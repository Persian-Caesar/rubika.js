export type MetaDataPartType =
    | 'Bold'
    | 'Italic'
    | 'Mono'
    | 'Underline'
    | 'Strike'
    | 'Spoiler'
    | 'Link'
    | 'MentionText'
    | 'MentionLink';

export interface MetaDataPart {
    type: MetaDataPartType;
    from_index: number;
    length: number;
    /** برای Link */
    link?: string;
    /** برای MentionText و MentionLink */
    user_id?: string;
}

export interface Metadata {
    meta_data_parts: MetaDataPart[];
}