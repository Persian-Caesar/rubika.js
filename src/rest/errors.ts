import type { ResponseParameters } from '../types/api';

export class RubikaAPIError extends Error {
    public readonly code: number;
    public readonly parameters?: ResponseParameters;

    constructor(code: number, message: string, parameters?: ResponseParameters) {
        super(message);
        this.name = 'RubikaAPIError';
        this.code = code;
        this.parameters = parameters;
    }
}

/**
 * کلیک دکمه‌های شیشه‌ای (InlineKeypad) طبق مستندات رسمی روبیکا
 * فقط از طریق Webhook و endpoint مخصوص `ReceiveInlineMessage` ارسال می‌شود.
 * متد getUpdates (Polling) این رویداد را تضمین نمی‌کند.
 *
 * برای استفادهٔ مطمئن از رویداد `callbackQuery` باید mode را روی `webhook` بگذارید.
 *
 * اگر می‌خواهید در polling فقط حالت best-effort (تشخیص button_id
 * داخل NewMessage، مثلاً ChatKeypad یا موارد نادر) را فعال کنید،
 * در options مقدار `allowCallbackQueryInPolling: true` بگذارید.
 */
export class CallbackQueryRequiresWebhookError extends Error {
    public readonly code = 'CALLBACK_QUERY_REQUIRES_WEBHOOK';
    public readonly currentMode: string;
    public readonly requiredModes = ['webhook'] as const;

    constructor(currentMode: string = 'polling') {
        super(
            [
                'رویداد callbackQuery (کلیک دکمه شیشه‌ای / InlineKeypad) در حالت polling پشتیبانی رسمی ندارد.',
                'طبق مستندات روبیکا این رویداد فقط از طریق Webhook با endpoint از نوع ReceiveInlineMessage دریافت می‌شود.',
                `حالت فعلی کلاینت: "${currentMode}"`,
                'راه‌حل: mode را روی "webhook" تنظیم کنید و endpoint از نوع ReceiveInlineMessage ثبت کنید.',
                'اگر عمداً می‌خواهید تشخیص experimental از طریق NewMessage+aux_data را در polling امتحان کنید،',
                'گزینه allowCallbackQueryInPolling: true را در RubikaClientOptions فعال کنید (تضمینی نیست و برای InlineKeypad رسمی نیست).',
            ].join(' '),
        );
        this.name = 'CallbackQueryRequiresWebhookError';
        this.currentMode = currentMode;
    }
}
