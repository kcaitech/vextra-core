/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// 文本编辑时的增量排版

import { Text } from "./text";
import { BulletNumbersLayout, TextLayout, fixLineHorAlign, layoutPara } from "./textlayout";
import { ShapeFrame, ShapeSize, TextBehaviour, TextHorAlign, TextVerAlign } from "../typesdefine";

export function layoutAtInsert(text: Text,
    frame: ShapeSize,
    index: number,
    len: number,
    layout: TextLayout): TextLayout {
    if (len <= 0) return layout;

    const layoutWidth = ((b: TextBehaviour) => {
        switch (b) {
            case TextBehaviour.Flexible: return Number.MAX_VALUE;
            case TextBehaviour.Fixed: return frame.width;
            case TextBehaviour.FixWidthAndHeight: return frame.width;
        }
        // return Number.MAX_VALUE
    })(text.attr?.textBehaviour ?? TextBehaviour.Flexible)

    const padding = text.attr?.padding;
    const paddingLeft = padding?.left ?? 0;
    const paddingTop = padding?.top ?? 0;
    const paddingRight = padding?.right ?? 0;
    const paddingBottom = padding?.bottom ?? 0;
    const coreLayoutWidth = layoutWidth - paddingLeft - paddingRight;

    // 找到对应段
    const paras = text.paras;
    const parascount = paras.length;
    const parasLayout = layout.paras;
    let contentHeight = 0;
    let contentWidth = 0;
    let i = 0;
    const preBulletNumbers: BulletNumbersLayout[] = [];
    for (let len2 = parasLayout.length; i < parascount && i < len2; i++) {
        const para = paras[i];
        const paraLayout = parasLayout[i];
        if (index < paraLayout.charCount) break;
        if (para.length !== paraLayout.charCount) throw new Error("layout and data Not match 1") // 这是正常的，比如一个emoji占用两个字符
        index -= paraLayout.charCount;
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        if (paraLayout.bulletNumbers) preBulletNumbers.push(paraLayout.bulletNumbers);
        paraLayout.xOffset = 0;
    }

    // todo 先做到段落重排
    const needUpdateCount = paras.length - parasLayout.length + 1;
    for (let j = 0; i < parascount && j < needUpdateCount; j++, i++) {
        const para = paras[i];
        const paraLayout = layoutPara(text, para, coreLayoutWidth, preBulletNumbers);
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        if (j === 0) {
            parasLayout.splice(i, 1, paraLayout);
        } else {
            parasLayout.splice(i, 0, paraLayout);
        }
    }

    // 继续更新para
    for (let len2 = parasLayout.length; i < parascount && i < len2; i++) {
        const para = paras[i];
        const paraLayout = parasLayout[i];
        if (para.length !== paraLayout.charCount) throw new Error("layout and data Not match 2")
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        paraLayout.xOffset = 0;
    }

    if (parascount !== parasLayout.length) throw new Error("layout and data Not match 3")

    // hor align
    const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    const alignWidth = textBehaviour === TextBehaviour.Flexible ? contentWidth : coreLayoutWidth;
    let alignX = Number.MAX_SAFE_INTEGER;
    for (let i = 0, pc = text.paras.length; i < pc; i++) {
        const para = text.paras[i];
        const paraLayout = parasLayout[i];
        const alignment = para.attr?.alignment ?? TextHorAlign.Left;
        for (let li = 0, llen = paraLayout.length; li < llen; li++) {
            const line = paraLayout[li];
            fixLineHorAlign(line, alignment, alignWidth);
        }
        if (textBehaviour === TextBehaviour.Flexible) switch (alignment) {
            case TextHorAlign.Centered:
                alignX = Math.min(alignX, -(paraLayout.paraWidth - frame.width) / 2);
                break;
            case TextHorAlign.Left:
            case TextHorAlign.Natural:
                alignX = Math.min(alignX, 0);
                break;
            case TextHorAlign.Justified:
            case TextHorAlign.Right:
                alignX = Math.min(alignX, -(paraLayout.paraWidth - frame.width));
                break;
        }
    }

    const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
    const yOffset: number = ((align: TextVerAlign) => {
        switch (align) {
            case TextVerAlign.Top: return paddingTop;
            case TextVerAlign.Middle: return (frame.height - contentHeight - paddingTop - paddingBottom) / 2;
            case TextVerAlign.Bottom: return frame.height - contentHeight - paddingBottom;
        }
    })(vAlign);
    layout.alignX = alignX === Number.MAX_SAFE_INTEGER ? 0 : alignX;
    layout.xOffset = paddingLeft;
    layout.yOffset = yOffset;
    layout.contentHeight = contentHeight;
    layout.contentWidth = contentWidth;
    // debug
    // {
    //     let text = '';
    //     layout.paras.forEach((p) => p.forEach((l) => l.forEach((gr) => gr.forEach((g) => text += g.char))))
    //     console.log("text insert layout", text)
    // }
    return layout;
}

