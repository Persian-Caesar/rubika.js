import { Base } from './Base';
import type { RubikaClient } from '../client/RubikaClient';
import type { APIBot } from '../types/user';

export class User extends Base {
    public readonly id: string;
    public readonly username?: string;
    public readonly firstName: string;
    public readonly lastName?: string;
    public readonly isBot: boolean;

    constructor(client: RubikaClient, data: APIBot | { user_id: string; first_name?: string }) {
        super(client);
        if ('bot_id' in data) {
            this.id = data.bot_id;
            this.username = data.bot_username;
            this.firstName = data.first_name;
            this.lastName = data.last_name;
            this.isBot = true;
        } else {
            this.id = data.user_id;
            this.firstName = data.first_name ?? '';
            this.isBot = false;
        }
    }

    get fullName(): string {
        return this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName;
    }

    toString(): string {
        return this.username ? `@${this.username}` : this.fullName;
    }
}