import type { APIMessage } from './message';
import type { InlineMessage } from './inline-message';

export type UpdateType =
    | 'NewMessage'
    | 'UpdatedMessage'
    | 'RemovedMessage'
    | 'StartedBot'
    | 'StoppedBot'
    | 'EventData'
    | 'InlineMessage';

export interface Update {
    update_id: string;
    type: UpdateType;
    chat_id?: string;
    new_message?: APIMessage;
    updated_message?: APIMessage;
    removed_message_id?: string;
    inline_message?: InlineMessage;
    event_data?: {
        type?: string; // مثلاً "BotJoined", "BotRemoved", ...
        [key: string]: unknown;
    };
}

export interface GetUpdatesResult {
    updates: Update[];
    next_offset_id: string;
}