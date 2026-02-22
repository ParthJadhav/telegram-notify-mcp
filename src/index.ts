#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TelegramClient } from "./telegram.js";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const USERNAME = process.env.TELEGRAM_USERNAME;

if (!BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN environment variable is required");
  process.exit(1);
}

if (!USERNAME) {
  console.error("Error: TELEGRAM_USERNAME environment variable is required");
  process.exit(1);
}

const telegram = new TelegramClient(BOT_TOKEN, USERNAME);

const server = new McpServer({
  name: "telegram-notify-mcp",
  version: "1.0.0",
});

// Tool: Send a text message
server.tool(
  "send_message",
  "Send a text message to the configured Telegram user",
  {
    text: z.string().describe("The message text to send"),
    parse_mode: z
      .enum(["HTML", "Markdown", "MarkdownV2"])
      .optional()
      .describe("Message formatting mode"),
  },
  async ({ text, parse_mode }) => {
    try {
      await telegram.sendMessage(text, parse_mode);
      return {
        content: [
          {
            type: "text",
            text: `Message sent to @${USERNAME}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to send message: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Send a photo/image
server.tool(
  "send_photo",
  "Send a photo to the configured Telegram user. Accepts a URL or local file path.",
  {
    photo: z
      .string()
      .describe("URL or local file path of the photo to send"),
    caption: z.string().optional().describe("Photo caption"),
    parse_mode: z
      .enum(["HTML", "Markdown", "MarkdownV2"])
      .optional()
      .describe("Caption formatting mode"),
  },
  async ({ photo, caption, parse_mode }) => {
    try {
      await telegram.sendPhoto(photo, caption, parse_mode);
      return {
        content: [
          {
            type: "text",
            text: `Photo sent to @${USERNAME}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to send photo: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: Send a document/file
server.tool(
  "send_document",
  "Send a document or file to the configured Telegram user. Accepts a URL or local file path.",
  {
    document: z
      .string()
      .describe("URL or local file path of the document to send"),
    caption: z.string().optional().describe("Document caption"),
    parse_mode: z
      .enum(["HTML", "Markdown", "MarkdownV2"])
      .optional()
      .describe("Caption formatting mode"),
  },
  async ({ document, caption, parse_mode }) => {
    try {
      await telegram.sendDocument(document, caption, parse_mode);
      return {
        content: [
          {
            type: "text",
            text: `Document sent to @${USERNAME}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to send document: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
