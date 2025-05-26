/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    BulletNumbers,
    Para,
    ParaAttr,
    Span,
    Text,
    TextAttr,
    TextBehaviour,
    TextTransformType
} from "../../../data/text/text";
import {importColor} from "./common";
import * as types from "../../../data/classes"
import {FillType} from "../../../data"
import {BasicArray} from "../../../data";
import {IJSON} from "./basic";
import {mergeSpanAttr} from "../../../data/text/textutils";
import {parseGradient} from "./shapeio";

function importHorzAlignment(align: string) {
    switch (align) {
        case "RIGHT":
            return types.TextHorAlign.Right;
        case "CENTER":
            return types.TextHorAlign.Centered;
        case "JUSTIFIED":
            return types.TextHorAlign.Justified;
        default:
            return types.TextHorAlign.Left;
    }
}

function importVertAlignment(align: string) {
    switch (align) {
        case 'TOP':
            return types.TextVerAlign.Top;
        case "CENTER":
            return types.TextVerAlign.Middle;
        case 'BOTTOM':
            return types.TextVerAlign.Bottom;
        default:
            return types.TextVerAlign.Top;
    }
}

const fontWeightMap: { [key: string]: number } = {
    "Regular": 400,
    "Bold": 700,
    "Black": 900,
    "Medium": 500,
    "Semi Bold": 600,
    "Extra Bold": 800,
    "Light": 300,
    "Extra Light": 200,
    "Thin": 100,
}

function importTransform(textCase: string) {
    switch (textCase) {
        case "UPPER":
            return TextTransformType.Uppercase;
        case "LOWER":
            return TextTransformType.Lowercase;
        case "TITLE":
            return TextTransformType.UppercaseFirst;
        case "ORIGINAL":
            console.warn("unsupport ORIGINAL transform");
            return;
    }
}

