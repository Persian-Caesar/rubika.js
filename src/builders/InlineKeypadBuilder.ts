import { BaseBuilder } from './BaseBuilder';
import type { Keypad, Button, ButtonType, ButtonSelection } from '../types/keypad';

export interface ButtonOptions {
    id: string;
    button_text: string;
    type?: ButtonType;
    url?: string;
    selection?: ButtonSelection;
    default_value?: string;
    min_value?: string;
    max_value?: string;
}

export class InlineKeypadBuilder extends BaseBuilder<Keypad> {
    private buttons: Button[] = [];
    private rowSizes: number[] = [];

    addButton(options: ButtonOptions): this {
        this.buttons.push({
            id: options.id,
            type: options.type ?? 'Simple',
            button_text: options.button_text,
            ...(options.url ? { url: options.url } : {}),
            ...(options.selection ? { selection: options.selection } : {}),
            ...(options.default_value ? { default_value: options.default_value } : {}),
            ...(options.min_value ? { min_value: options.min_value } : {}),
            ...(options.max_value ? { max_value: options.max_value } : {}),
        });
        return this;
    }

    /**
     * اندازه ردیف‌ها را تنظیم می‌کند. آخرین اندازه برای دکمه‌های باقیمانده تکرار می‌شود.
     * می‌توان چندبار فراخوانی کرد و دکمه‌های جدید بعد از آن اضافه کرد.
     */
    adjust(...sizes: number[]): this {
        this.rowSizes.push(...sizes);
        return this;
    }

    build(): Keypad {
        if (this.rowSizes.length === 0) {
            return { rows: [{ buttons: [...this.buttons] }] };
        }

        const rows: { buttons: Button[] }[] = [];
        let index = 0;
        for (let i = 0; i < this.rowSizes.length; i++) {
            const size = this.rowSizes[i]!;
            if (i === this.rowSizes.length - 1) {
                // آخرین اندازه برای بقیه دکمه‌ها تکرار می‌شود
                while (index < this.buttons.length) {
                    rows.push({ buttons: this.buttons.slice(index, index + size) });
                    index += size;
                }
            } else {
                const row = this.buttons.slice(index, index + size);
                if (row.length > 0) rows.push({ buttons: row });
                index += size;
            }
        }
        if (index < this.buttons.length) {
            rows.push({ buttons: this.buttons.slice(index) });
        }
        return { rows };
    }
}