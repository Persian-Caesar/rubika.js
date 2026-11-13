import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'http';
import type { RubikaClient } from '../client/RubikaClient';
import type { Update } from '../types/update';
import type { InlineMessage } from '../types/inline-message';

export interface WebhookOptions {
    /** دامنه عمومی بدون مسیر انتهایی، مثلاً https://bot.example.com */
    baseUrl: string;
    port?: number;
    /** مسیر پایه اختیاری (پیش‌فرض خالی). مسیرهای نهایی: {path}/receiveUpdate و {path}/receiveInlineMessage */
    path?: string;
    /** حداکثر اندازه body بر حسب بایت (پیش‌فرض ۱ مگابایت) */
    maxBodyBytes?: number;
}

const DEFAULT_MAX_BODY = 1_000_000;

export class WebhookManager {
    private readonly client: RubikaClient;
    private readonly baseUrl: string;
    private readonly port: number;
    private readonly pathPrefix: string;
    private readonly maxBodyBytes: number;
    private server?: Server;

    constructor(client: RubikaClient, options: WebhookOptions) {
        this.client = client;
        this.baseUrl = options.baseUrl.replace(/\/$/, '');
        this.port = options.port ?? 3000;
        const rawPath = (options.path ?? '').replace(/\/$/, '');
        this.pathPrefix = rawPath.startsWith('/') || rawPath === '' ? rawPath : `/${rawPath}`;
        this.maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY;
    }

    private endpoint(suffix: string): string {
        return `${this.baseUrl}${this.pathPrefix}${suffix}`;
    }

    private localPath(suffix: string): string {
        return `${this.pathPrefix}${suffix}` || suffix;
    }

    async start(): Promise<void> {
        await this.client.rest.updateBotEndpoint(this.endpoint('/receiveUpdate'), 'ReceiveUpdate');
        await this.client.rest.updateBotEndpoint(
            this.endpoint('/receiveInlineMessage'),
            'ReceiveInlineMessage',
        );

        this.server = createServer((req, res) => this.handleRequest(req, res));
        await new Promise<void>((resolve, reject) => {
            this.server!.once('error', reject);
            this.server!.listen(this.port, () => {
                this.server!.off('error', reject);
                resolve();
            });
        });
    }

    async stop(): Promise<void> {
        if (this.server) {
            await new Promise<void>((resolve, reject) => {
                this.server!.close((err) => (err ? reject(err) : resolve()));
            });
            this.server = undefined;
        }
    }

    private handleRequest(req: IncomingMessage, res: ServerResponse): void {
        const url = (req.url ?? '').split('?')[0] ?? '';
        const isUpdate = url === this.localPath('/receiveUpdate');
        const isInline = url === this.localPath('/receiveInlineMessage');

        if (req.method !== 'POST' || (!isUpdate && !isInline)) {
            res.writeHead(404).end();
            return;
        }

        const chunks: Buffer[] = [];
        let total = 0;
        let aborted = false;

        req.on('data', (chunk: Buffer) => {
            if (aborted) return;
            total += chunk.length;
            if (total > this.maxBodyBytes) {
                aborted = true;
                res.writeHead(413).end('Payload Too Large');
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });

        req.on('end', () => {
            if (aborted) return;
            try {
                const body = Buffer.concat(chunks).toString('utf8');
                const parsed = JSON.parse(body) as Record<string, unknown>;

                if (isInline) {
                    const inline = (parsed.inline_message ?? parsed) as InlineMessage;
                    this.client.dispatchUpdate({
                        update_id: `inline-${inline.message_id ?? Date.now()}`,
                        type: 'InlineMessage',
                        chat_id: inline.chat_id,
                        inline_message: inline,
                    });
                } else {
                    const update = (parsed.update ?? parsed) as Update;
                    this.client.dispatchUpdate(update);
                }

                res.writeHead(200).end('OK');
            } catch (error) {
                this.client.emit('error', error);
                res.writeHead(400).end('Bad Request');
            }
        });

        req.on('error', (error) => {
            this.client.emit('error', error);
        });
    }
}
