import { Base } from './Base';
import type { RubikaClient } from '../client/RubikaClient';
import type { APIChat } from '../types/chat';

export class Chat extends Base {
    public readonly id: string;
    public readonly type: APIChat['chat_type'];
    public readonly title?: string;
    public readonly username?: string;
    public readonly firstName?: string;
    public readonly lastName?: string;
    public readonly description?: string;
    public readonly inviteLink?: string;
    public readonly memberCount?: number;

    constructor(client: RubikaClient, data: APIChat) {
        super(client);
        this.id = data.chat_id;
        this.type = data.chat_type;
        this.title = data.title;
        this.username = data.username;
        this.firstName = data.first_name;
        this.lastName = data.last_name;
        this.description = data.description;
        this.inviteLink = data.invite_link;
        this.memberCount = data.member_count;
    }

    get isPrivate(): boolean { return this.type === 'User'; }
    get isGroup(): boolean { return this.type === 'Group'; }
    get isChannel(): boolean { return this.type === 'Channel'; }
}