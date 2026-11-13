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
    private consecutiveErrors = 0;
    private readonly seenUpdateIds = new Set<string>();
    private readonly maxSeen = 500;

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
        this.consecutiveErrors = 0;
        this.seenUpdateIds.clear();

        void this.loop();
    }

    stop(): void {
        this.running = false;
    }

    private async skipPendingUpdates(): Promise<void> {
        const result = await this.client.rest.getUpdates({
            limit: this.limit,
        });
        this.offsetId = result.next_offset_id;
    }

    private remember(updateId: string): boolean {
        if (this.seenUpdateIds.has(updateId)) return false;
        this.seenUpdateIds.add(updateId);
        if (this.seenUpdateIds.size > this.maxSeen) {
            const first = this.seenUpdateIds.values().next().value;
            if (first !== undefined) this.seenUpdateIds.delete(first);
        }
        return true;
    }

    private async loop(): Promise<void> {
        while (this.running) {
            try {
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
                    const id = update.update_id;
                    if (id && !this.remember(id)) continue;
                    this.client.dispatchUpdate(update);
                }

                this.consecutiveErrors = 0;
            } catch (error) {
                this.consecutiveErrors += 1;
                this.client.emit('error', error);
            }

            if (this.running) {
                const backoff =
                    this.consecutiveErrors > 0
                        ? Math.min(this.interval * 2 ** Math.min(this.consecutiveErrors, 4), 30_000)
                        : this.interval;
                await delay(backoff);
            }
        }
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
