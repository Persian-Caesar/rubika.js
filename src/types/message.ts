import type { APIChat } from './chat';
import type { Keypad } from './keypad';
import { Poll } from './poll';

export interface APIMessage {
    message_id: string;
    chat_id: string;
    sender_id?: string;
    sender_type?: 'User' | 'Bot';
    text?: string;
    caption?: string;
    time: string;
    is_edited?: boolean;
    reply_to_message_id?: string;
    forwarded_from?: ForwardedFrom;
    file?: APIFile;
    contact?: Contact;
    location?: Location;
    sticker?: Sticker;
    poll?: Poll;
    chat_keypad?: Keypad;
    inline_keypad?: Keypad;
}

export interface ForwardedFrom {
    type_from: 'User' | 'Channel' | 'Bot';
    message_id: string;
    from_chat_id: string;
    from_sender_id: string;
}

export interface APIFile {
    file_id: string;
    file_name: string;
    size: string;
}

export interface Contact {
    phone_number: string;
    first_name: string;
    last_name?: string;
    user_id?: string;
}

export interface Location {
    longitude: string;
    latitude: string;
}

export interface Sticker {
    sticker_id: string;
    file_id: string;
    emoji?: string;
}