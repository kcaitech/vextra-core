import { Border, BorderPosition, BorderSideSetting, CornerType, CurveMode, CurvePoint, FillType, Gradient, GradientType, Path, Shape, ShapeFrame, SideType, parsePath } from "../data/classes";
import { render as renderGradient } from "./gradient";
import { objectId } from '../basic/objectid';
import { randomId } from "./basic";
import { BasicArray } from "../data/basic";
import { Matrix } from "../basic/matrix";

const handler: { [key: string]: (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape) => any } = {};
const angularHandler: { [key: string]: (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape) => any } = {};

angularHandler[BorderPosition.Inner] = function (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape): any {
    const rId = randomId();
    const clipId = "clippath-border" + objectId(border) + rId;
    const mask1Id = "mask1-border" + objectId(border) + rId;
    const mask2Id = "mask2-border" + objectId(border) + rId;
    const thickness = get_thickness(border.sideSetting);
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
    if (Math.max(...shape.radius) > 0 || border.sideSetting.sideType !== SideType.Custom) path_props['stroke-linejoin'] = 'miter';
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`
    }
    const mask_path = inner_mask_path(shape, border, false);
    path_props.mask = "url(#" + mask2Id + ")";
    const mask = h(
        "mask",
        { id: mask2Id, x: 0, y: 0, width, height },
        [
            h("path", { d: path, fill: "white" }),
            h("path", { d: mask_path, fill: "black" }),
        ]
    )
    return h("g", [

        h("mask", {
            id: mask1Id,
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
            mask,
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
            mask: "url(#" + mask1Id + ")"
        },
            h("div", { width: "100%", height: "100%", style: g_.style }))
    ]);
}


angularHandler[BorderPosition.Center] = function (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape): any {
    const rId = randomId();
    const mask1Id = "mask1-border" + objectId(border) + rId;
    const mask2Id = "mask2-border" + objectId(border) + rId;
    const thickness = get_thickness(border.sideSetting);
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
    if (Math.max(...shape.radius) > 0 || border.sideSetting.sideType !== SideType.Custom) path_props['stroke-linejoin'] = 'miter';
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`
    }
    const mask_outer_path = outer_mask_path(shape, border, true);
    const mask_inner_path = inner_mask_path(shape, border, true);
    const surplus_path = mask_surplus_path(frame, shape.radius, border.sideSetting, true);
    path_props.mask = "url(#" + mask2Id + ")";
    const mask = h(
        "mask",
        { id: mask2Id, x: -thickness / 2, y: -thickness / 2, width, height },
        [
            h("path", { d: mask_outer_path, fill: "white" }),
            h("path", { d: mask_inner_path, fill: "black" }),
            h("path", { d: surplus_path, fill: "black" }),
        ]
    )
    return h("g", [
        h("mask", {
            id: mask1Id,
            maskContentUnits: "userSpaceOnUse",
            x,
            y,
            width,
            height
        }, [
            mask,
            h("rect", { x, y, width, height, fill: "black" }),
            h("path", path_props)
        ]),
        h("foreignObject", {
            width,
            height,
            x,
            y,
            mask: "url(#" + mask1Id + ")"
        },
            h("div", { width: "100%", height: "100%", style: g_.style })),
    ])
}

