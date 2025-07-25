/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page } from "../data/page";
import { Gradient, ParaAttr, Shape, SpanAttr, Text, TextAttr, TextBehaviour, TextHorAlign, TextVerAlign, Variable } from "../data/classes";
import { BulletNumbersBehavior, BulletNumbersType, FillType, StrikethroughType, TextTransformType, UnderlineType } from "../data/typesdefine";
import { Color } from "../data/classes";
import { BasicOp } from "./basicop";
import { ShapeView } from "../dataview";

export class TextOp {
    constructor(private _basicop: BasicOp) { }
    
    insertSimpleText(parent: ShapeView | Shape | Variable, shapetext: Text, text: string, index: number, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
        return this._basicop.otTextInsert(parent instanceof ShapeView ? parent.data : parent, shapetext, index, text, props);
    }
    insertComplexText(parent: ShapeView | Shape | Variable, shapetext: Text, text: Text, index: number) {
        return this._basicop.otTextInsert(parent instanceof ShapeView ? parent.data : parent, shapetext, index, text);
    }
    deleteText(parent: ShapeView | Shape | Variable, shapetext: Text, index: number, count: number) {
        return this._basicop.otTextRemove(parent instanceof ShapeView ? parent.data : parent, shapetext, index, count);
    }
    
    textModifyColor(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, color: Color | undefined) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, idx, len, "color", color);
    }
    textModifyFontName(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, fontname: string | undefined) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, idx, len, "fontName", fontname);
    }
    textModifyFontSize(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, fontsize: number | undefined) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, idx, len, "fontSize", fontsize);
    }
    
    textModifyTextMask(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, maskid: string | undefined) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, idx, len, "textMask", maskid);
    }
    
    textModifyGradient(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, gradient: Gradient | undefined) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, idx, len, "gradient", gradient);
    }
    
    shapeModifyTextBehaviour(page: Page, shapetext: Text, textBehaviour: TextBehaviour) {
        const text = shapetext;
        if (textBehaviour === TextBehaviour.Flexible) {
            // default
            if (!text.attr || !text.attr.textBehaviour || text.attr.textBehaviour === TextBehaviour.Flexible) return;
        }
        // todo text 的layout 需要监听text 的变化
        if (!shapetext.attr) shapetext.attr = new TextAttr();
        return this._basicop.crdtSetAttr(shapetext.attr, "textBehaviour", textBehaviour);
    }
    shapeModifyTextVerAlign(shapetext: Text, verAlign: TextVerAlign) {
        const text = shapetext;
        if (verAlign === TextVerAlign.Top) {
            // default
            if (!text.attr || !text.attr.verAlign || text.attr.verAlign === TextVerAlign.Top) return;
        }
        if (!shapetext.attr) shapetext.attr = new TextAttr();
        return this._basicop.crdtSetAttr(shapetext.attr, "verAlign", verAlign);
    }
    textModifyHorAlign(parent: ShapeView | Variable, shapetext: Text, horAlign: TextHorAlign, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "alignment", horAlign);
    }
    shapeModifyTextDefaultHorAlign(shapetext: Text, horAlign: TextHorAlign) {
        const text = shapetext;
        if (horAlign === TextHorAlign.Left) {
            // default
            if (!text.attr || !text.attr.alignment || text.attr.alignment === TextHorAlign.Left) return;
        }
        if (!shapetext.attr) shapetext.attr = new TextAttr();
        if (shapetext.attr.alignment !== horAlign) {
            return this._basicop.crdtSetAttr(shapetext.attr, "alignment", horAlign);
        }
    }
    textModifyAutoLineHeight(parent: ShapeView | Variable, shapetext: Text, autoLineheight: boolean, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "autoLineHeight", autoLineheight);
    }
    textModifyMinLineHeight(parent: ShapeView | Variable, shapetext: Text, minLineheight: number | undefined, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "minimumLineHeight", minLineheight);
    }
    textModifyMaxLineHeight(parent: ShapeView | Variable, shapetext: Text, maxLineheight: number | undefined, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "maximumLineHeight", maxLineheight);
    }
    textModifyParaKerning(parent: ShapeView | Variable, shapetext: Text, kerning: number | undefined, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "kerning", kerning);
    }
    textModifySpanKerning(parent: ShapeView | Variable, shapetext: Text, kerning: number | undefined, index: number, len: number) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "kerning", kerning);
    }
    textModifyParaSpacing(parent: ShapeView | Variable, shapetext: Text, paraSpacing: number, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "paraSpacing", paraSpacing);
    }
    textModifyPaddingHor(parent: ShapeView | Variable, shapetext: Text, padding: { left: number, right: number }, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "padding", padding);
    }
    
    textModifyParaTextMask(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, maskid: string | undefined) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, idx, len, "textMask", maskid);
    }
    
    textModifySpanTransfrom(parent: ShapeView | Variable, shapetext: Text, transform: TextTransformType | undefined, index: number, len: number) {
        // 句属性
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "transform", transform);
    }
    textModifyParaTransfrom(parent: ShapeView | Variable, shapetext: Text, transform: TextTransformType | undefined, index: number, len: number) {
        // 段落属性
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "transform", transform);
    }
    shapeModifyTextTransform(shapetext: Text, transform: TextTransformType | undefined) {
        if (!shapetext.attr) shapetext.attr = new TextAttr();
        return this._basicop.crdtSetAttr(shapetext.attr, "transform", transform);
    }
    
    textModifyHighlightColor(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, color: Color | undefined) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, idx, len, "highlight", color);
    }
    textModifyUnderline(parent: ShapeView | Variable, shapetext: Text, underline: UnderlineType | undefined, index: number, len: number) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "underline", underline);
    }
    textModifyStrikethrough(parent: ShapeView | Variable, shapetext: Text, strikethrough: StrikethroughType | undefined, index: number, len: number) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "strikethrough", strikethrough);
    }
    textModifyWeight(parent: ShapeView | Variable, shapetext: Text, weight: number, index: number, len: number) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "weight", weight);
    }
    textModifyItalic(parent: ShapeView | Variable, shapetext: Text, italic: boolean, index: number, len: number) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "italic", italic);
    }
    textModifyFillType(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, fillType: FillType) {
        return this._basicop.otTextSetAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, idx, len, "fillType", fillType);
    }
    
    textModifyBulletNumbersType(parent: ShapeView | Variable, shapetext: Text, type: BulletNumbersType, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "bulletNumbersType", type);
    }
    
    textModifyBulletNumbersStart(parent: ShapeView | Variable, shapetext: Text, start: number, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "bulletNumbersStart", start);
    }
    
    textModifyBulletNumbersBehavior(parent: ShapeView | Variable, shapetext: Text, behavior: BulletNumbersBehavior, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "bulletNumbersBehavior", behavior);
    }
    
    textModifyParaIndent(parent: ShapeView | Variable, shapetext: Text, indent: number | undefined, index: number, len: number) {
        return this._basicop.otTextSetParaAttr(parent instanceof ShapeView ? parent.data : parent, shapetext, index, len, "indent", indent);
    }
}
