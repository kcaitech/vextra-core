import { Color } from "./style";
import { AtomGroup } from "./transact";

@AtomGroup
export class SpanAttr {
    private m_fontName?: string;
    private m_fontSize?: number;
    private m_color?: Color;
    constructor(fontName?: string, fontSize?: number, color?: Color) {
        // this.m_len = len;
        this.m_fontName = fontName;
        this.m_fontSize = fontSize;
        this.m_color = color;
    }
    get fontName(): string {
        return this.m_fontName || "";
    }
    get fontSize() {
        return this.m_fontSize;
    }
    get color() {
        return this.m_color;
    }
}

@AtomGroup
export class Span extends SpanAttr {
    private m_len: number;
    constructor(len: number, fontName?: string, fontSize?: number, color?: Color) {
        super(fontName, fontSize, color);
        this.m_len = len;
    }
    get length() {
        return this.m_len;
    }
}

@AtomGroup
export class ParaAttr extends SpanAttr {
    private m_alignment: number = 0;
    private m_paragraphSpacing: number = 0;
    private m_allowsDefaultTighteningForTruncation: boolean = false;

    get alignment(): number {
        return this.m_alignment;
    }
    set alignment(a: number) {
        this.m_alignment = a;
    }
    get paragraphSpacing(): number {
        return this.m_paragraphSpacing;
    }
    set paragraphSpacing(s: number) {
        this.m_paragraphSpacing = s;
    }
    get allowsDefaultTighteningForTruncation(): boolean {
        return this.m_allowsDefaultTighteningForTruncation;
    }
    set allowsDefaultTighteningForTruncation(a: boolean) {
        this.m_allowsDefaultTighteningForTruncation = a;
    }
}

@AtomGroup
export class Para {
    private m_text: string;
    private m_spans: Span[];
    private m_attr?: ParaAttr;

    constructor(text: string, spans: Span[], defaultAttr?: ParaAttr) {
        this.m_text = text;
        this.m_spans = spans;
        this.m_attr = defaultAttr;
    }
    get length() {
        return this.m_text.length;
    }
    get defaultAttr() {
        return this.m_attr;
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

@AtomGroup
export class TextAttr extends ParaAttr {
    private m_kerning: number = 0;
    private m_textStyleVerticalAlignmentKey: number = 0;
    private m_verticalAlignment: number = 0; // 上中下
    private m_orientation: number = 0;

    get kerning(): number {
        return this.m_kerning;
    }
    set kerning(k: number) {
        this.m_kerning = k;
    }
    get textStyleVerticalAlignmentKey(): number {
        return this.m_textStyleVerticalAlignmentKey;
    }
    set textStyleVerticalAlignmentKey(k: number) {
        this.m_textStyleVerticalAlignmentKey = k;
    }
    get verticalAlignment(): number {
        return this.m_verticalAlignment;
    }
    set verticalAlignment(a: number) {
        this.m_verticalAlignment = a;
    }
    get orientation(): number {
        return this.m_orientation;
    }
    set orientation(o: number) {
        this.m_orientation = o;
    }
}

@AtomGroup
export class Text {
    private m_paras: Para[];
    private m_attr?: TextAttr;

    constructor(paras: Para[], defaultAttr?: TextAttr) {
        this.m_paras = paras;
        this.m_attr = defaultAttr;
    }
    get paraCount(): number {
        return this.m_paras.length;
    }
    getParaByIndex(index: number) {
        return this.m_paras[index];
    }
    get defaultAttr() {
        return this.m_attr;
    }
}