angularHandler[BorderPosition.Outer] = function (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape): any {
    const thickness = get_thickness(border.sideSetting);
    const g_ = renderGradient(h, border.gradient as Gradient, frame);
    const width = frame.width + 2 * thickness;
    const height = frame.height + 2 * thickness;
    const x = - thickness;
    const y = - thickness;
    const rId = randomId();
    const mask1Id = "mask1-border" + objectId(border) + rId;
    const mask2Id = "mask2-border" + objectId(border) + rId;
    const opacity = border.gradient?.gradientOpacity;
    const path_props: any = {
        d: path,
        stroke: "white",
        "stroke-width": 2 * thickness,
        mask: "url(#" + mask1Id + ")",
        "stroke-linejoin": border.cornerType,
        opacity: opacity === undefined ? 1 : opacity
    }
    if (Math.max(...shape.radius) > 0 || border.sideSetting.sideType !== SideType.Custom) path_props['stroke-linejoin'] = 'miter';
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`;
    }
    const maskPath = outer_mask_path(shape, border, false);
    const surplus_path = mask_surplus_path(frame, shape.radius, border.sideSetting, false)

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
                h("path", { d: maskPath, fill: "white" }),
                h("path", { d: path, fill: "black" }),
                h("path", { d: surplus_path, fill: "black" }),
            ]),
            h("rect", { x, y, width, height, fill: "black" }),
            h('path', path_props)
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

handler[BorderPosition.Inner] = function (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape): any {
    const rId = randomId();
    const clipId = "clippath-border" + objectId(border) + rId;
    const maskId = "mask-border" + objectId(border) + rId;
    const { width, height } = frame;
    const thickness = get_thickness(border.sideSetting);

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
        const opacity = border.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
        body_props.stroke = "url(#" + g_.id + ")";
    }

    const elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    const mask_path = inner_mask_path(shape, border, false);
    body_props.mask = "url(#" + maskId + ")";
    const mask = h(
        "mask",
        { id: maskId, x: 0, y: 0, width, height },
        [
            h("path", { d: path, fill: "white" }),
            h("path", { d: mask_path, fill: "black" }),
        ]
    )
    elArr.push(
        h("clipPath", { id: clipId }, h("path", {
            d: path,
            "clip-rule": "evenodd",
        })), mask,
        h('path', body_props),
    );
    return h("g", elArr);
}

handler[BorderPosition.Center] = function (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape): any {
    const thickness = get_thickness(border.sideSetting);
    const rId = randomId();
    const maskId = "mask-border" + objectId(border) + rId;
    const radius = shape.radius;
    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        "stroke-linejoin": border.cornerType,
        'stroke-width': thickness
    }
    if (Math.max(...radius) > 0 || border.sideSetting.sideType !== SideType.Custom) body_props['stroke-linejoin'] = 'miter';
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`
    }
    const width = frame.width + thickness;
    const height = frame.height + thickness;
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
    const mask_outer_path = outer_mask_path(shape, border, true);
    const mask_inner_path = inner_mask_path(shape, border, true);
    const surplus_path = mask_surplus_path(frame, shape.radius, border.sideSetting, true)
    body_props.mask = "url(#" + maskId + ")";
    const mask = h(
        "mask",
        { id: maskId, x: -thickness / 2, y: -thickness / 2, width, height },
        [
            h("path", { d: mask_outer_path, fill: "white" }),
            h("path", { d: mask_inner_path, fill: "black" }),
            h("path", { d: surplus_path, fill: "black" }),
        ]
    )
    const body = h('path', body_props);
    if (g_ && g_.node) {
        return h("g", [g_.node, mask, body]);
    } else {
        return h("g", [mask, body]);;
    }
}

handler[BorderPosition.Outer] = function (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape): any {
    // const frame = shape.frame;
    const thickness = get_thickness(border.sideSetting);
    let g_;
    const radius = shape.radius;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        "stroke-linejoin": border.cornerType,
        'stroke-width': 2 * thickness,
    }
    if (Math.max(...radius) > 0 || border.sideSetting.sideType !== SideType.Custom) body_props['stroke-linejoin'] = 'miter';
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
    const maskPath = outer_mask_path(shape, border, false);
    const surplus_path = mask_surplus_path(frame, shape.radius, border.sideSetting, false)
    const mask = h(
        "mask",
        { id: maskId, x: -thickness, y: -thickness, width, height },
        [
            h("path", { d: maskPath, fill: "white" }),
            h("path", { d: path, fill: "black" }),
            h("path", { d: surplus_path, fill: "black" }),
        ]
    )
    const b_ = h('path', body_props);
    elArr.push(mask, b_);
    return (h("g", elArr));
}

