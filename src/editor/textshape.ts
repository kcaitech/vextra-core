import { _travelTextPara } from "../data/texttravel";
import {
    BulletNumbersBehavior,
    BulletNumbersType,
    Color,
    Page,
    SpanAttr,
    SpanAttrSetter,
    StrikethroughType,

    TextBehaviour,
    TextHorAlign,
    Text, Shape,
    TextTransformType,
    TextVerAlign,
    UnderlineType,
    TextShape,
    TableCell,
    VariableType,
    OverrideType,
    Para,
    ParaAttr,
    Span,
    ShapeType,
    Variable, Document, TableShape, FillType, GradientType, Gradient, Point2D, Stop
} from "../data/classes";
import { CoopRepository } from "./coop/cooprepo";
import { Api } from "./coop/recordapi";
import { ShapeEditor } from "./shape";
import { fixTableShapeFrameByLayout, fixTextShapeFrameByLayout } from "./utils/other";
import { BasicArray } from "../data/basic";
import { mergeParaAttr, mergeSpanAttr, mergeTextAttr } from "../data/textutils";
import { importGradient, importText } from "../data/baseimport";
import * as basicapi from "./basicapi"
import { uuid } from "../basic/uuid";

type TextShapeLike = Shape & { text: Text }

function createTextByString(stringValue: string, refShape: TextShapeLike) {
    const text = new Text(new BasicArray());
    if (refShape.text.attr) {
        mergeTextAttr(text, refShape.text.attr);
    }
    const para = new Para('\n', new BasicArray());
    para.attr = new ParaAttr();
    text.paras.push(para);
    const span = new Span(para.length);
    para.spans.push(span);
    mergeParaAttr(para, refShape.text.paras[0]);
    mergeSpanAttr(span, refShape.text.paras[0].spans[0]);
    text.insertText(stringValue, 0);
    return text;
}

interface _Api {
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number): void;

    tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number): void;
}

export class TextShapeEditor extends ShapeEditor {

    private __cachedSpanAttr?: SpanAttrSetter;