export function layoutAtDelete(text: Text,
    frame: ShapeSize,
    index: number,
    len: number,
    layout: TextLayout): TextLayout {
    if (len <= 0) return layout;

    const layoutWidth = ((b: TextBehaviour) => {
        switch (b) {
            case TextBehaviour.Flexible: return Number.MAX_VALUE;
            case TextBehaviour.Fixed: return frame.width;
            case TextBehaviour.FixWidthAndHeight: return frame.width;
        }
        // return Number.MAX_VALUE
    })(text.attr?.textBehaviour ?? TextBehaviour.Flexible)

    const padding = text.attr?.padding;
    const paddingLeft = padding?.left ?? 0;
    const paddingTop = padding?.top ?? 0;
    const paddingRight = padding?.right ?? 0;
    const paddingBottom = padding?.bottom ?? 0;
    const coreLayoutWidth = layoutWidth - paddingLeft - paddingRight;

    // 找到对应段
    const paras = text.paras;
    const parascount = paras.length;
    const parasLayout = layout.paras;
    let contentHeight = 0;
    let contentWidth = 0;
    let i = 0;
    const preBulletNumbers: BulletNumbersLayout[] = [];
    for (let len2 = parasLayout.length; i < parascount && i < len2; i++) {
        const para = paras[i];
        const paraLayout = parasLayout[i];
        if (index < paraLayout.charCount) break;
        if (para.length !== paraLayout.charCount) throw new Error("layout and data Not match 4")
        index -= paraLayout.charCount;
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        if (paraLayout.bulletNumbers) preBulletNumbers.push(paraLayout.bulletNumbers);
        paraLayout.xOffset = 0;
    }

    // todo 先做到段落重排
    const needUpdateCount = parasLayout.length - paras.length + 1;
    if (i < parascount && needUpdateCount > 0) {
        const para = paras[i];
        const paraLayout = layoutPara(text, para, coreLayoutWidth, preBulletNumbers);
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        parasLayout.splice(i, 1, paraLayout);
        i++;
        for (let j = 1; j < needUpdateCount; j++) {
            parasLayout.splice(i, 1);
        }
    }

    // 继续更新para
    for (let len2 = parasLayout.length; i < parascount && i < len2; i++) {
        const para = paras[i];
        const paraLayout = parasLayout[i];
        if (para.length !== paraLayout.charCount) throw new Error("layout and data Not match 5")
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        paraLayout.xOffset = 0;
    }

    if (parascount !== parasLayout.length) throw new Error("layout and data Not match 6")

    // hor align
    const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    const alignWidth = textBehaviour === TextBehaviour.Flexible ? contentWidth : coreLayoutWidth;
    let alignX = Number.MAX_SAFE_INTEGER;
    for (let i = 0, pc = text.paras.length; i < pc; i++) {
        const para = text.paras[i];
        const paraLayout = parasLayout[i];
        const alignment = para.attr?.alignment ?? TextHorAlign.Left;
        for (let li = 0, llen = paraLayout.length; li < llen; li++) {
            const line = paraLayout[li];
            fixLineHorAlign(line, alignment, alignWidth);
        }
        if (textBehaviour === TextBehaviour.Flexible) switch (alignment) {
            case TextHorAlign.Centered:
                alignX = Math.min(alignX, -(paraLayout.paraWidth - frame.width) / 2);
                break;
            case TextHorAlign.Left:
            case TextHorAlign.Natural:
                alignX = Math.min(alignX, 0);
                break;
            case TextHorAlign.Justified:
            case TextHorAlign.Right:
                alignX = Math.min(alignX, -(paraLayout.paraWidth - frame.width));
                break;
        }
    }

    const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
    const yOffset: number = ((align: TextVerAlign) => {
        switch (align) {
            case TextVerAlign.Top: return paddingTop;
            case TextVerAlign.Middle: return (frame.height - contentHeight - paddingTop - paddingBottom) / 2;
            case TextVerAlign.Bottom: return frame.height - contentHeight - paddingBottom;
        }
    })(vAlign);
    layout.alignX = alignX === Number.MAX_SAFE_INTEGER ? 0 : alignX;
    layout.xOffset = paddingLeft;
    layout.yOffset = yOffset;
    layout.contentHeight = contentHeight;
    layout.contentWidth = contentWidth;
    // debug
    // {
    //     let text = '';
    //     layout.paras.forEach((p) => p.forEach((l) => l.forEach((gr) => gr.forEach((g) => text += g.char))))
    //     console.log("text delete layout", text)
    // }
    return layout;
}

