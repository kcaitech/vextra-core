import {BulletNumbers, Para, ParaAttr, Span, Text, TextAttr, TextTransformType} from "../../../data/text";
import {importColor} from "./common";
import * as types from "../../../data/classes"
import {FillType} from "../../../data/classes"
import {BasicArray} from "../../../data/basic";
import {IJSON} from "./basic";
import {mergeSpanAttr} from "../../../data/textutils";
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

export function importText(data: IJSON, textStyle: IJSON): Text {

    // 默认字体颜色
    const fillPaints = textStyle.fillPaints;
    const fillPaint = fillPaints && fillPaints[0];
    const fontColor = fillPaint && importColor(fillPaint.color, fillPaint.opacity);
    const gradient = parseGradient(fillPaint, textStyle.size);
    const fontSize = textStyle.fontSize;
    const letterSpacingValue = textStyle.letterSpacing?.value || 0;
    /**
     family: "Inter"
     postscript: ""
     style: "Regular"
     */
    const font = textStyle.fontName;
    const fontName = font?.family;
    const weight = fontWeightMap[font?.style];
    /**
     units: "PERCENT" "PIXELS"
     value: 100
     */
    const lineHeight = textStyle.lineHeight;

    // 默认字体边框
    // const strokePaints = data.strokePaints; // 还不支持

    const alignment = textStyle.textAlignHorizontal && importHorzAlignment(textStyle.textAlignHorizontal);
    const verAlign = textStyle.textAlignVertical && importVertAlignment(textStyle.textAlignVertical);

    // "UNDERLINE" "STRIKETHROUGH"
    const textDecoration = textStyle.textDecoration;

    const transform = importTransform(textStyle.textCase);

    const paragraphSpacing = textStyle.paragraphSpacing;
    const listSpacing = textStyle.listSpacing;

    let text: string = data["characters"] || "";
    if (text[text.length - 1] != '\n') {
        text = text + "\n"; // attr也要修正
    }
    const lines = data['lines']; // 段落
    const styleOverrideTable = ((styleOverrideTable: any[]) => {
        const t = {} as { [key: number]: any };
        styleOverrideTable.forEach(s => {
            t[s.styleID] = s;
        })
        return t;
    })(data.styleOverrideTable || []);
    let index = 0;
    const characterStyleIDs = (data["characterStyleIDs"] || {}) as { [key: number]: number | undefined };
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
            span.kerning = letterSpacingValue;
            if (textDecoration === 'STRIKETHROUGH') span.strikethrough = types.StrikethroughType.Single;
            else if (textDecoration === 'UNDERLINE') span.underline = types.UnderlineType.Single;

            if (transform) span.transform = transform;

            if (spanattr) {
                const fillPaints = spanattr.fillPaints;
                const fillPaint = fillPaints && fillPaints[0];
                const fontColor = fillPaint && importColor(fillPaint.color, fillPaint.opacity);
                const gradient = parseGradient(fillPaint, spanattr.size);
                if (fontColor) span.color = fontColor;
                if (gradient) {
                    span.gradient = gradient;
                    span.fillType = FillType.Gradient;
                }
                const fontSize = spanattr.fontSize;
                const font = spanattr.fontName;
                const fontName = font?.family;
                const weight = fontWeightMap[font?.style];
                if (fontSize) span.fontSize = fontSize;
                if (weight) span.weight = weight;
                if (fontName) span.fontName = fontName;

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

        if (lineHeight && fontSize) {
            const value = lineHeight.value;
            if (lineHeight.units === 'PERCENT') {
                const v = Math.round(fontSize * 1.35 * value / 100);
                paraAttr.maximumLineHeight = v;
                paraAttr.minimumLineHeight = v;
            } else if (lineHeight.units === 'PIXELS') {
                paraAttr.maximumLineHeight = value;
                paraAttr.minimumLineHeight = value;
            }
        }
        if (alignment && alignment !== types.TextHorAlign.Left) paraAttr.alignment = alignment;
        if (paragraphSpacing !== undefined && fontSize !== undefined) {
            if (lineHeight.units === 'PERCENT') {
                paraAttr.paraSpacing = paragraphSpacing
            } else if (lineHeight.units === 'PIXELS') {
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

            if (listSpacing !== undefined && fontSize !== undefined) {
                if (lineHeight.units === 'PERCENT') {
                    paraAttr.paraSpacing = listSpacing
                } else if (lineHeight.units === 'PIXELS') {
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
            if (paragraphSpacing !== undefined && fontSize !== undefined) {
                if (lineHeight.units === 'PERCENT') {
                    paraAttr.paraSpacing = paragraphSpacing
                } else if (lineHeight.units === 'PIXELS') {
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

    const ret = new Text(paras);
    ret.attr = textAttr;
    return ret;
}
