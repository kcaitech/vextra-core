import { importParaAttr, importTextAttr } from "../io/baseimport";
import { Color } from "./baseclasses";
import { Para, Span, SpanAttr, ParaAttr, Text, TextAttr, SpanAttrSetter, ParaAttrSetter } from "./text";

export function isDiffSpanAttr(span: SpanAttr, attr: SpanAttr): boolean {
    if (attr.color) {
        if (!span.color) return true;
        // compare color
        const c1 = attr.color;
        const c2 = span.color;
        if (c1.alpha !== c2.alpha || c1.red != c2.red || c1.green !== c2.green || c1.blue !== c2.blue) {
            return true;
        }
    }
    else if (span.color) {
        return true;
    }
    if (attr.fontName !== attr.fontName) {
        return true;
    }
    if (attr.fontSize !== attr.fontSize) {
        return true;
    }
    return false;
}

export function mergeSpanAttr(span: Span, attr: SpanAttr) {
    const attrIsSetter = attr instanceof SpanAttrSetter;
    let changed = false;
    if (attr.color) {
        if (!span.color ||
            attr.color.alpha !== span.color.alpha ||
            attr.color.red !== span.color.red ||
            attr.color.green !== span.color.green ||
            attr.color.blue !== span.color.blue) {
            span.color = new Color(attr.color.alpha, attr.color.red, attr.color.green, attr.color.blue)
            changed = true;
        }
    } else if (attrIsSetter && (attr as SpanAttrSetter).colorIsSet && span.color) {
        span.color = undefined;
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
            return _mergeParaAttr(para.attr, attr);
        }
    }
    else if (_attr) {
        return _mergeParaAttr(para, attr);
    }
    return false;
}

function _mergeParaAttr(paraAttr: ParaAttr, attr: ParaAttr): boolean {
    const attrIsSetter = attr instanceof ParaAttrSetter;
    let changed = false;
    if (attr.color) {
        if (!paraAttr.color ||
            attr.color.alpha !== paraAttr.color.alpha ||
            attr.color.red !== paraAttr.color.red ||
            attr.color.green !== paraAttr.color.green ||
            attr.color.blue !== paraAttr.color.blue) {
            paraAttr.color = new Color(attr.color.alpha, attr.color.red, attr.color.green, attr.color.blue)
            changed = true;
        }
    } else if (attrIsSetter && (attr as ParaAttrSetter).colorIsSet && paraAttr.color) {
        paraAttr.color = undefined;
        changed = true;
    }

    if (attr.fontName) {
        if (!paraAttr.fontName || attr.fontName !== paraAttr.fontName) {
            paraAttr.fontName = attr.fontName;
            changed = true;
        }
    } else if (attrIsSetter && (attr as ParaAttrSetter).fontNameIsSet && paraAttr.fontName) {
        paraAttr.fontName = undefined;
        changed = true;
    }

    if (attr.fontSize) {
        if (!paraAttr.fontSize || attr.fontSize !== paraAttr.fontSize) {
            paraAttr.fontSize = attr.fontSize;
            changed = true;
        }
    } else if (attrIsSetter && (attr as ParaAttrSetter).fontNameIsSet && paraAttr.fontSize) {
        paraAttr.fontSize = undefined;
        changed = true;
    }

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