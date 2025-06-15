/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page } from "../../data/page";
import { ParaAttr, Shape, SpanAttr, Text, TextAttr, TextBehaviour, TextHorAlign, TextVerAlign, Variable } from "../../data/classes";
import { BulletNumbersBehavior, BulletNumbersType, FillType, StrikethroughType, TextTransformType, UnderlineType } from "../../data/typesdefine";
import { Color } from "../../data/classes";
import { crdtSetAttr, otTextInsert, otTextRemove, otTextSetAttr, otTextSetParaAttr } from "./basic";
import { Gradient } from "../../data/baseclasses";
import { ShapeView } from "../../dataview";

export function insertSimpleText(parent: ShapeView | Shape | Variable, shapetext: Text, text: string, index: number, props?: { attr?: SpanAttr, paraAttr?: ParaAttr }) {
    return otTextInsert(parent, shapetext, index, text, props);
}
export function insertComplexText(parent: ShapeView | Shape | Variable, shapetext: Text, text: Text, index: number) {
    return otTextInsert(parent, shapetext, index, text);
}
export function deleteText(parent: ShapeView | Shape | Variable, shapetext: Text, index: number, count: number) {
    return otTextRemove(parent, shapetext, index, count);
}

export function textModifyColor(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, color: Color | undefined) {
    return otTextSetAttr(parent, shapetext, idx, len, "color", color);
}
export function textModifyFontName(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, fontname: string | undefined) {
    return otTextSetAttr(parent, shapetext, idx, len, "fontName", fontname);
}
export function textModifyFontSize(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, fontsize: number | undefined) {
    return otTextSetAttr(parent, shapetext, idx, len, "fontSize", fontsize);
}

export function textModifyTextMask(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, maskid: string | undefined) {
    return otTextSetAttr(parent, shapetext, idx, len, "textMask", maskid);
}

export function textModifyGradient(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, gradient: Gradient | undefined) {
    return otTextSetAttr(parent, shapetext, idx, len, "gradient", gradient);
}

export function shapeModifyTextBehaviour(page: Page, shapetext: Text, textBehaviour: TextBehaviour) {
    const text = shapetext;
    if (textBehaviour === TextBehaviour.Flexible) {
        // default
        if (!text.attr || !text.attr.textBehaviour || text.attr.textBehaviour === TextBehaviour.Flexible) return;
    }
    // todo text 的layout 需要监听text 的变化
    if (!shapetext.attr) shapetext.attr = new TextAttr();
    return crdtSetAttr(shapetext.attr, "textBehaviour", textBehaviour);
}
export function shapeModifyTextVerAlign(shapetext: Text, verAlign: TextVerAlign) {
    const text = shapetext;
    if (verAlign === TextVerAlign.Top) {
        // default
        if (!text.attr || !text.attr.verAlign || text.attr.verAlign === TextVerAlign.Top) return;
    }
    if (!shapetext.attr) shapetext.attr = new TextAttr();
    return crdtSetAttr(shapetext.attr, "verAlign", verAlign);
}
export function textModifyHorAlign(parent: ShapeView | Variable, shapetext: Text, horAlign: TextHorAlign, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "alignment", horAlign);
}
export function shapeModifyTextDefaultHorAlign(shapetext: Text, horAlign: TextHorAlign) {
    const text = shapetext;
    if (horAlign === TextHorAlign.Left) {
        // default
        if (!text.attr || !text.attr.alignment || text.attr.alignment === TextHorAlign.Left) return;
    }
    if (!shapetext.attr) shapetext.attr = new TextAttr();
    if (shapetext.attr.alignment !== horAlign) {
        return crdtSetAttr(shapetext.attr, "alignment", horAlign);
    }
}
export function textModifyAutoLineHeight(parent: ShapeView | Variable, shapetext: Text, autoLineheight: boolean, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "autoLineHeight", autoLineheight);
}
export function textModifyMinLineHeight(parent: ShapeView | Variable, shapetext: Text, minLineheight: number | undefined, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "minimumLineHeight", minLineheight);
}
export function textModifyMaxLineHeight(parent: ShapeView | Variable, shapetext: Text, maxLineheight: number | undefined, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "maximumLineHeight", maxLineheight);
}
export function textModifyParaKerning(parent: ShapeView | Variable, shapetext: Text, kerning: number | undefined, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "kerning", kerning);
}
export function textModifySpanKerning(parent: ShapeView | Variable, shapetext: Text, kerning: number | undefined, index: number, len: number) {
    return otTextSetAttr(parent, shapetext, index, len, "kerning", kerning);
}
export function textModifyParaSpacing(parent: ShapeView | Variable, shapetext: Text, paraSpacing: number, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "paraSpacing", paraSpacing);
}
export function textModifyPaddingHor(parent: ShapeView | Variable, shapetext: Text, padding: { left: number, right: number }, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "padding", padding);
}

