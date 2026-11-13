import { BaseManager } from './BaseManager';
import { Message } from '../structures/Message';
import type { RubikaClient } from '../client/RubikaClient';
import type { APIMessage } from '../types/message';
import type { Keypad } from '../types/keypad';

export interface SendMessageOptions {
    chat_keypad?: Keypad;
    inline_keypad?: Keypad;
    chat_keypad_type?: string;
    disable_notification?: boolean;
    reply_to_message_id?: string;
}

export class MessageManager extends BaseManager {
    constructor(client: RubikaClient) {
        super(client);
    }

    async send(chatId: string, text: string, options?: SendMessageOptions): Promise<Message> {
        const payload = { chat_id: chatId, text, ...options };
        const data = await this.client.rest.sendMessage(payload);
        return new Message(this.client, { ...payload, message_id: data.message_id } as APIMessage);
    }

    async edit(chatId: string, messageId: string, text: string): Promise<Message> {
        const data = await this.client.rest.request<APIMessage>('editMessageText', {
            body: { chat_id: chatId, message_id: messageId, text },
        });
        return new Message(this.client, data);
    }

    async delete(chatId: string, messageId: string): Promise<void> {
        await this.client.rest.request<boolean>('deleteMessage', {
            body: { chat_id: chatId, message_id: messageId },
        });
    }
}