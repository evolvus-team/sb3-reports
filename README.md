# SB3-Reports

Discord bot that checks Scratch `.sb3` files for possible corruption using [TurboWarp sb3fix](https://github.com/TurboWarp/sb3fix).

## Features

* 🔍 Automatically detects `.sb3` attachments
* 🛠️ Checks projects with `sb3fix`
* 📊 Posts a Discord summary
* 📄 Generates a full `.txt` diagnostic report
* 🧹 Deletes temporary files

## Requirements

* Python 3.9+
* Node.js 18+
* Discord bot

## Setup

Install dependencies:

```bash
pip install -r requirements.txt
npm install
```

Create `.env`:

```env
DISCORD_TOKEN=your_bot_token
```

Enable **Message Content Intent** in the Discord Developer Portal.

Run:

```bash
python bot.py
```

Upload an `.sb3` to a channel the bot can access.

## Structure

```text
sb3-reports/
├── bot.py
├── fixer.js
├── package.json
├── requirements.txt
└── .env
```

`.env` and `node_modules/` should not be committed.

## Security

The bot only analyzes uploaded projects and does not execute Scratch code. Temporary files are deleted after processing.
