import { request } from 'undici';
import type { APIResponse } from '../types/api';
import type { APIBot } from '../types/user';
import type { APIChat } from '../types/chat';
import type { GetUpdatesResult } from '../types/update';
import type { Keypad } from '../types/keypad';
import type { Metadata } from '../types/metadata';
import type { BotCommand } from '../types/bot-command';
import type { APIMessage } from '../types/message';
import { RubikaAPIError } from './errors';

export interface RequestOptions {
    body?: Record<string, unknown>;
    files?: Record<string, { data: Buffer | Uint8Array; filename: string; contentType?: string }>;
}

export type EndpointType = 'ReceiveUpdate' | 'ReceiveInlineMessage' | 'ReceiveQuery' | 'GetSelectionItem';

export class RESTManager {
    private readonly token: string;
    private readonly baseUrl: string;

    constructor(token: string) {
        this.token = token;
        this.baseUrl = `https://botapi.rubika.ir/v3/${token}`;
    }

    async request<T>(method: string, options: RequestOptions = {}): Promise<T> {
        const url = `${this.baseUrl}/${method}`;
        let body: string | Buffer | Uint8Array | null = null;
        const headers: Record<string, string> = {};

        if (options.files && Object.keys(options.files).length > 0) {
            const form = new FormData();
            if (options.body) {
                for (const [key, value] of Object.entries(options.body)) {
                    if (value !== undefined && value !== null) {
                        form.append(
                            key,
                            typeof value === 'object' ? JSON.stringify(value) : String(value),
                        );
                    }
                }
            }
            for (const [key, file] of Object.entries(options.files)) {
                const bytes =
                    file.data instanceof Buffer
                        ? file.data
                        : Buffer.from(file.data.buffer, file.data.byteOffset, file.data.byteLength);
                const blob = new Blob([bytes], {
                    type: file.contentType ?? 'application/octet-stream',
                });
                form.append(key, blob, file.filename);
            }
            // undici accepts FormData as body
            const { statusCode, body: responseBody } = await request(url, {
                method: 'POST',
                body: form as unknown as string,
            });
            return this.parseResponse<T>(statusCode, responseBody);
        }

        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(options.body ?? {});

        const { statusCode, body: responseBody } = await request(url, {
            method: 'POST',
            headers,
            body,
        });
        return this.parseResponse<T>(statusCode, responseBody);
    }

    private async parseResponse<T>(
        statusCode: number,
        responseBody: { json: () => Promise<unknown> },
    ): Promise<T> {
        let rawData: APIResponse<T> & Record<string, unknown>;
        try {
            rawData = (await responseBody.json()) as APIResponse<T> & Record<string, unknown>;
        } catch {
            throw new RubikaAPIError(statusCode, `پاسخ نامعتبر از API روبیکا (HTTP ${statusCode})`);
        }

        const isSuccess =
            rawData.ok === true ||
            rawData.status === 'OK' ||
            rawData.status === 'ok' ||
            (rawData.status === undefined &&
                statusCode >= 200 &&
                statusCode < 300 &&
                (rawData.result !== undefined || rawData.data !== undefined));

        if (!isSuccess) {
            const errorMessage =
                (typeof rawData.description === 'string' && rawData.description) ||
                (typeof rawData.status === 'string' && rawData.status) ||
                `خطای ناشناخته در API روبیکا (HTTP ${statusCode})`;
            const errorCode =
                typeof rawData.error_code === 'number' ? rawData.error_code : statusCode;
            throw new RubikaAPIError(errorCode, errorMessage, rawData.parameters);
        }

        if (rawData.result !== undefined) return rawData.result as T;
        if (rawData.data !== undefined) return rawData.data as T;
        return rawData as unknown as T;
    }

    async getMe(): Promise<APIBot> {
        const result = await this.request<APIBot | { bot: APIBot }>('getMe');
        if (result && typeof result === 'object' && 'bot' in result && result.bot) {
            return result.bot;
        }
        return result as APIBot;
    }

    async sendMessage(params: {
        chat_id: string;
        text: string;
        metadata?: Metadata;
        chat_keypad?: Keypad;
        inline_keypad?: Keypad;
        chat_keypad_type?: string;
        disable_notification?: boolean;
        reply_to_message_id?: string;
    }): Promise<{ message_id: string } & Partial<APIMessage>> {
        return await this.request('sendMessage', { body: params });
    }

    async getUpdates(params?: { offset_id?: string; limit?: number }): Promise<GetUpdatesResult> {
        const body: Record<string, unknown> = {
            limit: params?.limit ?? 100,
        };

        if (params?.offset_id && params.offset_id !== '0') {
            body.offset_id = params.offset_id;
        }

        const result = await this.request<GetUpdatesResult>('getUpdates', { body });
        return {
            updates: result?.updates ?? [],
            next_offset_id: result?.next_offset_id ?? params?.offset_id ?? '',
        };
    }

