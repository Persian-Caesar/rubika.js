import type { APIBot } from './user';
import type { Message } from '../structures/Message';
import type { CallbackQuery } from '../structures/CallbackQuery';

export type ClientEvents = {
    ready: [bot: APIBot];
    messageCreate: [message: Message];
    messageEdit: [message: Message];
    callbackQuery: [query: CallbackQuery];
    error: [error: unknown];
};