export function importText(data: IJSON): Text {
    const textData = data.textData;

    // 默认字体颜色
    const fillPaints = data.fillPaints as IJSON[] | undefined;
    const fillPaint = fillPaints && fillPaints[0];
    const fontColor = fillPaint && importColor(fillPaint.color, fillPaint.opacity);
    const gradient = fillPaint && parseGradient(fillPaint, data.size);
    const fontSize = data.fontSize;
    const letterSpacing = data.letterSpacing;
    /**
     family: "Inter"
     postscript: ""
     style: "Regular"
     */
    const font = data.fontName;
    const fontName = font?.family;
    const weight = fontWeightMap[font?.style];
    /**
     units: "PERCENT" "PIXELS"
     value: 100
     */
    const lineHeight = data.lineHeight;

    // 默认字体边框
    // const strokePaints = data.strokePaints; // 还不支持

    const alignment = data.textAlignHorizontal && importHorzAlignment(data.textAlignHorizontal);
    const verAlign = data.textAlignVertical && importVertAlignment(data.textAlignVertical);

    // "UNDERLINE" "STRIKETHROUGH"
    const textDecoration = data.textDecoration;

    const transform = importTransform(data.textCase);

    const paragraphSpacing = data.paragraphSpacing;
    const listSpacing = data.listSpacing;

    const textAutoResize = data.textAutoResize;

    let text: string = textData["characters"] || "";
    if (text[text.length - 1] != '\n') {
        text = text + "\n"; // attr也要修正
    }
    const lines = textData['lines']; // 段落
    const styleOverrideTable = ((styleOverrideTable: any[]) => {
        const t = {} as { [key: number]: any };
        styleOverrideTable.forEach(s => {
            t[s.styleID] = s;
        })
        return t;
    })(textData.styleOverrideTable || []);
    let index = 0;
    const characterStyleIDs = (textData["characterStyleIDs"] || {}) as { [key: number]: number | undefined };
    const paras = new BasicArray<Para>();

    // let attrIdx = 0;

    while (index < text.length) {

        const end = text.indexOf('\n', index) + 1;
        let ptext = text.substring(index, end);
        const paraAttr: ParaAttr = new ParaAttr(); // todo
        const spans = new BasicArray<Span>();

        let spanIndex = index;
        while (spanIndex < end) {
            const styleId = characterStyleIDs[spanIndex];
            let spanEnd = spanIndex + 1;
            while (spanEnd < end && styleId === characterStyleIDs[spanEnd]) ++spanEnd;
            const spanattr = styleId !== undefined && styleOverrideTable[styleId];
            const span = new Span(spanEnd - spanIndex);
            span.fontSize = fontSize;
            span.weight = weight;
            span.fontName = fontName;
            span.color = fontColor;
            if (gradient) {
                span.gradient = gradient;
                span.fillType = FillType.Gradient;
            }
            if (letterSpacing) {
                let value = letterSpacing.value;
                if (letterSpacing.units === 'PERCENT' && fontSize) value = Math.round(fontSize * 1.35 * value / 100);
                span.kerning = value;
            }
            if (textDecoration === 'STRIKETHROUGH') span.strikethrough = types.StrikethroughType.Single;
            else if (textDecoration === 'UNDERLINE') span.underline = types.UnderlineType.Single;

            if (transform) span.transform = transform;

            if (spanattr) {
                const fillPaints = spanattr.fillPaints;
                const fillPaint = fillPaints && fillPaints[0];
                const fontColor = fillPaint && importColor(fillPaint.color, fillPaint.opacity);
                const gradient = fillPaint && parseGradient(fillPaint, spanattr.size);
                if (fontColor) span.color = fontColor;
                if (gradient) {
                    span.gradient = gradient;
                    span.fillType = FillType.Gradient;
                }
                const fontSize1 = spanattr.fontSize;
                const font = spanattr.fontName;
                const fontName = font?.family;
                const weight = fontWeightMap[font?.style];
                if (fontSize1) span.fontSize = fontSize1;
                if (weight) span.weight = weight;
                if (fontName) span.fontName = fontName;

                const fontSize2 = fontSize1 || fontSize;
                const lineHeight = spanattr.lineHeight;
                if (lineHeight) {
                    const value = lineHeight.value;
                    if (lineHeight.units === 'PERCENT' && fontSize2) {
                        const v = Math.round(fontSize2 * 1.35 * value / 100);
                        paraAttr.maximumLineHeight = v;
                        paraAttr.minimumLineHeight = v;
                    } else if (lineHeight.units === 'PIXELS') {
                        paraAttr.maximumLineHeight = value;
                        paraAttr.minimumLineHeight = value;
                    }
                }

                const letterSpacing = spanattr.letterSpacing;
                if (letterSpacing) {
                    let value = letterSpacing.value;
                    if (letterSpacing.units === 'PERCENT' && fontSize2) value = Math.round(fontSize2 * 1.35 * value / 100);
                    span.kerning = value;
                }

                const transform = importTransform(spanattr.textCase);
                if (transform) span.transform = transform;

                const textDecoration = spanattr.textDecoration;
                if (textDecoration === 'STRIKETHROUGH') {
                    span.underline = undefined;
                    span.strikethrough = types.StrikethroughType.Single;
                } else if (textDecoration === 'UNDERLINE') {
                    span.strikethrough = undefined;
                    span.underline = types.UnderlineType.Single;
                }
            }

            spans.push(span);
            spanIndex = spanEnd;
        }

        if (lineHeight && !paraAttr.maximumLineHeight && !paraAttr.minimumLineHeight) {
            const value = lineHeight.value;
            if (lineHeight.units === 'PERCENT' && fontSize) {
                const v = Math.round(fontSize * 1.35 * value / 100);
                paraAttr.maximumLineHeight = v;
                paraAttr.minimumLineHeight = v;
            } else if (lineHeight.units === 'PIXELS') {
                paraAttr.maximumLineHeight = value;
                paraAttr.minimumLineHeight = value;
            }
        }
        if (alignment && alignment !== types.TextHorAlign.Left) paraAttr.alignment = alignment;
        if (paragraphSpacing !== undefined) {
            if (lineHeight.units === 'PERCENT') {
                paraAttr.paraSpacing = paragraphSpacing
            } else if (lineHeight.units === 'PIXELS' && fontSize !== undefined) {
                paraAttr.paraSpacing = paragraphSpacing - fontSize;
            }
        }

        const line = lines[paras.length];

        if (line) {
            const indentationLevel = line.indentationLevel;
            if (indentationLevel) paraAttr.indent = indentationLevel - 1;
        }

        const lineType = line?.lineType;
        // "UNORDERED_LIST" "ORDERED_LIST" "PLAIN"
        if (line && (lineType === "UNORDERED_LIST" || lineType === "ORDERED_LIST")) {

            if (listSpacing !== undefined) {
                if (lineHeight.units === 'PERCENT') {
                    paraAttr.paraSpacing = listSpacing
                } else if (lineHeight.units === 'PIXELS' && fontSize !== undefined) {
                    paraAttr.paraSpacing = listSpacing - fontSize;
                }
            }
            const isFirstLineOfList = line.isFirstLineOfList;
            const listStartOffset = line.listStartOffset;

            ptext = '*' + ptext;

            const span = new Span(1);
            if (spans.length > 0) mergeSpanAttr(span, spans[0]);
            span.placeholder = true;
            spans.unshift(span);
            span.bulletNumbers = new BulletNumbers(lineType === "UNORDERED_LIST" ? types.BulletNumbersType.Disorded : types.BulletNumbersType.Ordered1Ai);
            if (isFirstLineOfList) span.bulletNumbers.behavior = types.BulletNumbersBehavior.Renew;
            if (listStartOffset) span.bulletNumbers.offset = listStartOffset;

        } else {
            if (paragraphSpacing !== undefined) {
                if (lineHeight.units === 'PERCENT') {
                    paraAttr.paraSpacing = paragraphSpacing
                } else if (lineHeight.units === 'PIXELS' && fontSize !== undefined) {
                    paraAttr.paraSpacing = paragraphSpacing - fontSize;
                }
            }
        }

        index = end;
        const para = new Para(ptext, spans);
        para.attr = paraAttr;
        paras.push(para);
    }

    const textAttr: TextAttr = new TextAttr();
    if (verAlign && verAlign !== types.TextVerAlign.Top) textAttr.verAlign = verAlign;

    textAttr.textBehaviour = ((textAutoResize: string) => {
        switch (textAutoResize) {
            case "HEIGHT":
                return TextBehaviour.Fixed;
            case "NONE":
                return TextBehaviour.Flexible;
            case "WIDTH_AND_HEIGHT":
                return TextBehaviour.FixWidthAndHeight;
            default:
                return TextBehaviour.Flexible;
        }
    })(textAutoResize);

    const ret = new Text(paras);
    ret.attr = textAttr;

    return ret;
}
