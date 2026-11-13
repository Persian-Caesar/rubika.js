import type { APIBot } from './user';
import type { Update } from './update';
import type { Message } from '../structures/Message';
import type { CallbackQuery } from '../structures/CallbackQuery';

export type ClientEvents = {
    ready: [bot: APIBot];
    messageCreate: [message: Message];
    messageEdit: [message: Message];
    messageDelete: [messageId: string, chatId?: string];
    callbackQuery: [query: CallbackQuery];
    botStarted: [update: Update];
    botStopped: [update: Update];
    eventData: [update: Update];
    error: [error: unknown];
};