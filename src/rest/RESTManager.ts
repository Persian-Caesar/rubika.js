import { request } from 'undici';
import type { APIResponse } from '../types/api';
import type { APIBot } from '../types/user';
import type { APIChat } from '../types/chat';
import type { GetUpdatesResult } from '../types/update';
import type { Keypad } from '../types/keypad';
import type { Metadata } from '../types/metadata';
import type { BotCommand } from '../types/bot-command';
import { RubikaAPIError } from './errors';

export interface RequestOptions {
    body?: Record<string, unknown>;
    files?: Record<string, { data: Buffer | Uint8Array; filename: string; contentType?: string }>;
}

export class RESTManager {
    private readonly token: string;
    private readonly baseUrl: string;

    constructor(token: string) {
        this.token = token;
        this.baseUrl = `https://botapi.rubika.ir/v3/${token}`;
    }

    async request<T>(method: string, options: RequestOptions = {}): Promise<T> {
        const url = `${this.baseUrl}/${method}`;
        let body: any;
        const headers: Record<string, string> = {};

        if (options.files && Object.keys(options.files).length > 0) {
            const form = new FormData();
            if (options.body) {
                for (const [key, value] of Object.entries(options.body)) {
                    if (value !== undefined && value !== null) form.append(key, String(value));
                }
            }
            for (const [key, file] of Object.entries(options.files)) {
                const view =
                    file.data.buffer instanceof ArrayBuffer
                        ? new Uint8Array(file.data.buffer, file.data.byteOffset, file.data.byteLength)
                        : Uint8Array.from(file.data);
                const blob = new Blob([view], { type: file.contentType ?? 'application/octet-stream' });
                form.append(key, blob, file.filename);
            }
            body = form;
        } else {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(options.body ?? {});
        }

        const { statusCode, body: responseBody } = await request(url, {
            method: 'POST',
            headers,
            body,
        });

        const rawData = (await responseBody.json()) as APIResponse<T> & Record<string, any>;

        // اصلاح باگ ۴.۳: تشخیص موفقیت با وجود result حتی اگر status نباشد
        const isSuccess =
            rawData.ok === true ||
            rawData.status === 'OK' ||
            rawData.status === 'ok' ||
            (rawData.status === undefined && rawData.result !== undefined);

        if (!isSuccess) {
            const errorMessage = rawData.description ?? rawData.status ?? 'خطای ناشناخته در API روبیکا';
            const errorCode = rawData.error_code ?? statusCode;
            throw new RubikaAPIError(errorCode, errorMessage, rawData.parameters);
        }

        return (rawData.result ?? rawData.data ?? rawData) as T;
    }

    async getMe(): Promise<APIBot> {
        return (await this.request<{ bot: APIBot }>('getMe')).bot;
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
    }): Promise<{ message_id: string }> {
        return await this.request<{ message_id: string }>('sendMessage', { body: params });
    }

    /** اصلاح باگ ۴.۶: پذیرش هر دو offset_id و start_id */
    async getUpdates(params?: { offset_id?: string; limit?: number }): Promise<GetUpdatesResult> {
        const body: Record<string, unknown> = {
            limit: params?.limit ?? 100,
        };

        // فقط اگر offset_id معتبر بود ارسال کن
        if (params?.offset_id && params.offset_id !== '0') {
            body.offset_id = params.offset_id;
        }

        return await this.request<GetUpdatesResult>('getUpdates', { body });
    }

    async updateBotEndpoint(endpoint: string): Promise<boolean> {
        return await this.request<boolean>('updateBotEndpoint', { body: { endpoint } });
    }

    async getFile(fileId: string): Promise<{ file_id: string; file_name: string; size: string }> {
        return await this.request('getFile', { body: { file_id: fileId } });
    }

    /** اصلاح باگ ۱.۳ + ۲ */
    async editMessageKeypad(params: {
        chat_id: string;
        message_id: string;
        inline_keypad: Keypad;
    }): Promise<unknown> {
        return await this.request('editMessageKeypad', { body: params });
    }

    async sendPoll(params: {
        chat_id: string;
        question: string;
        options: string[];
        is_anonymous?: boolean;
        allows_multiple_answers?: boolean;
        reply_to_message_id?: string;
    }): Promise<{ message_id: string }> {
        return await this.request<{ message_id: string }>('sendPoll', { body: params });
    }

    async sendLocation(params: {
        chat_id: string;
        latitude: string;
        longitude: string;
        reply_to_message_id?: string;
    }): Promise<{ message_id: string }> {
        return await this.request<{ message_id: string }>('sendLocation', { body: params });
    }

    async sendContact(params: {
        chat_id: string;
        first_name: string;
        last_name?: string;
        phone_number: string;
        reply_to_message_id?: string;
    }): Promise<{ message_id: string }> {
        return await this.request<{ message_id: string }>('sendContact', { body: params });
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
        callback_query_id: string;
        text?: string;
    }): Promise<boolean> {
        return await this.request<boolean>('answerCallbackQuery', { body: params });
    }

    async requestSendFile(params: {
        chat_id?: string;
        type: string;
    }): Promise<{ url: string }> {
        return await this.request('requestSendFile', { body: params });
    }

    async downloadFile(fileUrl: string): Promise<Buffer> {
        const response = await request(fileUrl);
        const arrayBuffer = await response.body.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    /** اصلاح باگ ۴.۵: URL دانلود به‌صورت امن ساخته می‌شود */
    getDownloadUrl(fileId: string): string {
        return `${this.baseUrl}/download/${fileId}`;
    }
}