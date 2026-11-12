export interface APIResponse<T> {
    ok: boolean;
    result?: T;
    description?: string;
    error_code?: number;
    parameters?: ResponseParameters;
}

export interface ResponseParameters {
    retry_after?: number;
}