const { InlineKeypadBuilder } = require("../../dist");

// ─── تست ۱: یک ردیف ساده ───────────────────
console.log('🔹 تست ۱: کیبورد یک‌ردیفی');
const kb1 = new InlineKeypadBuilder()
    .addButton({ id: 'yes', button_text: '✅ بله' })
    .addButton({ id: 'no', button_text: '❌ خیر' })
    .build();

console.log(JSON.stringify(kb1, null, 2));
console.assert(kb1.rows.length === 1, '❌ باید ۱ ردیف باشد');
console.assert(kb1.rows[0].buttons.length === 2, '❌ باید ۲ دکمه باشد');
console.log('✅ موفق\n');

// ─── تست ۲: چیدمان چندردیفی ──────────────────
console.log('🔹 تست ۲: چیدمان ۲-۱');
const kb2 = new InlineKeypadBuilder()
    .addButton({ id: 'a', button_text: 'A' })
    .addButton({ id: 'b', button_text: 'B' })
    .addButton({ id: 'c', button_text: 'C' })
    .adjust(2, 1)
    .build();

console.log(JSON.stringify(kb2, null, 2));
console.assert(kb2.rows.length === 2, '❌ باید ۲ ردیف باشد');
console.assert(kb2.rows[0].buttons.length === 2, '❌ ردیف اول ۲ دکمه');
console.assert(kb2.rows[1].buttons.length === 1, '❌ ردیف دوم ۱ دکمه');
console.log('✅ موفق\n');

// ─── تست ۳: دکمه با URL ─────────────────────
console.log('🔹 تست ۳: دکمه لینک');
const kb3 = new InlineKeypadBuilder()
    .addButton({
        id: 'site',
        button_text: '🌐 سایت ما',
        type: 'Link',
        url: 'https://example.com',
    })
    .build();

console.log(JSON.stringify(kb3, null, 2));
console.assert(kb3.rows[0].buttons[0].url === 'https://example.com', '❌ URL درست نیست');
console.assert(kb3.rows[0].buttons[0].type === 'Link', '❌ type درست نیست');
console.log('✅ موفق\n');

// ─── تست ۴: بدون adjust (همه در یک ردیف) ────
console.log('🔹 تست ۴: بدون adjust');
const kb4 = new InlineKeypadBuilder()
    .addButton({ id: '1', button_text: 'One' })
    .addButton({ id: '2', button_text: 'Two' })
    .addButton({ id: '3', button_text: 'Three' })
    .build();

console.assert(kb4.rows.length === 1, '❌ باید ۱ ردیف باشد');
console.assert(kb4.rows[0].buttons.length === 3, '❌ باید ۳ دکمه باشد');
console.log('✅ موفق\n');

console.log('🎉 همه تست‌های کیبورد پاس شدند!');