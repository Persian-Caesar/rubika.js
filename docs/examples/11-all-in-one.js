// یک ربات کامل با همه ویژگی‌های فعلی
require('dotenv').config();

const {
    RubikaClient,
    InlineKeypadBuilder,
    Collection,
    RubikaAPIError,
} = require('../../dist/index.js');

const client = new RubikaClient({
    token: process.env.RUBIKA_TOKEN,
    mode: 'polling',
    polling: { interval: 2000, limit: 100 },
});

// کش کاربران
const users = new Collection();

// وضعیت مکالمه
const states = new Collection();

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ═══ رویدادها ═══════════════════════════════════

client.on('ready', (bot) => {
    console.log(`╔══════════════════════════════════╗`);
    console.log(`║  🤖 @${bot.bot_username?.padEnd(28) ?? '?'} ║`);
    console.log(`║  ✅ آماده دریافت پیام            ║`);
    console.log(`╚══════════════════════════════════╝\n`);
    console.log('📋 دستورات: /menu /edit /delete /photo /doc /count /state\n');
});

client.on('messageCreate', async (message) => {
    // آمار
    if (message.from) users.set(message.from.id, message.from);

    try {
        await handleMessage(message);
    } catch (err) {
        if (err instanceof RubikaAPIError) {
            console.error(`❌ API [${err.code}]: ${err.message}`);
        } else {
            console.error('❌ خطا:', err);
        }
    }
});

client.on('callbackQuery', async (query) => {
    console.log(`👆 کلیک: ${query.buttonId}`);

    try {
        switch (query.buttonId) {
            case 'menu_products':
                await query.answer('📦 محصولات در راه است');
                break;
            case 'menu_cart':
                await query.answer('🛒 سبد خالی');
                break;
            case 'menu_help':
                await query.answer('📞 با پشتیبانی تماس بگیرید');
                break;
            default:
                await query.answer('❓');
        }
    } catch (err) {
        console.error('❌ خطای callback:', err);
    }
});

client.on('error', (err) => console.error('❌', err));

// ═══ منطق اصلی ═════════════════════════════════

async function handleMessage(message) {
    if (!message.hasText) return;

    const text = message.text;
    const state = states.get(message.from?.id ?? '');

    // اگر در حالت گفتگو
    if (state) {
        return handleConversation(message, state);
    }

    switch (text) {
        case '/menu':
            return sendMenu(message);
        case '/edit':
            return testEdit(message);
        case '/delete':
            return testDelete(message);
        case '/photo':
            return testPhoto(message);
        case '/doc':
            return testDoc(message);
        case '/count':
            return message.reply(`📊 تعداد کاربران کش‌شده: ${users.size}`);
        case '/state':
            states.set(message.from.id, { step: 'name' });
            return message.reply('👤 نام خود را وارد کنید:');
        default:
            return message.reply(`🔁 شما گفتید: ${text}`);
    }
}

async function sendMenu(message) {
    const kb = new InlineKeypadBuilder()
        .addButton({ id: 'menu_products', button_text: '🛍 محصولات' })
        .addButton({ id: 'menu_cart', button_text: '🛒 سبد' })
        .addButton({ id: 'menu_help', button_text: '❓ راهنما' })
        .adjust(2, 1)
        .build();

    await message.reply('منو:', { inline_keypad: kb });
}

async function testEdit(message) {
    const sent = await message.reply('📝 اولیه');
    await delay(1500);
    await sent.edit('✏️ ویرایش شد');
}

async function testDelete(message) {
    const sent = await message.reply('🗑 حذف در ۲ ثانیه...');
    await delay(2000);
    await sent.delete();
}

async function testPhoto(message) {
    const png = Buffer.from(
        '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8cfc0f01f0005000001ff5d0e5d0000000049454e44ae426082',
        'hex',
    );
    await client.media.sendFile(message.chat.id, 'Image', png, '🖼 تست');
}

async function testDoc(message) {
    const buf = Buffer.from(`فایل تست — ${new Date().toISOString()}\n`);
    await client.media.sendFile(message.chat.id, 'File', buf, '📄 تست');
}

async function handleConversation(message, state) {
    const userId = message.from.id;

    if (state.step === 'name') {
        await message.reply(`👋 سلام ${message.text}! حالا ایمیلت را وارد کن:`);
        state.name = message.text;
        state.step = 'email';
        return;
    }

    if (state.step === 'email') {
        await message.reply(`✅ ثبت شد!\n👤 نام: ${state.name}\n📧 ایمیل: ${message.text}`);
        states.delete(userId);
    }
}

// ═══ شروع ═════════════════════════════════════

process.on('SIGINT', async () => {
    console.log('\n👋 خاموش...');
    await client.destroy();
    process.exit(0);
});

client.login();