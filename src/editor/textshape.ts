/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { _travelTextPara } from "../data/text/texttravel";
import {
    BulletNumbersBehavior,
    BulletNumbersType,
    Color,
    SpanAttr,
    StrikethroughType,
    TextBehaviour,
    TextHorAlign,
    Text, Shape,
    TextTransformType,
    TextVerAlign,
    UnderlineType,
    TableCell,
    VariableType,
    OverrideType,
    Para,
    Span,
    ShapeType,
    Variable, Document, FillType, Gradient,
    string2Text,
} from "../data";
import { CoopRepository, CmdMergeType } from "../coop";
import { Operator } from "../coop/recordop";
import { ShapeEditor } from "./shape";
import { BasicArray } from "../data";
import { mergeParaAttr, mergeSpanAttr } from "../data/text/textutils";
import { importGradient, importText } from "../data/baseimport";
import { AsyncGradientEditor, Status } from "./controller";
import { PageView, ShapeView, TableCellView, TableView, TextShapeView, adapt2Shape } from "../dataview";
import { cell4edit2, varParent } from "./symbol";
import { uuid } from "../basic/uuid";
import { SymbolRefShape, SymbolShape, GroupShape } from "../data";
import { ParaAttr } from "../data";
import { prepareVar } from "./symbol_utils";

type TextShapeLike = Shape & { text: Text }

export interface AsyncTextAttrEditor {
    execute_char_spacing: (kerning: number) => void;
    execute_line_height: (lineHeight: number) => void;
    close: () => undefined;
}

export class TextShapeEditor extends ShapeEditor {

    private _cacheAttr?: SpanAttr;
    private get cacheAttr() {
        if (this._cacheAttr === undefined) this._cacheAttr = new SpanAttr();
        return this._cacheAttr;
    }

    constructor(shape: TextShapeView | TableCellView, page: PageView, repo: CoopRepository, document: Document) {
        super(shape, page, repo, document);
    }
    get shape(): TextShapeLike {
        return adapt2Shape(this.__shape) as TextShapeLike;
    }

    get view() {
        return this.__shape as (TextShapeView | TableCellView);
    }

    public resetCachedSpanAttr() {
        this._cacheAttr = undefined;
    }

    public getCachedSpanAttr() {
        return this._cacheAttr;
    }

    public setCachedSpanAttr() {
        this._cacheAttr = new SpanAttr();
    }

    public insertText(text: string, index: number, attr?: SpanAttr): number {
        return this.insertText2(text, index, 0, attr);
    }

    public fixFrameByLayout(api: Operator) {
        // if (this.shape.isVirtualShape) return; // api = basicapi;
        // if (this.view instanceof TextShapeView) fixTextShapeFrameByLayout(api, this.__page, this.view);
        // else if (this.view instanceof TableCellView) fixTableShapeFrameByLayout(api, this.__page, this.view, this.view.parent as TableView);
    }
    public fixFrameByLayout2(api: Operator, shape: TextShapeView | TableCellView | Variable) {
        // if (shape instanceof Variable) return;
        // if (shape.isVirtualShape) return; // api = basicapi;
        // if (shape instanceof TextShapeView) fixTextShapeFrameByLayout(api, this.__page, shape);
        // else if (shape instanceof TableCellView) fixTableShapeFrameByLayout(api, this.__page, shape, this.view.parent as TableView);
    }

    private overrideVariable(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, api: Operator, view?: ShapeView) {
        view = view ?? this.__shape;
        return prepareVar(api, this._page, view, overrideType, varType, valuefun)?.var;
    }

    private fixText(text: Text) {
        const fixedText = importText(text);
        fixedText.fixed = true;
        return fixedText;
    }

