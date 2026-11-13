import { Base } from './Base';
import { Chat } from './Chat';
import { User } from './User';
import type { RubikaClient } from '../client/RubikaClient';
import type { APIMessage } from '../types/message';
import type { ChatType } from '../types/chat';

export class Message extends Base {
    public readonly id: string;
    public readonly chat: Chat;
    public readonly from?: User;
    public readonly text?: string;
    public readonly caption?: string;
    public readonly date: Date;
    private readonly _raw: APIMessage;

    constructor(client: RubikaClient, data: APIMessage, chatId?: string) {
        super(client);
        this._raw = data;
        this.id = data.message_id;

        // ✅ chat_id به عنوان پارامتر جداگانه دریافت می‌شود
        if (!chatId)
            chatId = data.chat_id;

        this.chat = new Chat(client, {
            chat_id: chatId,
            chat_type: (data.chat_type ?? 'User') as ChatType,
        });

        this.from = data.sender_id
            ? new User(client, {
                user_id: data.sender_id,
                first_name: data.first_name,
                last_name: data.last_name,
                username: data.username,
            })
            : undefined;

        this.text = data.text;
        this.caption = data.caption;
        this.date = new Date(Number(data.time) * 1000);
    }

    get raw(): APIMessage { return this._raw; }
    get hasText(): boolean { return typeof this.text === 'string' && this.text.length > 0; }
    get hasFile(): boolean { return this._raw.file !== undefined; }
    get hasPoll(): boolean { return this._raw.poll !== undefined; }
    get hasLocation(): boolean { return this._raw.location !== undefined; }
    get hasContact(): boolean { return this._raw.contact !== undefined; }
    get hasSticker(): boolean { return this._raw.sticker !== undefined; }
    get isEdited(): boolean { return this._raw.is_edited === true; }

    async reply(text: string, options?: { inline_keypad?: any; metadata?: any }): Promise<Message> {
        return await this.client.messages.send(this.chat.id, text, {
            reply_to_message_id: this.id,
            ...options,
        });
    }

    async edit(text: string): Promise<Message> {
        return await this.client.messages.edit(this.chat.id, this.id, text);
    }

    async editKeypad(keypad: import('../types/keypad').Keypad): Promise<void> {
        return await this.client.messages.editKeypad(this.chat.id, this.id, keypad);
    }

    async delete(): Promise<void> {
        return await this.client.messages.delete(this.chat.id, this.id);
    }

    async forward(toChatId: string): Promise<void> {
        return await this.client.messages.forward(this.chat.id, this.id, toChatId);
    }
}