export const renderCustomBorder = (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape) => {
    const fillType = border.fillType;
    const gradientType = border.gradient && border.gradient.gradientType;
    if (fillType == FillType.Gradient && gradientType == GradientType.Angular) {
        return angularHandler[border.position](h, frame, border, path, shape)
    }
    return handler[border.position](h, frame, border, path, shape);
}

const outer_mask_path = (shape: Shape, border: Border, iscenter: boolean) => {
    const cornerType = border.cornerType
    const { width, height } = shape.frame;
    const radius = shape.radius;
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = border.sideSetting;
    const t = iscenter ? thicknessTop / 2 : thicknessTop;
    const b = iscenter ? thicknessBottom / 2 : thicknessBottom;
    const l = iscenter ? thicknessLeft / 2 : thicknessLeft;
    const r = iscenter ? thicknessRight / 2 : thicknessRight;
    if (Math.max(...radius) > 0 || sideType !== SideType.Custom || cornerType !== CornerType.Bevel) {
        return outer_radius_border_path(radius, shape.frame, border.sideSetting, cornerType, iscenter);
    } else {
        //切角
        const w = width + r + l;
        const h = height + t + b;
        const p1 = new CurvePoint([] as any, '', 0, -t, CurveMode.Straight);
        const p2 = new CurvePoint([] as any, '', width, -t, CurveMode.Straight);
        const p3 = new CurvePoint([] as any, '', width + r, 0, CurveMode.Straight);
        const p4 = new CurvePoint([] as any, '', width + r, height, CurveMode.Straight);
        const p5 = new CurvePoint([] as any, '', width, height + b, CurveMode.Straight);
        const p6 = new CurvePoint([] as any, '', 0, height + b, CurveMode.Straight);
        const p7 = new CurvePoint([] as any, '', -l, height, CurveMode.Straight);
        const p8 = new CurvePoint([] as any, '', -l, 0, CurveMode.Straight);
        const path = new Path(parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4, p5, p6, p7, p8), true, w, h, undefined));
        const m = new Matrix();
        m.preScale(w, h);
        path.transform(new Matrix(m.inverse));
        return path.toString();
    }
}

const get_thickness = (side: BorderSideSetting) => {
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = side;
    return Math.max(thicknessBottom, thicknessTop, thicknessLeft, thicknessRight);
}

const outer_radius_border_path = (radius: number[], frame: ShapeFrame, side: BorderSideSetting, cornerType: CornerType, iscenter: boolean) => {
    const { width, height } = frame
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = side;
    const p1 = new CurvePoint([] as any, '', 0, 0, CurveMode.Straight);
    const p2 = new CurvePoint([] as any, '', 1, 0, CurveMode.Straight);
    const p3 = new CurvePoint([] as any, '', 1, 1, CurveMode.Straight);
    const p4 = new CurvePoint([] as any, '', 0, 1, CurveMode.Straight);
    const t = iscenter ? thicknessTop / 2 : thicknessTop;
    const b = iscenter ? thicknessBottom / 2 : thicknessBottom;
    const l = iscenter ? thicknessLeft / 2 : thicknessLeft;
    const r = iscenter ? thicknessRight / 2 : thicknessRight;
    if (Math.max(...radius) > 0) {
        const lt = l === 0 ? t : t === 0 ? l : Math.min(l, t);
        const lb = l === 0 ? b : b === 0 ? l : Math.min(l, b);
        const rt = r === 0 ? t : t === 0 ? r : Math.min(r, t);
        const rb = r === 0 ? b : b === 0 ? r : Math.min(r, b);
        p1.radius = radius[0] > 0 ? radius[0] + lt : 0;
        p2.radius = radius[1] > 0 ? radius[1] + rt : 0;
        p3.radius = radius[2] > 0 ? radius[2] + rb : 0;
        p4.radius = radius[3] > 0 ? radius[3] + lb : 0;
    } else if (cornerType === CornerType.Round && sideType === SideType.Custom) {
        const lt = l > 0 && t > 0 ? Math.min(l, t) : 0;
        const rt = r > 0 && t > 0 ? Math.min(r, t) : 0;
        const rb = r > 0 && b > 0 ? Math.min(r, b) : 0;
        const lb = l > 0 && b > 0 ? Math.min(l, b) : 0;
        p1.radius = lt;
        p2.radius = rt;
        p3.radius = rb;
        p4.radius = lb;
    }
    let w = width, h = height
    switch (sideType) {
        case SideType.Top:
            w = width; h = height + t;
            break;
        case SideType.Bottom:
            w = width; h = height + b;
            break;
        case SideType.Left:
            w = width + l; h = height;
            break;
        case SideType.Right:
            w = width + r; h = height;
            break;
        case SideType.Custom:
            w = width + r + l; h = height + t + b;
            break;
        default:
            w = width; h = height;
    }

    const path = new Path(parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4), true, w, h, undefined));
    path.translate(-l, -t);
    return path.toString();
}

