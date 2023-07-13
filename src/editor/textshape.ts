import { BulletNumbersType, Color, Page, SpanAttr, SpanAttrSetter, StrikethroughType, Text, TextBehaviour, TextHorAlign, TextShape, TextTransformType, TextVerAlign, UnderlineType } from "../data/classes";
import { CoopRepository } from "./command/cooprepo";
import { Api } from "./command/recordapi";
import { ShapeEditor } from "./shape";
import { fixTextShapeFrameByLayout } from "./utils";

export class TextShapeEditor extends ShapeEditor {

    private __cachedSpanAttr?: SpanAttrSetter;

    constructor(shape: TextShape, page: Page, repo: CoopRepository) {
        super(shape, page, repo);
    }
    get shape(): TextShape {
        return this.__shape as TextShape;
    }

    public resetCachedSpanAttr() {
        this.__cachedSpanAttr = undefined;
    }

    public getCachedSpanAttr() {
        return this.__cachedSpanAttr;
    }

    public insertText(text: string, index: number, attr?: SpanAttr): number {
        return this.insertText2(text, index, 0, attr);
    }

    private fixFrameByLayout(api: Api) {
        fixTextShapeFrameByLayout(api, this.__page, this.shape)
    }

    public deleteText(index: number, count: number): number { // 清空后，在失去焦点时，删除shape
        if (index < 0) {
            count += index;
            index = 0;
        }
        if (count <= 0) return 0;
        const api = this.__repo.start("deleteText", {});
        try {
            const deleted = api.deleteText(this.__page, this.shape, index, count);
            count = deleted ? deleted.length : count;
            if (count <= 0) {
                this.__repo.rollback();
                return 0;
            }
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return count;

        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return 0;
    }

    public insertText2(text: string, index: number, del: number, attr?: SpanAttr): number {
        attr = attr ?? this.__cachedSpanAttr;
        const api = this.__repo.start("insertText", {});
        try {
            let count = text.length;
            if (del > 0) api.deleteText(this.__page, this.shape, index, del);
            api.insertSimpleText(this.__page, this.shape, index, text, attr);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return count;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        this.resetCachedSpanAttr();
        return 0;
    }

    public insertTextForNewLine(index: number, del: number, attr?: SpanAttr): number {
        attr = attr ?? this.__cachedSpanAttr;
        const text = '\n';
        const api = this.__repo.start("insertTextForNewLine", {});
        try {
            let count = text.length;
            if (del > 0) api.deleteText(this.__page, this.shape, index, del);
            for (; ;) {
                const paraInfo = this.shape.text.paraAt(index);
                if (!paraInfo) {
                    throw new Error("index wrong? not find para :" + index)
                }
                const paraText = paraInfo.para.text;
                const span0 = paraInfo.para.spans[0];
                // 空行回车
                // indent - 1
                // 没有indent时删除编号符号
                // 再新增空行
                if (paraText === '\n' || paraText === '*\n' && paraInfo.index === 1) {

                    const indent = paraInfo.para.attr?.indent || 0;
                    if (indent > 0) {
                        // todo
                        count = 0;
                        break;
                    }
                    else if (paraText === '*\n' && span0.placeholder && span0.length === 1 && span0.bulletNumbers) {
                        // api.deleteText(this.__page, this.shape, index - 1, 1);
                        api.textModifyBulletNumbers(this.__page, this.shape, undefined, index, 0);
                        count = -1;
                        break;
                    }
                }

                // 非空行回车
                api.insertSimpleText(this.__page, this.shape, index, text, attr);
                // 新增段落
                if ((!attr || !attr.bulletNumbers) &&
                    span0.placeholder &&
                    span0.length === 1 &&
                    span0.bulletNumbers &&
                    span0.bulletNumbers.type !== BulletNumbersType.None) {
                    api.textModifyBulletNumbers(this.__page, this.shape, span0.bulletNumbers.type, index, text.length + 1);
                    // if (span0.kerning) api.textModifyKerning()
                    count++;
                }
                break;
            }
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return count;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        this.resetCachedSpanAttr();
        return 0;
    }

    public insertFormatText(text: Text, index: number, del: number): boolean {
        const api = this.__repo.start("insertText", {});
        try {
            if (del > 0) api.deleteText(this.__page, this.shape, index, del);
            api.insertComplexText(this.__page, this.shape, index, text);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    private __composingStarted: boolean = false;
    private __composingIndex: number = 0;
    private __composingDel: number = 0;
    private __composingAttr?: SpanAttr;
    public composingInputStart(index: number, del: number, attr?: SpanAttr) {
        this.__composingStarted = true;
        this.__composingIndex = index;
        this.__composingDel = del;
        this.__composingAttr = attr;

        const api = this.__repo.start("composingInput", {});
        if (del > 0) api.deleteText(this.__page, this.shape, index, del);
    }
    public composingInputUpdate(text: string): boolean {
        this.__repo.rollback();
        const api = this.__repo.start("composingInput", {});
        if (this.__composingDel > 0) api.deleteText(this.__page, this.shape, this.__composingIndex, this.__composingDel);
        if (text.length > 0) api.insertSimpleText(this.__page, this.shape, this.__composingIndex, text, this.__composingAttr);
        else this.shape.text.composingInputUpdate(this.__composingIndex);
        this.fixFrameByLayout(api);
        this.__repo.transactCtx.fireNotify(); // 会导致不断排版绘制
        return true;
    }
    public composingInputEnd(text: string): boolean {
        this.__repo.rollback();
        this.__composingStarted = false;
        return !!this.insertText2(text, this.__composingIndex, this.__composingDel, this.__composingAttr);
    }

    public isInComposingInput() {
        return this.__composingStarted;
    }
    public setTextDefaultColor(color: Color) {
        const api = this.__repo.start("setTextDefaultColor", {});
        try {
            api.shapeModifyTextColor(this.__page, this.shape, color)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextDefaultFontName(fontName: string) {
        const api = this.__repo.start("setTextDefaultFontName", {});
        try {
            api.shapeModifyTextFontName(this.__page, this.shape, fontName);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextDefaultFontSize(fontSize: number) {
        const api = this.__repo.start("setTextDefaultFontSize", {});
        try {
            api.shapeModifyTextFontSize(this.__page, this.shape, fontSize);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextColor(index: number, len: number, color: Color | undefined) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.color = color;
            this.__cachedSpanAttr.colorIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextColor", {});
        try {
            api.textModifyColor(this.__page, this.shape, index, len, color)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextHighlightColor(index: number, len: number, color: Color | undefined) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.highlight = color;
            this.__cachedSpanAttr.highlightIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextColor", {});
        try {
            api.textModifyHighlightColor(this.__page, this.shape, index, len, color)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFontName(index: number, len: number, fontName: string) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.fontName = fontName;
            this.__cachedSpanAttr.fontNameIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextFontName", {});
        try {
            api.textModifyFontName(this.__page, this.shape, index, len, fontName)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFontSize(index: number, len: number, fontSize: number) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.fontSize = fontSize;
            this.__cachedSpanAttr.fontSizeIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextFontSize", {});
        try {
            api.textModifyFontSize(this.__page, this.shape, index, len, fontSize)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // 对象属性
    public setTextBehaviour(textBehaviour: TextBehaviour) {
        const api = this.__repo.start("setTextBehaviour", {});
        try {
            api.shapeModifyTextBehaviour(this.__page, this.shape, textBehaviour)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // 对象属性
    public setTextVerAlign(verAlign: TextVerAlign) {
        const api = this.__repo.start("setTextVerAlign", {});
        try {
            api.shapeModifyTextVerAlign(this.__page, this.shape, verAlign)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 对象属性
    public setTextDefaultHorAlign(horAlign: TextHorAlign) {
        const api = this.__repo.start("setTextDefaultHorAlign", {});
        try {
            api.shapeModifyTextDefaultHorAlign(this.__page, this.shape, horAlign)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // 段属性
    public setTextHorAlign(horAlign: TextHorAlign, index: number, len: number) {
        const api = this.__repo.start("setTextHorAlign", {});
        try {
            api.textModifyHorAlign(this.__page, this.shape, horAlign, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextDefaultMinLineHeight(minLineHeight: number) {
        const api = this.__repo.start("setTextDefaultMinLineHeight", {});
        try {
            api.shapeModifyTextDefaultMinLineHeight(this.__page, this.shape, minLineHeight);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // 行高 段属性
    public setMinLineHeight(minLineHeight: number, index: number, len: number) {
        const api = this.__repo.start("setMinLineHeight", {});
        try {
            api.textModifyMinLineHeight(this.__page, this.shape, minLineHeight, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setDefaultMaxLineHeight(maxLineHeight: number) {
        const api = this.__repo.start("setDefaultMaxLineHeight", {});
        try {
            api.shapeModifyTextDefaultMaxLineHeight(this.__page, this.shape, maxLineHeight);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // 行高 段属性
    public setMaxLineHeight(maxLineHeight: number, index: number, len: number) {
        const api = this.__repo.start("setMaxLineHeight", {});
        try {
            api.textModifyMaxLineHeight(this.__page, this.shape, maxLineHeight, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setLineHeight(lineHeight: number, index: number, len: number) {
        const api = this.__repo.start("setLineHeight", {});
        try {
            api.textModifyMinLineHeight(this.__page, this.shape, lineHeight, index, len)
            api.textModifyMaxLineHeight(this.__page, this.shape, lineHeight, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setDefaultCharSpacing(kerning: number) {
        const api = this.__repo.start("setDefaultCharSpacing", {});
        try {
            api.shapeModifyTextKerning(this.__page, this.shape, kerning)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // 字间距 段属性
    public setCharSpacing(kerning: number, index: number, len: number) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.kerning = kerning;
            this.__cachedSpanAttr.kerningIsSet = true;
            return;
        }
        const api = this.__repo.start("setCharSpace", {});
        try {
            api.textModifyKerning(this.__page, this.shape, kerning, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setDefaultParaSpacing(paraSpacing: number) {
        const api = this.__repo.start("setDefaultParaSpacing", {});
        try {
            api.shapeModifyTextParaSpacing(this.__page, this.shape, paraSpacing)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // 段间距 段属性
    public setParaSpacing(paraSpacing: number, index: number, len: number) {
        const api = this.__repo.start("setParaSpacing", {});
        try {
            api.textModifyParaSpacing(this.__page, this.shape, paraSpacing, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextDefaultUnderline(underline: boolean) {
        const api = this.__repo.start("setTextDefaultUnderline", {});
        try {
            api.shapeModifyTextUnderline(this.__page, this.shape, underline ? UnderlineType.Single : undefined)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextUnderline(underline: boolean, index: number, len: number) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.underline = underline ? UnderlineType.Single : undefined;
            this.__cachedSpanAttr.underlineIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextUnderline", {});
        try {
            api.textModifyUnderline(this.__page, this.shape, underline ? UnderlineType.Single : undefined, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextDefaultStrikethrough(strikethrough: boolean) {
        const api = this.__repo.start("setTextDefaultStrikethrough", {});
        try {
            api.shapeModifyStrikethrough(this.__page, this.shape, strikethrough ? StrikethroughType.Single : undefined)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextStrikethrough(strikethrough: boolean, index: number, len: number) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.strikethrough = strikethrough ? StrikethroughType.Single : undefined;
            this.__cachedSpanAttr.strikethroughIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextStrikethrough", {});
        try {
            api.textModifyStrikethrough(this.__page, this.shape, strikethrough ? StrikethroughType.Single : undefined, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextDefaultBold(bold: boolean) {
        const api = this.__repo.start("setTextDefaultBold", {});
        try {
            api.shapeModifyTextDefaultBold(this.__page, this.shape, bold)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextBold(bold: boolean, index: number, len: number) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.bold = bold;
            this.__cachedSpanAttr.boldIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextBold", {});
        try {
            api.textModifyBold(this.__page, this.shape, bold, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextDefaultItalic(italic: boolean) {
        const api = this.__repo.start("setTextDefaultItalic", {});
        try {
            api.shapeModifyTextDefaultItalic(this.__page, this.shape, italic)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextItalic(italic: boolean, index: number, len: number) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.italic = italic;
            this.__cachedSpanAttr.italicIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextItalic", {});
        try {
            api.textModifyItalic(this.__page, this.shape, italic, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 需要个占位符

    public setTextBulletNumbers(type: BulletNumbersType, index: number, len: number) {
        const api = this.__repo.start("setTextBulletNumbers", {});
        try {
            api.textModifyBulletNumbers(this.__page, this.shape, type, index, len);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextBulletNumbersStart(start: number, index: number, len: number) {
        const api = this.__repo.start("setTextBulletNumbersStart", {});
        try {
            api.textModifyBulletNumbersStart(this.__page, this.shape, start, index, len);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextBulletNumbersInherit(inherit: boolean, index: number, len: number) {
        const api = this.__repo.start("setTextBulletNumbersInherit", {});
        try {
            api.textModifyBulletNumbersInherit(this.__page, this.shape, inherit, index, len);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextTransform(transform: TextTransformType | undefined, index: number, len: number) {
        if (len === 0 && transform !== TextTransformType.UppercaseFirst) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.transform = transform;
            this.__cachedSpanAttr.transformIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextTransform", {});
        try {
            api.textModifyTransform(this.__page, this.shape, transform, index, len);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
}