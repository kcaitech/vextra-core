/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { Para, ParaAttr, Span, Text, TextAttr, TextTransformType } from "../../../data/text/text";
import { importColor } from "./styleio";
import * as types from "../../../data/classes"
import { BasicArray } from "../../../data/basic";
import { IJSON } from "./basic";

function importHorzAlignment(align: number) {
    return [types.TextHorAlign.Left,
    types.TextHorAlign.Right,
    types.TextHorAlign.Centered,
    types.TextHorAlign.Justified,
    types.TextHorAlign.Natural][align] ?? types.TextHorAlign.Left;
}
function importVertAlignment(align: number) {
    return [types.TextVerAlign.Top,
    types.TextVerAlign.Middle,
    types.TextVerAlign.Bottom][align] ?? types.TextVerAlign.Top;
}

export function importText(data: IJSON, textStyle: IJSON): Text {

    let text: string = data["string"] || "";
    if (text[text.length - 1] != '\n') {
        text = text + "\n"; // attr也要修正
    }
    let index = 0;
    const attributes = data["attributes"] || [];
    const paras = new BasicArray<Para>();

    let attrIdx = 0;

    while (index < text.length) {

        const end = text.indexOf('\n', index) + 1;
        const ptext = text.substring(index, end);
        const paraAttr: ParaAttr = new ParaAttr(); // todo
        const spans = new BasicArray<Span>();

        let spanIndex = index;
        while (attrIdx < attributes.length && spanIndex < end) {
            const attr: IJSON = attributes[attrIdx];
            const location: number = attr['location'];
            const length: number = attr['length'];
            const attrAttr = attr['attributes'];
            const font: IJSON = attrAttr && attrAttr['MSAttributedStringFontAttribute'] && attrAttr['MSAttributedStringFontAttribute']['attributes'];
            const color: IJSON = attrAttr && attrAttr['MSAttributedStringColorAttribute'];
            const transfrom = attrAttr && attrAttr['MSAttributedStringTextTransformAttribute'];
            const kerning = attrAttr && attrAttr['kerning'];

            let len = Math.min(location + length - spanIndex, end - spanIndex);

            if (attrIdx == attributes.length - 1) {
                len = end - spanIndex;
            }

            const span = new Span(len);
            span.kerning = kerning;
            span.transform = ((t) => {
                switch (t) {
                    case 1: return TextTransformType.Uppercase;
                    case 2: return TextTransformType.Lowercase;
                }
            })(transfrom);
            span.fontName = fontName(font);
            span.fontSize = font['size'];
            span.color = color && importColor(color)
            const weight = fontWeight(font);
            span.weight = weight?.weight;
            span.italic = weight?.italic;
            spans.push(span);

            spanIndex = spanIndex + len;
            if (spanIndex >= location + length) {
                attrIdx = attrIdx + 1;
            }

            const pAttr = attrAttr && attrAttr["paragraphStyle"];
            if (pAttr) {
                paraAttr.paraSpacing = pAttr["paragraphSpacing"] || 0;
                paraAttr.alignment = importHorzAlignment(pAttr["alignment"]);
                // paraAttr.allowsDefaultTighteningForTruncation = pAttr["allowsDefaultTighteningForTruncation"] || 0;
                paraAttr.maximumLineHeight = pAttr["maximumLineHeight"] || Number.MAX_VALUE;
                paraAttr.minimumLineHeight = pAttr["minimumLineHeight"] || 0;
                // paraAttr.kerning = kerning || 0;
            }
        }

        index = end;
        const para = new Para(ptext, spans);
        para.attr = paraAttr;
        paras.push(para);
    }

    const textAttr: TextAttr = new TextAttr();
    if (textStyle) {
        const styAttr = textStyle['encodedAttributes'];
        const styParaAttr = styAttr['paragraphStyle'];
        // textAttr.verticalAlignment = importVertAlignment(textStyle['verticalAlignment']);
        if (styParaAttr) {
            textAttr.alignment = importHorzAlignment(styParaAttr['alignment']);
            // textAttr.allowsDefaultTighteningForTruncation = styParaAttr['allowsDefaultTighteningForTruncation'];
            textAttr.minimumLineHeight = styParaAttr['minimumLineHeight'];
            textAttr.maximumLineHeight = styParaAttr['maximumLineHeight'];
        }
        // const font:IJSON = styAttr['MSAttributedStringFontAttribute'] && styAttr['MSAttributedStringFontAttribute']['attributes'];
        // const color:IJSON = styAttr['MSAttributedStringColorAttribute'];
        // defaultAttr.fontName = font['name'];
    }

    const ret = new Text(paras);
    ret.attr = textAttr;
    return ret;
}


function fontName(font: IJSON) {
    if (!font['name']) return;
    const newName = font['name'].replace(/-BoldItalic|-BlackItalic|-Thin|-Light|-ExtraLight|-SemiBold|-Black|-Italic|-Bold|-Medium|-ExtraBold|-Regular/i, "");
    return newName;
}

function fontWeight(font: IJSON) {
    if (!font['name']) return;
    const reg = RegExp(/BoldItalic|BlackItalic|ExtraBold|Thin|ExtraLight|SemiBold|Black|Italic|Bold|Medium|Light|Regular/i);
    const weight = font['name'].match(reg);
    if(!weight) return;
    switch (weight[0]) {
        case 'Regular':
            return { weight: 400, italic: false };
        case 'Light':
            return { weight: 300, italic: false };
        case 'Bold':
            return { weight: 700, italic: false };
        case 'Thin':
            return { weight: 100, italic: false };
        case 'ExtraLight':
            return { weight: 200, italic: false };
        case 'Medium':
            return { weight: 500, italic: false };
        case 'SemiBold':
            return { weight: 600, italic: false };
        case 'ExtraBold':
            return { weight: 800, italic: false };
        case 'Black':
            return { weight: 900, italic: false };
        case 'Italic':
            return { weight: 400, italic: true };
        case 'BoldItalic':
            return { weight: 700, italic: true };
        case 'BlackItalic':
            return { weight: 900, italic: true };
        default:
            return { weight: 400, italic: false };
    }
}