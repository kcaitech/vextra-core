import { render as renderGradient } from "./gradient";
import { objectId } from '../../basic/objectid';
import {
    Border,
    BorderPosition,
    FillType,
    Gradient,
    GradientType,
    OverrideType,
    Shape,
    ShapeSize,
    ShapeType,
    SideType,
    SymbolRefShape,
    SymbolShape,
    VariableType
} from "../../data";
import { findOverrideAndVar, randomId } from "../basic";
import { renderCustomBorder } from "./border_custom";


const handler: {
    [key: string]: (h: Function, frame: ShapeSize, border: Border, path: string, shape?: Shape) => any
} = {};
const angularHandler: {
    [key: string]: (h: Function, frame: ShapeSize, border: Border, path: string, shape?: Shape) => any
} = {};

angularHandler[BorderPosition.Inner] = function (h: Function, frame: ShapeSize, border: Border, path: string, shape?: Shape): any {
    if (shape && is_side_custom(border.sideSetting.sideType, shape)) {
        return renderCustomBorder(h, frame, border, path, shape);
    }
    const rId = randomId();
    const clipId = "clippath-border" + objectId(border) + rId;
    const maskId = "mask-border" + objectId(border) + rId;
    // const frame = shape.frame;
    const thickness = border.sideSetting.thicknessTop;
    const width = frame.width;
    const height = frame.height;
    const g_ = renderGradient(h, border.gradient as Gradient, frame);
    const opacity = border.gradient?.gradientOpacity;
    const path_props: any = {
        d: path,
        stroke: "white",
        'stroke-width': 2 * thickness,
        "clip-path": "url(#" + clipId + ")",
        "stroke-linejoin": border.cornerType,
        opacity: opacity === undefined ? 1 : opacity
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`
    }
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
            h('path', path_props)
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

angularHandler[BorderPosition.Center] = function (h: Function, frame: ShapeSize, border: Border, path: string, shape?: Shape): any {
    if (shape && is_side_custom(border.sideSetting.sideType, shape)) {
        return renderCustomBorder(h, frame, border, path, shape);
    }
    const rId = randomId();
    const maskId = "mask-border" + objectId(border) + rId;
    // const frame = shape.frame;
    const thickness = border.sideSetting.thicknessTop;

    const g_ = renderGradient(h, border.gradient as Gradient, frame);

    const x = -thickness / 2;
    const y = -thickness / 2;
    const width = frame.width + thickness;
    const height = frame.height + thickness;
    const opacity = border.gradient?.gradientOpacity;
    const path_props: any = {
        d: path,
        stroke: "white",
        'stroke-width': thickness,
        "stroke-linejoin": border.cornerType,
        opacity: opacity === undefined ? 1 : opacity
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`
    }
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
            h("path", path_props)
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

angularHandler[BorderPosition.Outer] = function (h: Function, frame: ShapeSize, border: Border, path: string, shape?: Shape): any {
    // const frame = shape.frame;
    const thickness = border.sideSetting.thicknessTop;
    if (shape && is_side_custom(border.sideSetting.sideType, shape)) {
        return renderCustomBorder(h, frame, border, path, shape);
    }
    const g_ = renderGradient(h, border.gradient as Gradient, frame);
    const width = frame.width + 2 * thickness;
    const height = frame.height + 2 * thickness;
    const x = -thickness;
    const y = -thickness;
    const rId = randomId();
    const mask1Id = "mask1-border" + objectId(border) + rId;
    const mask2Id = "mask2-border" + objectId(border) + rId;
    const opacity = border.gradient?.gradientOpacity;
    const path_props: any = {
        d: path,
        stroke: "white",
        'stroke-width': 2 * thickness,
        mask: "url(#" + mask1Id + ")",
        "stroke-linejoin": border.cornerType,
        opacity: opacity === undefined ? 1 : opacity
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`
    }
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
                // h("rect", { x: -thickness, y: -thickness, width, height, fill: "white" }),
                h("path", { d: path, fill: "black", 'stroke-width': 2 * thickness, stroke: 'white' }),
                h("path", { d: path, fill: "black" }),
            ]),
            h("rect", { x, y, width, height, fill: "black" }),
            h('path', path_props)
        ]),
        h("foreignObject", {
            width: width + (6 * thickness),
            height: height + (6 * thickness),
            x: x - (3 * thickness),
            y: y - (3 * thickness),
            mask: "url(#" + mask2Id + ")"
        },
            h("div", { width: "100%", height: "100%", style: g_.style })),
    ]);
}

handler[BorderPosition.Inner] = function (h: Function, frame: ShapeSize, border: Border, path: string, shape?: Shape): any {
    if (shape && is_side_custom(border.sideSetting.sideType, shape)) {
        return renderCustomBorder(h, frame, border, path, shape);
    }
    const rId = randomId();
    const clipId = "clippath-border" + objectId(border) + rId;
    // const frame = shape.frame;
    const thickness = border.sideSetting.thicknessTop;

    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': 2 * thickness,
        "stroke-linejoin": border.cornerType,
        'clip-path': "url(#" + clipId + ")"
    }
    if (shape && Math.max(...shape.radius) > 0) body_props['stroke-linejoin'] = 'miter';
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
        const opacity = border.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
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

handler[BorderPosition.Center] = function (h: Function, frame: ShapeSize, border: Border, path: string, shape?: Shape): any {
    // const frame = shape.frame;
    if (shape && is_side_custom(border.sideSetting.sideType, shape)) {
        return renderCustomBorder(h, frame, border, path, shape);
    }
    const thickness = border.sideSetting.thicknessTop;
    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        "stroke-linejoin": border.cornerType,
        'stroke-width': thickness
    }
    // if (shape && Math.max(...shape.radius) > 0) body_props['stroke-linejoin'] = 'miter';
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
        const opacity = border.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
        body_props.stroke = "url(#" + g_.id + ")";
    }
    const body = h('path', body_props);
    if (g_ && g_.node) {
        return h("g", [g_.node, body]);
    } else {
        return body;
    }
}

handler[BorderPosition.Outer] = function (h: Function, frame: ShapeSize, border: Border, path: string, shape?: Shape): any {
    // const frame = shape.frame;
    if (shape && is_side_custom(border.sideSetting.sideType, shape)) {
        return renderCustomBorder(h, frame, border, path, shape);
    }
    const thickness = border.sideSetting.thicknessTop;

    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        "stroke-linejoin": border.cornerType,
        'stroke-width': 2 * thickness,
    }
    // if (shape && Math.max(...shape.radius) > 0) body_props['stroke-linejoin'] = 'miter';
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
        const opacity = border.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
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
            // h("rect", { x: -thickness, y: -thickness, width, height, fill: "white" }),
            h("path", { d: path, fill: "black", 'stroke-width': 2 * thickness, stroke: 'white' }),
            h("path", { d: path, fill: "black" }),
        ]
    )
    const b_ = h('path', body_props);
    elArr.push(mask, b_);
    return (h("g", elArr));
}

export function render(h: Function, borders: Border[], frame: ShapeSize, path: string, shape: Shape | undefined, isClosed = true): Array<any> {
    const bc = borders.length;
    const elArr = [];
    for (let i = 0; i < bc; i++) {
        const border: Border = borders[i];
        if (!border.isEnabled) {
            continue;
        }

        // 不闭合的图层的边框默认以居中效果来渲染
        const position = isClosed ? border.position : BorderPosition.Center;

        const fillType = border.fillType;
        const gradientType = border.gradient && border.gradient.gradientType;

        fillType == FillType.Gradient && gradientType == GradientType.Angular && (() => {
            elArr.push(angularHandler[position](h, frame, border, path, shape));
        })() || (fillType == FillType.SolidColor || fillType == FillType.Gradient) && (() => {
            elArr.push(handler[position](h, frame, border, path, shape));
        })() || fillType == FillType.Pattern && (() => {
            return true; // todo
        })
    }
    return elArr;
}

export function renderWithVars(h: Function, shape: Shape, frame: ShapeSize, path: string,
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
    return render(h, borders, frame, path, shape, shape.isClosed);
}

function is_side_custom(sideType: SideType, shape: Shape) {
    if (sideType === SideType.Normal || shape.haveEdit) return false;
    return [ShapeType.Rectangle, ShapeType.Artboard, ShapeType.Image, ShapeType.Symbol, ShapeType.SymbolRef, ShapeType.SymbolUnion].includes(shape.type);
}