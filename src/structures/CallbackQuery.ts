import { Base } from './Base';
import type { RubikaClient } from '../client/RubikaClient';
import type { InlineMessage } from '../types/inline-message';
import type { Keypad } from '../types/keypad';
import type { SendMessageOptions } from '../managers/MessageManager';
import { Message } from './Message';

export class CallbackQuery extends Base {
    public readonly chatId: string;
    public readonly messageId: string;
    public readonly fromId: string;
    public readonly buttonId: string;
    public readonly data?: string;
    public readonly text?: string;
    private readonly _raw: InlineMessage;

    constructor(client: RubikaClient, data: InlineMessage) {
        super(client);
        this._raw = data;
        this.chatId = data.chat_id;
        this.messageId = data.message_id;
        this.fromId = data.sender_id;
        this.buttonId = data.aux_data?.button_id ?? data.data ?? '';
        this.data = data.data ?? data.aux_data?.button_id;
        this.text = data.text;
    }

    get raw(): InlineMessage {
        return this._raw;
    }

    async answer(text?: string, options?: { show_alert?: boolean }): Promise<boolean> {
        return await this.client.rest.answerCallbackQuery({
            callback_query_id: this.buttonId,
            button_id: this.buttonId,
            text,
            show_alert: options?.show_alert,
        });
    }

    async reply(text: string, options?: SendMessageOptions): Promise<Message> {
        return await this.client.messages.send(this.chatId, text, {
            reply_to_message_id: this.messageId,
            ...options,
        });
    }

    async editMessageText(text: string): Promise<Message> {
        return await this.client.messages.edit(this.chatId, this.messageId, text);
    }

    async editMessageKeypad(keypad: Keypad): Promise<void> {
        return await this.client.messages.editKeypad(this.chatId, this.messageId, keypad);
    }
}
