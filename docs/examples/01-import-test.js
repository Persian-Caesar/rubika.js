const lib = require('../../dist/index');

console.log('📦 نسخه کتابخانه:', lib.VERSION);
console.log('');

const requiredExports = [
    'RubikaClient',
    'RESTManager',
    'RubikaAPIError',
    'Message',
    'Chat',
    'User',
    'CallbackQuery',
    'TypedEmitter',
    'MessageManager',
    'MediaManager',
    'PollingManager',
    'WebhookManager',
    'InlineKeypadBuilder',
    'Collection',
    'BaseBuilder',
];

let pass = 0;
let fail = 0;

for (const name of requiredExports) {
    const exists = typeof lib[name] === 'function';
    if (exists) {
        console.log(`✅ ${name} ✓`);
        pass++;
    } else {
        console.log(`❌ ${name} ✗ (یافت نشد)`);
        fail++;
    }
}

console.log('');
console.log(`📊 نتیجه: ${pass} موفق، ${fail} ناموفق`);

if (fail > 0) {
    console.error('\n❌ برخی exportها موجود نیستند. build را چک کنید.');
    process.exit(1);
}

console.log('\n🎉 همه ایمپورت‌ها سالم هستند!');