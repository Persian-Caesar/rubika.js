export class Collection<K, V> extends Map<K, V> {
    toArray(): V[] {
        return [...this.values()];
    }

    toKeyArray(): K[] {
        return [...this.keys()];
    }

    first(): V | undefined {
        return this.values().next().value;
    }

    last(): V | undefined {
        const values = this.toArray();
        return values[values.length - 1];
    }

    find(fn: (value: V, key: K) => boolean): V | undefined {
        for (const [key, value] of this) {
            if (fn(value, key)) return value;
        }
        return undefined;
    }

    some(fn: (value: V, key: K) => boolean): boolean {
        for (const [key, value] of this) {
            if (fn(value, key)) return true;
        }
        return false;
    }

    every(fn: (value: V, key: K) => boolean): boolean {
        for (const [key, value] of this) {
            if (!fn(value, key)) return false;
        }
        return true;
    }

    filter(fn: (value: V, key: K) => boolean): Collection<K, V> {
        const result = new Collection<K, V>();
        for (const [key, value] of this) {
            if (fn(value, key)) result.set(key, value);
        }
        return result;
    }

    map<T>(fn: (value: V, key: K) => T): T[] {
        const result: T[] = [];
        for (const [key, value] of this) {
            result.push(fn(value, key));
        }
        return result;
    }

    sweep(fn: (value: V, key: K) => boolean): number {
        let removed = 0;
        for (const [key, value] of this) {
            if (fn(value, key)) {
                this.delete(key);
                removed++;
            }
        }
        return removed;
    }

    random(): V | undefined {
        const arr = this.toArray();
        if (arr.length === 0) return undefined;
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
