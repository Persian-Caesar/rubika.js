export type ChatType = 'User' | 'Group' | 'Channel';

export interface APIChat {
    chat_id: string;
    chat_type: ChatType;
    user_id?: string;
    first_name?: string;
    last_name?: string;
    title?: string;
    username?: string;
    description?: string;
    invite_link?: string;
    pin?: string;
    member_count?: number;
    permissions?: string[];
}