import { Base } from './Base';
import { Chat } from './Chat';
import { User } from './User';
import type { RubikaClient } from '../client/RubikaClient';
import type { APIMessage } from '../types/message';

export class Message extends Base {
    public readonly id: string;
    public readonly chat: Chat;
    public readonly from?: User;
    public readonly text?: string;
    public readonly caption?: string;
    public readonly date: Date;
    private readonly _raw: APIMessage;

    constructor(client: RubikaClient, data: APIMessage) {
        super(client);
        this._raw = data;
        this.id = data.message_id;
        this.chat = new Chat(client, { chat_id: data.chat_id, chat_type: 'User' } as any);
        this.from = data.sender_id ? new User(client, { user_id: data.sender_id }) : undefined;
        this.text = data.text;
        this.caption = data.caption;
        this.date = new Date(Number(data.time) * 1000);
    }

    get raw(): APIMessage { return this._raw; }
    get hasText(): boolean { return typeof this.text === 'string' && this.text.length > 0; }

    async reply(text: string, options?: { inline_keypad?: any }): Promise<Message> {
        return this.client.messages.send(this.chat.id, text, {
            reply_to_message_id: this.id,
            ...options,
        });
    }

    async edit(text: string): Promise<Message> {
        return this.client.messages.edit(this.chat.id, this.id, text);
    }

    async delete(): Promise<void> {
        return this.client.messages.delete(this.chat.id, this.id);
    }
}