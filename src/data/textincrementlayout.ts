// 文本编辑时的增量排版

import { ParaAttrSetter, SpanAttrSetter, Text, TextBehaviour, TextHorAlign, TextVerAlign } from "./classes";
import { BulletNumbersLayout, TextLayout, fixLineHorAlign, layoutPara } from "./textlayout";

export function layoutAtInsert(text: Text,
    layoutWidth: number,
    layoutHeight: number,
    index: number,
    len: number,
    layout: TextLayout): TextLayout {
    if (len <= 0) return layout;
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
        if (index < paraLayout.graphCount) break;
        if (para.length !== paraLayout.graphCount) throw new Error("layout and data Not match")
        index -= paraLayout.graphCount;
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        if (paraLayout.bulletNumbers) preBulletNumbers.push(paraLayout.bulletNumbers);
    }

    // todo 先做到段落重排
    const needUpdateCount = paras.length - parasLayout.length + 1;
    for (let j = 0; i < parascount && j < needUpdateCount; j++, i++) {
        const para = paras[i];
        const paraLayout = layoutPara(text, para, layoutWidth, preBulletNumbers);
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
        if (para.length !== paraLayout.graphCount) throw new Error("layout and data Not match")
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
    }

    if (parascount !== parasLayout.length) throw new Error("layout and data Not match")

    // hor align
    const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    const alignWidth = textBehaviour === TextBehaviour.Flexible ? contentWidth : layoutWidth;
    for (let i = 0, pc = text.paras.length; i < pc; i++) {
        const para = text.paras[i];
        const paraLayout = parasLayout[i];
        const alignment = para.attr?.alignment ?? TextHorAlign.Left;
        for (let li = 0, llen = paraLayout.length; li < llen; li++) {
            const line = paraLayout[li];
            fixLineHorAlign(line, alignment, alignWidth);
        }
    }

    const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
    const yOffset: number = ((align: TextVerAlign) => {
        switch (align) {
            case TextVerAlign.Top: return 0;
            case TextVerAlign.Middle: return (layoutHeight - contentHeight) / 2;
            case TextVerAlign.Bottom: return layoutHeight - contentHeight;
        }
    })(vAlign);
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
    layoutWidth: number,
    layoutHeight: number,
    index: number,
    len: number,
    layout: TextLayout): TextLayout {
    if (len <= 0) return layout;
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
        if (index < paraLayout.graphCount) break;
        if (para.length !== paraLayout.graphCount) throw new Error("layout and data Not match")
        index -= paraLayout.graphCount;
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        if (paraLayout.bulletNumbers) preBulletNumbers.push(paraLayout.bulletNumbers);
    }

    // todo 先做到段落重排
    const needUpdateCount = parasLayout.length - paras.length + 1;
    if (i < parascount && needUpdateCount > 0) {
        const para = paras[i];
        const paraLayout = layoutPara(text, para, layoutWidth, preBulletNumbers);
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
        if (para.length !== paraLayout.graphCount) throw new Error("layout and data Not match")
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
    }

    if (parascount !== parasLayout.length) throw new Error("layout and data Not match")

    // hor align
    const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    const alignWidth = textBehaviour === TextBehaviour.Flexible ? contentWidth : layoutWidth;
    for (let i = 0, pc = text.paras.length; i < pc; i++) {
        const para = text.paras[i];
        const paraLayout = parasLayout[i];
        const alignment = para.attr?.alignment ?? TextHorAlign.Left;
        for (let li = 0, llen = paraLayout.length; li < llen; li++) {
            const line = paraLayout[li];
            fixLineHorAlign(line, alignment, alignWidth);
        }
    }

    const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
    const yOffset: number = ((align: TextVerAlign) => {
        switch (align) {
            case TextVerAlign.Top: return 0;
            case TextVerAlign.Middle: return (layoutHeight - contentHeight) / 2;
            case TextVerAlign.Bottom: return layoutHeight - contentHeight;
        }
    })(vAlign);
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
    layoutWidth: number,
    layoutHeight: number,
    index: number,
    len: number,
    layout: TextLayout,
    props: { attr?: SpanAttrSetter, paraAttr?: ParaAttrSetter }): TextLayout {
    if (len <= 0) return layout;
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
        if (index < paraLayout.graphCount) break;
        if (para.length !== paraLayout.graphCount) throw new Error("layout and data Not match")
        index -= paraLayout.graphCount;
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
        if (paraLayout.bulletNumbers) preBulletNumbers.push(paraLayout.bulletNumbers);
    }

    // todo 先做到段落重排
    // const needUpdateCount = parasLayout.length - paras.length + 1;
    len += index;
    for (let len2 = parasLayout.length; len >= 0 && i < parascount && i < len2; i++) {
        const para = paras[i];
        const paraLayout = layoutPara(text, para, layoutWidth, preBulletNumbers);
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
        if (para.length !== paraLayout.graphCount) throw new Error("layout and data Not match")
        if (i > 0) {
            const prePara = paras[i - 1];
            const paraSpacing = prePara.attr?.paraSpacing || 0;
            contentHeight += paraSpacing;
        }
        paraLayout.yOffset = contentHeight;
        contentHeight += paraLayout.paraHeight;
        contentWidth = Math.max(paraLayout.paraWidth, contentWidth);
    }

    if (parascount !== parasLayout.length) throw new Error("layout and data Not match")

    // hor align
    const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    const alignWidth = textBehaviour === TextBehaviour.Flexible ? contentWidth : layoutWidth;
    for (let i = 0, pc = text.paras.length; i < pc; i++) {
        const para = text.paras[i];
        const paraLayout = parasLayout[i];
        const alignment = para.attr?.alignment ?? TextHorAlign.Left;
        for (let li = 0, llen = paraLayout.length; li < llen; li++) {
            const line = paraLayout[li];
            fixLineHorAlign(line, alignment, alignWidth);
        }
    }

    const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
    const yOffset: number = ((align: TextVerAlign) => {
        switch (align) {
            case TextVerAlign.Top: return 0;
            case TextVerAlign.Middle: return (layoutHeight - contentHeight) / 2;
            case TextVerAlign.Bottom: return layoutHeight - contentHeight;
        }
    })(vAlign);
    layout.yOffset = yOffset;
    layout.contentHeight = contentHeight;
    layout.contentWidth = contentWidth;
    return layout;
}