/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// import { gradient_equals } from "../io/cilpboard";
import { importParaAttr, importTextAttr } from "../baseimport";
import { BasicArray } from "../basic";
import { Color } from "../color";
import { Gradient } from "../style";
import {
    Para,
    SpanAttr,
    ParaAttr,
    Text,
    TextAttr,
    Span,
    TextBehaviour,
    UnderlineType,
    StrikethroughType,
    BulletNumbers
} from "./text";
import { is_mac } from "../utils";

export const gradient_equals = (a: Gradient, b: Gradient) => {
    if (a.gradientType !== b.gradientType || a.elipseLength !== b.elipseLength || a.gradientOpacity !== b.gradientOpacity) {
        return false;
    }
    if (a.from.x !== b.from.x || a.from.y !== b.from.y || a.to.x !== b.to.x || a.to.y !== b.to.y) {
        return false;
    }
    if (a.stops.length !== b.stops.length) {
        return false;
    }
    for (let i = 0; i < a.stops.length; i++) {
        const stop1 = a.stops[i];
        const stop2 = b.stops[i];
        if (stop1.position !== stop2.position || !(stop1.color as Color).equals(stop2.color as Color)) {
            return false;
        }
    }
    return true;
}

export function isDiffSpanAttr(span: SpanAttr, attr: SpanAttr): boolean {
    if (attr.color) {
        if (!span.color) return true;
        if (!(attr.color.equals(span.color))) return true;
    } else if (span.color) {
        return true;
    }

    if (attr.highlight) {
        if (!span.highlight) return true;
        if (!(attr.highlight.equals(span.highlight))) return true;
    } else if (span.highlight) {
        return true;
    }

    if (attr.fontName !== span.fontName) {
        return true;
    }
    if (attr.fontSize !== span.fontSize) {
        return true;
    }
    if (attr.textMask !== span.textMask) {
        return true;
    }

    if (attr.weight !== span.weight) {
        return true;
    }
    if (!!attr.italic !== !!span.italic) {
        return true;
    }

    if (attr.underline !== span.underline) {
        return true;
    }
    if (attr.strikethrough !== span.strikethrough) {
        return true;
    }

    if (attr.kerning !== span.kerning) {
        return true;
    }

    if (attr.transform !== span.transform) {
        return true;
    }

    if (attr.bulletNumbers && !span.bulletNumbers || !attr.bulletNumbers && span.bulletNumbers) {
        return true;
    }
    if (attr.bulletNumbers && span.bulletNumbers) {
        if (attr.bulletNumbers.type !== span.bulletNumbers.type) return true;
        if (attr.bulletNumbers.offset !== span.bulletNumbers.offset) return true;
        if (attr.bulletNumbers.behavior !== span.bulletNumbers.behavior) return true;
    }

    if (!!attr.placeholder !== !!span.placeholder) {
        return true;
    }

    if (attr.fillType !== span.fillType) {
        return true;
    }

    if (attr.gradient) {
        if (!span.gradient) return true;
        if (!(gradient_equals(span.gradient, attr.gradient))) return true;
    } else if (span.gradient) {
        return true;
    }

    return false;
}

export function mergeSpanAttr(span: SpanAttr, attr: SpanAttr, isSetting?: boolean) {
    // const attrIsSetter = attr instanceof SpanAttrSetter || attr instanceof ParaAttrSetter;
    _mergeSpanAttr(span, attr, isSetting);
}

