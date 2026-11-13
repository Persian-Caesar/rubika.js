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
}