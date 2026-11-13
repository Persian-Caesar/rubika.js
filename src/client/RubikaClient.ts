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

    constructor(options: RubikaClientOptions) {
        super();
        this.options = options;
        this.mode = options.mode ?? 'polling';
        this.rest = new RESTManager(options.token);
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

    /**
         * ✅ آپدیت‌ها را به رویدادهای discord.js-like تبدیل می‌کند.
         * هر آپدیت تنها یک‌بار emit می‌شود (چون PollingManager از آپدیت تکراری جلوگیری می‌کند).
         */
    dispatchUpdate(update: Update): void {
        switch (update.type) {
            case 'NewMessage':
                if (update.new_message) {
                    // ✅ chat_id از سطح اصلی update خوانده می‌شود (نه از sender_id)
                    const chatId = update.chat_id;
                    if (chatId) {
                        this.emit(
                            'messageCreate',
                            new Message(this, update.new_message, chatId),
                        );
                    }
                }
                break;

            case 'UpdatedMessage':
                if (update.updated_message) {
                    const chatId = update.chat_id;
                    if (chatId) {
                        this.emit(
                            'messageEdit',
                            new Message(this, update.updated_message, chatId),
                        );
                    }
                }
                break;

            case 'RemovedMessage':
                if (update.removed_message_id) {
                    this.emit('messageDelete', update.removed_message_id, update.chat_id);
                }
                break;

            case 'InlineMessage':
                if (update.inline_message) {
                    this.emit('callbackQuery', new CallbackQuery(this, update.inline_message));
                }
                break;

            case 'StartedBot':
                this.emit('botStarted', update);
                break;

            case 'StoppedBot':
                this.emit('botStopped', update);
                break;

            case 'EventData':
                this.emit('eventData', update);
                break;

            default:
                // انواع ناشناخته را نادیده بگیر (یا لاگ کن)
                break;
        }
    }
}