    public shape4edit(api: Operator, shape?: TextShapeView | TableCellView): Variable | TableCellView | TextShapeView {
        const _shape = shape ?? this.__shape as (TextShapeView | TableCellView);

        if (_shape instanceof TableCellView) {
            const _var = cell4edit2(this._page, _shape.parent as TableView, _shape, api);
            let cell: TableCell;
            if (_var) {
                cell = _var.value;
            } else {
                // cell可能是不存在的, 需要重新获取
                const table = _shape.parent as TableView;
                cell = table.data.cells.get(_shape.data.id) as TableCell;
                if (!cell) throw new Error();
            }
            this.__repo.updateTextSelectionPath(cell.text);
            if (_var || cell !== _shape.data) {
                _shape.setData(cell); // 手动更新下，要不光标更新不对
            }
            return _shape;
        } else {
            let _var = this.overrideVariable(VariableType.Text, OverrideType.Text, (_var) => {
                if (_var) {
                    if (_var.value instanceof Text) return importText(_var.value);
                    if (typeof _var.value === 'string') {
                        return string2Text(_var.value)
                    }
                }
                else {
                    return this.fixText(_shape.text);
                }
                throw new Error();
            }, api, shape);

            if (_var && (typeof _var.value === 'string')) { // 这有问题！
                const host = varParent(_var)! as SymbolRefShape | SymbolShape;
                const textVar = new Variable(uuid(), VariableType.Text, _var.name, string2Text(_shape.text.toString()));
                if (host instanceof SymbolShape) {
                    // sketch不会走到这
                    // 更换var
                    // 更换bindvar
                    api.shapeRemoveVariable(this.__page, host, _var.id);
                    api.shapeAddVariable(this.__page, host, textVar);
                    const bindid = _var.id;
                    const rebind = (shape: Shape) => {
                        if (shape.varbinds?.get(OverrideType.Text) === bindid) {
                            api.shapeUnbinVar(this.__page, shape, OverrideType.Text);
                            api.shapeBindVar(this.__page, shape, OverrideType.Text, textVar.id);
                        }
                        if (shape instanceof GroupShape) {
                            shape.childs.forEach(c => rebind(c));
                        }
                    }
                    rebind(host);
                } else {
                    let override_id: string | undefined;
                    for (let [k, v] of host.overrides!) {
                        if (v === _var.id) {
                            override_id = k;
                            break;
                        }
                    }
                    if (!override_id) throw new Error();
                    // 不可以直接修改，需要删除后重新override到一个text
                    api.shapeRemoveOverride(this.__page, host, override_id);
                    api.shapeRemoveVariable(this.__page, host, _var.id);
                    api.shapeAddVariable(this.__page, host, textVar);
                    api.shapeAddOverride(this.__page, host, override_id, textVar.id);
                }
                _var = textVar;
            }
            if (_var && _var.value instanceof Text) {
                this.__repo.updateTextSelectionPath(_var.value);
                return _var;
            }
            return _shape;
        }
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
            api.deleteText(this.__page, shape, index, count);
            // count = deleted ? deleted.length : count;
            if (count <= 0) {
                this.__repo.rollback();
                return 0;
            }
            this.fixFrameByLayout(api);
            this.updateName(api);
            this.__repo.commit(CmdMergeType.TextDelete);
            return count;

        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return 0;
    }
    public updateName(api: Operator) {
        const shape = this.shape;
        if (shape.nameIsFixed || shape.isVirtualShape) return;
        const name = (shape as TextShapeLike).text.getText(0, Infinity);
        const i = name.indexOf('\n');
        const placeholder = shape.text.paras[0].spans[0].placeholder;

        api.shapeModifyName(this.__page, shape, name.slice(placeholder ? 1 : 0, i));
    }
    public insertText2(text: string, index: number, del: number, attr?: SpanAttr): number {
        if (text.length === 0 && del === 0) return 0;
        attr = attr ?? this._cacheAttr;
        this.resetCachedSpanAttr();
        let count = text.length; // 插入字符数
        const api = this.__repo.start("insertText");
        try {
            const shape = this.shape4edit(api);
            this.__repo.updateTextSelectionRange(index, del);
            if (del > 0 && text.length === 0) {
                api.deleteText(this.__page, shape, index, del);
            }
            else if (del > 0) {
                const _text = shape instanceof Variable ? shape.value as Text : shape.text;
                const span = _text.spanAt(index + del - 1);
                const para = _text.paraAt(index); // 用第一段的段属性

                // 构造text
                const text1 = new Text(new BasicArray());
                const para1 = new Para(text, new BasicArray());
                if (para?.para) mergeParaAttr(para1, para.para);
                text1.paras.push(para1);
                const span1 = new Span(para1.length);
                if (span) mergeSpanAttr(span1, span);
                if (attr) mergeSpanAttr(span1, attr);
                para1.spans.push(span1);

                api.deleteText(this.__page, shape, index, del);
                api.insertComplexText(this.__page, shape, index, text1)
            } else {
                api.insertSimpleText(this.__page, shape, index, text, attr);
            }
            this.fixFrameByLayout(api);
            this.updateName(api);
            this.__repo.commit(CmdMergeType.TextInsert);
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
        attr = attr ?? this._cacheAttr;
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
                        api.textModifyParaIndent(this.__page, shape, indent - 1, index, paraText.length);
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
        if (text.length === 0 && del === 0) return true;
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

    private __composingEnding: any;
    private __composingStarted: boolean = false;
    private __composingIndex: number = 0;
    private __composingDel: number = 0;
    private __composingAttr?: SpanAttr;
    public composingInputStart(index: number, del: number, attr?: SpanAttr) {
        if (this.__composingEnding) {
            clearTimeout(this.__composingEnding);
            this.__composingEnding = undefined;
        }
        this.__preInputText = undefined;
        this.__composingStarted = true;
        this.__composingIndex = index;
        this.__composingDel = del;
        this.__composingAttr = attr;
        const api = this.__repo.start("composingInput");
        this.__composingApi = api;
        try {
            const shape = this.shape4edit(api);
            if (del > 0) {
                const _text = shape instanceof Variable ? shape.value as Text : shape.text;
                const span = _text.spanAt(index + del - 1);
                const para = _text.paraAt(index); // 用第一段的段属性
                this.__composdelSpan = span;
                this.__composdelpara = para?.para.attr;
                api.deleteText(this.__page, shape, index, del);
                this.fixFrameByLayout(api);
            }
        } catch (e) {
            console.error(e);
        }
    }

    private __composdelSpan: SpanAttr | undefined;
    private __composdelpara: ParaAttr | undefined;
    private __composingApi: Operator | undefined;
    private __preInputText: string | undefined;
    public composingInputUpdate(text: string): boolean {
        const api = this.__composingApi;
        if (!api) throw new Error();
        try {
            const savetext = text;
            const shape = this.shape4edit(api);
            let index = this.__composingIndex;
            if (this.__preInputText && this.__preInputText.length > 0) { // 删除之前的
                const prelen = this.__preInputText.length;
                const preText = this.__preInputText;
                // const min = Math.min(text.length, len);
                const min = text.length;
                let del = preText.length;
                let delindex = index;
                if (min <= prelen) { // 变短了，删除
                    if (preText.startsWith(text)) {
                        text = '';
                        del = preText.length - min;
                        delindex += min;
                    }
                } else { // 变长了，输入
                    if (text.startsWith(preText)) {
                        text = text.slice(prelen);
                        del = 0;
                        index += prelen;
                    }
                }

                if (del > 0) api.deleteText(this.__page, shape, delindex, del);
                this.__preInputText = undefined;
            }
            if (this.__composingDel > 0 && text.length > 0) { // 继承属性

                const attr = this.__composingAttr;
                const span = this.__composdelSpan;
                const para = this.__composdelpara;

                // 构造text
                const text1 = new Text(new BasicArray());
                const para1 = new Para(text, new BasicArray());
                if (para) mergeParaAttr(para1, para);
                text1.paras.push(para1);
                const span1 = new Span(para1.length);
                if (span) mergeSpanAttr(span1, span);
                if (attr) mergeSpanAttr(span1, attr);
                para1.spans.push(span1);

                api.insertComplexText(this.__page, shape, index, text1);
            }
            else if (text.length > 0) {
                api.insertSimpleText(this.__page, shape, index, text, this.__composingAttr);
            }

            this.__preInputText = savetext;
            if (!this.view.isVirtualShape && this.view instanceof TextShapeView) this.view.frameProxy.forceUpdateOriginFrame();
            this.fixFrameByLayout(api);
            this.__repo.transactCtx.fireNotify(); // 会导致不断排版绘制
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    public composingInputEnd(text: string): boolean {
        this.__repo.rollback("composingInput");
        // safari在删除预输入的内容后，还会再派发一个backspace事件，需要过滤掉
        this.__composingEnding = setTimeout(() => {
            this.__composingStarted = false;
        }, 50);
        if (text.length === 0 && this.__composingDel === 0) return true;
        if (!this.view.isVirtualShape && this.view instanceof TextShapeView) this.view.frameProxy.forceUpdateOriginFrame(); // 需要更新，否则一会updateFrame时不对
        return !!this.insertText2(text, this.__composingIndex, this.__composingDel, this.__composingAttr);
    }

    public isInComposingInput() {
        return this.__composingStarted;
    }

    public setTextColor(index: number, len: number, color: Color | undefined) {
        if (len === 0) {
            if (this._cacheAttr === undefined) this._cacheAttr = new SpanAttr();
            this._cacheAttr.color = color;
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

    public setTextColorMulti(shapes: (TextShapeView | TableCellView)[], color: Color | undefined) {
        const api = this.__repo.start("setTextColorMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
            this.cacheAttr.highlight = color;
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

    public setTextHighlightColorMulti(shapes: (TextShapeView | TableCellView)[], color: Color | undefined) {
        const api = this.__repo.start("setTextHighlightColorMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
            this.cacheAttr.fontName = fontName;
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
    public setTextFontNameMulti(shapes: (TextShapeView | TableCellView)[], fontName: string) {
        const api = this.__repo.start("setTextFontNameMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
            this.cacheAttr.fontSize = fontSize;
            return;
        }

        const api = this.__repo.start("setTextFontSize");
        try {
            const shape = this.shape4edit(api);
            const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
            const text_length = text.length;
            if (len === text_length - 1) {
                len = text_length;
            }
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

    public setTextMask(index: number, len: number, maskid: string) {
        // fix fontSize
        if (typeof maskid !== 'string') {
            maskid = maskid + ''.toString();
        }
        if (len === 0) {
            this.cacheAttr.textMask = maskid;
            return;
        }

        const api = this.__repo.start("setTextMask");
        try {
            const shape = this.shape4edit(api);
            const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
            const text_length = text.length;
            if (len === text_length - 1) {
                len = text_length;
            }
            api.textModifyTextMask(this.__page, shape, index, len, maskid)
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextFontSizeMulti(shapes: (TextShapeView | TableCellView)[], fontSize: number) {
        const api = this.__repo.start("setTextFontSizeMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
            const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
    public setTextBehaviourMulti(shapes: (TextShapeView | TableCellView)[], textBehaviour: TextBehaviour) {
        const api = this.__repo.start("setTextBehaviourMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
            api.shapeModifyTextVerAlign(this.__page, shape, verAlign)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextVerAlignMulti(shapes: (TextShapeView | TableCellView)[], verAlign: TextVerAlign) {
        const api = this.__repo.start("setTextVerAlignMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
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

    public setTextHorAlignMulti(shapes: (TextShapeView | TableCellView)[], horAlign: TextHorAlign) {
        const api = this.__repo.start("setTextHorAlignMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
    public setLineHeight(lineHeight: number | undefined, isAuto: boolean, index: number, len: number) {
        const api = this.__repo.start("setLineHeight");
        try {
            const shape = this.shape4edit(api);
            api.textModifyAutoLineHeight(this.__page, shape, isAuto, index, len)
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
    public setLineHeightMulit(shapes: (TextShapeView | TableCellView)[], lineHeight: number | undefined, isAuto: boolean) {
        const api = this.__repo.start("setLineHeightMulit");
        try {
            for (let i = 0; i < shapes.length; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                const text_length = text.length;
                api.textModifyAutoLineHeight(this.__page, shape, isAuto, 0, text_length)
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
            this.cacheAttr.kerning = kerning;
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
    public setCharSpacingMulit(shapes: (TextShapeView | TableCellView)[], kerning: number) {
        const api = this.__repo.start("setCharSpacingMulit");
        try {
            for (let i = 0; i < shapes.length; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
    public setParaSpacingMulit(shapes: (TextShapeView | TableCellView)[], paraSpacing: number) {
        const api = this.__repo.start("setParaSpacingMulit");
        try {
            for (let i = 0; i < shapes.length; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
            this.cacheAttr.underline = underline ? UnderlineType.Single : UnderlineType.None;
            return;
        }
        const api = this.__repo.start("setTextUnderline");
        try {
            const shape = this.shape4edit(api);
            api.textModifyUnderline(this.__page, shape, underline ? UnderlineType.Single : UnderlineType.None, index, len)
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
    public setTextUnderlineMulti(shapes: (TextShapeView | TableCellView)[], underline: boolean) {
        const api = this.__repo.start("setTextUnderlineMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyUnderline(this.__page, shape, underline ? UnderlineType.Single : UnderlineType.None, 0, text_length);
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
            this.cacheAttr.strikethrough = strikethrough ? StrikethroughType.Single : StrikethroughType.None;
            return;
        }
        const api = this.__repo.start("setTextStrikethrough");
        try {
            const shape = this.shape4edit(api);
            api.textModifyStrikethrough(this.__page, shape, strikethrough ? StrikethroughType.Single : StrikethroughType.None, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextStrikethroughMulti(shapes: (TextShapeView | TableCellView)[], strikethrough: boolean) {
        const api = this.__repo.start("setTextStrikethroughMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyStrikethrough(this.__page, shape, strikethrough ? StrikethroughType.Single : StrikethroughType.None, 0, text_length);
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
            this.cacheAttr.fillType = fillType;
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
    public setTextFillTypeMulti(shapes: (TextShapeView | TableCellView)[], fillType: FillType) {
        const api = this.__repo.start("setTextFillTypeMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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

    public setTextWeight(weight: number, italic: boolean, index: number, len: number) {
        if (len === 0) {
            this.cacheAttr.weight = weight;
            this.cacheAttr.italic = italic;
            return;
        }
        const api = this.__repo.start("setTextWeight");
        try {
            const shape = this.shape4edit(api);
            api.textModifyWeight(this.__page, shape, weight, index, len)
            api.textModifyItalic(this.__page, shape, italic, index, len)
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    // public template(shapes: Shape[]) {
    //     const api = this.__repo.start("setTexts");
    //     try {
    //         for (let i = 0, len = shapes.length; i < len; i++) {
    //             const text_shape: TextShape = shapes[i] as TextShape;
    //             if (text_shape.type !== ShapeType.Text) continue;
    //             const text_length = text_shape.text.length;
    //             if (text_length === 0) continue;
    //         }
    //         this.__repo.commit();
    //         return true;
    //     } catch (error) {
    //         console.log(error)
    //         this.__repo.rollback();
    //     }
    //     return false;
    // }
    /**
     * @description 多选文字对象时，给每个文字对象的全部文字设置字重
     */
    public setTextWeightMulti(shapes: (TextShapeView | TableCellView)[], weight: number, italic: boolean) {
        const api = this.__repo.start("setTextWeightMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyWeight(this.__page, shape, weight, 0, text_length);
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
    public setTextBulletNumbersMulti(shapes: (TextShapeView | TableCellView)[], type: BulletNumbersType) {
        const api = this.__repo.start("setTextBulletNumbersMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
        try {
            if (len === 0 && transform !== TextTransformType.UppercaseFirst) {
                this.cacheAttr.transform = transform;
                return;
            }
            const api = this.__repo.start("setTextTransform");
            const shape = this.shape4edit(api);
            api.textModifyTransform(this.__page, shape, transform, index, len);
            this.fixFrameByLayout(api);
            this.__repo.commit();
            return true;
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    public setTextTransformMulti(shapes: (TextShapeView | TableCellView)[], type: TextTransformType | undefined) {
        const api = this.__repo.start("setTextTransformMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
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
            const text = (shape instanceof ShapeView) ? shape.text : shape.value as Text;
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
    public setTextGradient(gradient: Gradient, index: number, len: number) {
        if (len === 0) {
            this.cacheAttr.gradient = gradient;
            return;
        }
        const api = this.__repo.start("setTextGradient");
        try {
            const shape = this.shape4edit(api);
            api.setTextGradient(this.__page, shape, gradient, index, len);
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextGradientMulti(shapes: (TextShapeView | TableCellView)[], gradient: Gradient) {
        const api = this.__repo.start("setTextGradientMulti");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const shape = this.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.setTextGradient(this.__page, shape, gradient, 0, text_length);
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public asyncSetTextGradient(shapes: (TextShapeView | TableCellView)[], gradient: Gradient, index: number, len: number): AsyncGradientEditor {
        const api = this.__repo.start("asyncSetTextGradient");
        let status: Status = Status.Pending;
        const execute_from = (from: { x: number, y: number }) => {
            status = Status.Pending;
            try {
                const new_gradient = importGradient(gradient);
                new_gradient.from.x = from.x;
                new_gradient.from.y = from.y;
                set_gradient(new_gradient);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_to = (to: { x: number, y: number }) => {
            status = Status.Pending;
            try {
                const new_gradient = importGradient(gradient);
                new_gradient.to.x = to.x;
                new_gradient.to.y = to.y;
                set_gradient(new_gradient);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_elipselength = (length: number) => {
            status = Status.Pending;
            try {
                const new_gradient = importGradient(gradient);
                new_gradient.elipseLength = length;
                set_gradient(new_gradient);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_stop_position = (position: number, id: string) => {
            status = Status.Pending;
            try {
                const new_gradient = importGradient(gradient);
                const i = new_gradient.stops.findIndex((item) => item.id === id);
                new_gradient.stops[i].position = position;
                const g_s = new_gradient.stops;
                g_s.sort((a, b) => {
                    if (a.position > b.position) {
                        return 1;
                    } else if (a.position < b.position) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                set_gradient(new_gradient);
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        const set_gradient = (new_gradient: Gradient) => {
            if (shapes.length === 1) {
                const g = importGradient(new_gradient);
                if (len === 0) {
                    this.cacheAttr.gradient = g;
                }
                const shape = this.shape4edit(api);
                api.setTextGradient(this.__page, shape, g, index, len);
            } else if (shapes.length > 1) {
                for (let i = 0, l = shapes.length; i < l; i++) {
                    const g = importGradient(new_gradient);
                    const text_shape = shapes[i];
                    if (text_shape.type !== ShapeType.Text) continue;
                    const shape = this.shape4edit(api, text_shape);
                    const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                    const text_length = text.length;
                    if (text_length === 0) continue;
                    api.setTextGradient(this.__page, shape, g, 0, text_length);
                }
            }
        }
        return { execute_from, execute_to, execute_elipselength, execute_stop_position, close }
    }
    public asyncSetTextAttr(shapes: (TextShapeView | TableCellView)[], index: number, len: number): AsyncTextAttrEditor {
        const api = this.__repo.start("asyncSetTextAttr");
        let status: Status = Status.Pending;
        const execute_char_spacing = (kerning: number) => {
            status = Status.Pending;
            try {
                if (shapes.length === 1) {
                    if (len === 0) {
                        this.cacheAttr.kerning = kerning;
                    } else {
                        const shape = this.shape4edit(api);
                        api.textModifyKerning(this.__page, shape, kerning, index, len)
                        this.fixFrameByLayout(api);
                    }
                } else if (shapes.length > 1) {
                    for (let i = 0, l = shapes.length; i < l; i++) {
                        const text_shape = shapes[i];
                        if (text_shape.type !== ShapeType.Text) continue;
                        const shape = this.shape4edit(api, text_shape);
                        const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                        const text_length = text.length;
                        if (text_length === 0) continue;
                        api.textModifyKerning(this.__page, shape, kerning, 0, text_length);
                        this.fixFrameByLayout2(api, shape);
                    }
                }
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const execute_line_height = (lineHeight: number) => {
            status = Status.Pending;
            try {
                if (shapes.length === 1) {
                    const shape = this.shape4edit(api);
                    api.textModifyMinLineHeight(this.__page, shape, lineHeight, index, len)
                    api.textModifyMaxLineHeight(this.__page, shape, lineHeight, index, len)
                    this.fixFrameByLayout(api);
                } else if (shapes.length > 1) {
                    for (let i = 0, l = shapes.length; i < l; i++) {
                        const text_shape = shapes[i];
                        if (text_shape.type !== ShapeType.Text) continue;
                        const shape = this.shape4edit(api, text_shape);
                        const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                        const text_length = text.length;
                        if (text_length === 0) continue;
                        api.textModifyMinLineHeight(this.__page, shape, lineHeight, 0, text_length)
                        api.textModifyMaxLineHeight(this.__page, shape, lineHeight, 0, text_length)
                        this.fixFrameByLayout2(api, shape);
                    }
                }
                this.__repo.transactCtx.fireNotify();
                status = Status.Fulfilled;
            } catch (e) {
                console.error(e);
                status = Status.Exception;
            }
        }
        const close = () => {
            if (status == Status.Fulfilled && this.__repo.isNeedCommit()) {
                this.__repo.commit();
            } else {
                this.__repo.rollback();
            }
            return undefined;
        }
        return { execute_char_spacing, execute_line_height, close }
    }
}