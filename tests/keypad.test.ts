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
});