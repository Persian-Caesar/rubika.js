import { describe, it, expect } from 'vitest';
import { MetadataBuilder } from '../src/builders/MetadataBuilder';

describe('MetadataBuilder', () => {
    it('builds bold part', () => {
        const m = new MetadataBuilder().bold(0, 4).build();
        expect(m.meta_data_parts).toHaveLength(1);
        expect(m.meta_data_parts[0]).toMatchObject({ type: 'Bold', from_index: 0, length: 4 });
    });

    it('builds link part', () => {
        const m = new MetadataBuilder().link('https://example.com', 0, 10).build();
        expect(m.meta_data_parts[0]!.link).toBe('https://example.com');
    });

    it('builds mention part', () => {
        const m = new MetadataBuilder().mentionText('u1', 5, 7).build();
        expect(m.meta_data_parts[0]!.user_id).toBe('u1');
    });
});