function _mergeSpanAttr(span: SpanAttr, attr: SpanAttr, isSetting?: boolean) {
    let changed = false;
    if (attr.color) {
        if (!span.color || !(attr.color.equals(span.color))) {
            span.color = new Color(attr.color.alpha, attr.color.red, attr.color.green, attr.color.blue)
            changed = true;
        }
    }

    if (attr.highlight) {
        if (!span.highlight || !(attr.highlight.equals(span.highlight))) {
            span.highlight = new Color(attr.highlight.alpha, attr.highlight.red, attr.highlight.green, attr.highlight.blue)
            changed = true;
        }
    }

    if (attr.fontName) {
        if (!span.fontName || attr.fontName !== span.fontName) {
            span.fontName = attr.fontName;
            changed = true;
        }
    }

    if (attr.fontSize) {
        if (!span.fontSize || attr.fontSize !== span.fontSize) {
            span.fontSize = attr.fontSize;
            changed = true;
        }
    }

    if (attr.textMask) {
        if (!span.textMask || attr.textMask !== span.textMask) {
            span.textMask = attr.textMask;
            changed = true;
        }
    }

    // weight
    if (attr.weight !== undefined) {
        if (!span.weight || span.weight !== attr.weight) {
            span.weight = attr.weight;
            changed = true;
        }
    }
    // italic
    if (attr.italic !== undefined) {
        if (!!span.italic !== attr.italic) {
            span.italic = attr.italic ? true : undefined;
            changed = true;
        }
    }
    // underline
    if (attr.underline) {
        const underline = attr.underline === UnderlineType.None ? undefined : attr.underline;
        if (underline !== span.underline) {
            span.underline = underline;
            changed = true;
        }
    }
    // strikethrough
    if (attr.strikethrough) {
        const strikethrough = attr.strikethrough === StrikethroughType.None ? undefined : attr.strikethrough;
        if (strikethrough !== span.strikethrough) {
            span.strikethrough = attr.strikethrough === StrikethroughType.None ? undefined : attr.strikethrough;
            changed = true;
        }
    }

    if (attr.kerning != undefined) {
        if (span.kerning == undefined || span.kerning !== attr.kerning) {
            span.kerning = attr.kerning;
            changed = true;
        }
    }

    if (attr.transform != undefined) {
        if (span.transform == undefined || span.transform !== attr.transform) {
            span.transform = attr.transform;
            changed = true;
        }
    }

    if (attr.placeholder && (isSetting)) { // placeholder属性不拷贝，仅在首次插入时设置
        if (!span.placeholder) {
            span.placeholder = true;
            changed = true;
        }
        if (attr.bulletNumbers) {
            if (!span.bulletNumbers) {
                span.bulletNumbers = new BulletNumbers(attr.bulletNumbers.type);
                changed = true;
            }
            if (attr.bulletNumbers.type !== span.bulletNumbers.type) {
                span.bulletNumbers.type = attr.bulletNumbers.type;
                changed = true;
            }
            if (attr.bulletNumbers.offset !== span.bulletNumbers.offset) {
                span.bulletNumbers.offset = attr.bulletNumbers.offset;
                changed = true;
            }
            if (attr.bulletNumbers.behavior !== span.bulletNumbers.behavior) {
                span.bulletNumbers.behavior = attr.bulletNumbers.behavior;
                changed = true;
            }
        }
    }

    if (attr.fillType) {
        if (!span.fillType || attr.fillType !== span.fillType) {
            span.fillType = attr.fillType;
            changed = true;
        }
    }

    if (attr.gradient) {
        if (!span.gradient || !(gradient_equals(span.gradient, attr.gradient))) {
            span.gradient = new Gradient(attr.gradient.from, attr.gradient.to, attr.gradient.gradientType, attr.gradient.stops, attr.gradient.elipseLength, attr.gradient.gradientOpacity)
            changed = true;
        }
    }

    return changed;
}

export function mergeParaAttr(para: Para | ParaAttr, attr: Para | ParaAttr): boolean {
    const _attr = attr instanceof ParaAttr ? attr : attr.attr;
    if (para instanceof Para) {
        if (!para.attr) {
            if (_attr) para.attr = importParaAttr(_attr); // deep clone
            return !!_attr;
        } else if (_attr) {
            return _mergeParaAttr(para.attr, _attr);
        }
    } else if (_attr) {
        return _mergeParaAttr(para, _attr);
    }
    return false;
}