    async updateBotEndpoint(endpoint: string, type?: EndpointType): Promise<boolean> {
        const body: Record<string, unknown> = { endpoint, url: endpoint };
        if (type) {
            body.type = type;
        }
        return await this.request<boolean>('updateBotEndpoint', { body });
    }

    async getFile(fileId: string): Promise<{ file_id: string; file_name: string; size: string }> {
        return await this.request('getFile', { body: { file_id: fileId } });
    }

    async editMessageText(params: {
        chat_id: string;
        message_id: string;
        text: string;
    }): Promise<APIMessage | { message_id: string }> {
        return await this.request('editMessageText', { body: params });
    }

    async editMessageKeypad(params: {
        chat_id: string;
        message_id: string;
        inline_keypad: Keypad;
    }): Promise<unknown> {
        return await this.request('editMessageKeypad', { body: params });
    }

    async deleteMessage(params: { chat_id: string; message_id: string }): Promise<boolean> {
        return await this.request('deleteMessage', { body: params });
    }

    async sendPoll(params: {
        chat_id: string;
        question: string;
        options: string[];
        is_anonymous?: boolean;
        allows_multiple_answers?: boolean;
        reply_to_message_id?: string;
    }): Promise<{ message_id: string }> {
        return await this.request('sendPoll', { body: params });
    }

    async sendLocation(params: {
        chat_id: string;
        latitude: string;
        longitude: string;
        reply_to_message_id?: string;
    }): Promise<{ message_id: string }> {
        return await this.request('sendLocation', { body: params });
    }

    async sendContact(params: {
        chat_id: string;
        first_name: string;
        last_name?: string;
        phone_number: string;
        reply_to_message_id?: string;
    }): Promise<{ message_id: string }> {
        return await this.request('sendContact', { body: params });
    }

    async forwardMessage(params: {
        from_chat_id: string;
        message_id: string;
        to_chat_id: string;
        disable_notification?: boolean;
    }): Promise<unknown> {
        return await this.request('forwardMessage', { body: params });
    }

    async getChat(chatId: string): Promise<APIChat> {
        return await this.request<APIChat>('getChat', { body: { chat_id: chatId } });
    }

    async setCommands(commands: BotCommand[]): Promise<unknown> {
        return await this.request('setCommands', { body: { commands } });
    }

    async answerCallbackQuery(params: {
        callback_query_id?: string;
        button_id?: string;
        text?: string;
        show_alert?: boolean;
    }): Promise<boolean> {
        const body: Record<string, unknown> = {};
        if (params.callback_query_id) body.callback_query_id = params.callback_query_id;
        if (params.button_id) body.button_id = params.button_id;
        if (params.text !== undefined) body.text = params.text;
        if (params.show_alert !== undefined) body.show_alert = params.show_alert;
        if (params.callback_query_id && !params.button_id) {
            body.button_id = params.callback_query_id;
        }
        if (params.button_id && !params.callback_query_id) {
            body.callback_query_id = params.button_id;
        }
        return await this.request<boolean>('answerCallbackQuery', { body });
    }

    async requestSendFile(params: {
        type: string;
        chat_id?: string;
    }): Promise<{ upload_url?: string; url?: string; file_id?: string }> {
        return await this.request('requestSendFile', { body: params });
    }

    async uploadToUrl(
        uploadUrl: string,
        data: Buffer | Uint8Array,
        filename: string,
        contentType = 'application/octet-stream',
    ): Promise<unknown> {
        const bytes =
            data instanceof Buffer
                ? data
                : Buffer.from(data.buffer, data.byteOffset, data.byteLength);
        const form = new FormData();
        const blob = new Blob([bytes], { type: contentType });
        form.append('file', blob, filename);

        const { statusCode, body } = await request(uploadUrl, {
            method: 'POST',
            body: form as unknown as string,
        });

        if (statusCode < 200 || statusCode >= 300) {
            throw new RubikaAPIError(statusCode, `آپلود فایل ناموفق بود (HTTP ${statusCode})`);
        }

        try {
            return await body.json();
        } catch {
            return { ok: true };
        }
    }

    async downloadFile(fileUrl: string): Promise<Buffer> {
        const response = await request(fileUrl);
        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new RubikaAPIError(
                response.statusCode,
                `دانلود فایل ناموفق بود (HTTP ${response.statusCode})`,
            );
        }
        const arrayBuffer = await response.body.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    getDownloadUrl(fileId: string): string {
        return `${this.baseUrl}/downloadFile/${fileId}`;
    }
}
