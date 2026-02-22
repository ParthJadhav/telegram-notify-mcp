import { readFile, stat } from "fs/promises";
import { basename, resolve } from "path";

const TELEGRAM_API = "https://api.telegram.org";

type ParseMode = "HTML" | "Markdown" | "MarkdownV2";

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    from?: {
      id: number;
      username?: string;
    };
    chat: {
      id: number;
    };
    text?: string;
  };
}

export class TelegramClient {
  private botToken: string;
  private targetUsername: string;
  private chatId: number | null = null;
  private resolvingChatId: Promise<number> | null = null;

  constructor(botToken: string, targetUsername: string) {
    this.botToken = botToken;
    // Strip leading @ if present
    this.targetUsername = targetUsername.replace(/^@/, "");
  }

  private get baseUrl(): string {
    return `${TELEGRAM_API}/bot${this.botToken}`;
  }

  private async apiCall(
    method: string,
    params: Record<string, unknown>
  ): Promise<TelegramResponse> {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      throw new Error(
        `Telegram API request failed with status ${response.status}`
      );
    }
    return (await response.json()) as TelegramResponse;
  }

  private async apiCallMultipart(
    method: string,
    formData: FormData
  ): Promise<TelegramResponse> {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error(
        `Telegram API request failed with status ${response.status}`
      );
    }
    return (await response.json()) as TelegramResponse;
  }

  async resolveChatId(): Promise<number> {
    if (this.chatId !== null) {
      return this.chatId;
    }

    // Deduplicate concurrent resolution attempts
    if (this.resolvingChatId !== null) {
      return this.resolvingChatId;
    }

    this.resolvingChatId = this.fetchChatId();
    try {
      return await this.resolvingChatId;
    } finally {
      this.resolvingChatId = null;
    }
  }

  private async fetchChatId(): Promise<number> {
    const response = await this.apiCall("getUpdates", { limit: 100 });

    if (!response.ok || !Array.isArray(response.result)) {
      throw new Error(
        `Failed to get updates: ${response.description ?? "Unknown error"}. ` +
          `Make sure the bot token is valid.`
      );
    }

    const updates = response.result as TelegramUpdate[];

    for (const update of updates) {
      const username = update.message?.from?.username;
      if (
        username &&
        username.toLowerCase() === this.targetUsername.toLowerCase()
      ) {
        this.chatId = update.message!.chat.id;
        return this.chatId;
      }
    }

    throw new Error(
      `Could not find chat_id for username @${this.targetUsername}. ` +
        `The user must first send /start to the bot, then try again.`
    );
  }

  private async readLocalFile(filePath: string): Promise<{ blob: Blob; filename: string }> {
    const resolved = resolve(filePath);
    const fileStat = await stat(resolved);
    if (!fileStat.isFile()) {
      throw new Error(`Path is not a regular file: ${resolved}`);
    }
    const fileBuffer = await readFile(resolved);
    return { blob: new Blob([fileBuffer]), filename: basename(resolved) };
  }

  private isUrl(value: string): boolean {
    return value.startsWith("http://") || value.startsWith("https://");
  }

  private async sendFile(
    method: string,
    fileField: string,
    fileSource: string,
    caption?: string,
    parseMode?: ParseMode
  ): Promise<TelegramResponse> {
    const chatId = await this.resolveChatId();

    let result: TelegramResponse;

    if (this.isUrl(fileSource)) {
      const params: Record<string, unknown> = { chat_id: chatId, [fileField]: fileSource };
      if (caption) params.caption = caption;
      if (parseMode) params.parse_mode = parseMode;
      result = await this.apiCall(method, params);
    } else {
      const { blob, filename } = await this.readLocalFile(fileSource);
      const formData = new FormData();
      formData.append("chat_id", String(chatId));
      formData.append(fileField, blob, filename);
      if (caption) formData.append("caption", caption);
      if (parseMode) formData.append("parse_mode", parseMode);
      result = await this.apiCallMultipart(method, formData);
    }

    if (!result.ok) {
      throw new Error(
        `Failed to ${method}: ${result.description ?? "Unknown error"}`
      );
    }
    return result;
  }

  async sendMessage(
    text: string,
    parseMode?: ParseMode
  ): Promise<TelegramResponse> {
    const chatId = await this.resolveChatId();
    const params: Record<string, unknown> = { chat_id: chatId, text };
    if (parseMode) {
      params.parse_mode = parseMode;
    }
    const result = await this.apiCall("sendMessage", params);
    if (!result.ok) {
      throw new Error(
        `Failed to send message: ${result.description ?? "Unknown error"}`
      );
    }
    return result;
  }

  async sendPhoto(
    photo: string,
    caption?: string,
    parseMode?: ParseMode
  ): Promise<TelegramResponse> {
    return this.sendFile("sendPhoto", "photo", photo, caption, parseMode);
  }

  async sendDocument(
    document: string,
    caption?: string,
    parseMode?: ParseMode
  ): Promise<TelegramResponse> {
    return this.sendFile("sendDocument", "document", document, caption, parseMode);
  }
}
