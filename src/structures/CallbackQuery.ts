import { Base } from './Base';
import type { RubikaClient } from '../client/RubikaClient';
import type { InlineMessage } from '../types/inline-message';

export class CallbackQuery extends Base {
    public readonly chatId: string;
    public readonly messageId: string;
    public readonly fromId: string;
    public readonly buttonId: string;
    public readonly data?: string;

    constructor(client: RubikaClient, data: InlineMessage) {
        super(client);
        this.chatId = data.chat_id;
        this.messageId = data.message_id;
        this.fromId = data.sender_id;
        this.buttonId = data.button_id;
        this.data = data.data;
    }

    async answer(text?: string): Promise<boolean> {
        return this.client.rest.request<boolean>('answerCallbackQuery', {
            body: { callback_query_id: this.buttonId, text },
        });
    }
}