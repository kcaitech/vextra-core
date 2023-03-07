
import { Shape } from '@/data/data/shape';
import { Border, BorderPosition, FillType, Gradient, GradientType } from '@/data/data/style';
// import { ELArray, EL, h } from "./basic";
import { render as renderGradient } from "./gradient";
import { objectId } from '@/basic/objectid';

const handler: { [key: number]: (h: Function, shape: Shape, border: Border, path: string) => any } = {};
const angularHandler: { [key: number]: (h: Function, shape: Shape, border: Border, path: string) => any } = {};

angularHandler[BorderPosition.Inner] = function (h: Function, shape: Shape, border: Border, path: string): any {
    const clipId = "clippath-border" + objectId(border);
    const maskId = "mask-border" + objectId(border);
    const frame = shape.frame;
    const thickness = border.thickness;
    const width = frame.width;
    const height = frame.height;
    const g_ = renderGradient(h, border.gradient as Gradient, frame);

    return h("g", { transform: "translate(" + frame.x + " " + frame.y + ")" }, [

        h("mask", {
            id: maskId,
            width,
            height
        }, [
            h("rect", {
                x: 0,
                y: 0,
                width,
                height,
                fill: "black"
            }),
            h("clipPath", { id: clipId }, h("path", {
                d: path
            })),
            h('path', {
                d: path,
                stroke: "white",
                'stroke-width': 2 * thickness,
                "clip-path": "url(#" + clipId + ")"
            })
        ]),

        h("foreignObject", {
            x: 0,
            y: 0,
            width,
            height,
            mask: "url(#" + maskId + ")"
        },
            h("div", { width: "100%", height: "100%", style: g_.style }))
    ]);
}

angularHandler[BorderPosition.Center] = function (h: Function, shape: Shape, border: Border, path: string): any {
    const maskId = "mask-border" + objectId(border);
    const frame = shape.frame;
    const thickness = border.thickness;

    const g_ = renderGradient(h, border.gradient as Gradient, frame);

    const x = -thickness / 2;
    const y = -thickness / 2;
    const width = frame.width + thickness;
    const height = frame.height + thickness;

    return h("g", { transform: "translate(" + frame.x + " " + frame.y + ")" }, [
        h("mask", {
            id: maskId,
            maskContentUnits: "userSpaceOnUse",
            width,
            height
        }, [
            h("rect", { x, y, width, height, fill: "black" }),
            h("path", {
                d: path,
                stroke: "white",
                'stroke-width': thickness,
            })
        ]),
        h("foreignObject", {
            width,
            height,
            x,
            y,
            mask: "url(#" + maskId + ")"
        },
            h("div", { width: "100%", height: "100%", style: g_.style })),
    ])
}

angularHandler[BorderPosition.Outer] = function (h: Function, shape: Shape, border: Border, path: string): any {
    const frame = shape.frame;
    const thickness = border.thickness;

    const g_ = renderGradient(h, border.gradient as Gradient, frame);
    const width = frame.width + 2 * thickness;
    const height = frame.height + 2 * thickness;
    const x = - thickness;
    const y = - thickness;
    const mask1Id = "mask1-border" + objectId(border);
    const mask2Id = "mask2-border" + objectId(border);

    return h("g", { transform: "translate(" + frame.x + " " + frame.y + ")" }, [
        h("mask", {
            id: mask2Id,
            width,
            height
        }, [
            h("mask", {
                id: mask1Id,
                width,
                height
            }, [
                h("rect", { x: -thickness, y: -thickness, width, height, fill: "white" }),
                h("path", { d: path, fill: "black" })
            ]),
            h("rect", { x, y, width, height, fill: "black" }),
            h('path', {
                d: path,
                stroke: "white",
                'stroke-width': 2 * thickness,
                mask: "url(#" + mask1Id + ")",
            })
        ]),
        h("foreignObject", {
            width,
            height,
            x,
            y,
            mask: "url(#" + mask2Id + ")"
        },
            h("div", { width: "100%", height: "100%", style: g_.style })),
    ]);
}

