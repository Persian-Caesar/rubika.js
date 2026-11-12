export interface Poll {
    poll_id: string;
    question: string;
    options: PollOption[];
    total_votes: number;
    is_closed: boolean;
}

export interface PollOption {
    option_id: string;
    text: string;
    votes: number;
}

export interface SendPollOptions {
    chat_id: string;
    question: string;
    options: string[];
    is_anonymous?: boolean;
    allows_multiple_answers?: boolean;
    reply_to_message_id?: string;
}