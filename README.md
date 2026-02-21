# Telegram MCP

An MCP (Model Context Protocol) server that lets AI agents send results to you via Telegram — messages, images, and files.

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts
3. Copy the bot token you receive

### 2. Start a conversation with your bot

1. Find your bot in Telegram (search for the username you gave it)
2. Send `/start` to the bot — this is required so the bot can find your chat ID

### 3. Install

```bash
npm install
npm run build
```

### 4. Configure

Add to your Claude Code MCP settings (`.claude/settings.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "telegram": {
      "command": "node",
      "args": ["/absolute/path/to/telegram-mcp/build/index.js"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your-bot-token-here",
        "TELEGRAM_USERNAME": "your-telegram-username"
      }
    }
  }
}
```

Or via CLI:

```bash
claude mcp add telegram -e TELEGRAM_BOT_TOKEN=your-token -e TELEGRAM_USERNAME=your-username -- node /absolute/path/to/telegram-mcp/build/index.js
```

## Tools

### `send_message`

Send a text message. Supports `HTML`, `Markdown`, and `MarkdownV2` formatting.

### `send_photo`

Send a photo from a URL or local file path. Optional caption.

### `send_document`

Send a document/file from a URL or local file path. Optional caption.

## How it works

On the first tool call, the server resolves your username to a Telegram chat ID by checking the bot's recent messages (`getUpdates`). This is why you need to send `/start` to the bot first. The chat ID is cached for subsequent calls.
