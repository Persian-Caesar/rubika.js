import type { ClientEvents } from '../types/events';
import { MessageManager } from '../managers/MessageManager';
import { PollingManager } from '../managers/PollingManager';
import { WebhookManager } from '../managers/WebhookManager';
import { CallbackQuery } from '../structures/CallbackQuery';
import { TypedEmitter } from '../structures/TypedEmitter';
import { MediaManager } from '../managers/MediaManager';
import { RESTManager } from '../rest/RESTManager';
import { CallbackQueryRequiresWebhookError } from '../rest/errors';
import type { APIBot } from '../types/user';
import type { Update } from '../types/update';
import type { InlineMessage } from '../types/inline-message';
import type { APIMessage } from '../types/message';
import { Message } from '../structures/Message';

export interface RubikaClientOptions {
    token: string;
    /** حالت دریافت رویداد. پیش‌فرض: polling. auto-webhook حذف شده است. */
    mode?: 'polling' | 'webhook';
    polling?: { interval?: number; limit?: number; skipOldUpdatesOnStart?: boolean };
    webhook?: {
        endpoint: string;
        port?: number;
        /** مسیر پایه اختیاری؛ مسیرهای نهایی /receiveUpdate و /receiveInlineMessage */
        path?: string;
        maxBodyBytes?: number;
    };
    /**
     * فقط برای حالت polling:
     * اگر true باشد، ثبت listener برای callbackQuery خطا نمی‌دهد و
     * تلاش best-effort برای تشخیص button_id داخل NewMessage انجام می‌شود
     * (معمولاً برای ChatKeypad؛ برای InlineKeypad تضمین رسمی ندارد).
     * پیش‌فرض: false
     */
    allowCallbackQueryInPolling?: boolean;
}

export class RubikaClient extends TypedEmitter<ClientEvents> {
    public readonly rest: RESTManager;
    public readonly messages: MessageManager;
    public readonly media: MediaManager;

    private readonly mode: NonNullable<RubikaClientOptions['mode']>;
    private readonly options: RubikaClientOptions;
    private readonly allowCallbackQueryInPolling: boolean;
    private pollingManager?: PollingManager;
    private webhookManager?: WebhookManager;
    private botInfo?: APIBot;
    private callbackQueryGuardWarned = false;

    constructor(options: RubikaClientOptions) {
        super();
        this.options = options;
        this.mode = options.mode ?? 'polling';
        this.allowCallbackQueryInPolling = options.allowCallbackQueryInPolling ?? false;
        this.rest = new RESTManager(options.token);
        this.messages = new MessageManager(this);
        this.media = new MediaManager(this);
    }

    get bot(): APIBot | undefined {
        return this.botInfo;
    }

    /**
     * جلوگیری از ثبت ناخواستهٔ callbackQuery در polling بدون آگاهی.
     * در mode=webhook آزاد است.
     * در polling فقط با allowCallbackQueryInPolling: true مجاز است؛ وگرنه خطا پرتاب می‌شود.
     */
    override on<K extends keyof ClientEvents & string>(
        event: K,
        listener: (...args: ClientEvents[K]) => void,
    ): this {
        this.assertCallbackQueryAllowed(event);
        return super.on(event, listener);
    }

    override once<K extends keyof ClientEvents & string>(
        event: K,
        listener: (...args: ClientEvents[K]) => void,
    ): this {
        this.assertCallbackQueryAllowed(event);
        return super.once(event, listener);
    }

    private assertCallbackQueryAllowed(event: string): void {
        if (event !== 'callbackQuery') return;
        if (this.mode === 'webhook') return;
        if (this.allowCallbackQueryInPolling) {
            if (!this.callbackQueryGuardWarned) {
                this.callbackQueryGuardWarned = true;
                // eslint-disable-next-line no-console
                console.warn(
                    '[rubika.js] callbackQuery در polling فقط best-effort است ' +
                        '(NewMessage + aux_data.button_id). برای InlineKeypad رسمی از mode="webhook" استفاده کنید.',
                );
            }
            return;
        }
        throw new CallbackQueryRequiresWebhookError(this.mode);
    }

    async login(): Promise<void> {
        this.botInfo = await this.rest.getMe();
        this.emit('ready', this.botInfo);

        if (this.mode === 'polling') {
            this.pollingManager = new PollingManager(this, this.options.polling);
            this.pollingManager.start();
        } else if (this.mode === 'webhook') {
            if (!this.options.webhook?.endpoint) {
                throw new Error('webhook.endpoint الزامی است');
            }
            this.webhookManager = new WebhookManager(this, {
                baseUrl: this.options.webhook.endpoint,
                port: this.options.webhook.port,
                path: this.options.webhook.path,
                maxBodyBytes: this.options.webhook.maxBodyBytes,
            });
            await this.webhookManager.start();
        } else {
            throw new Error(
                `mode نامعتبر: "${String(this.mode)}". فقط "polling" یا "webhook" پشتیبانی می‌شود. auto-webhook حذف شده است.`,
            );
        }
    }

    async destroy(): Promise<void> {
        this.pollingManager?.stop();
        await this.webhookManager?.stop();
        this.pollingManager = undefined;
        this.webhookManager = undefined;
    }

    /**
     * آپدیت‌ها را به رویدادهای discord.js-like تبدیل می‌کند.
     */
    dispatchUpdate(update: Update): void {
        switch (update.type) {
            case 'NewMessage':
                if (update.new_message) {
                    const chatId = update.chat_id ?? update.new_message.chat_id;
                    if (chatId) {
                        this.emit(
                            'messageCreate',
                            new Message(this, update.new_message, chatId),
                        );
                    }

                    // best-effort: اگر button_id در aux_data باشد (معمولاً ChatKeypad)
                    // و اجازهٔ polling داده شده یا mode=webhook باشد، callbackQuery هم emit شود.
                    if (this.mode === 'webhook' || this.allowCallbackQueryInPolling) {
                        const inline = this.tryBuildInlineMessageFromNewMessage(
                            update.new_message,
                            chatId,
                        );
                        if (inline) {
                            this.emit('callbackQuery', new CallbackQuery(this, inline));
                        }
                    }
                }
                break;

            case 'UpdatedMessage':
                if (update.updated_message) {
                    const chatId = update.chat_id ?? update.updated_message.chat_id;
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
                // مسیر رسمی InlineKeypad — معمولاً فقط از webhook ReceiveInlineMessage می‌آید
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
                break;
        }
    }

    /**
     * اگر NewMessage شامل aux_data.button_id باشد، InlineMessage مصنوعی می‌سازد
     * تا همان رویداد callbackQuery قابل استفاده باشد (best-effort).
     */
    private tryBuildInlineMessageFromNewMessage(
        message: APIMessage,
        chatId?: string,
    ): InlineMessage | null {
        const aux = message.aux_data;
        if (!aux || typeof aux !== 'object') return null;

        const buttonId =
            typeof aux.button_id === 'string' && aux.button_id.length > 0
                ? aux.button_id
                : undefined;

        if (!buttonId) return null;

        const resolvedChatId = chatId ?? message.chat_id;
        if (!resolvedChatId || !message.message_id || !message.sender_id) return null;

        return {
            chat_id: resolvedChatId,
            message_id: message.message_id,
            sender_id: message.sender_id,
            text: message.text ?? '',
            aux_data: {
                start_id: aux.start_id ?? null,
                button_id: buttonId,
            },
            data: buttonId,
        };
    }
}
