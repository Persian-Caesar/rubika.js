import { BaseManager } from './BaseManager';
import { Message } from '../structures/Message';
import type { RubikaClient } from '../client/RubikaClient';
import type { APIMessage } from '../types/message';
import type { Keypad } from '../types/keypad';
import type { Metadata } from '../types/metadata';

export interface SendMessageOptions {
    metadata?: Metadata;
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
        return new Message(this.client, {
            ...data,
            chat_id: chatId,
            message_id: data.message_id,
            text,
            time: String(Math.floor(Date.now() / 1000)),
        } as APIMessage);
    }

    async edit(chatId: string, messageId: string, text: string): Promise<Message> {
        const data = await this.client.rest.editMessageText({
            chat_id: chatId,
            message_id: messageId,
            text,
        });
        const messageIdOut =
            'message_id' in data && data.message_id ? data.message_id : messageId;
        return new Message(this.client, {
            ...(typeof data === 'object' ? data : {}),
            chat_id: chatId,
            message_id: messageIdOut,
            text,
            time: String(Math.floor(Date.now() / 1000)),
        } as APIMessage);
    }

    async editKeypad(chatId: string, messageId: string, keypad: Keypad): Promise<void> {
        await this.client.rest.editMessageKeypad({
            chat_id: chatId,
            message_id: messageId,
            inline_keypad: keypad,
        });
    }

    async delete(chatId: string, messageId: string): Promise<void> {
        await this.client.rest.deleteMessage({
            chat_id: chatId,
            message_id: messageId,
        });
    }

    async forward(
        fromChatId: string,
        messageId: string,
        toChatId: string,
        options?: { disable_notification?: boolean },
    ): Promise<void> {
        await this.client.rest.forwardMessage({
            from_chat_id: fromChatId,
            message_id: messageId,
            to_chat_id: toChatId,
            ...options,
        });
    }

    async sendPoll(
        chatId: string,
        question: string,
        options: string[],
        opts?: {
            is_anonymous?: boolean;
            allows_multiple_answers?: boolean;
            reply_to_message_id?: string;
        },
    ): Promise<Message> {
        const data = await this.client.rest.sendPoll({
            chat_id: chatId,
            question,
            options,
            ...opts,
        });
        return new Message(this.client, {
            chat_id: chatId,
            message_id: data.message_id,
            text: question,
            time: String(Math.floor(Date.now() / 1000)),
        } as APIMessage);
    }

    async sendLocation(
        chatId: string,
        latitude: string,
        longitude: string,
        opts?: { reply_to_message_id?: string },
    ): Promise<Message> {
        const data = await this.client.rest.sendLocation({
            chat_id: chatId,
            latitude,
            longitude,
            ...opts,
        });
        return new Message(this.client, {
            chat_id: chatId,
            message_id: data.message_id,
            time: String(Math.floor(Date.now() / 1000)),
            location: { latitude, longitude },
        } as APIMessage);
    }

    async sendContact(
        chatId: string,
        contact: { first_name: string; last_name?: string; phone_number: string },
        opts?: { reply_to_message_id?: string },
    ): Promise<Message> {
        const data = await this.client.rest.sendContact({
            chat_id: chatId,
            ...contact,
            ...opts,
        });
        return new Message(this.client, {
            chat_id: chatId,
            message_id: data.message_id,
            time: String(Math.floor(Date.now() / 1000)),
            contact,
        } as APIMessage);
    }
}
