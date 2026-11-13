import { BaseManager } from './BaseManager';
import { Message } from '../structures/Message';
import type { RubikaClient } from '../client/RubikaClient';
import type { FileInput, MediaType, SendFileOptions } from '../types/media';
import type { APIMessage } from '../types/message';

export class MediaManager extends BaseManager {
    constructor(client: RubikaClient) {
        super(client);
    }

    async sendFile(
        chatId: string,
        type: MediaType,
        input: FileInput,
        captionOrOptions?: string | SendFileOptions,
    ): Promise<Message> {
        const options: SendFileOptions =
            typeof captionOrOptions === 'string'
                ? { caption: captionOrOptions }
                : (captionOrOptions ?? {});

        if (input instanceof URL) {
            throw new Error(
                'URL به‌عنوان ورودی پشتیبانی نمی‌شود. از file_id (string) یا Buffer استفاده کنید.',
            );
        }

        if (typeof input === 'string') {
            const data = await this.client.rest.request<{ message_id: string }>('sendFile', {
                body: {
                    chat_id: chatId,
                    type,
                    file_id: input,
                    caption: options.caption,
                    file_name: options.file_name,
                    disable_notification: options.disable_notification,
                    reply_to_message_id: options.reply_to_message_id,
                    inline_keypad: options.inline_keypad,
                },
            });
            return this.makeMessage(chatId, data.message_id, options.caption);
        }

        const filename = options.file_name ?? 'file';
        const contentType = guessContentType(type, filename);

        try {
            const uploadInfo = await this.client.rest.requestSendFile({
                chat_id: chatId,
                type,
            });
            const uploadUrl = uploadInfo.upload_url ?? uploadInfo.url;

            if (uploadUrl) {
                const uploaded = (await this.client.rest.uploadToUrl(
                    uploadUrl,
                    input,
                    filename,
                    contentType,
                )) as { file_id?: string; data?: { file_id?: string } };

                const fileId =
                    uploaded?.file_id ?? uploaded?.data?.file_id ?? uploadInfo.file_id;

                if (fileId) {
                    const data = await this.client.rest.request<{ message_id: string }>('sendFile', {
                        body: {
                            chat_id: chatId,
                            type,
                            file_id: fileId,
                            caption: options.caption,
                            file_name: filename,
                            disable_notification: options.disable_notification,
                            reply_to_message_id: options.reply_to_message_id,
                            inline_keypad: options.inline_keypad,
                        },
                    });
                    return this.makeMessage(chatId, data.message_id, options.caption);
                }
            }
        } catch {
            // fallback multipart
        }

        const data = await this.client.rest.request<{ message_id: string }>('sendFile', {
            body: {
                chat_id: chatId,
                type,
                caption: options.caption,
                file_name: filename,
                disable_notification: options.disable_notification,
                reply_to_message_id: options.reply_to_message_id,
                inline_keypad: options.inline_keypad,
            },
            files: {
                file: { data: input, filename, contentType },
            },
        });
        return this.makeMessage(chatId, data.message_id, options.caption);
    }

    async downloadFile(fileId: string): Promise<Buffer> {
        const file = await this.client.rest.getFile(fileId);
        const id = file.file_id || fileId;
        return this.client.rest.downloadFile(this.client.rest.getDownloadUrl(id));
    }

    private makeMessage(chatId: string, messageId: string, caption?: string): Message {
        return new Message(this.client, {
            chat_id: chatId,
            message_id: messageId,
            time: String(Math.floor(Date.now() / 1000)),
            caption,
        } as APIMessage);
    }
}

function guessContentType(type: MediaType, filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.ogg')) return 'audio/ogg';
    switch (type) {
        case 'Image':
            return 'image/jpeg';
        case 'Video':
            return 'video/mp4';
        case 'Audio':
            return 'audio/mpeg';
        case 'Voice':
            return 'audio/ogg';
        default:
            return 'application/octet-stream';
    }
}