//  某条边没有厚度时，遮罩盖不全会溢出一点像素显示？，多加一层遮盖
const mask_surplus_path = (frame: ShapeFrame, r: number[], side: BorderSideSetting, iscenter: boolean) => {
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = side;
    let w = frame.width, h = frame.height;
    let _p1 = { x: 0, y: 0 }, _p2 = { x: w, y: 0 }, _p3 = { x: w, y: h }, _p4 = { x: 0, y: h };
    let radius = [...r];
    const min_side = Math.min(w, h);
    if (r[0] > min_side / 2) {
        if (r[1] > 0 || r[3] > 0) {
            r[1] > 0 && r[3] > 0 ? radius[0] = min_side / 2 : r[1] > 0 ? radius[0] = Math.min(r[0], w / 2, h) : radius[0] = Math.min(r[0], w, h / 2);
        } else {
            r[0] > min_side ? radius[0] = min_side : radius[0] = r[0];
        }
    }
    if (r[1] > min_side / 2) {
        if (r[0] > 0 || r[2] > 0) {
            r[0] > 0 && r[2] > 0 ? radius[1] = min_side / 2 : r[0] > 0 ? radius[1] = Math.min(r[1], w / 2, h) : radius[1] = Math.min(r[1], w, h / 2);
        } else {
            r[1] > min_side ? radius[1] = min_side : radius[1] = r[1];
        }
    }
    if (r[2] > min_side / 2) {
        if (r[3] > 0 || r[1] > 0) {
            r[3] > 0 && r[1] > 0 ? radius[2] = min_side / 2 : r[3] > 0 ? radius[2] = Math.min(r[2], w / 2, h) : radius[2] = Math.min(r[2], w, h / 2);
        } else {
            r[2] > min_side ? radius[2] = min_side : radius[2] = r[2];
        }
    }
    if (r[3] > min_side / 2) {
        if (r[2] > 0 || r[0] > 0) {
            r[2] > 0 && r[0] > 0 ? radius[3] = min_side / 2 : r[2] > 0 ? radius[3] = Math.min(r[3], w / 2, h) : radius[3] = Math.min(r[3], w, h / 2);
        } else {
            r[3] > min_side ? radius[3] = min_side : radius[3] = r[3];
        }
    }

    if (thicknessTop === 0) {
        if (thicknessLeft > 0) {
            radius[0] > 0 ? _p1.x = radius[0] : _p1.x = 0;
            _p1.y = -2;
        } else {
            _p1.x = -2; _p1.y = -2;
        }
        if (thicknessRight > 0) {
            radius[1] > 0 ? _p2.x -= radius[1] : _p2.x = w;
            _p2.y = -2;
        } else {
            _p2.x += 2; _p2.y = -2;
        }
    } else {
        if (thicknessLeft > 0) {
            _p1.y = radius[0];
        } else {
            radius[0] > 0 ? _p1.y = radius[0] : _p1.y = 0;
            _p1.x = -2;
        }
        if (thicknessRight > 0) {
            _p2.y = radius[1];
        } else {
            radius[1] > 0 ? _p2.y = radius[1] : _p2.y = 0;
            _p2.x += 2;
        }
    }

    if (thicknessBottom === 0) {
        if (thicknessLeft > 0) {
            radius[3] > 0 ? _p4.x = radius[3] : _p4.x = 0;
            _p4.y = h + 2;
        } else {
            _p4.x = -2; _p4.y += 2;
        }
        if (thicknessRight > 0) {
            radius[2] > 0 ? _p3.x -= radius[2] : _p3.x = w;
        } else {
            _p3.x += 2; _p3.y += 2;
        }
    } else {
        if (thicknessLeft > 0) {
            _p4.x = 0; _p4.y -= radius[3];
        } else {
            radius[3] > 0 ? _p4.y -= radius[3] : _p4.y = h;
            _p4.x = -2;
        }
        if (thicknessRight > 0) {
            _p3.x = w; _p3.y -= radius[2];
        } else {
            radius[2] > 0 ? _p3.y -= radius[2] : _p3.y = h;
            _p3.x += 2;
        }
    }
    if (iscenter) {
        _p1.x += (thicknessLeft / 2); _p1.y += (thicknessTop / 2);
        _p2.x -= (thicknessRight / 2); _p2.y += (thicknessTop / 2);
        _p3.x -= (thicknessRight / 2); _p3.y -= (thicknessBottom / 2);
        _p4.x += (thicknessLeft / 2); _p4.y -= (thicknessBottom / 2);
    }
    const p1 = new CurvePoint([] as any, '', _p1.x, _p1.y, CurveMode.Straight);
    const p2 = new CurvePoint([] as any, '', _p2.x, _p2.y, CurveMode.Straight);
    const p3 = new CurvePoint([] as any, '', _p3.x, _p3.y, CurveMode.Straight);
    const p4 = new CurvePoint([] as any, '', _p4.x, _p4.y, CurveMode.Straight);
    const m_x = Math.max(_p2.x, _p3.x);
    const m_y = Math.max(_p3.y, _p4.y);
    const path = new Path(parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4), true, m_x, m_y, undefined));
    const m = new Matrix();
    m.preScale(m_x, m_y);
    path.transform(new Matrix(m.inverse));
    return path.toString();
}

