# rubika.js

کتابخانه‌ای قدرتمند، تایپ‌شده و ماژولار برای ساخت ربات‌های روبیکا با TypeScript — الهام‌گرفته از discord.js.

## نصب
npm install rubika.js

## شروع سریع
```ts
import { RubikaClient, InlineKeypadBuilder } from 'rubika.js';

const client = new RubikaClient({ token: process.env.RUBIKA_TOKEN! });

client.on('messageCreate', async (message) => {
  if (message.text !== '/start') return;
  const keypad = new InlineKeypadBuilder()
    .addButton({ id: 'btn1', button_text: 'سلام' })
    .build();
  await message.reply('خوش آمدید!', { inline_keypad: keypad });
});

client.login();
```