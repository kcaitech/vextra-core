import {
    Fill,
    FillType,
    Gradient,
    GradientType,
    OverrideType,
    Shape,
    ShapeSize,
    SymbolRefShape,
    SymbolShape,
    VariableType
} from "../../../data";
import { render as renderGradient } from "./gradient";
import { render as clippathR } from "./clippath"
import { objectId } from "../../../basic/objectid";
import { findOverrideAndVar } from "../../basic";
import { patternRender } from "./pattern";
import { EL } from "../../../dataview";

function randomId() {
    return Math.floor((Math.random() * 10000) + 1);
}

const handler: { [key: string]: (h: Function, frame: ShapeSize, fill: Fill, path: string) => EL } = {};
handler[FillType.SolidColor] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): EL {
    const color = fill.color;
    return h("path", {
        d: path,
        fill: "rgb(" + color.red + "," + color.green + "," + color.blue + ")",
        "fill-opacity": color.alpha,
        stroke: 'none',
        'stroke-width': 0,
        "fill-rule": fill.fillRule || "evenodd",
    });
}

handler[FillType.Gradient] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): EL {
    const opacity = fill.gradient?.gradientOpacity;
    const elArr = [];
    const g_ = renderGradient(h, fill.gradient as Gradient, frame);
    if (g_.node) elArr.push(g_.node);
    const gid = g_.id;
    const gStyle = g_.style;
    if (gStyle) {
        const id = "clippath-fill-" + objectId(fill) + randomId();
        const cp = clippathR(h, id, path);
        elArr.push(cp);
        elArr.push(h("foreignObject", {
                width: frame.width, height: frame.height, x: 0, y: 0,
                "clip-path": "url(#" + id + ")",
                opacity: opacity === undefined ? 1 : opacity
            },
            h("div", { width: "100%", height: "100%", style: gStyle })));
    } else {
        elArr.push(h('path', {
            d: path,
            fill: "url(#" + gid + ")",
            "fill-opacity": opacity === undefined ? 1 : opacity,
            stroke: 'none',
            'stroke-width': 0,
            "fill-rule": fill.fillRule || "evenodd",
        }));
    }
    return h("g", elArr);
}

handler[FillType.Pattern] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): EL {
    const id = "pattern-fill-" + objectId(fill) + randomId();
    const setting = fill.contextSettings;
    const pattern = patternRender(h, frame, id, path, fill);

    const _path = h('path', {
        d: path,
        fill: 'url(#' + id + ')',
        "fill-opacity": (setting ? setting.opacity : 1)
    })

    return h("g", [pattern, _path]);
}

export function render(h: Function, fills: Fill[], frame: ShapeSize, path: string): EL[] {
    const fillsCount = fills.length;
    const elArr: EL[] = [];
    for (let i = 0; i < fillsCount; i++) {
        const fill = fills[i];
        if (!fill.isEnabled) continue;
        const fillType = fill.fillType;
        elArr.push(handler[fillType](h, frame, fill, path));
    }
    return elArr;
}

const handler2: { [key: string]: (h: Function, frame: ShapeSize, fill: Fill, path: string) => EL } = {};
handler2[FillType.SolidColor] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): EL {
    return handler[FillType.SolidColor](h, frame, fill, path)
}

handler2[FillType.Gradient] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): EL {
    if (fill.gradient?.gradientType === GradientType.Angular) {
        return handler[FillType.SolidColor](h, frame, fill, path);
    }
    const opacity = fill.gradient?.gradientOpacity;
    const elArr = [];
    const g_ = renderGradient(h, fill.gradient as Gradient, frame);
    if (g_.node) elArr.push(g_.node);
    const gid = g_.id;
    const gStyle = g_.style;
    if (gStyle) {
        const id = "clippath-fill-" + objectId(fill) + randomId();
        const cp = clippathR(h, id, path);
        elArr.push(cp);
        elArr.push(h("foreignObject", {
                width: frame.width, height: frame.height, x: 0, y: 0,
                "clip-path": "url(#" + id + ")",
                opacity: opacity === undefined ? 1 : opacity
            },
            h("div", { width: "100%", height: "100%", style: gStyle })));
    } else {
        elArr.push(h('path', {
            d: path,
            fill: "url(#" + gid + ")",
            "fill-opacity": opacity === undefined ? 1 : opacity,
            stroke: 'none',
            'stroke-width': 0,
            "fill-rule": fill.fillRule || "evenodd",
        }));
    }
    return h("g", elArr);
}

handler2[FillType.Pattern] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): EL {
    return handler[FillType.Pattern](h, frame, fill, path)
}

export function render2(h: Function, fills: Fill[], frame: ShapeSize, path: string): Array<any> {
    const fillsCount = fills.length;
    const elArr = [];
    for (let i = 0; i < fillsCount; i++) {
        const fill = fills[i];
        if (!fill.isEnabled) {
            continue;
        }
        const fillType = fill.fillType;
        elArr.push(handler2[fillType](h, frame, fill, path));
    }
    return elArr;
}

export function renderWithVars(h: Function, shape: Shape, frame: ShapeSize, path: string,
                               varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    let fills = shape.style.fills;
    if (varsContainer) {
        const _vars = findOverrideAndVar(shape, OverrideType.Fills, varsContainer);
        if (_vars) {
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === VariableType.Fills) {
                // return _var.value;
                fills = _var.value;
            }
        }
    }
    return render(h, fills, frame, path);
}