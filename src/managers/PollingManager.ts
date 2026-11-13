import type { RubikaClient } from '../client/RubikaClient';
import { RubikaAPIError } from '../rest/errors';

export interface PollingOptions {
    interval?: number;
    limit?: number;
}

export class PollingManager {
    private readonly client: RubikaClient;
    private readonly interval: number;
    private readonly limit: number;
    private running = false;
    private startId = '0';

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
                const updates = await this.client.rest.getUpdates({
                    start_id: this.startId,
                    limit: this.limit,
                });
                for (const update of updates) {
                    this.startId = update.update_id;
                    this.client.dispatchUpdate(update);
                }
            } catch (error) {
                this.client.emit('error', error);
                await delay(this.interval);
            }
            await delay(this.interval);
        }
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}