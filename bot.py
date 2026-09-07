import discord
from discord.ext import commands
from dotenv import load_dotenv

import os
import json
import asyncio
import tempfile

load_dotenv()


TOKEN = os.getenv("DISCORD_TOKEN")


intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(
    command_prefix="!",
    intents=intents
)


@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")


@bot.event
async def on_message(message):

    # Don't process ourselves
    if message.author.bot:
        return

    # Look through attachments
    for attachment in message.attachments:

        if not attachment.filename.lower().endswith(".sb3"):
            continue

        await check_project(message, attachment)

    await bot.process_commands(message)

async def check_project(message, attachment):

    filename = attachment.filename

    status_message = await message.reply(
        f"🔍 Checking `{filename}`..."
    )

    temp_path = None
    report_path = None

    try:

        # Download the SB3
        data = await attachment.read()

        # Create temporary SB3 file
        with tempfile.NamedTemporaryFile(
            suffix=".sb3",
            delete=False
        ) as temp:

            temp.write(data)
            temp_path = temp.name

        # Run Node.js checker
        process = await asyncio.create_subprocess_exec(
            "node",
            "fixer.js",
            temp_path,

            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        stdout, stderr = await process.communicate()

        # Node process failed
        if process.returncode != 0:

            await status_message.edit(
                content=(
                    f"❌ **Checker failed**\n"
                    f"`{filename}`\n\n"
                    f"```text\n"
                    f"{stderr.decode()[:1500]}"
                    f"\n```"
                )
            )

            return

        # Parse Node output
        result = json.loads(stdout.decode())

        # sb3fix itself reported an error
        if not result["success"]:

            await status_message.edit(
                content=(
                    f"❌ **Could not check project**\n"
                    f"`{filename}`\n\n"
                    f"{result['error']}"
                )
            )

            return

        # Get logs
        logs = result["logs"]

        # Create Discord report + issue list
        report, issues = create_report(
            filename,
            logs
        )

        # If there are issues, create full TXT report
        if issues:

            report_filename = (
                filename.rsplit(".", 1)[0]
                + "-report.txt"
            )

            report_path = os.path.join(
                tempfile.gettempdir(),
                report_filename
            )

            with open(
                report_path,
                "w",
                encoding="utf-8"
            ) as report_file:

                report_file.write(
                    "SB3 Compatibility Report\n"
                )

                report_file.write(
                    "=========================\n\n"
                )

                report_file.write(
                    f"File: {filename}\n"
                )

                report_file.write(
                    f"Diagnostics: {len(issues)}\n\n"
                )

                for number, issue in enumerate(
                    issues,
                    start=1
                ):

                    report_file.write(
                        f"{number}. {issue}\n"
                    )

            # Send report + TXT attachment
            await status_message.delete()

            await message.reply(
                content=report,
                file=discord.File(
                    report_path,
                    filename=report_filename
                )
            )

        else:

            # Clean project — no TXT needed
            await status_message.edit(
                content=report
            )

    except Exception as error:

        await status_message.edit(
            content=(
                f"❌ **Unexpected error**\n"
                f"`{filename}`\n\n"
                f"```text\n"
                f"{str(error)[:1500]}"
                f"\n```"
            )
        )

    finally:

        # Delete temporary SB3
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

        # Delete temporary report
        if report_path and os.path.exists(report_path):
            os.remove(report_path)

def create_report(filename, logs):
    issues = []

    for log in logs:
        log = str(log).strip()

        if not log:
            continue

        # Ignore normal progress messages
        if log.lower().startswith("checking target"):
            continue

        issues.append(log)

    if not issues:
        report = (
            "## 🔍 SB3 Compatibility Report\n"
            f"**File:** `{filename}`\n\n"
            "### ✅ No issues detected\n"
            "The project passed the SB3Fix check."
        )

        return report, []

    report_lines = [
        "## 🔍 SB3 Compatibility Report",
        f"**File:** `{filename}`",
        "",
        f"### ⚠️ {len(issues)} diagnostic message(s)",
        ""
    ]

    # Only show the first few in Discord
    preview_count = 10

    for issue in issues[:preview_count]:
        report_lines.append(f"• {issue}")

    if len(issues) > preview_count:
        report_lines.extend([
            "",
            f"⚠️ **{len(issues) - preview_count} additional diagnostics are included in the attached report.**"
        ])

    return "\n".join(report_lines), issues

bot.run(TOKEN)