import { Keypad } from "./keypad";

export type FileInput = Buffer | string | URL;

export type MediaType = 'Image' | 'Video' | 'File' | 'Audio' | 'Voice';

export interface SendFileOptions {
    caption?: string;
    file_name?: string;
    disable_notification?: boolean;
    reply_to_message_id?: string;
    inline_keypad?: Keypad;
}