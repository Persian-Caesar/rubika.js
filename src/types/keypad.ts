export type ButtonType =
    | 'Simple'
    | 'Link'
    | 'AskMyPhoneNumber'
    | 'AskMyLocation'
    | 'Calendar'
    | 'NumberPicker'
    | 'StringPicker'
    | 'Payment'
    | 'Selection'
    | 'CameraImage'
    | 'CameraVideo';

export interface Button {
    id: string;
    type: ButtonType;
    button_text: string;
    url?: string;
    selection?: ButtonSelection;
    /** برای Calendar و NumberPicker */
    default_value?: string;
    min_value?: string;
    max_value?: string;
}

export interface ButtonSelection {
    selection_id: string;
    search_type?: string;
    get_type?: string;
    items: ButtonSelectionItem[];
    is_multi_selection?: boolean;
    columns_count?: string;
    title?: string;
}

export interface ButtonSelectionItem {
    text: string;
    image_url?: string;
    type?: string;
}

export interface KeypadRow {
    buttons: Button[];
}

export interface Keypad {
    rows: KeypadRow[];
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
}