const fs = require("fs");
const path = require("path");
const os = require("os");

const {
    Client,
    GatewayIntentBits
} = require("discord.js");

const sb3fix = require("@turbowarp/sb3fix");
require("dotenv").config();


const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error("ERROR: DISCORD_TOKEN is not set.");
    process.exit(1);
}


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});


client.on("messageCreate", async (message) => {

    // Ignore other bots
    if (message.author.bot) {
        return;
    }

    // Check every attachment
    for (const attachment of message.attachments.values()) {

        if (
            !attachment.name ||
            !attachment.name.toLowerCase().endsWith(".sb3")
        ) {
            continue;
        }

        await checkProject(message, attachment);
    }
});


async function checkProject(message, attachment) {

    const filename = attachment.name;

    let inputPath = null;
    let reportPath = null;

    // Initial status
    const statusMessage = await message.reply(
        `🔍 Checking \`${filename}\`...`
    );

    try {

        /*
         * Download the SB3
         */

        const response = await fetch(attachment.url);

        if (!response.ok) {
            throw new Error(
                `Failed to download attachment (${response.status})`
            );
        }

        const buffer = Buffer.from(
            await response.arrayBuffer()
        );


        /*
         * Create temporary input file
         */

        inputPath = path.join(
            os.tmpdir(),
            `sb3-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2)}.sb3`
        );

        fs.writeFileSync(
            inputPath,
            buffer
        );


        /*
         * Run TurboWarp SB3Fix
         */

        const logs = [];

        await sb3fix.fixZip(buffer, {

            platform: "scratch",

            logCallback: (message) => {
                logs.push(String(message));
            }

        });


        /*
         * Remove normal progress messages
         */

        const issues = logs.filter((log) => {

            const text = log.trim();

            if (!text) {
                return false;
            }

            if (
                text.toLowerCase().startsWith(
                    "checking target"
                )
            ) {
                return false;
            }

            return true;
        });


        /*
         * CLEAN PROJECT
         */

        if (issues.length === 0) {

            await statusMessage.edit({
                content:
                    "## 🔍 SB3 Compatibility Report\n" +
                    `**File:** \`${filename}\`\n\n` +
                    "### ✅ No issues detected\n" +
                    "The project passed the SB3Fix check."
            });

            return;
        }


        /*
         * PROJECT WITH ISSUES
         */

        const previewCount = 10;

        let report =
            "## 🔍 SB3 Compatibility Report\n" +
            `**File:** \`${filename}\`\n\n` +
            `### ⚠️ ${issues.length} diagnostic message(s)\n\n`;


        for (
            let i = 0;
            i < Math.min(previewCount, issues.length);
            i++
        ) {

            report += `• ${issues[i]}\n`;
        }


        if (issues.length > previewCount) {

            report +=
                "\n" +
                `⚠️ **${issues.length - previewCount} additional diagnostics are included in the attached report.**`;
        }


        /*
         * Generate full TXT report
         */

        const baseName = path.basename(
            filename,
            ".sb3"
        );

        const reportFilename =
            `${baseName}-report.txt`;

        reportPath = path.join(
            os.tmpdir(),
            reportFilename
        );


        let fullReport =
            "SB3 Compatibility Report\n" +
            "========================\n\n" +
            `File: ${filename}\n` +
            `Diagnostics: ${issues.length}\n\n`;


        issues.forEach((issue, index) => {

            fullReport +=
                `${index + 1}. ${issue}\n`;

        });


        fs.writeFileSync(
            reportPath,
            fullReport,
            "utf8"
        );


        /*
         * Delete the "checking..." message
         */

        await statusMessage.delete();


        /*
         * Send report + TXT
         */

        await message.reply({
            content: report,

            files: [
                {
                    attachment: reportPath,
                    name: reportFilename
                }
            ]
        });

    }

    catch (error) {

        console.error(
            `Error checking ${filename}:`,
            error
        );

        await statusMessage.edit({
            content:
                "## ❌ SB3 Check Failed\n" +
                `**File:** \`${filename}\`\n\n` +
                "```text\n" +
                `${String(error).substring(0, 1500)}` +
                "\n```"
        });

    }

    finally {

        /*
         * Always delete temporary files
         */

        if (
            inputPath &&
            fs.existsSync(inputPath)
        ) {
            fs.unlinkSync(inputPath);
        }

        if (
            reportPath &&
            fs.existsSync(reportPath)
        ) {
            fs.unlinkSync(reportPath);
        }
    }
};


client.login(TOKEN);