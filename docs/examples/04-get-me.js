// اجرا: node --env-file=.env docs/examples/04-get-me.js
require('dotenv').config();

const { RESTManager } = require("../../dist");


async function main() {
    const token = process.env.RUBIKA_TOKEN;
    if (!token) {
        console.error('❌ RUBIKA_TOKEN تنظیم نشده');
        process.exit(1);
    }

    console.log('🔍 در حال دریافت اطلاعات ربات...\n');

    const rest = new RESTManager(token);

    try {
        const bot = await rest.getMe();
        console.log('✅ اطلاعات ربات:');
        console.log(JSON.stringify(bot, null, 2));

        if (bot.bot_id) {
            console.log(`\n🤖 ربات @${bot.username ?? '?'} (ID: ${bot.bot_id})`);
        }
    } catch (err) {
        if (err instanceof RubikaAPIError) {
            console.error(`❌ خطای API [${err.code}]: ${err.message}`);
        } else {
            console.error('❌ خطای غیرمنتظره:', err);
        }
        process.exit(1);
    }
}

main();