export function textModifyParaTextMask(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, maskid: string | undefined) {
    return otTextSetParaAttr(parent, shapetext, idx, len, "textMask", maskid);
}

export function textModifySpanTransfrom(parent: ShapeView | Variable, shapetext: Text, transform: TextTransformType | undefined, index: number, len: number) {
    // 句属性
    return otTextSetAttr(parent, shapetext, index, len, "transform", transform);
}
export function textModifyParaTransfrom(parent: ShapeView | Variable, shapetext: Text, transform: TextTransformType | undefined, index: number, len: number) {
    // 段落属性
    return otTextSetParaAttr(parent, shapetext, index, len, "transform", transform);
}
export function shapeModifyTextTransform(shapetext: Text, transform: TextTransformType | undefined) {
    if (!shapetext.attr) shapetext.attr = new TextAttr();
    return crdtSetAttr(shapetext.attr, "transform", transform);
}

export function textModifyHighlightColor(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, color: Color | undefined) {
    return otTextSetAttr(parent, shapetext, idx, len, "highlight", color);
}
export function textModifyUnderline(parent: ShapeView | Variable, shapetext: Text, underline: UnderlineType | undefined, index: number, len: number) {
    return otTextSetAttr(parent, shapetext, index, len, "underline", underline);
}
export function textModifyStrikethrough(parent: ShapeView | Variable, shapetext: Text, strikethrough: StrikethroughType | undefined, index: number, len: number) {
    return otTextSetAttr(parent, shapetext, index, len, "strikethrough", strikethrough);
}
export function textModifyWeight(parent: ShapeView | Variable, shapetext: Text, weight: number, index: number, len: number) {
    return otTextSetAttr(parent, shapetext, index, len, "weight", weight);
}
export function textModifyItalic(parent: ShapeView | Variable, shapetext: Text, italic: boolean, index: number, len: number) {
    return otTextSetAttr(parent, shapetext, index, len, "italic", italic);
}
export function textModifyFillType(parent: ShapeView | Variable, shapetext: Text, idx: number, len: number, fillType: FillType) {
    return otTextSetAttr(parent, shapetext, idx, len, "fillType", fillType);
}

export function textModifyBulletNumbersType(parent: ShapeView | Variable, shapetext: Text, type: BulletNumbersType, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "bulletNumbersType", type);
}

export function textModifyBulletNumbersStart(parent: ShapeView | Variable, shapetext: Text, start: number, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "bulletNumbersStart", start);
}

export function textModifyBulletNumbersBehavior(parent: ShapeView | Variable, shapetext: Text, behavior: BulletNumbersBehavior, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "bulletNumbersBehavior", behavior);
}

export function textModifyParaIndent(parent: ShapeView | Variable, shapetext: Text, indent: number | undefined, index: number, len: number) {
    return otTextSetParaAttr(parent, shapetext, index, len, "indent", indent);
}