handler[BorderPosition.Inner] = function (h: Function, shape: Shape, border: Border, path: string): any {
    const clipId = "clippath-border" + objectId(border);
    const frame = shape.frame;
    const thickness = border.thickness;

    let g_;
    let stroke;
    const color = border.color;
    const fillType = border.fillType;
    if (fillType == FillType.SolidColor) {
        stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
    } else {
        g_ = renderGradient(h, border.gradient as Gradient, frame);
        stroke = "url(#" + g_.id + ")";
    }
    const x = frame.x;
    const y = frame.y;

    const elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    elArr.push(
        h("clipPath", { id: clipId }, h("path", {
            d: path
        })),
        h('path', {
            d: path,
            fill: "none",
            stroke,
            'stroke-width': 2 * thickness,
            "clip-path": "url(#" + clipId + ")"
        })
    );
    return h("g", { transform: "translate(" + x + " " + y + ")" }, elArr);
}

handler[BorderPosition.Center] = function (h: Function, shape: Shape, border: Border, path: string): any {
    const frame = shape.frame;
    const thickness = border.thickness;

    let g_;
    let stroke;
    const color = border.color;
    const fillType = border.fillType;
    if (fillType == FillType.SolidColor) {
        stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
    } else {
        g_ = renderGradient(h, border.gradient as Gradient, frame);
        stroke = "url(#" + g_.id + ")";
    }
    const x = frame.x;
    const y = frame.y;

    if (g_ && g_.node) {
        // elArr.push(g_.node);
        return h("g", { transform: "translate(" + x + " " + y + ")" }, [
            g_.node,
            h('path', {
                d: path,
                fill: "none",
                stroke,
                'stroke-width': thickness,

            })
        ]);
    } else {
        return h('path', {
            d: path,
            fill: "none",
            stroke,
            'stroke-width': thickness,
            transform: "translate(" + x + " " + y + ")"
        });
    }
}

handler[BorderPosition.Outer] = function (h: Function, shape: Shape, border: Border, path: string): any {
    const frame = shape.frame;
    const thickness = border.thickness;

    let g_;
    let stroke;
    const color = border.color;
    const fillType = border.fillType;
    if (fillType == FillType.SolidColor) {
        stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
    } else {
        g_ = renderGradient(h, border.gradient as Gradient, frame);
        stroke = "url(#" + g_.id + ")";
    }

    const maskId = "mask-border" + objectId(border);

    const width = frame.width + 2 * thickness;
    const height = frame.height + 2 * thickness;

    const elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    elArr.push(h("mask", { id: maskId }, [
        h("rect", { x: -thickness, y: -thickness, width, height, fill: "white" }),
        h("path", { d: path, fill: "black" })
    ]),
        h('path', {
            d: path,
            fill: "none",
            stroke,
            'stroke-width': 2 * thickness,
            mask: "url(#" + maskId + ")"
        }))

    return (h("g", { transform: "translate(" + frame.x + " " + frame.y + ")" }, elArr));
}

export function render(h: Function, shape: Shape, path?:string): Array<any> {
    const style = shape.style;
    const bc = style.bordersCount;
    path = path || shape.getPath(true);

    const elArr = new Array();
    for (let i = 0; i < bc; i++) {
        const border: Border = style.getBorderByIndex(i);
        if (!border.isEnabled) {
            continue;
        }
        const position = border.position;
        const fillType = border.fillType;
        const gradientType = border.gradient && border.gradient.gradientType;

        fillType == FillType.Gradient && gradientType == GradientType.Angular && (() => {
            elArr.push(angularHandler[position](h, shape, border, path));
        })() || (fillType == FillType.SolidColor || fillType == FillType.Gradient) && (() => {
            elArr.push(handler[position](h, shape, border, path));
        })() || fillType == FillType.Pattern && (() => {
            return true; // todo
        })
    }
    return elArr;

}