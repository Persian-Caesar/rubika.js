const { Collection } = require("../../dist");

console.log('🔹 تست Collection\n');

const col = new Collection([
    ['a', 1],
    ['b', 2],
    ['c', 3],
    ['d', 4],
]);

console.log('📦 Collection اولیه:', col.toArray());
console.assert(col.size === 4, '❌ size باید ۴ باشد');

console.log('👆 first():', col.first());
console.assert(col.first() === 1, '❌ first() باید ۱ باشد');

console.log('👇 last():', col.last());
console.assert(col.last() === 4, '❌ last() باید ۴ باشد');

console.log('🔑 کلیدها:', col.toKeyArray());
console.assert(col.toKeyArray().length === 4, '❌ باید ۴ کلید باشد');

const filtered = col.filter((v) => v > 2);
console.log('🔍 filter(v > 2):', filtered.toArray());
console.assert(filtered.size === 2, '❌ filter باید ۲ آیتم برگرداند');

const mapped = col.map((v) => v * 10);
console.log('✨ map(v * 10):', mapped);
console.assert(mapped.length === 4, '❌ map باید ۴ آیتم برگرداند');
console.assert(mapped[0] === 10, '❌ map اولی باید ۱۰ باشد');

console.log('\n🎉 Collection سالم است!');