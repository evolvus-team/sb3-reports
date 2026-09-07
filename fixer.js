const fs = require("fs");
const sb3fix = require("@turbowarp/sb3fix");

async function main() {
    const inputPath = process.argv[2];

    if (!inputPath) {
        console.error("No input file specified.");
        process.exit(1);
    }

    try {
        const input = fs.readFileSync(inputPath);

        const logs = [];

        await sb3fix.fixZip(input, {
            logCallback: (message) => {
                logs.push(message);
            },

            platform: "scratch"
        });

        console.log(JSON.stringify({
            success: true,
            logs: logs
        }));

    } catch (error) {
        console.log(JSON.stringify({
            success: false,
            error: error.message
        }));

        process.exit(1);
    }
}

main();