function _mergeParaAttr(paraAttr: ParaAttr, attr: ParaAttr): boolean {
    // const attrIsSetter = attr instanceof ParaAttrSetter;
    let changed = false;
    changed = _mergeSpanAttr(paraAttr, attr);

    if (attr.autoLineHeight != undefined) {
        if (paraAttr.autoLineHeight == undefined || paraAttr.autoLineHeight !== attr.autoLineHeight) {
            paraAttr.autoLineHeight = attr.autoLineHeight;
            changed = true;
        }
    }

    if (attr.minimumLineHeight != undefined) {
        if (paraAttr.minimumLineHeight == undefined || paraAttr.minimumLineHeight !== attr.minimumLineHeight) {
            paraAttr.minimumLineHeight = attr.minimumLineHeight;
            changed = true;
        }
    }

    if (attr.maximumLineHeight != undefined) {
        if (paraAttr.maximumLineHeight == undefined || paraAttr.maximumLineHeight !== attr.maximumLineHeight) {
            paraAttr.maximumLineHeight = attr.maximumLineHeight;
            changed = true;
        }
    }

    if (attr.paraSpacing != undefined) {
        if (paraAttr.paraSpacing == undefined || paraAttr.paraSpacing !== attr.paraSpacing) {
            paraAttr.paraSpacing = attr.paraSpacing;
            changed = true;
        }
    }

    // alignment
    if (attr.alignment != undefined) {
        if (paraAttr.alignment == undefined || paraAttr.alignment !== attr.alignment) {
            paraAttr.alignment = attr.alignment;
            changed = true;
        }
    }

    if (attr.indent != undefined) {
        if (paraAttr.indent == undefined || paraAttr.indent !== attr.indent) {
            paraAttr.indent = attr.indent;
            changed = true;
        }
    }
    return changed;
}

export function mergeTextAttr(text: Text, attr: TextAttr) {
    if (!text.attr) {
        text.attr = importTextAttr(attr);
        return;
    }
    _mergeParaAttr(text.attr, attr);
    if (attr.verAlign) text.attr.verAlign = attr.verAlign;
    if (attr.orientation) text.attr.orientation = attr.orientation;
    if (attr.textBehaviour) text.attr.textBehaviour = attr.textBehaviour;
}

export function newText(textAttr?: TextAttr): Text {
    const text = new Text(new BasicArray());
    const para = new Para('\n', new BasicArray());
    para.attr = new ParaAttr();
    para.attr.autoLineHeight = true;
    text.paras.push(para);
    const span = new Span(para.length);
    span.fontName = is_mac() ? "PingFang SC" : "微软雅黑";
    span.fontSize = 14;
    span.color = new Color(1, 51, 51, 51);
    para.spans.push(span);
    if (textAttr) {
        mergeTextAttr(text, textAttr);
        mergeParaAttr(para, textAttr);
        mergeSpanAttr(span, textAttr);
    }
    return text;
}

export function newText2(textAttr?: TextAttr, paraAttr?: ParaAttr, spanAttr?: SpanAttr): Text {
    const text = new Text(new BasicArray());
    const para = new Para('\n', new BasicArray());
    para.attr = new ParaAttr();
    para.attr.autoLineHeight = true;
    text.paras.push(para);
    const span = new Span(para.length);
    span.fontName = is_mac() ? "PingFang SC" : "微软雅黑";
    span.fontSize = 14;
    span.color = new Color(0.85, 0, 0, 0);
    para.spans.push(span);
    if (textAttr) {
        mergeTextAttr(text, textAttr);
        mergeParaAttr(para, textAttr);
        mergeSpanAttr(span, textAttr);
    }
    if (paraAttr) {
        mergeParaAttr(para, paraAttr);
    }
    if (spanAttr) {
        mergeSpanAttr(span, spanAttr);
    }
    return text;
}

export function newTableCellText(textAttr?: TextAttr) {
    const _text = newText(textAttr);
    _text.setTextBehaviour(TextBehaviour.Fixed);
    _text.setPadding(5, 0, 3, 0);
    return _text;
}