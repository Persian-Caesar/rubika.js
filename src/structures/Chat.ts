import { Base } from './Base';
import type { RubikaClient } from '../client/RubikaClient';
import type { APIChat } from '../types/chat';

export class Chat extends Base {
    public readonly id: string;
    public readonly type: APIChat['chat_type'];
    public readonly title?: string;
    public readonly username?: string;

    constructor(client: RubikaClient, data: APIChat) {
        super(client);
        this.id = data.chat_id;
        this.type = data.chat_type;
        this.title = data.title;
        this.username = data.username;
    }

    get isPrivate(): boolean { return this.type === 'User'; }
    get isGroup(): boolean { return this.type === 'Group'; }
    get isChannel(): boolean { return this.type === 'Channel'; }
}