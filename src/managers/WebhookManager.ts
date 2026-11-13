import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'http';
import type { RubikaClient } from '../client/RubikaClient';
import type { Update } from '../types/update';

export interface WebhookOptions {
    baseUrl: string;
    port?: number;
}

export class WebhookManager {
    private readonly client: RubikaClient;
    private readonly baseUrl: string;
    private readonly port: number;
    private server?: Server;

    constructor(client: RubikaClient, options: WebhookOptions) {
        this.client = client;
        this.baseUrl = options.baseUrl.replace(/\/$/, ''); // حذف اسلش انتهایی
        this.port = options.port ?? 3000;
    }

    async start(): Promise<void> {
        // Register endpoint for regular messages
        await this.client.rest.updateBotEndpoint(
            `${this.baseUrl}/receiveUpdate`
        );
        // Register endpoint for inline button callbacks
        await this.client.rest.updateBotEndpoint(
            `${this.baseUrl}/receiveInlineMessage`
        );

        // Start local HTTP server
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
        // Accept both paths
        if (
            req.method !== 'POST' ||
            (req.url !== '/receiveUpdate' && req.url !== '/receiveInlineMessage')
        ) {
            res.writeHead(404).end();
            return;
        }
        
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                const update = (parsed.update ?? parsed) as Update;
                this.client.dispatchUpdate(update);
                res.writeHead(200).end('OK');
            } catch (error) {
                this.client.emit('error', error);
                res.writeHead(400).end('Bad Request');
            }
        });
    }
}