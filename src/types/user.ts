export interface APIBot {
    bot_id: string;
    bot_username: string;
    first_name: string;
    last_name?: string;
    is_bot: boolean;
    language?: string;
    title?: string;
    description?: string;
    photo?: string;
}