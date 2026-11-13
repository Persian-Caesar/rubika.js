
import type { RubikaClient } from '../client/RubikaClient';

export interface PollingOptions {
    interval?: number;
    limit?: number;
    /** نادیده گرفتن آپدیت‌های قدیمی هنگام شروع */
    skipOldUpdatesOnStart?: boolean;
}

export class PollingManager {
    private readonly client: RubikaClient;
    private readonly interval: number;
    private readonly limit: number;
    private readonly skipOldUpdatesOnStart: boolean;

    private running = false;
    private offsetId: string | undefined;
    private isFirstFetch = true;

    constructor(client: RubikaClient, options: PollingOptions = {}) {
        this.client = client;
        this.interval = options.interval ?? 3000;
        this.limit = options.limit ?? 100;
        this.skipOldUpdatesOnStart = options.skipOldUpdatesOnStart ?? true;
    }

    start(): void {
        if (this.running) return;

        this.running = true;
        this.isFirstFetch = true;
        this.offsetId = undefined;

        void this.loop();
    }

    stop(): void {
        this.running = false;
    }

    private async skipPendingUpdates(): Promise<void> {
        const result = await this.client.rest.getUpdates({
            limit: this.limit,
        });

        // آپدیت‌های دریافت‌شده Dispatch نمی‌شوند.
        // فقط آخرین Offset برای دریافت‌های بعدی ذخیره می‌شود.
        this.offsetId = result.next_offset_id;
    }

    private async loop(): Promise<void> {
        while (this.running) {
            try {
                // در اولین اجرای Polling، آپدیت‌های قبلی را رد کن.
                if (this.isFirstFetch) {
                    this.isFirstFetch = false;

                    if (this.skipOldUpdatesOnStart) {
                        await this.skipPendingUpdates();
                        continue;
                    }
                }

                if (!this.running) break;

                const result = await this.client.rest.getUpdates({
                    offset_id: this.offsetId,
                    limit: this.limit,
                });

                if (result.next_offset_id) {
                    this.offsetId = result.next_offset_id;
                }

                for (const update of result.updates ?? []) {
                    if (!this.running) break;

                    this.client.dispatchUpdate(update);
                }
            } catch (error) {
                this.client.emit('error', error);
            }

            if (this.running) {
                await delay(this.interval);
            }
        }
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}