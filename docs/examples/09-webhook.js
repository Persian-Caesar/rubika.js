// ۱. ngrok را اجرا کنید: ngrok http 3000
// ۲. URL عمومی را در .env بگذارید:
//    RUBIKA_WEBHOOK=https://xxxx.ngrok.io/rubika/webhook
// ۳. اجرا کنید: node --env-file=.env docs/examples/09-webhook.js
require('dotenv').config();

const { RubikaClient } = require('../../dist/index.js');

const endpoint = process.env.RUBIKA_WEBHOOK;
if (!endpoint) {
    console.error('❌ RUBIKA_WEBHOOK تنظیم نشده');
    process.exit(1);
}

const client = new RubikaClient({
    token: process.env.RUBIKA_TOKEN,
    mode: 'webhook',
    webhook: {
        endpoint,
        port: 3000,
        path: '/rubika/webhook',
    },
});

client.on('ready', (bot) => {
    console.log(`✅ @${bot.bot_username} در حالت webhook`);
    console.log(`📡 Endpoint: ${endpoint}`);
    console.log('حالا در روبیکا به ربات پیام دهید\n');
});

client.on('messageCreate', async (message) => {
    console.log('📩 پیام:', message.text);
    if (message.hasText) {
        await message.reply(`🔁 (از webhook) ${message.text}`);
    }
});

client.on('error', (err) => console.error('❌', err));

process.on('SIGINT', async () => {
    console.log('\n👋 خاموش...');
    await client.destroy();
    process.exit(0);
});

client.login();