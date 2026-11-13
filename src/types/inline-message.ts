export interface InlineMessage {
    chat_id: string;
    message_id: string;
    sender_id: string;
    text: string;
    aux_data?: {
        start_id?: string | null;
        button_id?: string;
    };
    /** ممکن است در برخی پاسخ‌ها وجود داشته باشد */
    data?: string;
}