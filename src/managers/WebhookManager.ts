import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'http';
import type { RubikaClient } from '../client/RubikaClient';
import type { Update } from '../types/update';

export interface WebhookOptions {
    endpoint: string;
    port?: number;
    path?: string;
}

export class WebhookManager {
    private readonly client: RubikaClient;
    private readonly endpoint: string;
    private readonly port: number;
    private readonly path: string;
    private server?: Server;

    constructor(client: RubikaClient, options: WebhookOptions) {
        this.client = client;
        this.endpoint = options.endpoint;
        this.port = options.port ?? 3000;
        this.path = options.path ?? '/rubika/webhook';
    }

    async start(): Promise<void> {
        await this.client.rest.updateBotEndpoint(this.endpoint);
        this.server = createServer((req, res) => this.handleRequest(req, res));
        await new Promise<void>((resolve, reject) => {
            this.server!.listen(this.port, () => resolve());
            this.server!.on('error', reject);
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
        if (req.method !== 'POST' || req.url !== this.path) {
            res.writeHead(404).end();
            return;
        }
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                // ممکن است روبیکا update را مستقیماً بفرستد یا داخل کلید update
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