const inner_mask_path = (shape: Shape, border: Border, iscenter: boolean) => {
    const { width, height } = shape.frame;
    const radius = shape.radius;
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = border.sideSetting;
    const t = iscenter ? thicknessTop / 2 : thicknessTop;
    const b = iscenter ? thicknessBottom / 2 : thicknessBottom;
    const l = iscenter ? thicknessLeft / 2 : thicknessLeft;
    const r = iscenter ? thicknessRight / 2 : thicknessRight;
    const p1 = new CurvePoint([] as any, '', 0, 0, CurveMode.Straight);
    const p2 = new CurvePoint([] as any, '', 1, 0, CurveMode.Straight);
    const p3 = new CurvePoint([] as any, '', 1, 1, CurveMode.Straight);
    const p4 = new CurvePoint([] as any, '', 0, 1, CurveMode.Straight);
    if (radius[0] > 0) {
        const side = Math.max(l, t);
        side > radius[0] ? p1.radius = 0 : p1.radius = radius[0] - side;
    }
    if (radius[1] > 0) {
        const side = Math.max(r, t);
        side > radius[1] ? p2.radius = 0 : p2.radius = radius[1] - side;
    }
    if (radius[2] > 0) {
        const side = Math.max(r, b);
        side > radius[2] ? p3.radius = 0 : p3.radius = radius[2] - side;
    }
    if (radius[3] > 0) {
        const side = Math.max(l, b);
        side > radius[3] ? p4.radius = 0 : p4.radius = radius[3] - side;
    }
    let w = width, h = height
    switch (sideType) {
        case SideType.Top:
            w = width; h = height - t;
            break;
        case SideType.Bottom:
            w = width; h = height - b;
            break;
        case SideType.Left:
            w = width - l; h = height;
            break;
        case SideType.Right:
            w = width - r; h = height;
            break;
        case SideType.Custom:
            w = width - r - l; h = height - t - b;
            break;
        default:
            w = width; h = height;
    }
    const path = new Path(parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4), true, w, h, undefined));
    path.translate(l, t);
    return path.toString();
}