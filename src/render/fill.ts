import { ShapeSize, Fill, FillType, Gradient, Shape, SymbolRefShape, SymbolShape, Variable, OverrideType, VariableType } from "../data/classes";
// import { ELArray, EL, h } from "./basic";
import { render as renderGradient } from "./gradient";
import { render as clippathR } from "./clippath"
import { objectId } from "../basic/objectid";
import { findOverrideAndVar } from "./basic";
import { patternRender } from "./pattern";

function randomId() {
    return Math.floor((Math.random() * 10000) + 1);
}

const handler: { [key: string]: (h: Function, frame: ShapeSize, fill: Fill, path: string) => any } = {};
handler[FillType.SolidColor] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): any {
    const color = fill.color;
    return h("path", {
        d: path,
        fill: "rgb(" + color.red + "," + color.green + "," + color.blue + ")",
        "fill-opacity": (color ? color.alpha : 1),
        stroke: 'none',
        'stroke-width': 0,
        "fill-rule": fill.fillRule || "evenodd",
    });
}

handler[FillType.Gradient] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): any {
    const opacity = fill.gradient?.gradientOpacity;
    const elArr = new Array();
    const g_ = renderGradient(h, fill.gradient as Gradient, frame);
    if (g_.node) {
        elArr.push(g_.node);
    }
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
    }
    else {
        elArr.push(h('path', {
            d: path,
            fill: "url(#" + gid + ")",
            "fill-opacity": opacity === undefined ? 1 : opacity,
            stroke: 'none',
            'stroke-width': 0,
            "fill-rule": fill.fillRule || "evenodd",
        }));
    }
    // if (elArr.length == 1) {
    //     return elArr[0];
    // }
    return h("g", elArr);
}

handler[FillType.Pattern] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): any {
    const id = "pattern-fill-" + objectId(fill) + randomId();
    const color = fill.color;
    const pattern = patternRender(h, frame, id, path, fill);
    
    const _path = h('path', {
        d: path,
        fill: 'url(#' + id + ')',
        "fill-opacity": (color ? color.alpha : 1)
    })

    return h("g", [pattern, _path]);
}

export function render(h: Function, fills: Fill[], frame: ShapeSize, path: string): Array<any> {
    const fillsCount = fills.length;
    const elArr = new Array();
    for (let i = 0; i < fillsCount; i++) {
        const fill = fills[i];
        if (!fill.isEnabled) {
            continue;
        }
        const fillType = fill.fillType;
        elArr.push(handler[fillType](h, frame, fill, path));
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