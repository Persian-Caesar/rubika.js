import { describe, it, expect } from 'vitest';
import { InlineKeypadBuilder } from '../src/builders/InlineKeypadBuilder';
import { Collection } from '../src/util/Collection';
import { CallbackQueryRequiresWebhookError } from '../src/rest/errors';

describe('InlineKeypadBuilder edge cases', () => {
    it('throws on adjust(0)', () => {
        expect(() => new InlineKeypadBuilder().adjust(0)).toThrow();
    });
    it('throws on negative adjust', () => {
        expect(() => new InlineKeypadBuilder().adjust(-1)).toThrow();
    });
    it('builds empty keypad', () => {
        const k = new InlineKeypadBuilder().build();
        expect(k.rows).toEqual([]);
    });
});

describe('Collection', () => {
    it('find/some/every/sweep/random', () => {
        const c = new Collection<string, number>([
            ['a', 1],
            ['b', 2],
            ['c', 3],
        ]);
        expect(c.find((v) => v === 2)).toBe(2);
        expect(c.some((v) => v > 2)).toBe(true);
        expect(c.every((v) => v > 0)).toBe(true);
        expect(c.random()).toBeDefined();
        expect(c.sweep((v) => v === 1)).toBe(1);
        expect(c.size).toBe(2);
    });
});

describe('CallbackQueryRequiresWebhookError', () => {
    it('has expected code', () => {
        const e = new CallbackQueryRequiresWebhookError('polling');
        expect(e.code).toBe('CALLBACK_QUERY_REQUIRES_WEBHOOK');
        expect(e.currentMode).toBe('polling');
    });
});
