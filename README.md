# SB3-Reports

Discord bot that checks Scratch `.sb3` files for possible corruption using [TurboWarp sb3fix](https://github.com/TurboWarp/sb3fix).

## Features

* 🔍 Automatically detects `.sb3` attachments
* 🛠️ Checks projects with `sb3fix`
* 📊 Posts a Discord summary
* 📄 Generates a full `.txt` diagnostic report
* 🧹 Deletes temporary files
* 📎 Supports forwarded `.sb3` files

## Requirements

* Node.js 18+
* Discord bot

## Setup

Install dependencies:

```bash
npm install
```

Create `.env`:

```env
DISCORD_TOKEN=your_bot_token
```

Enable **Message Content Intent** in the Discord Developer Portal.

Run locally:

```bash
npm start
```

For WispByte, use:

```bash
npm start
```

as the startup command and add `DISCORD_TOKEN` as an environment variable.

## Structure

```text
sb3-reports/
├── bot.js
├── package.json
├── package-lock.json
└── .env
```

`.env` and `node_modules/` should not be committed.

## Security

The bot only analyzes uploaded projects and does not execute Scratch code. Temporary files are deleted after processing.
