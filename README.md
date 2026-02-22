# Telegram MCP

[![npm version](https://img.shields.io/npm/v/telegram-notify-mcp.svg)](https://www.npmjs.com/package/telegram-notify-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A dead-simple [MCP](https://modelcontextprotocol.io) server with one job: **send AI agent progress back to you on Telegram.**

That's it. No chat management, no group administration, no inline queries. Just notifications — as text, images, or files.

You kick off an agent, walk away, and get a Telegram message when it's done (or while it's working). Nothing more, nothing less.

## Quick Start

### 1. Create a Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the bot token

### 2. Start a chat with your bot

Find your bot on Telegram and send `/start`. This is required so the bot can discover your chat ID.

### 3. Add to your MCP client

#### Claude Code

```bash
claude mcp add telegram -e TELEGRAM_BOT_TOKEN=your-token -e TELEGRAM_USERNAME=your-username -- npx telegram-notify-mcp
```

#### Claude Desktop / Cursor / Windsurf

Add to your MCP config file:

```json
{
  "mcpServers": {
    "telegram": {
      "command": "npx",
      "args": ["-y", "telegram-notify-mcp"],
      "env": {
        "TELEGRAM_BOT_TOKEN": "your-bot-token",
        "TELEGRAM_USERNAME": "your-telegram-username"
      }
    }
  }
}
```

## Configuration

| Environment Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_USERNAME` | Yes | Your Telegram username (without the @) |

## Tools

Three tools. That's the entire surface area.

### `send_message`

Send a text update to the user.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `text` | string | Yes | The message text |
| `parse_mode` | string | No | `HTML`, `Markdown`, or `MarkdownV2` |

### `send_photo`

Send an image — a screenshot, a chart, a generated visual.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `photo` | string | Yes | URL or absolute file path |
| `caption` | string | No | Photo caption |
| `parse_mode` | string | No | Caption formatting mode |

### `send_document`

Send a file — a report, a log, a build artifact.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `document` | string | Yes | URL or absolute file path |
| `caption` | string | No | Document caption |
| `parse_mode` | string | No | Caption formatting mode |

## How It Works

On the first tool call, the server resolves your username to a chat ID via the Telegram Bot API's `getUpdates`. This is why sending `/start` to the bot is required — Telegram bots can only message users who have initiated a conversation. The chat ID is cached for the lifetime of the process.

## Development

```bash
git clone https://github.com/ParthJadhav/telegram-notify-mcp.git
cd telegram-notify-mcp
npm install
npm run build
```

## License

MIT
