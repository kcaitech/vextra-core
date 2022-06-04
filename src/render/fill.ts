import { Shape } from "@/data/shape";
import { Fill, FillType, Gradient } from "@/data/style";
import { ELArray, EL, h } from "./basic";
import { render as renderGradient } from "./gradient";
import { render as clippathR } from "./clippath"
import { objectId } from "@/basic/objectid";

const handler: {[key: number]: (shape: Shape, fill: Fill, path: string) => EL} = {};
handler[FillType.SolidColor] = function (shape: Shape, fill: Fill, path: string): EL {
    const color = fill.color;
    const frame = shape.frame;
    return h("path", {
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
    const elArr = new ELArray();
    const g_ = renderGradient(fill.gradient as Gradient, frame);
    if (g_.node) {
        elArr.push(g_.node);
    }
    const gid = g_.id;
    const gStyle = g_.style;
    if (gStyle) {
        const id = "clippath-fill-" + objectId(fill);
        const cp = clippathR(shape, id, path);
        elArr.push(cp);
        elArr.push(h("foreignObject", {
            width: frame.width, height: frame.height, x: 0, y: 0,
            "clip-path": "url(#" + id + ")"
        },
            h("div", { width: "100%", height: "100%", style: gStyle })));
    }
    else {
        elArr.push(h('path', {
            d: path,
            fill: "url(#" + gid + ")",
            "fill-opacity": color ? color.alpha : 1,
            stroke: 'none',
            'stroke-width': 0,
        }));
    }
    // if (elArr.length == 1) {
    //     return elArr[0];
    // }
    return h("g", {transform: "translate(" + frame.x + " " + frame.y + ")"}, elArr);
}

export function render(shape: Shape, path?: string): ELArray {
    const style = shape.style;
    const fillsCount = style.fillsCount;
    const elArr = new ELArray();
    path = path || shape.getPath(true);

    for (let i = 0; i < fillsCount; i++) {
        const fill = style.getFillByIndex(i);
        if (!fill.isEnabled) {
            continue;
        }
        const fillType = fill.fillType;
        elArr.push(handler[fillType](shape, fill, path));
    }
    return elArr;
}