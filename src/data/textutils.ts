import { importParaAttr, importTextAttr } from "../io/baseimport";
import { Color } from "./baseclasses";
import { Para, SpanAttr, ParaAttr, Text, TextAttr, SpanAttrSetter, ParaAttrSetter } from "./text";
import { isColorEqual } from "./utils";

export function isDiffSpanAttr(span: SpanAttr, attr: SpanAttr): boolean {
    if (attr.color) {
        if (!span.color) return true;
        if (!isColorEqual(attr.color, span.color)) return true;
    }
    else if (span.color) {
        return true;
    }

    if (attr.highlight) {
        if (!span.highlight) return true;
        if (!isColorEqual(attr.highlight, span.highlight)) return true;
    }
    else if (span.highlight) {
        return true;
    }

    if (attr.fontName !== span.fontName) {
        return true;
    }
    if (attr.fontSize !== span.fontSize) {
        return true;
    }

    if (!!attr.bold !== !!span.bold) {
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

    // bullet numbers??
    return false;
}

export function mergeSpanAttr(span: SpanAttr, attr: SpanAttr) {
    const attrIsSetter = attr instanceof SpanAttrSetter;
    _mergeSpanAttr(span, attr, attrIsSetter);
}

function _mergeSpanAttr(span: SpanAttr, attr: SpanAttr, attrIsSetter: boolean) {
    let changed = false;
    if (attr.color) {
        if (!span.color || !isColorEqual(attr.color, span.color)) {
            span.color = new Color(attr.color.alpha, attr.color.red, attr.color.green, attr.color.blue)
            changed = true;
        }
    } else if (attrIsSetter && (attr as SpanAttrSetter).colorIsSet && span.color) {
        span.color = undefined;
        changed = true;
    }

    if (attr.highlight) {
        if (!span.highlight || !isColorEqual(attr.highlight, span.highlight)) {
            span.highlight = new Color(attr.highlight.alpha, attr.highlight.red, attr.highlight.green, attr.highlight.blue)
            changed = true;
        }
    } else if (attrIsSetter && (attr as SpanAttrSetter).highlightIsSet && span.highlight) {
        span.highlight = undefined;
        changed = true;
    }

    if (attr.fontName) {
        if (!span.fontName || attr.fontName !== span.fontName) {
            span.fontName = attr.fontName;
            changed = true;
        }
    } else if (attrIsSetter && (attr as SpanAttrSetter).fontNameIsSet && span.fontName) {
        span.fontName = undefined;
        changed = true;
    }

    if (attr.fontSize) {
        if (!span.fontSize || attr.fontSize !== span.fontSize) {
            span.fontSize = attr.fontSize;
            changed = true;
        }
    } else if (attrIsSetter && (attr as SpanAttrSetter).fontSizeIsSet && span.fontSize) {
        span.fontSize = undefined;
        changed = true;
    }

    // bold
    if (attr.bold) {
        if (!!span.bold !== attr.bold) {
            span.bold = attr.bold;
            changed = true;
        }
    } else if (attrIsSetter && (attr as SpanAttrSetter).boldIsSet && span.bold) {
        span.bold = undefined;
        changed = true;
    }
    // italic
    if (attr.italic) {
        if (!!span.italic !== attr.italic) {
            span.italic = attr.italic;
            changed = true;
        }
    } else if (attrIsSetter && (attr as SpanAttrSetter).italicIsSet && span.italic) {
        span.italic = undefined;
        changed = true;
    }
    // underline
    if (attr.underline) {
        if (!span.underline || attr.underline !== span.underline) {
            span.underline = attr.underline;
            changed = true;
        }
    } else if (attrIsSetter && (attr as SpanAttrSetter).underlineIsSet && span.underline) {
        span.underline = undefined;
        changed = true;
    }
    // strikethrough
    if (attr.strikethrough) {
        if (!span.strikethrough || attr.strikethrough !== span.strikethrough) {
            span.strikethrough = attr.strikethrough;
            changed = true;
        }
    } else if (attrIsSetter && (attr as SpanAttrSetter).strikethroughIsSet && span.strikethrough) {
        span.strikethrough = undefined;
        changed = true;
    }

    return changed;
}

export function mergeParaAttr(para: Para | ParaAttr, attr: Para | ParaAttr): boolean {
    const _attr = attr instanceof ParaAttr ? attr : attr.attr;
    if (para instanceof Para) {
        if (!para.attr) {
            if (_attr) para.attr = importParaAttr(_attr); // deep clone
            return !!_attr;
        }
        else if (_attr) {
            return _mergeParaAttr(para.attr, _attr);
        }
    }
    else if (_attr) {
        return _mergeParaAttr(para, _attr);
    }
    return false;
}

function _mergeParaAttr(paraAttr: ParaAttr, attr: ParaAttr): boolean {
    const attrIsSetter = attr instanceof ParaAttrSetter;
    let changed = false;
    changed = _mergeSpanAttr(paraAttr, attr, attrIsSetter);

    if (attr.minimumLineHeight != undefined) {
        if (paraAttr.minimumLineHeight == undefined || paraAttr.minimumLineHeight !== attr.minimumLineHeight) {
            paraAttr.minimumLineHeight = paraAttr.minimumLineHeight;
            changed = true;
        }
    } else if (attrIsSetter && (attr as ParaAttrSetter).minimumLineHeightIsSet && paraAttr.minimumLineHeight) {
        paraAttr.minimumLineHeight = undefined;
        changed = true;
    }

    if (attr.maximumLineHeight != undefined) {
        if (paraAttr.maximumLineHeight == undefined || paraAttr.maximumLineHeight !== attr.maximumLineHeight) {
            paraAttr.maximumLineHeight = paraAttr.maximumLineHeight;
            changed = true;
        }
    } else if (attrIsSetter && (attr as ParaAttrSetter).maximumLineHeightIsSet && paraAttr.maximumLineHeight) {
        paraAttr.maximumLineHeight = undefined;
        changed = true;
    }

    if (attr.paraSpacing != undefined) {
        if (paraAttr.paraSpacing == undefined || paraAttr.paraSpacing !== attr.paraSpacing) {
            paraAttr.paraSpacing = paraAttr.paraSpacing;
            changed = true;
        }
    } else if (attrIsSetter && (attr as ParaAttrSetter).paraSpacingIsSet && paraAttr.paraSpacing) {
        paraAttr.paraSpacing = undefined;
        changed = true;
    }

    if (attr.kerning != undefined) {
        if (paraAttr.kerning == undefined || paraAttr.kerning !== attr.kerning) {
            paraAttr.kerning = paraAttr.kerning;
            changed = true;
        }
    } else if (attrIsSetter && (attr as ParaAttrSetter).kerningIsSet && paraAttr.kerning) {
        paraAttr.kerning = undefined;
        changed = true;
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