import type { RubikaClient } from '../client/RubikaClient';

export abstract class BaseManager {
    public readonly client: RubikaClient;
    constructor(client: RubikaClient) {
        this.client = client;
    }
}