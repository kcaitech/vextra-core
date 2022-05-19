import { Color } from "./style";

// export class FontAttr {
//     private m_name: string;
//     private m_size: number;
//     constructor(name: string, size: number) {
//         this.m_name = name;
//         this.m_size = size;
//     }
//     get name(): string {
//         return this.m_name;
//     }
//     get size(): number {
//         return this.m_size;
//     }
// }

export class Attr {
    private m_fontName?: string;
    private m_fontSize?: number;
    private m_color?: Color;
    constructor(fontName?: string, fontSize?: number, color?: Color) {
        // this.m_len = len;
        this.m_fontName = fontName;
        this.m_fontSize = fontSize;
        this.m_color = color;
    }
    get fontName() {
        return this.m_fontName;
    }
    get fontSize() {
        return this.m_fontSize;
    }
    get color() {
        return this.m_color;
    }
    // get length() {
    //     return this.m_len;
    // }
}

export class Span extends Attr {
    private m_len: number;
    constructor(len: number, fontName?: string, fontSize?: number, color?: Color) {
        super(fontName, fontSize, color);
        this.m_len = len;
    }
    get length() {
        return this.m_len;
    }
}

export class Para {
    private m_text: string;
    private m_spans: Span[];
    private m_defaultAttr?: Attr;
    constructor(text: string, spans: Span[], defaultAttr?: Attr) {
        this.m_text = text;
        this.m_spans = spans;
        this.m_defaultAttr = defaultAttr;
    }
    get length() {
        return this.m_text.length;
    }
    get defaultAttr() {
        return this.m_defaultAttr;
    }
    get text() {
        return this.m_text;
    }
    get spansCount() {
        return this.m_spans.length;
    }
    getSpanByIndex(index:number): Span {
        return this.m_spans[index];
    }
}

export class Text {
    private m_paras: Para[];
    private m_defaultAttr?: Attr;
    
    constructor(paras: Para[], defaultAttr?: Attr) {
        this.m_paras = paras;
        this.m_defaultAttr = defaultAttr;
    }
    get paraCount(): number {
        return this.m_paras.length;
    }
    getParaByIndex(index: number) {
        return this.m_paras[index];
    }
    get defaultAttr() {
        return this.m_defaultAttr;
    }
}
