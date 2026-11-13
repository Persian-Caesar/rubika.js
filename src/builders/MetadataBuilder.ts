import { BaseBuilder } from './BaseBuilder';
import type { Metadata, MetaDataPart, MetaDataPartType } from '../types/metadata';

export interface MetadataPartOptions {
    type: MetaDataPartType;
    from_index: number;
    length: number;
    link?: string;
    user_id?: string;
}

export class MetadataBuilder extends BaseBuilder<Metadata> {
    private parts: MetaDataPart[] = [];

    addPart(options: MetadataPartOptions): this {
        this.parts.push({
            type: options.type,
            from_index: options.from_index,
            length: options.length,
            ...(options.link ? { link: options.link } : {}),
            ...(options.user_id ? { user_id: options.user_id } : {}),
        });
        return this;
    }

    bold(from_index: number, length: number): this {
        return this.addPart({ type: 'Bold', from_index, length });
    }

    italic(from_index: number, length: number): this {
        return this.addPart({ type: 'Italic', from_index, length });
    }

    mono(from_index: number, length: number): this {
        return this.addPart({ type: 'Mono', from_index, length });
    }

    underline(from_index: number, length: number): this {
        return this.addPart({ type: 'Underline', from_index, length });
    }

    link(url: string, from_index: number, length: number): this {
        return this.addPart({ type: 'Link', link: url, from_index, length });
    }

    mentionText(userId: string, from_index: number, length: number): this {
        return this.addPart({ type: 'MentionText', user_id: userId, from_index, length });
    }

    mentionLink(userId: string, from_index: number, length: number): this {
        return this.addPart({ type: 'MentionLink', user_id: userId, from_index, length });
    }

    build(): Metadata {
        return { meta_data_parts: [...this.parts] };
    }
}