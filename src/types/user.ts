export interface APIBot {
    bot_id: string;       // ✅ در پاسخ روبیکا وجود دارد
    username: string;     // ✅ فیلد درست نام کاربری (نه bot_username)
    bot_title: string;    // ✅ نام نمایشی
    avatar?: string;
    description?: string;
    start_message?: string;
    share_url?: string;
}