require('dotenv').config();

const { RESTManager, RubikaAPIError } = require('../../dist/index.js');

console.log('🔹 تست مدیریت خطا\n');

// ─── تست ۱: توکن جعلی ─────────────────────────
async function testInvalidToken() {
    console.log('🔸 تست ۱: توکن جعلی');
    const rest = new RESTManager('invalid-token-12345');
    try {
        await rest.getMe();
        console.log('⚠️ انتظار خطا داشتیم ولی موفق شد!\n');
    } catch (err) {
        if (err instanceof RubikaAPIError) {
            console.log(`✅ خطای API دریافت شد: [${err.code}] ${err.message}`);
        } else {
            console.log(`⚠️ خطای غیر-API: ${err.message}`);
        }
        console.log('');
    }
}

// ─── تست ۲: درخواست نامعتبر ────────────────────
async function testInvalidRequest() {
    console.log('🔸 تست ۲: درخواست نامعتبر (chat_id خالی)');
    const token = process.env.RUBIKA_TOKEN;
    if (!token) {
        console.log('⏭ بدون توکن رد شد\n');
        return;
    }
    const rest = new RESTManager(token);
    try {
        await rest.sendMessage({ chat_id: '', text: 'test' });
        console.log('⚠️ انتظار خطا داشتیم ولی موفق شد!\n');
    } catch (err) {
        if (err instanceof RubikaAPIError) {
            console.log(`✅ خطای API: [${err.code}] ${err.message}\n`);
        } else {
            console.log(`⚠️ خطای غیر-API: ${err.message}\n`);
        }
    }
}

// ─── تست ۳: Retry ─────────────────────────────
async function withRetry(fn, maxAttempts = 3) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            return await fn();
        } catch (err) {
            if (err instanceof RubikaAPIError && err.code === 429) {
                const wait = (err.parameters?.retry_after ?? 1) * 1000;
                console.log(`   ⏳ rate limit — ${wait}ms صبر...`);
                await new Promise((r) => setTimeout(r, wait));
                continue;
            }
            if (i === maxAttempts - 1) throw err;
            await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
        }
    }
}

async function testRetry() {
    console.log('🔸 تست ۳: الگوی retry');
    const token = process.env.RUBIKA_TOKEN;
    if (!token) {
        console.log('⏭ بدون توکن رد شد\n');
        return;
    }
    const rest = new RESTManager(token);
    try {
        const me = await withRetry(() => rest.getMe());
        console.log(`✅ با retry موفق: @${me.bot_username}\n`);
    } catch (err) {
        console.log(`❌ retry ناموفق: ${err.message}\n`);
    }
}

(async () => {
    await testInvalidToken();
    await testInvalidRequest();
    await testRetry();
    console.log('🎉 تست‌های خطا تمام شد');
})();