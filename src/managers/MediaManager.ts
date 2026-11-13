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
            return new Message(this.client, { chat_id: chatId, message_id: data.message_id, time: '0' } as APIMessage);
        }
        const fileId = input instanceof URL ? input.toString() : input;
        const data = await this.client.rest.request<{ message_id: string }>('sendFile', {
            body: { chat_id: chatId, type, file_id: fileId, caption },
        });
        return new Message(this.client, { chat_id: chatId, message_id: data.message_id, time: '0' } as APIMessage);
    }

    async downloadFile(fileId: string): Promise<Buffer> {
        const file = await this.client.rest.getFile(fileId);
        return this.client.rest.downloadFile(`https://botapi.rubika.ir/v3/${this.client['token']}/download/${file.file_id}`);
    }
}