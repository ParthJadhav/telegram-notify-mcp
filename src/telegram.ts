import { readFile } from "fs/promises";
import { basename } from "path";

const TELEGRAM_API = "https://api.telegram.org";

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
    return (await response.json()) as TelegramResponse;
  }

  async resolveChatId(): Promise<number> {
    if (this.chatId !== null) {
      return this.chatId;
    }

    // Try to find the chat_id by polling getUpdates
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

  async sendMessage(
    text: string,
    parseMode?: string
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
    parseMode?: string
  ): Promise<TelegramResponse> {
    const chatId = await this.resolveChatId();

    // If it looks like a URL, send as URL
    if (photo.startsWith("http://") || photo.startsWith("https://")) {
      const params: Record<string, unknown> = { chat_id: chatId, photo };
      if (caption) params.caption = caption;
      if (parseMode) params.parse_mode = parseMode;
      const result = await this.apiCall("sendPhoto", params);
      if (!result.ok) {
        throw new Error(
          `Failed to send photo: ${result.description ?? "Unknown error"}`
        );
      }
      return result;
    }

    // Otherwise treat as a local file path — upload via multipart
    const fileBuffer = await readFile(photo);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("photo", blob, basename(photo));
    if (caption) formData.append("caption", caption);
    if (parseMode) formData.append("parse_mode", parseMode);

    const result = await this.apiCallMultipart("sendPhoto", formData);
    if (!result.ok) {
      throw new Error(
        `Failed to send photo: ${result.description ?? "Unknown error"}`
      );
    }
    return result;
  }

  async sendDocument(
    document: string,
    caption?: string,
    parseMode?: string
  ): Promise<TelegramResponse> {
    const chatId = await this.resolveChatId();

    // If it looks like a URL, send as URL
    if (document.startsWith("http://") || document.startsWith("https://")) {
      const params: Record<string, unknown> = {
        chat_id: chatId,
        document,
      };
      if (caption) params.caption = caption;
      if (parseMode) params.parse_mode = parseMode;
      const result = await this.apiCall("sendDocument", params);
      if (!result.ok) {
        throw new Error(
          `Failed to send document: ${result.description ?? "Unknown error"}`
        );
      }
      return result;
    }

    // Otherwise treat as a local file path — upload via multipart
    const fileBuffer = await readFile(document);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append("chat_id", String(chatId));
    formData.append("document", blob, basename(document));
    if (caption) formData.append("caption", caption);
    if (parseMode) formData.append("parse_mode", parseMode);

    const result = await this.apiCallMultipart("sendDocument", formData);
    if (!result.ok) {
      throw new Error(
        `Failed to send document: ${result.description ?? "Unknown error"}`
      );
    }
    return result;
  }
}
