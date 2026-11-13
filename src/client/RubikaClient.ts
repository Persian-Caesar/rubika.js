import type { ClientEvents } from '../types/events';
import { RESTManager } from '../rest/RESTManager';
import { MessageManager } from '../managers/MessageManager';
import { MediaManager } from '../managers/MediaManager';
import { PollingManager } from '../managers/PollingManager';
import { WebhookManager } from '../managers/WebhookManager';
import { CallbackQuery } from '../structures/CallbackQuery';
import { TypedEmitter } from '../structures/TypedEmitter';
import { Message } from '../structures/Message';
import type { APIBot } from '../types/user';
import type { Update } from '../types/update';

export interface RubikaClientOptions {
    token: string;
    mode?: 'polling' | 'webhook';
    polling?: { interval?: number; limit?: number };
    webhook?: { endpoint: string; port?: number; path?: string };
}

export class RubikaClient extends TypedEmitter<ClientEvents> {
    public readonly rest: RESTManager;
    public readonly messages: MessageManager;
    public readonly media: MediaManager;

    private readonly mode: 'polling' | 'webhook';
    private readonly options: RubikaClientOptions;
    private pollingManager?: PollingManager;
    private webhookManager?: WebhookManager;
    private botInfo?: APIBot;
    private token: string;

    constructor(options: RubikaClientOptions) {
        super();
        this.options = options;
        this.mode = options.mode ?? 'polling';
        this.token = options.token;
        this.rest = new RESTManager(this.token);
        this.messages = new MessageManager(this);
        this.media = new MediaManager(this);
    }

    get bot(): APIBot | undefined { return this.botInfo; }

    async login(): Promise<void> {
        this.botInfo = await this.rest.getMe();
        this.emit('ready', this.botInfo);

        if (this.mode === 'polling') {
            this.pollingManager = new PollingManager(this, this.options.polling);
            this.pollingManager.start();
        } else {
            if (!this.options.webhook?.endpoint) {
                throw new Error('webhook.endpoint الزامی است');
            }
            this.webhookManager = new WebhookManager(this, this.options.webhook);
            await this.webhookManager.start();
        }
    }

    async destroy(): Promise<void> {
        this.pollingManager?.stop();
        this.pollingManager = undefined;
        await this.webhookManager?.stop();
        this.webhookManager = undefined;
    }

    dispatchUpdate(update: Update): void {
        if (update.type === 'NewMessage' && update.new_message) {
            this.emit('messageCreate', new Message(this, update.new_message));
        }
        if (update.type === 'UpdatedMessage' && update.updated_message) {
            this.emit('messageEdit', new Message(this, update.updated_message));
        }
        if (update.type === 'InlineMessage' && update.inline_message) {
            this.emit('callbackQuery', new CallbackQuery(this, update.inline_message));
        }
    }
}