    constructor(shape: TextShapeLike, page: Page, repo: CoopRepository, document: Document) {
        super(shape, page, repo, document);
        //
        if (shape.isVirtualShape) {

        }
    }
    get shape(): TextShapeLike {
        return this.__shape as TextShapeLike;
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

    private fixFrameByLayout(api: _Api) {
        if (this.shape.isVirtualShape) api = basicapi;
        if (this.shape instanceof TextShape) fixTextShapeFrameByLayout(api, this.__page, this.shape);
        else if (this.shape instanceof TableCell) fixTableShapeFrameByLayout(api, this.__page, this.shape);
    }
    private fixFrameByLayout2(api: _Api, shape: TextShapeLike | Variable) {
        if (this.shape.isVirtualShape) api = basicapi;
        if (shape instanceof TextShape) fixTextShapeFrameByLayout(api, this.__page, shape);
        else if (shape instanceof TableCell) fixTableShapeFrameByLayout(api, this.__page, shape);
    }

    private shape4edit(api: Api, shape?: TextShapeLike) {
        const _shape = shape ?? this.__shape as TextShapeLike;
        const _var = this.overrideVariable(VariableType.Text, OverrideType.Text, (_var) => {
            if (_var) {
                if (_var.value instanceof Text) return importText(_var.value);
                if (typeof _var.value === 'string') return createTextByString(_var.value, _shape);
            }
            else {
                return importText(_shape.text);
            }
            throw new Error();
        }, api, shape);
        
        if (_var && typeof _var.value === 'string') {
            api.shapeModifyVariable(this.__page, _var, createTextByString(_var.value, _shape));
        }
        return _var || _shape as TextShapeLike;
    }

    public deleteText(index: number, count: number): number { // 清空后，在失去焦点时，删除shape
        if (index < 0) {
            count += index;
            index = 0;
        }
        if (count <= 0) return 0;
        const api = this.__repo.start("deleteText");
        try {
            const shape = this.shape4edit(api);
            const deleted = api.deleteText(this.__page, shape, index, count);
            // count = deleted ? deleted.length : count;
            if (count <= 0) {
                this.__repo.rollback();
                return 0;
            }
            this.fixFrameByLayout(api);
            this.updateName(api);
            this.__repo.commit();
            return count;

        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return 0;
    }
    public updateName(api: Api) {
        if (this.__shape.nameIsFixed || this.__shape.isVirtualShape) return;
        const name = (this.__shape as TextShape).text.getText(0, Infinity);
        const i = name.indexOf('\n');
        api.shapeModifyName(this.__page, this.__shape, name.slice(0, i));
    }
    public insertText2(text: string, index: number, del: number, attr?: SpanAttr): number {
        //
        if (this.__shape.isVirtualShape) {
            // 当前text是个variable,或者需要先override

        }
        attr = attr ?? this.__cachedSpanAttr;
        this.resetCachedSpanAttr();
        let count = text.length; // 插入字符数
        const api = this.__repo.start("insertText");
        try {
            const shape = this.shape4edit(api);
            if (del > 0) api.deleteText(this.__page, shape, index, del);
            api.insertSimpleText(this.__page, shape, index, text, attr);
            this.fixFrameByLayout(api);
            this.updateName(api);
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
            return 0;
        }

        // 自动编号识别
        if (text === ' ') {
            const paraInfo = this.shape.text.paraAt(index);
            if (paraInfo && paraInfo.index === 1 && paraInfo.para.text.at(0) === '*') {
                const span0 = paraInfo.para.spans[0];
                if (!span0 || !span0.placeholder) {
                    const api = this.__repo.start("auto bullet");
                    try {
                        const shape = this.shape4edit(api);
                        api.deleteText(this.__page, shape, index - 1, 2); // 删除*+空格
                        api.textModifyBulletNumbers(this.__page, shape, BulletNumbersType.Disorded, index - 1, 0);
                        this.fixFrameByLayout(api);
                        this.__repo.commit();
                        count = 0;
                    } catch (error) {
                        console.log(error)
                        this.__repo.rollback();
                        return count;
                    }
                }
            }
            else if (paraInfo && paraInfo.index >= 1 && paraInfo.para.text.at(paraInfo.index - 1) === '.') {
                const numStr = paraInfo.para.text.slice(0, paraInfo.index - 1);
                const numInt = parseInt(numStr);
                if (('' + numInt) === numStr) {

                    const api = this.__repo.start("auto number");
                    try {
                        const shape = this.shape4edit(api);
                        const paraStartIndex = index - paraInfo.index;
                        if (paraStartIndex !== index - numStr.length - 1) throw new Error("wrong??")
                        api.deleteText(this.__page, shape, index - numStr.length - 1, numStr.length + 2); // 删除数字+.+空格
                        api.textModifyBulletNumbers(this.__page, shape, BulletNumbersType.Ordered1Ai, index - numStr.length - 1, 0);
                        // 找到最近一个有序编号
                        const paras = this.shape.text.paras;
                        const paraIndex = paraInfo.paraIndex;
                        const curIndent = paraInfo.para.attr?.indent || 0;
                        let curIdx = 0;
                        for (let i = paraIndex - 1; i >= 0; i--) {
                            const p = paras[i];
                            if (p.text.at(0) === '*' &&
                                p.spans.length > 0 &&
                                p.spans[0].placeholder &&
                                p.spans[0].bulletNumbers &&
                                p.spans[0].length === 1) { // todo indent

                                const indent = p.attr?.indent || 0;
                                if (indent < curIndent) break;
                                if (indent > curIndent) continue;

                                const bulletNumbers = p.spans[0].bulletNumbers;
                                if (bulletNumbers.type === BulletNumbersType.None) {
                                    continue;
                                }
                                if (bulletNumbers.type !== BulletNumbersType.Ordered1Ai) {
                                    break;
                                }
                                if (bulletNumbers.behavior && bulletNumbers.behavior !== BulletNumbersBehavior.Inherit) {
                                    curIdx += bulletNumbers.offset || 0;
                                    curIdx++;
                                    break;
                                }
                                curIdx++;
                            }
                        }
                        if (numInt !== curIdx + 1) {
                            const bnIndex = index - paraInfo.index;
                            api.textModifyBulletNumbersInherit(this.__page, shape, false, bnIndex, 1);
                            api.textModifyBulletNumbersStart(this.__page, shape, numInt - 1, bnIndex, 1);
                        }
                        this.fixFrameByLayout(api);
                        this.__repo.commit();
                        count = -numStr.length;
                    } catch (error) {
                        console.log(error)
                        this.__repo.rollback();
                        return count;
                    }
                }
            }
        }
        return count;
    }

    public insertTextForNewLine(index: number, del: number, attr?: SpanAttr): number {
        attr = attr ?? this.__cachedSpanAttr;
        this.resetCachedSpanAttr();
        const text = '\n';
        const api = this.__repo.start("insertTextForNewLine");
        try {
            const shape = this.shape4edit(api);
            let count = text.length;
            if (del > 0) api.deleteText(this.__page, shape, index, del);
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
                        api.textModifyBulletNumbers(this.__page, shape, undefined, index, 0);
                        count = -1;
                        break;
                    }
                }

                // 非空行回车
                api.insertSimpleText(this.__page, shape, index, text, attr);
                // 新增段落
                if ((!attr || !attr.bulletNumbers) &&
                    span0.placeholder &&
                    span0.length === 1 &&
                    span0.bulletNumbers &&
                    span0.bulletNumbers.type !== BulletNumbersType.None) {
                    api.textModifyBulletNumbers(this.__page, shape, span0.bulletNumbers.type, index, text.length + 1);
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
        return 0;
    }

    public insertFormatText(text: Text, index: number, del: number): boolean {
        const api = this.__repo.start("insertText");
        try {
            const shape = this.shape4edit(api);
            if (del > 0) api.deleteText(this.__page, shape, index, del);
            api.insertComplexText(this.__page, shape, index, text);
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
        const api = this.__repo.start("composingInput");
        const shape = this.shape4edit(api);
        try {
            if (del > 0) api.deleteText(this.__page, shape, index, del);
        } catch(e) {
            console.error(e);
        }
    }
    public composingInputUpdate(text: string): boolean {
        this.__repo.rollback("composingInput");
        const api = this.__repo.start("composingInput");
        try {
            const shape = this.shape4edit(api);
            if (this.__composingDel > 0) api.deleteText(this.__page, shape, this.__composingIndex, this.__composingDel);
            if (text.length > 0) api.insertSimpleText(this.__page, shape, this.__composingIndex, text, this.__composingAttr);
            else (shape instanceof Shape ? shape.text : shape.value as Text).composingInputUpdate(this.__composingIndex);
            this.fixFrameByLayout(api);
            this.__repo.transactCtx.fireNotify(); // 会导致不断排版绘制
            return true;
        } catch(e) {
            console.error(e);
            return false;
        }
    }
    public composingInputEnd(text: string): boolean {
        this.__repo.rollback("composingInput");
        this.__composingStarted = false;
        return !!this.insertText2(text, this.__composingIndex, this.__composingDel, this.__composingAttr);
    }

    public isInComposingInput() {
        return this.__composingStarted;
    }

    public setTextColor(index: number, len: number, color: Color | undefined) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.color = color;
            this.__cachedSpanAttr.colorIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextColor");
        try {
            const shape = this.shape4edit(api);
            api.textModifyColor(this.__page, shape, index, len, color)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextColorMulti(shapes: Shape[], color: Color | undefined) {
        const api = this.__repo.start("setTextColorMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyColor(this.__page, shape, 0, text_length, color);
            }
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
        const api = this.__repo.start("setTextHighlightColor");
        try {
            const shape = this.shape4edit(api);
            api.textModifyHighlightColor(this.__page, shape, index, len, color)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextHighlightColorMulti(shapes: Shape[], color: Color | undefined) {
        const api = this.__repo.start("setTextHighlightColorMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyHighlightColor(this.__page, shape, 0, text_length, color);
            }
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
        const api = this.__repo.start("setTextFontName");
        try {
            const shape = this.shape4edit(api);
            api.textModifyFontName(this.__page, shape, index, len, fontName)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFontNameMulti(shapes: Shape[], fontName: string) {
        const api = this.__repo.start("setTextFontNameMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyFontName(this.__page, shape, 0, text_length, fontName);
                this.fixFrameByLayout2(api, shape);
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFontSize(index: number, len: number, fontSize: number) {
        // fix fontSize
        if (typeof fontSize !== 'number') {
            fontSize = Number.parseFloat(fontSize);
        }
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.fontSize = fontSize;
            this.__cachedSpanAttr.fontSizeIsSet = true;
            return;
        }

        const api = this.__repo.start("setTextFontSize");
        try {
            const shape = this.shape4edit(api);
            api.textModifyFontSize(this.__page, shape, index, len, fontSize)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextFontSizeMulti(shapes: Shape[], fontSize: number) {
        const api = this.__repo.start("setTextFontSizeMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyFontSize(this.__page, shape, 0, text_length, fontSize);
            }
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
        const api = this.__repo.start("setTextBehaviour");
        try {
            const shape = this.shape4edit(api);
            const text = shape instanceof Shape ? shape.text : shape.value as Text;
            api.shapeModifyTextBehaviour(this.__page, text, textBehaviour)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextBehaviourMulti(shapes: Shape[], textBehaviour: TextBehaviour) {
        const api = this.__repo.start("setTextBehaviourMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.shapeModifyTextBehaviour(this.__page, text, textBehaviour);
                this.fixFrameByLayout2(api, shape);
            }
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
        const api = this.__repo.start("setTextVerAlign");
        try {
            const shape = this.shape4edit(api);
            api.shapeModifyTextVerAlign(this.__page, this.shape, verAlign)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextVerAlignMulti(shapes: Shape[], verAlign: TextVerAlign) {
        const api = this.__repo.start("setTextVerAlignMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                api.shapeModifyTextVerAlign(this.__page, shape, verAlign);
            }
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
        const api = this.__repo.start("setTextHorAlign");
        try {
            const shape = this.shape4edit(api);
            api.textModifyHorAlign(this.__page, shape, horAlign, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextHorAlignMulti(shapes: Shape[], horAlign: TextHorAlign) {
        const api = this.__repo.start("setTextHorAlignMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                api.textModifyHorAlign(this.__page, shape, horAlign, 0, text_length);
            }
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
        const api = this.__repo.start("setMinLineHeight");
        try {
            const shape = this.shape4edit(api);
            api.textModifyMinLineHeight(this.__page, shape, minLineHeight, index, len)
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
        const api = this.__repo.start("setMaxLineHeight");
        try {
            const shape = this.shape4edit(api);
            api.textModifyMaxLineHeight(this.__page, shape, maxLineHeight, index, len)
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
        const api = this.__repo.start("setLineHeight");
        try {
            const shape = this.shape4edit(api);
            api.textModifyMinLineHeight(this.__page, shape, lineHeight, index, len)
            api.textModifyMaxLineHeight(this.__page, shape, lineHeight, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setLineHeightMulit(shapes: Shape[], lineHeight: number) {
        const api = this.__repo.start("setLineHeightMulit");
        try {
            for (let i = 0; i < shapes.length; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                api.textModifyMinLineHeight(this.__page, shape, lineHeight, 0, text_length)
                api.textModifyMaxLineHeight(this.__page, shape, lineHeight, 0, text_length)
                this.fixFrameByLayout2(api, shape);
            }
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
        const api = this.__repo.start("setCharSpace");
        try {
            const shape = this.shape4edit(api);
            api.textModifyKerning(this.__page, shape, kerning, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setCharSpacingMulit(shapes: Shape[], kerning: number) {
        const api = this.__repo.start("setCharSpacingMulit");
        try {
            for (let i = 0; i < shapes.length; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                api.textModifyKerning(this.__page, shape, kerning, 0, text_length);
                this.fixFrameByLayout2(api, shape);
            }
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
        const api = this.__repo.start("setParaSpacing");
        try {
            const shape = this.shape4edit(api);
            api.textModifyParaSpacing(this.__page, shape, paraSpacing, index, len)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setParaSpacingMulit(shapes: Shape[], paraSpacing: number) {
        const api = this.__repo.start("setParaSpacingMulit");
        try {
            for (let i = 0; i < shapes.length; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                api.textModifyParaSpacing(this.__page, shape, paraSpacing, 0, text_length)
                this.fixFrameByLayout2(api, shape);
            }
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
        const api = this.__repo.start("setTextUnderline");
        try {
            const shape = this.shape4edit(api);
            api.textModifyUnderline(this.__page, shape, underline ? UnderlineType.Single : undefined, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    /**
     * @description 多选文字对象时，给每个文字对象的全部文字设置下划线
     */
    public setTextUnderlineMulti(shapes: Shape[], underline: boolean) {
        const api = this.__repo.start("setTextUnderlineMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyUnderline(this.__page, shape, underline ? UnderlineType.Single : undefined, 0, text_length);
            }
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
        const api = this.__repo.start("setTextStrikethrough");
        try {
            const shape = this.shape4edit(api);
            api.textModifyStrikethrough(this.__page, shape, strikethrough ? StrikethroughType.Single : undefined, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextStrikethroughMulti(shapes: Shape[], strikethrough: boolean) {
        const api = this.__repo.start("setTextStrikethroughMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyStrikethrough(this.__page, shape, strikethrough ? StrikethroughType.Single : undefined, 0, text_length);
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextFillType(fillType: FillType, index: number, len: number) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.fillType = fillType;
            this.__cachedSpanAttr.fillTypeIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextFillType");
        try {
            const shape = this.shape4edit(api);
            api.textModifyFillType(this.__page, shape, fillType, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFillTypeMulti(shapes: Shape[], fillType: FillType) {
        const api = this.__repo.start("setTextFillTypeMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyFillType(this.__page, shape, fillType, 0, text_length);
            }
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
        const api = this.__repo.start("setTextBold");
        try {
            const shape = this.shape4edit(api);
            api.textModifyBold(this.__page, shape, bold, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public template(shapes: Shape[]) {
        const api = this.__repo.start("setTextsBold");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const text_length = text_shape.text.length;
                if (text_length === 0) continue;
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    /**
     * @description 多选文字对象时，给每个文字对象的全部文字设置粗体
     */
    public setTextBoldMulti(shapes: Shape[], bold: boolean) {
        const api = this.__repo.start("setTextBoldMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyBold(this.__page, shape, bold, 0, text_length)
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return true;
    }

    public setTextItalic(italic: boolean, index: number, len: number) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.italic = italic;
            this.__cachedSpanAttr.italicIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextItalic");
        try {
            const shape = this.shape4edit(api);
            api.textModifyItalic(this.__page, shape, italic, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    /**
     * @description 多选文字对象时，给每个文字对象的全部文字设置斜体
     */
    public setTextItalicMulti(shapes: Shape[], italic: boolean) {
        const api = this.__repo.start("setTextItalicMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyItalic(this.__page, shape, italic, 0, text_length);
            }
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
        const api = this.__repo.start("setTextBulletNumbers");
        try {
            const shape = this.shape4edit(api);
            api.textModifyBulletNumbers(this.__page, shape, type, index, len);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextBulletNumbersMulti(shapes: Shape[], type: BulletNumbersType) {
        const api = this.__repo.start("setTextBulletNumbersMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyBulletNumbers(this.__page, shape, type, 0, text_length);
                this.fixFrameByLayout2(api, shape);
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextBulletNumbersStart(start: number, index: number, len: number) {
        const api = this.__repo.start("setTextBulletNumbersStart");
        try {
            const shape = this.shape4edit(api);
            api.textModifyBulletNumbersStart(this.__page, shape, start, index, len);
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
        const api = this.__repo.start("setTextBulletNumbersInherit");
        try {
            const shape = this.shape4edit(api);
            api.textModifyBulletNumbersInherit(this.__page, shape, inherit, index, len);
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
        const api = this.__repo.start("setTextTransform");
        try {
            const shape = this.shape4edit(api);
            api.textModifyTransform(this.__page, shape, transform, index, len);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextTransformMulti(shapes: Shape[], type: TextTransformType | undefined) {
        const api = this.__repo.start("setTextTransformMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape: TextShape = shapes[i] as TextShape;
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof Shape ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyTransform(this.__page, shape, type, 0, text_length);
                this.fixFrameByLayout2(api, shape);
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public offsetParaIndent(offset: number, index: number, len: number) {
        const api = this.__repo.start("offsetParaIndent");
        try {
            const shape = this.shape4edit(api);
            const text = (shape instanceof Shape) ? shape.text : shape.value as Text;
            _travelTextPara(text.paras, index, len || 1, (paraArray, paraIndex, para, _index, length) => {
                index -= _index;

                const cur = para.attr?.indent || 0;
                const tar = Math.max(0, cur + offset);
                if (cur !== tar) {
                    api.textModifyParaIndent(this.__page, shape, tar ? tar : undefined, index, para.length)
                }

                index += para.length;
            })

            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextGradientType(gradient: Gradient, index: number, len: number) {
        if (len === 0) {
            if (this.__cachedSpanAttr === undefined) this.__cachedSpanAttr = new SpanAttrSetter();
            this.__cachedSpanAttr.fillType = FillType.Gradient;
            this.__cachedSpanAttr.fillTypeIsSet = true;
            this.__cachedSpanAttr.gradient = gradient;
            this.__cachedSpanAttr.gradientIsSet = true;
            return;
        }
        const api = this.__repo.start("setTextGradientType");
        try {
            const shape = this.shape4edit(api);
            api.textModifyFillType(this.__page, shape, FillType.Gradient, index, len)
            api.setTextGradient(this.__page, shape, gradient, index, len);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
}