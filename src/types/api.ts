export interface APIResponse<T> {
    ok?: boolean;
    status?: string; // فیلد اصلی که روبیکا برمی‌گرداند
    result?: T;
    data?: T; // برخی پاسخ‌ها ممکن است داده را در فیلد data قرار دهند
    description?: string;
    error_code?: number;
    parameters?: ResponseParameters;
}

export interface ResponseParameters {
    retry_after?: number;
}