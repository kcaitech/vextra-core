

import { render as renderGradient } from "./gradient";
import { objectId } from '../basic/objectid';
import { Border, Gradient, BorderPosition, FillType, GradientType, ShapeFrame, Shape, SymbolRefShape, SymbolShape, Variable, OverrideType, VariableType } from "../data/classes";
import { findOverrideAndVar, randomId } from "./basic";


const handler: { [key: string]: (h: Function, frame: ShapeFrame, border: Border, path: string) => any } = {};
const angularHandler: { [key: string]: (h: Function, frame: ShapeFrame, border: Border, path: string) => any } = {};

angularHandler[BorderPosition.Inner] = function (h: Function, frame: ShapeFrame, border: Border, path: string): any {
    const rId = randomId();
    const clipId = "clippath-border" + objectId(border) + rId;
    const maskId = "mask-border" + objectId(border) + rId;
    // const frame = shape.frame;
    const thickness = border.thickness;
    const width = frame.width;
    const height = frame.height;
    const g_ = renderGradient(h, border.gradient as Gradient, frame);

    return h("g", [

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
                d: path,
                "clip-rule": "evenodd",
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

angularHandler[BorderPosition.Center] = function (h: Function, frame: ShapeFrame, border: Border, path: string): any {
    const rId = randomId();
    const maskId = "mask-border" + objectId(border) + rId;
    // const frame = shape.frame;
    const thickness = border.thickness;

    const g_ = renderGradient(h, border.gradient as Gradient, frame);

    const x = -thickness / 2;
    const y = -thickness / 2;
    const width = frame.width + thickness;
    const height = frame.height + thickness;

    return h("g", [
        h("mask", {
            id: maskId,
            maskContentUnits: "userSpaceOnUse",
            x,
            y,
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

angularHandler[BorderPosition.Outer] = function (h: Function, frame: ShapeFrame, border: Border, path: string): any {
    // const frame = shape.frame;
    const thickness = border.thickness;

    const g_ = renderGradient(h, border.gradient as Gradient, frame);
    const width = frame.width + 2 * thickness;
    const height = frame.height + 2 * thickness;
    const x = - thickness;
    const y = - thickness;
    const rId = randomId();
    const mask1Id = "mask1-border" + objectId(border) + rId;
    const mask2Id = "mask2-border" + objectId(border) + rId;

    return h("g", [
        h("mask", {
            id: mask2Id,
            x, y,
            width,
            height
        }, [
            h("mask", {
                id: mask1Id,
                x: -thickness, y: -thickness,
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

handler[BorderPosition.Inner] = function (h: Function, frame: ShapeFrame, border: Border, path: string): any {
    const rId = randomId();
    const clipId = "clippath-border" + objectId(border) + rId;
    // const frame = shape.frame;
    const thickness = border.thickness;

    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': 2 * thickness,
        'clip-path': "url(#" + clipId + ")"
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`
    }
    const fillType = border.fillType;
    if (fillType == FillType.SolidColor) {
        const color = border.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, border.gradient as Gradient, frame);
        body_props.stroke = "url(#" + g_.id + ")";
    }

    const elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    elArr.push(
        h("clipPath", { id: clipId }, h("path", {
            d: path,
            "clip-rule": "evenodd",
        })),
        h('path', body_props)
    );
    return h("g", elArr);
}

handler[BorderPosition.Center] = function (h: Function, frame: ShapeFrame, border: Border, path: string): any {
    // const frame = shape.frame;
    const thickness = border.thickness;
    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': thickness
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`
    }

    const fillType = border.fillType;
    if (fillType == FillType.SolidColor) {
        const color = border.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, border.gradient as Gradient, frame);
        body_props.stroke = "url(#" + g_.id + ")";
    }
    const body = h('path', body_props);
    if (g_ && g_.node) {
        return h("g", [g_.node, body]);
    } else {
        return body;
    }
}

handler[BorderPosition.Outer] = function (h: Function, frame: ShapeFrame, border: Border, path: string): any {
    // const frame = shape.frame;
    const thickness = border.thickness;

    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': 2 * thickness,
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`;
    }
    const fillType = border.fillType;
    if (fillType == FillType.SolidColor) {
        const color = border.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, border.gradient as Gradient, frame);
        body_props.stroke = "url(#" + g_.id + ")";
    }

    const rId = randomId();
    const maskId = "mask-border" + objectId(border) + rId;
    body_props.mask = "url(#" + maskId + ")";

    const width = frame.width + 2 * thickness;
    const height = frame.height + 2 * thickness;

    const elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    const mask = h(
        "mask",
        { id: maskId, x: -thickness, y: -thickness, width, height },
        [
            h("rect", { x: -thickness, y: -thickness, width, height, fill: "white" }),
            h("path", { d: path, fill: "black" })
        ]
    )
    const b_ = h('path', body_props);
    elArr.push(mask, b_);
    return (h("g", elArr));
}

export function render(h: Function, borders: Border[], frame: ShapeFrame, path: string): Array<any> {
    const bc = borders.length;
    const elArr = [];
    for (let i = 0; i < bc; i++) {
        const border: Border = borders[i];
        if (!border.isEnabled) {
            continue;
        }
        const position = border.position;
        const fillType = border.fillType;
        const gradientType = border.gradient && border.gradient.gradientType;

        fillType == FillType.Gradient && gradientType == GradientType.Angular && (() => {
            elArr.push(angularHandler[position](h, frame, border, path));
        })() || (fillType == FillType.SolidColor || fillType == FillType.Gradient) && (() => {
            elArr.push(handler[position](h, frame, border, path));
        })() || fillType == FillType.Pattern && (() => {
            return true; // todo
        })
    }
    return elArr;
}

export function renderWithVars(h: Function, shape: Shape, frame: ShapeFrame, path: string,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    let borders = shape.style.borders;
    if (varsContainer) {
        const _vars = findOverrideAndVar(shape, OverrideType.Borders, varsContainer);
        if (_vars) {
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === VariableType.Borders) {
                // return _var.value;
                borders = _var.value;
            }
        }
    }
    return render(h, borders, frame, path);
}