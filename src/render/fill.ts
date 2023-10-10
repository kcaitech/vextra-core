import { ShapeFrame, Fill, FillType, Gradient } from "../data/classes";
// import { ELArray, EL, h } from "./basic";
import { render as renderGradient } from "./gradient";
import { render as clippathR } from "./clippath"
import { objectId } from "../basic/objectid";

function randomId() {
    return Math.floor((Math.random()*10000)+1);
}

const handler: { [key: string]: (h: Function, frame: ShapeFrame, fill: Fill, path: string) => any } = {};
handler[FillType.SolidColor] = function (h: Function, frame: ShapeFrame, fill: Fill, path: string): any {
    const color = fill.color;
    return h("path", {
        d: path,
        fill: "rgb(" + color.red + "," + color.green + "," + color.blue + ")",
        "fill-opacity": (color ? color.alpha : 1),
        stroke: 'none',
        'stroke-width': 0,
        "fill-rule": "evenodd",
    });
}

handler[FillType.Gradient] = function (h: Function, frame: ShapeFrame, fill: Fill, path: string): any {
    const color = fill.color;
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
            "clip-path": "url(#" + id + ")"
        },
            h("div", { width: "100%", height: "100%", style: gStyle })));
    }
    else {
        elArr.push(h('path', {
            d: path,
            fill: "url(#" + gid + ")",
            "fill-opacity": (color ? color.alpha : 1),
            stroke: 'none',
            'stroke-width': 0,
            "fill-rule": "evenodd",
        }));
    }
    // if (elArr.length == 1) {
    //     return elArr[0];
    // }
    return h("g", elArr);
}

handler[FillType.Pattern] = function (h: Function, frame: ShapeFrame, fill: Fill, path: string): any {
    const id = "clippath-fill-" + objectId(fill) +  + randomId();
    const cp = clippathR(h, id, path);

    const url = fill.peekImage(true);
    const props: any = {}
    // const frame = shape.frame;
    props.width = frame.width;
    props.height = frame.height;
    props['xlink:href'] = url;
    props['preserveAspectRatio'] = "none meet";
    props["clip-path"] = "url(#" + id + ")"
    const img = h("image", props);

    return h("g", [cp, img]);
}

export function render(h: Function, fills: Fill[], frame: ShapeFrame, path: string): Array<any> {
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