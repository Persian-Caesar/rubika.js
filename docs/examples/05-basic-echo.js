// اجرا: node --env-file=.env docs/examples/05-basic-echo.js
// سپس در روبیکا به ربات پیام دهید.
require('dotenv').config();

const { RubikaClient } = require("../../dist");


const client = new RubikaClient({
    token: process.env.RUBIKA_TOKEN,
    mode: 'polling',
    polling: { interval: 2000, limit: 100 },
});

client.on('ready', (bot) => {
    console.log(`✅ ربات @${bot.bot_username} آماده است`);
    console.log('📝 حالا در روبیکا به ربات پیام دهید...\n');
});

client.on('messageCreate', async (message) => {
    console.log('📩 پیام دریافت شد:');
    console.log(`   از: ${message.from?.fullName ?? '?'} (${message.from?.id ?? '?'})`);
    console.log(`   متن: "${message.text ?? ''}"`);
    console.log(`   در چت: ${message.chat.id}`);

    if (!message.hasText) {
        console.log('   (بدون متن — نادیده گرفته شد)\n');
        return;
    }

    try {
        await message.reply(`🔁 شما گفتید: ${message.text}`);
        console.log('   ✅ پاسخ ارسال شد\n');
    } catch (err) {
        console.error('   ❌ خطا در پاسخ:', err.message, '\n');
    }
});

client.on('error', (err) => {
    console.error('❌ خطای کلاینت:', err);
});

process.on('SIGINT', async () => {
    console.log('\n👋 در حال خاموشی...');
    await client.destroy();
    process.exit(0);
});

client.login().catch((err) => {
    console.error('❌ خطای login:', err);
    process.exit(1);
});