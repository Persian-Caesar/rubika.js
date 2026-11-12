import type { ResponseParameters } from '../types/api';

export class RubikaAPIError extends Error {
    public readonly code: number;
    public readonly parameters?: ResponseParameters;

    constructor(code: number, message: string, parameters?: ResponseParameters) {
        super(message);
        this.name = 'RubikaAPIError';
        this.code = code;
        this.parameters = parameters;
    }
}