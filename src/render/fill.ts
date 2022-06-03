import { Shape } from "@/data/shape";
import { Fill, FillType, Gradient } from "@/data/style";
import { ELArray, EL, el } from "./element";
import { render as renderGradient } from "./gradient";
import { render as clippathR } from "./clippath"
import { objectId } from "@/basic/objectid";

const handler: {[key: number]: (shape: Shape, fill: Fill, path: string) => EL} = {};
handler[FillType.SolidColor] = function (shape: Shape, fill: Fill, path: string): EL {
    const color = fill.color;
    const frame = shape.frame;
    return el("path", {
        d: path,
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")",
        "fill-opacity": color ? color.alpha : 1,
        stroke: 'none',
        'stroke-width': 0,
        transform: "translate(" + frame.x + " " + frame.y + ")",
    });
}

handler[FillType.Gradient] = function (shape: Shape, fill: Fill, path: string): EL {
    const color = fill.color;
    const frame = shape.frame;
    let elArr = new ELArray();
    let g_ = renderGradient(fill.gradient as Gradient, frame);
    if (g_.node) {
        elArr.push(g_.node);
    }
    let gid = g_.id;
    let gStyle = g_.style;
    if (gStyle) {
        let id = "clippath-fill-" + objectId(fill);
        let cp = clippathR(shape, id, path);
        elArr.push(cp);
        elArr.push(el("foreignObject", {
            width: frame.width, height: frame.height, x: frame.x, y: frame.y,
            "clip-path": "url(#" + id + ")"
        },
            el("div", { width: "100%", height: "100%", style: gStyle })));
    }
    else {
        elArr.push(el('path', {
            d: path,
            fill: "url(#" + gid + ")",
            "fill-opacity": color ? color.alpha : 1,
            stroke: 'none',
            'stroke-width': 0,
            transform: "translate(" + frame.x + " " + frame.y + ")",
        }));
    }
    if (elArr.length == 1) {
        return elArr[0];
    }
    return el("g", {}, elArr);
}

export function render(shape: Shape, path?: string): ELArray {
    let style = shape.style;
    let frame = shape.frame;
    let fillsCount = style.fillsCount;
    let elArr = new ELArray();
    path = path || shape.getPath(true);

    for (let i = 0; i < fillsCount; i++) {
        let fill = style.getFillByIndex(i);
        if (!fill.isEnabled) {
            continue;
        }
        let fillType = fill.fillType;
        elArr.push(handler[fillType](shape, fill, path));
    }
    return elArr;
}