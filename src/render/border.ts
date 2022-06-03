
import { Shape } from '@/data/shape';
import { Border, BorderPosition, FillType, Gradient, GradientType } from '@/data/style';
import { ELArray, EL, el } from "./element";
import { render as renderGradient } from "./gradient";
import { objectId } from '@/basic/objectid';

const handler: { [key: number]: (shape: Shape, border: Border, path: string) => EL } = {};
const angularHandler: { [key: number]: (shape: Shape, border: Border, path: string) => EL } = {};

angularHandler[BorderPosition.Inner] = function (shape: Shape, border: Border, path: string): EL {
    const clipId = "clippath-border" + objectId(border);
    const maskId = "mask-border" + objectId(border);
    const frame = shape.frame;
    const thickness = border.thickness;
    const width = frame.width;
    const height = frame.height;
    let g_ = renderGradient(border.gradient as Gradient, frame);

    return el("g", { transform: "translate(" + frame.x + " " + frame.y + ")" }, [

        el("mask", {
            id: maskId,
            width,
            height
        }, [
            el("rect", {
                x: 0,
                y: 0,
                width,
                height,
                fill: "black"
            }),
            el("clipPath", { id: clipId }, el("path", {
                d: path
            })),
            el('path', {
                d: path,
                stroke: "white",
                'stroke-width': 2 * thickness,
                "clip-path": "url(#" + clipId + ")"
            })
        ]),

        el("foreignObject", {
            x: 0,
            y: 0,
            width,
            height,
            mask: "url(#" + maskId + ")"
        },
            el("div", { width: "100%", height: "100%", style: g_.style }))
    ]);
}

angularHandler[BorderPosition.Center] = function (shape: Shape, border: Border, path: string): EL {
    const maskId = "mask-border" + objectId(border);
    const frame = shape.frame;
    const thickness = border.thickness;

    let g_ = renderGradient(border.gradient as Gradient, frame);

    let x = -thickness / 2;
    let y = -thickness / 2;
    let width = frame.width + thickness;
    let height = frame.height + thickness;

    return el("g", { transform: "translate(" + frame.x + " " + frame.y + ")" }, [
        el("mask", {
            id: maskId,
            maskContentUnits: "userSpaceOnUse",
            width,
            height
        }, [
            el("rect", { x, y, width, height, fill: "black" }),
            el("path", {
                d: path,
                stroke: "white",
                'stroke-width': thickness,
            })
        ]),
        el("foreignObject", {
            width,
            height,
            x,
            y,
            mask: "url(#" + maskId + ")"
        },
            el("div", { width: "100%", height: "100%", style: g_.style })),
    ])
}

angularHandler[BorderPosition.Outer] = function (shape: Shape, border: Border, path: string): EL {
    const frame = shape.frame;
    const thickness = border.thickness;

    let g_ = renderGradient(border.gradient as Gradient, frame);
    let width = frame.width + 2 * thickness;
    let height = frame.height + 2 * thickness;
    let x = - thickness;
    let y = - thickness;
    let mask1Id = "mask1-border" + objectId(border);
    let mask2Id = "mask2-border" + objectId(border);

    return el("g", { transform: "translate(" + frame.x + " " + frame.y + ")" }, [
        el("mask", {
            id: mask2Id,
            width,
            height
        }, [
            el("mask", {
                id: mask1Id,
                width,
                height
            }, [
                el("rect", { x: -thickness, y: -thickness, width, height, fill: "white" }),
                el("path", { d: path, fill: "black" })
            ]),
            el("rect", { x, y, width, height, fill: "black" }),
            el('path', {
                d: path,
                stroke: "white",
                'stroke-width': 2 * thickness,
                mask: "url(#" + mask1Id + ")",
            })
        ]),
        el("foreignObject", {
            width,
            height,
            x,
            y,
            mask: "url(#" + mask2Id + ")"
        },
            el("div", { width: "100%", height: "100%", style: g_.style })),
    ]);
}

handler[BorderPosition.Inner] = function (shape: Shape, border: Border, path: string): EL {
    const clipId = "clippath-border" + objectId(border);
    const frame = shape.frame;
    const thickness = border.thickness;

    let g_;
    let stroke;
    let color = border.color;
    let fillType = border.fillType;
    if (fillType == FillType.SolidColor) {
        stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
    } else {
        g_ = renderGradient(border.gradient as Gradient, frame);
        stroke = "url(#" + g_.id + ")";
    }
    let x = frame.x;
    let y = frame.y;

    let elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    elArr.push(
        el("clipPath", { id: clipId }, el("path", {
            d: path
        })),
        el('path', {
            d: path,
            fill: "none",
            stroke,
            'stroke-width': 2 * thickness,
            "clip-path": "url(#" + clipId + ")"
        })
    );
    return el("g", { transform: "translate(" + x + " " + y + ")" }, elArr);
}

handler[BorderPosition.Center] = function (shape: Shape, border: Border, path: string): EL {
    const frame = shape.frame;
    const thickness = border.thickness;

    let g_;
    let stroke;
    let color = border.color;
    let fillType = border.fillType;
    if (fillType == FillType.SolidColor) {
        stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
    } else {
        g_ = renderGradient(border.gradient as Gradient, frame);
        stroke = "url(#" + g_.id + ")";
    }
    let x = frame.x;
    let y = frame.y;

    if (g_ && g_.node) {
        // elArr.push(g_.node);
        return el("g", { transform: "translate(" + x + " " + y + ")" }, [
            g_.node,
            el('path', {
                d: path,
                fill: "none",
                stroke,
                'stroke-width': thickness,

            })
        ]);
    } else {
        return el('path', {
            d: path,
            fill: "none",
            stroke,
            'stroke-width': thickness,
            transform: "translate(" + x + " " + y + ")"
        });
    }
}

handler[BorderPosition.Outer] = function (shape: Shape, border: Border, path: string): EL {
    const frame = shape.frame;
    const thickness = border.thickness;

    let g_;
    let stroke;
    let color = border.color;
    let fillType = border.fillType;
    if (fillType == FillType.SolidColor) {
        stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
    } else {
        g_ = renderGradient(border.gradient as Gradient, frame);
        stroke = "url(#" + g_.id + ")";
    }

    let maskId = "mask-border" + objectId(border);

    let width = frame.width + 2 * thickness;
    let height = frame.height + 2 * thickness;

    let elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    elArr.push(el("mask", { id: maskId }, [
        el("rect", { x: -thickness, y: -thickness, width, height, fill: "white" }),
        el("path", { d: path, fill: "black" })
    ]),
        el('path', {
            d: path,
            fill: "none",
            stroke,
            'stroke-width': 2 * thickness,
            mask: "url(#" + maskId + ")"
        }))

    return (el("g", { transform: "translate(" + frame.x + " " + frame.y + ")" }, elArr));
}

export function render(shape: Shape, path?:string): ELArray {
    const style = shape.style;
    const bc = style.bordersCount;
    path = path || shape.getPath(true);

    let elArr = new ELArray();
    for (let i = 0; i < bc; i++) {
        const border: Border = style.getBorderByIndex(i);
        if (!border.isEnabled) {
            continue;
        }
        const position = border.position;
        let fillType = border.fillType;
        let gradientType = border.gradient && border.gradient.gradientType;

        fillType == FillType.Gradient && gradientType == GradientType.Angular && (() => {
            angularHandler[position](shape, border, path);
        })() || (fillType == FillType.SolidColor || fillType == FillType.Gradient) && (() => {
            handler[position](shape, border, path);
        })() || fillType == FillType.Pattern && (() => {
            return true; // todo
        })
    }
    return elArr;

}