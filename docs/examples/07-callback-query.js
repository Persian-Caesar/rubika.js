// در روبیکا /menu بفرستید، سپس روی دکمه‌ها کلیک کنید.
require('dotenv').config();

const { RubikaClient, InlineKeypadBuilder } = require('../../dist/index.js');

const client = new RubikaClient({
    token: process.env.RUBIKA_TOKEN,
    mode: 'polling',
});

client.on('ready', (bot) => {
    console.log(`✅ @${bot.username} آماده`);
    console.log('دستور /menu را بفرستید\n');
});

client.on('messageCreate', async (message) => {
    if (message.text === '/menu') {
        const keypad = new InlineKeypadBuilder()
            .addButton({ id: 'btn_products', button_text: '🛍 محصولات' })
            .addButton({ id: 'btn_cart', button_text: '🛒 سبد خرید' })
            .addButton({ id: 'btn_help', button_text: '❓ راهنما' })
            .adjust(2, 1)
            .build();

        await message.reply('یکی از گزینه‌ها را انتخاب کنید:', {
            inline_keypad: keypad,
        });
        console.log('✅ منو ارسال شد');
    }
});

client.on('callbackQuery', async (query) => {
    console.log('\n👆 کلیک شد:');
    console.log(`   از: ${query.fromId}`);
    console.log(`   دکمه: ${query.buttonId}`);
    console.log(`   داده: ${query.data ?? '(خالی)'}`);

    try {
        if (query.buttonId === 'btn_products') {
            await query.answer('📦 در حال بارگذاری محصولات...');
        } else if (query.buttonId === 'btn_cart') {
            await query.answer('🛒 سبد خرید شما خالی است');
        } else if (query.buttonId === 'btn_help') {
            await query.answer('📞 برای پشتیبانی با ما تماس بگیرید');
        } else {
            await query.answer('❓ دکمه ناشناخته');
        }
        console.log('   ✅ پاسخ ارسال شد\n');
    } catch (err) {
        console.error('   ❌ خطا:', err.message, '\n');
    }
});

client.on('error', (err) => console.error('❌', err));

client.login();