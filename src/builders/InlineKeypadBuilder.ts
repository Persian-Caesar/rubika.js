import { BaseBuilder } from './BaseBuilder';
import type { Keypad, Button, ButtonType } from '../types/keypad';

export interface ButtonOptions {
    id: string;
    button_text: string;
    type?: ButtonType;
    url?: string;
}

export class InlineKeypadBuilder extends BaseBuilder<Keypad> {
    private buttons: Button[] = [];
    private rows: Button[][] = [];

    addButton(options: ButtonOptions): this {
        this.buttons.push({
            id: options.id,
            type: options.type ?? 'Simple',
            button_text: options.button_text,
            ...(options.url ? { url: options.url } : {}),
        });
        return this;
    }

    adjust(...sizes: number[]): this {
        let index = 0;
        for (const size of sizes) {
            const row = this.buttons.slice(index, index + size);
            if (row.length > 0) this.rows.push(row);
            index += size;
        }
        const remaining = this.buttons.slice(index);
        if (remaining.length > 0) this.rows.push(remaining);
        return this;
    }

    build(): Keypad {
        const rows = (this.rows.length > 0 ? this.rows : [this.buttons]).map((buttons) => ({ buttons }));
        return { rows };
    }
}