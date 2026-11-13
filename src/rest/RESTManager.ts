import { request } from 'undici';
import type { APIResponse } from '../types/api';
import type { APIBot } from '../types/user';
import type { GetUpdatesResult, Update } from '../types/update';
import type { APIMessage } from '../types/message';
import type { Keypad } from '../types/keypad';
import { RubikaAPIError } from './errors';

export interface RequestOptions {
    body?: Record<string, unknown>;
    files?: Record<string, { data: Buffer | Uint8Array; filename: string; contentType?: string }>;
}

export class RESTManager {
    private readonly baseUrl: string;

    constructor(private readonly token: string) {
        this.baseUrl = `https://botapi.rubika.ir/v3/${token}`;
    }

    async request<T>(method: string, options: RequestOptions = {}): Promise<T> {
        const url = `${this.baseUrl}/${method}`;
        let body: any;
        let headers: Record<string, string> = {};

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
                        : Uint8Array.from(file.data); // SharedArrayBuffer fallback — copy

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

        // دریافت پاسخ خام
        const rawData = (await responseBody.json()) as APIResponse<T> & Record<string, any>;

        // بررسی خطا: اگر نه ok===true و نه status==="OK" باشد، یعنی خطا رخ داده
        const isSuccess = rawData.ok === true || rawData.status === 'OK' || rawData.status === 'ok';

        if (!isSuccess) {
            // تلاش برای استخراج پیام خطا از فیلدهای مختلف
            const errorMessage = rawData.description ?? rawData.status ?? 'خطای ناشناخته در API روبیکا';
            const errorCode = rawData.error_code ?? statusCode;

            throw new RubikaAPIError(errorCode, errorMessage, rawData.parameters);
        }

        // استخراج نتیجه: اولویت با result، سپس data، در غیر این صورت خود پاسخ خام
        return (rawData.result ?? rawData.data ?? rawData) as T;
    }

    getMe(): Promise<APIBot> {
        return this.request<APIBot>('getMe');
    }

    sendMessage(params: {
        chat_id: string;
        text: string;
        chat_keypad?: Keypad;
        inline_keypad?: Keypad;
        chat_keypad_type?: string;
        disable_notification?: boolean;
        reply_to_message_id?: string;
    }): Promise<{ message_id: string }> {
        return this.request<{ message_id: string }>('sendMessage', { body: params });
    }

    getUpdates(params?: { offset_id?: string; limit?: number }): Promise<GetUpdatesResult> {
        const body: Record<string, unknown> = {
            limit: String(params?.limit ?? 100), // limit باید رشته باشد
        };

        // فقط اگر offset_id مقدار معتبر داشت، آن را ارسال کن
        if (params?.offset_id && params.offset_id !== '0') {
            body.offset_id = params.offset_id;
        }

        return this.request<GetUpdatesResult>('getUpdates', { body });
    }

    updateBotEndpoint(endpoint: string): Promise<boolean> {
        return this.request<boolean>('updateBotEndpoint', { body: { endpoint } });
    }

    getFile(fileId: string): Promise<{ file_id: string; file_name: string; size: string }> {
        return this.request('getFile', { body: { file_id: fileId } });
    }

    async downloadFile(fileUrl: string): Promise<Buffer> {
        const response = await request(fileUrl);
        const arrayBuffer = await response.body.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}