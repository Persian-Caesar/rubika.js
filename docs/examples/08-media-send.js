// در روبیکا /photo بفرستید تا ربات یک تصویر بفرستد.
require('dotenv').config();

const { RubikaClient } = require('../../dist/index.js');

const client = new RubikaClient({
    token: process.env.RUBIKA_TOKEN,
    mode: 'polling',
});

// ساخت یک PNG کوچک تست (1x1 پیکسل آبی)
async function createTestImage() {
    const pngBuffer = Buffer.from(
        '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000001ff5d0e5d0000000049454e44ae426082',
        'hex',
    );
    return pngBuffer;
}

client.on('ready', (bot) => {
    console.log(`✅ @${bot.username} آماده`);
    console.log('دستورات: /photo یا /doc\n');
});

client.on('messageCreate', async (message) => {
    if (message.text === '/photo') {
        try {
            const buffer = await createTestImage();
            await client.media.sendFile(message.chat.id, 'Image', buffer, '🖼 تست تصویر');
            console.log('✅ تصویر ارسال شد');
        } catch (err) {
            console.error('❌ خطا در ارسال تصویر:', err.message);
        }
    }

    if (message.text === '/doc') {
        try {
            const buffer = Buffer.from('سلام! این یک فایل تست است.\n');
            await client.media.sendFile(message.chat.id, 'File', buffer, '📄 تست فایل');
            console.log('✅ فایل ارسال شد');
        } catch (err) {
            console.error('❌ خطا در ارسال فایل:', err.message);
        }
    }
});

client.on('error', (err) => console.error('❌', err));

client.login();