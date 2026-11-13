// اجرا: node --env-file=.env docs/examples/06-edit-delete.js
// سپس در روبیکا به ربات پیام دهید.

// در روبیکا این دستورات را بفرستید:
//   /edit   → ربات پیامی می‌فرستد، ۲ ثانیه بعد ویرایش می‌کند
//   /delete → ربات پیامی می‌فرستد، ۲ ثانیه بعد حذف می‌کند
require('dotenv').config();

const { RubikaClient } = require('../../dist/index.js');

const client = new RubikaClient({
  token: process.env.RUBIKA_TOKEN,
  mode: 'polling',
});

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

client.on('ready', (bot) => {
  console.log(`✅ @${bot.username} آماده`);
  console.log('دستورات: /edit یا /delete\n');
});

client.on('messageCreate', async (message) => {
  if (!message.hasText) return;

  if (message.text === '/edit') {
    const sent = await message.reply('📝 متن اولیه');
    console.log(`✅ پیام ارسال شد (${sent.id})`);

    await delay(2000);

    const edited = await sent.edit('✏️ متن ویرایش شد!');
    console.log(`✅ پیام ویرایش شد (${edited.id})`);
  }

  if (message.text === '/delete') {
    const sent = await message.reply('🗑 این پیام حذف خواهد شد...');
    console.log(`✅ پیام ارسال شد (${sent.id})`);

    await delay(2000);

    await sent.delete();
    console.log(`✅ پیام حذف شد`);
  }
});

client.on('error', (err) => console.error('❌', err));

client.login();
