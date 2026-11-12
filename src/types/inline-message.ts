export interface InlineMessage {
    chat_id: string;
    message_id: string;
    sender_id: string;
    text: string;
    button_id: string;
    data?: string;
}