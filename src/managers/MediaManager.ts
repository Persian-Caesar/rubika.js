import { BaseManager } from './BaseManager';
import { Message } from '../structures/Message';
import type { RubikaClient } from '../client/RubikaClient';
import type { FileInput, MediaType } from '../types/media';
import type { APIMessage } from '../types/message';

export class MediaManager extends BaseManager {
    constructor(client: RubikaClient) {
        super(client);
    }

    async sendFile(
        chatId: string,
        type: MediaType,
        input: FileInput,
        caption?: string,
    ): Promise<Message> {
        if (Buffer.isBuffer(input)) {
            const data = await this.client.rest.request<{ message_id: string }>('sendFile', {
                body: { chat_id: chatId, type, caption },
                files: { file: { data: input, filename: 'file' } },
            });
            return new Message(this.client, {
                chat_id: chatId,
                message_id: data.message_id,
                time: '0',
            } as APIMessage);
        }

        if (input instanceof URL) {
            throw new Error(
                'URL به‌عنوان ورودی پشتیبانی نمی‌شود. از file_id (string) یا Buffer استفاده کنید.',
            );
        }

        // اصلاح باگ ۱.۵: رشته فقط به‌عنوان file_id در نظر گرفته می‌شود
        const data = await this.client.rest.request<{ message_id: string }>('sendFile', {
            body: { chat_id: chatId, type, file_id: input, caption },
        });
        return new Message(this.client, {
            chat_id: chatId,
            message_id: data.message_id,
            time: '0',
        } as APIMessage);
    }

    async downloadFile(fileId: string): Promise<Buffer> {
        const file = await this.client.rest.getFile(fileId);
        return this.client.rest.downloadFile(this.client.rest.getDownloadUrl(file.file_id));
    }
}