export function layoutAtFormat(text: Text,
    frame: ShapeSize,
    index: number,
    len: number,
    layout: TextLayout): TextLayout {
    if (len <= 0) return layout;

    const layoutWidth = ((b: TextBehaviour) => {
        switch (b) {
            case TextBehaviour.Flexible: return Number.MAX_VALUE;
            case TextBehaviour.Fixed: return frame.width;
            case TextBehaviour.FixWidthAndHeight: return frame.width;
        }
        // return Number.MAX_VALUE
    })(text.attr?.textBehaviour ?? TextBehaviour.Flexible)

    const padding = text.attr?.padding;
    const paddingLeft = padding?.left ?? 0;
    const paddingTop = padding?.top ?? 0;
    const paddingRight = padding?.right ?? 0;
    const paddingBottom = padding?.bottom ?? 0;
    const coreLayoutWidth = layoutWidth - paddingLeft - paddingRight;

    // 找到对应段
    const paras = text.paras;
    const parascount = paras.length;
    const parasLayout = layout.paras;
    let contentHeight = 0;
    let contentWidth = 0;
    let i = 0;
    const preBulletNumbers: BulletNumbersLayout[] = [];
    for (let len2 = parasLayout.length; i < parascount && i < len2; i++) {
        const para = paras[i];
        const paraLayout = parasLayout[i];
        if (index < paraLayout.charCount) break;
        if (para.length !== paraLayout.charCount) throw new Error("layout and data Not match 7")
        index -= paraLayout.charCount;
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        if (paraLayout.bulletNumbers) preBulletNumbers.push(paraLayout.bulletNumbers);
        paraLayout.xOffset = 0;
    }

    // todo 先做到段落重排
    // const needUpdateCount = parasLayout.length - paras.length + 1;
    len += index;
    for (let len2 = parasLayout.length; len >= 0 && i < parascount && i < len2; i++) {
        const para = paras[i];
        const paraLayout = layoutPara(text, para, coreLayoutWidth, preBulletNumbers);
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        parasLayout.splice(i, 1, paraLayout);
        len -= para.length;
    }

    // 继续更新para
    for (let len2 = parasLayout.length; i < parascount && i < len2; i++) {
        const para = paras[i];
        const paraLayout = parasLayout[i];
        if (para.length !== paraLayout.charCount) throw new Error("layout and data Not match 8")
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        paraLayout.xOffset = 0;
    }

    if (parascount !== parasLayout.length) throw new Error("layout and data Not match 9")

    // hor align
    const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    const alignWidth = textBehaviour === TextBehaviour.Flexible ? contentWidth : coreLayoutWidth;
    let alignX = Number.MAX_SAFE_INTEGER;
    for (let i = 0, pc = text.paras.length; i < pc; i++) {
        const para = text.paras[i];
        const paraLayout = parasLayout[i];
        const alignment = para.attr?.alignment ?? TextHorAlign.Left;
        for (let li = 0, llen = paraLayout.length; li < llen; li++) {
            const line = paraLayout[li];
            fixLineHorAlign(line, alignment, alignWidth);
        }
        if (textBehaviour === TextBehaviour.Flexible) switch (alignment) {
            case TextHorAlign.Centered:
                alignX = Math.min(alignX, -(paraLayout.paraWidth - frame.width) / 2);
                break;
            case TextHorAlign.Left:
            case TextHorAlign.Natural:
                alignX = Math.min(alignX, 0);
                break;
            case TextHorAlign.Justified:
            case TextHorAlign.Right:
                alignX = Math.min(alignX, -(paraLayout.paraWidth - frame.width));
                break;
        }
    }

    const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
    const yOffset: number = ((align: TextVerAlign) => {
        switch (align) {
            case TextVerAlign.Top: return paddingTop;
            case TextVerAlign.Middle: return (frame.height - contentHeight - paddingTop - paddingBottom) / 2;
            case TextVerAlign.Bottom: return frame.height - contentHeight - paddingBottom;
        }
    })(vAlign);
    layout.alignX = alignX === Number.MAX_SAFE_INTEGER ? 0 : alignX;
    layout.xOffset = paddingLeft;
    layout.yOffset = yOffset;
    layout.contentHeight = contentHeight;
    layout.contentWidth = contentWidth;
    return layout;
}