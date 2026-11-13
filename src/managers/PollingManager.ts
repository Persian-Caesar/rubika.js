import type { RubikaClient } from '../client/RubikaClient';

export interface PollingOptions {
    interval?: number;
    limit?: number;
}

export class PollingManager {
    private readonly client: RubikaClient;
    private readonly interval: number;
    private readonly limit: number;
    private running = false;
    private offsetId: string | undefined = undefined;

    constructor(client: RubikaClient, options: PollingOptions = {}) {
        this.client = client;
        this.interval = options.interval ?? 3000;
        this.limit = options.limit ?? 100;
    }

    start(): void {
        if (this.running) return;
        this.running = true;
        void this.loop();
    }

    stop(): void {
        this.running = false;
    }

    private async loop(): Promise<void> {
        while (this.running) {
            try {
                const result = await this.client.rest.getUpdates({
                    offset_id: this.offsetId,
                    limit: this.limit,
                });

                // ✅ حیاتی: next_offset_id را برای درخواست بعدی ذخیره کن
                // این کار از دریافت مجدد همان آپدیت‌ها جلوگیری می‌کند
                const newOffset = result.next_offset_id;
                if (newOffset && newOffset !== this.offsetId) {
                    this.offsetId = newOffset;
                }

                const updates = result.updates ?? [];
                for (const update of updates) {
                    this.client.dispatchUpdate(update);
                }
            } catch (error) {
                // در صورت خطا، offset_id را تغییر نده تا از دست رفتن آپدیت جلوگیری شود
                this.client.emit('error', error);
            }
            // حتی در صورت خطا هم صبر کن تا از حلقه‌ی سریع جلوگیری شود
            await delay(this.interval);
        }
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}