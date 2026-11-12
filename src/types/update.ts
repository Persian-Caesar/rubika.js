import type { APIMessage } from './message';
import type { InlineMessage } from './inline-message';

export type UpdateType =
    | 'NewMessage'
    | 'EditedMessage'
    | 'RemovedMessage'
    | 'InlineMessage'
    | 'Ready';

export interface Update {
    update_id: string;
    type: UpdateType;
    chat_id?: string;
    new_message?: APIMessage;
    inline_message?: InlineMessage;
    removed_message_id?: string;
}