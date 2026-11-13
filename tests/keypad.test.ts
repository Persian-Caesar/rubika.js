import { describe, it, expect } from 'vitest';
import { InlineKeypadBuilder } from '../src/builders/InlineKeypadBuilder';

describe('InlineKeypadBuilder', () => {
    it('builds a single-row keypad', () => {
        const keypad = new InlineKeypadBuilder()
            .addButton({ id: '1', button_text: 'Yes' })
            .addButton({ id: '2', button_text: 'No' })
            .build();
        expect(keypad.rows).toHaveLength(1);
        expect(keypad.rows[0]!.buttons).toHaveLength(2);
    });

    it('adjusts buttons across rows', () => {
        const keypad = new InlineKeypadBuilder()
            .addButton({ id: '1', button_text: 'A' })
            .addButton({ id: '2', button_text: 'B' })
            .addButton({ id: '3', button_text: 'C' })
            .adjust(2, 1)
            .build();
        expect(keypad.rows).toHaveLength(2);
    });

    // اصلاح باگ ۴.۲
    it('supports adding buttons after adjust', () => {
        const keypad = new InlineKeypadBuilder()
            .addButton({ id: '1', button_text: 'A' })
            .addButton({ id: '2', button_text: 'B' })
            .adjust(2)
            .addButton({ id: '3', button_text: 'C' })
            .build();
        expect(keypad.rows).toHaveLength(2);
        expect(keypad.rows[0]!.buttons).toHaveLength(2);
        expect(keypad.rows[1]!.buttons).toHaveLength(1);
    });

    it('repeats last size for remaining buttons', () => {
        const keypad = new InlineKeypadBuilder()
            .addButton({ id: '1', button_text: 'A' })
            .addButton({ id: '2', button_text: 'B' })
            .addButton({ id: '3', button_text: 'C' })
            .addButton({ id: '4', button_text: 'D' })
            .adjust(1)
            .build();
        expect(keypad.rows).toHaveLength(4);
    });

    // اصلاح باگ ۴.۱
    it('supports Link buttons', () => {
        const keypad = new InlineKeypadBuilder()
            .addButton({ id: 'x', button_text: 'X', type: 'Link', url: 'https://example.com' })
            .build();
        expect(keypad.rows[0]!.buttons[0]!.type).toBe('Link');
        expect(keypad.rows[0]!.buttons[0]!.url).toBe('https://example.com');
    });

    it('supports Selection buttons', () => {
        const keypad = new InlineKeypadBuilder()
            .addButton({
                id: 'sel',
                button_text: 'Pick',
                type: 'Selection',
                selection: {
                    selection_id: 's1',
                    items: [{ text: 'One' }, { text: 'Two' }],
                },
            })
            .build();
        expect(keypad.rows[0]!.buttons[0]!.selection?.items).toHaveLength(2);
    });

    it('supports Calendar and NumberPicker buttons', () => {
        const keypad = new InlineKeypadBuilder()
            .addButton({ id: 'cal', button_text: 'Date', type: 'Calendar', default_value: '2026-01-01' })
            .addButton({ id: 'num', button_text: 'Num', type: 'NumberPicker', min_value: '1', max_value: '10' })
            .build();
        expect(keypad.rows[0]!.buttons[0]!.default_value).toBe('2026-01-01');
        expect(keypad.rows[0]!.buttons[1]!.min_value).toBe('1');
        expect(keypad.rows[0]!.buttons[1]!.max_value).toBe('10');
    });
});