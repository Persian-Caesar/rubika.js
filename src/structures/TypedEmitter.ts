import { EventEmitter } from 'events';

export class TypedEmitter<Events extends Record<string, any[]>> extends EventEmitter {
    public on<K extends keyof Events & string>(event: K, listener: (...args: Events[K]) => void): this {
        return super.on(event, listener);
    }
    public once<K extends keyof Events & string>(event: K, listener: (...args: Events[K]) => void): this {
        return super.once(event, listener);
    }
    public off<K extends keyof Events & string>(event: K, listener: (...args: Events[K]) => void): this {
        return super.off(event, listener);
    }
    public emit<K extends keyof Events & string>(event: K, ...args: Events[K]): boolean {
        return super.emit(event, ...args);
    }
}