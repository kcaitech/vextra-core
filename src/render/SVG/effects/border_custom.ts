/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    Border,
    BorderPosition,
    BorderSideSetting,
    CornerType,
    CurveMode,
    CurvePoint,
    FillType,
    Gradient,
    GradientType,
    Shape,
    ShapeSize,
    SideType,
    Fill,
    parsePath
} from "../../../data";
import { render as renderGradient } from "./gradient";
import { objectId } from '../../../basic/objectid';
import { randomId } from "../../basic";
import { BasicArray } from "../../../data";
import { Matrix } from "../../../basic/matrix";

const handler: {
    [key: string]: (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill, radius: number[]) => any
} = {};
const angularHandler: {
    [key: string]: (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill, radius: number[]) => any
} = {};

angularHandler[BorderPosition.Inner] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill, radius: number[]): any {
    const rId = randomId();
    const clipId = "clippath-border" + objectId(strokePaints) + rId;
    const mask1Id = "mask1-border" + objectId(strokePaints) + rId;
    const mask2Id = "mask2-border" + objectId(strokePaints) + rId;
    const thickness = get_thickness(border.sideSetting);
    const width = frame.width;
    const height = frame.height;
    const g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
    const opacity = strokePaints.gradient?.gradientOpacity;
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
        path_props['stroke-dashoffset'] = length / 2;
    }
    const mask_path = inner_mask_path(frame, border.sideSetting, false, radius);
    path_props.mask = "url(#" + mask2Id + ")";
    const mask = h(
        "mask",
        { id: mask2Id, x: 0, y: 0, width, height },
        [
            h("path", { d: path, fill: "white" }),
            h("path", { d: mask_path, fill: "black" }),
        ]
    )
    const elArr = [];
    if (Math.max(...radius) === 0) {
        const props: any = { fill: "none", stroke: 'white' }
        if (length || gap) {
            props['stroke-dasharray'] = `${length}, ${gap}`
            props['stroke-dashoffset'] = length / 2;
        }
        const rect = h("rect", { x: 0, y: 0, width, height, fill: "black" })
        const el = sidePath(h, frame, border.sideSetting, props, false);
        const clip = h("clipPath", { id: clipId }, h("path", { d: path, "clip-rule": "evenodd", }))
        const g = h('g', { 'clip-path': "url(#" + clipId + ")" }, el)
        elArr.push(rect, clip, g);
    } else {
        const rect = h("rect", { x: 0, y: 0, width, height, fill: "black" })
        const clip = h("clipPath", { id: clipId }, h("path", { d: path, "clip-rule": "evenodd", }))
        elArr.push(rect, clip, h('path', path_props), mask);
    }
    return h("g", [
        h("mask", { id: mask1Id, width, height }, elArr),
        h("foreignObject", { x: 0, y: 0, width, height, mask: "url(#" + mask1Id + ")" }, [
            h("div", { width: "100%", height: "100%", style: g_.style })
        ])
    ]);
}


angularHandler[BorderPosition.Center] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill, radius: number[]): any {
    const rId = randomId();
    const mask1Id = "mask1-border" + objectId(strokePaints) + rId;
    const mask2Id = "mask2-border" + objectId(strokePaints) + rId;
    const thickness = get_thickness(border.sideSetting);
    const g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);

    const x = -thickness / 2;
    const y = -thickness / 2;
    const width = frame.width + thickness;
    const height = frame.height + thickness;
    const opacity = strokePaints.gradient?.gradientOpacity;
    const path_props: any = {
        d: path,
        stroke: "white",
        'stroke-width': thickness,
        "stroke-linejoin": border.cornerType,
        opacity: opacity === undefined ? 1 : opacity
    }
    if (Math.max(...radius) > 0 || border.sideSetting.sideType !== SideType.Custom) path_props['stroke-linejoin'] = 'miter';
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`
        path_props['stroke-dashoffset'] = length / 2;
    }
    const mask_outer_path = outer_mask_path(frame, border, true, radius);
    const mask_inner_path = inner_mask_path(frame, border.sideSetting, true, radius);
    path_props.mask = "url(#" + mask2Id + ")";
    const mask = h(
        "mask",
        { id: mask2Id, x: -thickness / 2, y: -thickness / 2, width, height },
        [
            h("path", { d: mask_outer_path, fill: "white" }),
            h("path", { d: mask_inner_path, fill: "black" }),
        ]
    )
    const elArr = [mask, h("rect", { x, y, width, height, fill: "black" })];
    if (Math.max(...radius) === 0 && (length || gap)) {
        const props: any = { fill: "none", stroke: 'white', 'stroke-dasharray': length, gap, 'stroke-dashoffset': length / 2 }
        const corner = cornerFill(h, frame, border.sideSetting, 'white');
        const el = sidePath(h, frame, border.sideSetting, props, true);
        const body = h('g', { mask: "url(#" + mask2Id + ")" }, [...el, corner]);
        elArr.push(body);
    } else {
        elArr.push(h("path", path_props));
    }
    return h("g", [
        h("mask", {
            id: mask1Id,
            maskContentUnits: "userSpaceOnUse",
            x,
            y,
            width,
            height
        }, elArr),
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

angularHandler[BorderPosition.Outer] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill, radius: number[]): any {
    const thickness = get_thickness(border.sideSetting);
    const g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
    const width = frame.width + 2 * thickness;
    const height = frame.height + 2 * thickness;
    const x = - thickness;
    const y = - thickness;
    const rId = randomId();
    const mask1Id = "mask1-border" + objectId(strokePaints) + rId;
    const mask2Id = "mask2-border" + objectId(strokePaints) + rId;
    const opacity = strokePaints.gradient?.gradientOpacity;
    const path_props: any = {
        d: path,
        stroke: "white",
        "stroke-width": 2 * thickness,
        mask: "url(#" + mask1Id + ")",
        "stroke-linejoin": border.cornerType,
        opacity: opacity === undefined ? 1 : opacity
    }
    if (Math.max(...radius) > 0 || border.sideSetting.sideType !== SideType.Custom) path_props['stroke-linejoin'] = 'miter';
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`;
        path_props['stroke-dashoffset'] = length / 2;
    }
    const maskPath = outer_mask_path(frame, border, false, radius);
    const surplus_path = mask_surplus_path(frame, radius, border.sideSetting)

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

handler[BorderPosition.Inner] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill, radius: number[]): any {
    const { length, gap } = border.borderStyle;
    if (Math.max(...radius) === 0) {
        return get_inner_border_path(h, frame, border, path, strokePaints);
    }
    const rId = randomId();
    const clipId = "clippath-border" + objectId(strokePaints) + rId;
    const maskId = "mask-border" + objectId(strokePaints) + rId;
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
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`
        body_props['stroke-dashoffset'] = length / 2;
    }
    const fillType = strokePaints.fillType;
    if (fillType == FillType.SolidColor) {
        const color = strokePaints.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
        const opacity = strokePaints.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
        body_props.stroke = "url(#" + g_.id + ")";
    }

    const elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    const mask_path = inner_mask_path(frame, border.sideSetting, false, radius);
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

handler[BorderPosition.Center] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill, radius: number[]): any {
    const { length, gap } = border.borderStyle;
    if (Math.max(...radius) === 0 && (length || gap)) {
        return get_center_border_path(h, frame, border, path, strokePaints, radius);
    }
    const thickness = get_thickness(border.sideSetting);
    const rId = randomId();
    const maskId = "mask-border" + objectId(strokePaints) + rId;
    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        "stroke-linejoin": border.cornerType,
        'stroke-width': thickness
    }
    if (Math.max(...radius) > 0 || border.sideSetting.sideType !== SideType.Custom) body_props['stroke-linejoin'] = 'miter';
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`
        body_props['stroke-dashoffset'] = length / 2;
    }
    const width = frame.width + thickness;
    const height = frame.height + thickness;
    const fillType = strokePaints.fillType;
    if (fillType == FillType.SolidColor) {
        const color = strokePaints.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
        const opacity = strokePaints.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
        body_props.stroke = "url(#" + g_.id + ")";
    }
    const mask_outer_path = outer_mask_path(frame, border, true, radius);
    const mask_inner_path = inner_mask_path(frame, border.sideSetting, true, radius);
    body_props.mask = "url(#" + maskId + ")";
    const mask = h(
        "mask",
        { id: maskId, x: -thickness / 2, y: -thickness / 2, width, height },
        [
            h("path", { d: mask_outer_path, fill: "white" }),
            h("path", { d: mask_inner_path, fill: "black" }),
        ]
    )
    const body = h('path', body_props);
    if (g_ && g_.node) {
        return h("g", [g_.node, mask, body]);
    } else {
        return h("g", [mask, body]);;
    }
}

handler[BorderPosition.Outer] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill, radius: number[]): any {
    // const frame = shape.frame;
    const thickness = get_thickness(border.sideSetting);
    let g_;
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
        body_props['stroke-dashoffset'] = length / 2;
    }
    const fillType = strokePaints.fillType;
    if (fillType == FillType.SolidColor) {
        const color = strokePaints.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
        const opacity = strokePaints.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
        body_props.stroke = "url(#" + g_.id + ")";
    }

    const rId = randomId();
    const maskId = "mask-border" + objectId(strokePaints) + rId;
    body_props.mask = "url(#" + maskId + ")";

    const width = frame.width + 2 * thickness;
    const height = frame.height + 2 * thickness;

    const elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    const maskPath = outer_mask_path(frame, border, false, radius);
    const surplus_path = mask_surplus_path(frame, radius, border.sideSetting)
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

export const renderCustomBorder = (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill, radius: number[]) => {
    const fillType = strokePaints.fillType;
    const position = border.position;
    const gradientType = strokePaints.gradient && strokePaints.gradient.gradientType;
    if (fillType == FillType.Gradient && gradientType == GradientType.Angular) {
        return angularHandler[position](h, frame, border, path, strokePaints, radius)
    }
    return handler[position](h, frame, border, path, strokePaints, radius);
}

const outer_mask_path = (frame: ShapeSize, border: Border, iscenter: boolean, radius: number[]) => {
    const cornerType = border.cornerType
    const { width, height } = frame;
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = border.sideSetting;
    const t = iscenter ? thicknessTop / 2 : thicknessTop;
    const b = iscenter ? thicknessBottom / 2 : thicknessBottom;
    const l = iscenter ? thicknessLeft / 2 : thicknessLeft;
    const r = iscenter ? thicknessRight / 2 : thicknessRight;
    if (Math.max(...radius) > 0 || sideType !== SideType.Custom || cornerType !== CornerType.Bevel) {
        return outer_radius_border_path(radius, frame, border.sideSetting, cornerType, iscenter);
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
        const path = parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4, p5, p6, p7, p8), true, w, h, undefined);
        const m = new Matrix();
        m.preScale(w, h);
        path.transform(new Matrix(m.inverse));
        return path.toString();
    }
}

const get_thickness = (side: BorderSideSetting) => {
    const { thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = side;
    return Math.max(thicknessBottom, thicknessTop, thicknessLeft, thicknessRight);
}

const outer_radius_border_path = (radius: number[], frame: ShapeSize, side: BorderSideSetting, cornerType: CornerType, iscenter: boolean) => {
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
        const _r = getCornerSize(radius, frame);
        p1.radius = _r[0] > 0 ? _r[0] + lt : 0
        p2.radius = _r[1] > 0 ? _r[1] + rt : 0;
        p3.radius = _r[2] > 0 ? _r[2] + rb : 0;
        p4.radius = _r[3] > 0 ? _r[3] + lb : 0;
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
    let w = width + r + l, h = height + t + b

    const path = (parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4), true, w, h, undefined));
    path.translate(-l, -t);
    return path.toString();
}

const mask_surplus_path = (frame: ShapeSize, r: number[], side: BorderSideSetting) => {
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = side;
    let w = frame.width, h = frame.height;
    let _p1 = { x: 0, y: 0 }, _p2 = { x: w, y: 0 }, _p3 = { x: w, y: h }, _p4 = { x: 0, y: h };
    const radius = getCornerSize(r, frame);
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

    const p1 = new CurvePoint([] as any, '', _p1.x, _p1.y, CurveMode.Straight);
    const p2 = new CurvePoint([] as any, '', _p2.x, _p2.y, CurveMode.Straight);
    const p3 = new CurvePoint([] as any, '', _p3.x, _p3.y, CurveMode.Straight);
    const p4 = new CurvePoint([] as any, '', _p4.x, _p4.y, CurveMode.Straight);
    const m_x = Math.max(_p2.x, _p3.x);
    const m_y = Math.max(_p3.y, _p4.y);
    const path = (parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4), true, m_x, m_y, undefined));
    const m = new Matrix();
    m.preScale(m_x, m_y);
    path.transform(new Matrix(m.inverse));
    return path.toString();
}

const inner_mask_path = (frame: ShapeSize, sideSetting: BorderSideSetting, iscenter: boolean, radius: number[]) => {
    const { width, height } = frame;
    const {thicknessBottom, thicknessTop, thicknessLeft, thicknessRight} = sideSetting;
    const tt = iscenter ? thicknessTop / 2 : thicknessTop;
    const tb = iscenter ? thicknessBottom / 2 : thicknessBottom;
    const tl = iscenter ? thicknessLeft / 2 : thicknessLeft;
    const tr = iscenter ? thicknessRight / 2 : thicknessRight;
    const p1 = new CurvePoint([] as any, '', 0, 0, CurveMode.Straight);
    const p2 = new CurvePoint([] as any, '', 1, 0, CurveMode.Straight);
    const p3 = new CurvePoint([] as any, '', 1, 1, CurveMode.Straight);
    const p4 = new CurvePoint([] as any, '', 0, 1, CurveMode.Straight);
    const _radius = getCornerSize(radius, frame);

    if (_radius[0] > 0) {
        const side = Math.max(tl, tt);
        side > _radius[0] ? p1.radius = 0 : p1.radius = _radius[0] - side;
    }
    if (_radius[1] > 0) {
        const side = Math.max(tr, tt);
        side > _radius[1] ? p2.radius = 0 : p2.radius = _radius[1] - side;
    }
    if (_radius[2] > 0) {
        const side = Math.max(tr, tb);
        side > _radius[2] ? p3.radius = 0 : p3.radius = _radius[2] - side;
    }
    if (_radius[3] > 0) {
        const side = Math.max(tl, tb);
        side > _radius[3] ? p4.radius = 0 : p4.radius = _radius[3] - side;
    }
    let w = (tr + tl) > width ? 0 : width - (tr + tl), h = (tt + tb) > height ? 0 : height - (tt + tb)

    const path = (parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4), true, w, h, undefined));
    path.translate(tl, tt);
    return path.toString();
}

const get_inner_border_path = (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill) => {
    const rId = randomId();
    const clipId = "clippath-border" + objectId(strokePaints) + rId;
    let g_;
    const body_props: any = {
        fill: "none",
        stroke: '',
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`
        body_props['stroke-dashoffset'] = length / 2;
    }
    const fillType = strokePaints.fillType;
    if (fillType == FillType.SolidColor) {
        const color = strokePaints.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
        const opacity = strokePaints.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
        body_props.stroke = "url(#" + g_.id + ")";
    }

    const elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    const el = sidePath(h, frame, border.sideSetting, body_props, false);
    elArr.push(
        h("clipPath", { id: clipId }, h("path", {
            d: path,
            "clip-rule": "evenodd",
        })),
        h('g', { 'clip-path': "url(#" + clipId + ")" }, el)
    );
    return h("g", elArr);
}

const sidePath = (h: Function, frame: ShapeSize, sideSetting: BorderSideSetting, props: any, iscenter: boolean) => {
    const { sideType, thicknessTop, thicknessLeft, thicknessBottom, thicknessRight } = sideSetting;
    const { width, height } = frame;
    const elArr = [];
    const p1 = h('path', { d: `M 0 0 L ${width} 0`, ...props, 'stroke-width': iscenter ? thicknessTop : thicknessTop * 2 });
    const p2 = h('path', { d: `M ${width} 0 L ${width} ${height}`, ...props, 'stroke-width': iscenter ? thicknessRight : thicknessRight * 2 });
    const p3 = h('path', { d: `M 0 0 L 0 ${height}`, ...props, 'stroke-width': iscenter ? thicknessLeft : thicknessLeft * 2 });
    const p4 = h('path', { d: `M 0 ${height} L ${width} ${height}`, ...props, 'stroke-width': iscenter ? thicknessBottom : thicknessBottom * 2 });
    switch (sideType) {
        case SideType.Top:
            elArr.push(p1);
            break;
        case SideType.Left:
            elArr.push(p3);
            break;
        case SideType.Right:
            elArr.push(p2);
            break;
        case SideType.Bottom:
            elArr.push(p4);
            break;
        case SideType.Custom:
            elArr.push(p1, p2, p3, p4);
            break;
        default:
            return [];
    }
    return elArr;
}

const get_center_border_path = (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill, radius: number[]) => {
    const thickness = get_thickness(border.sideSetting);
    const rId = randomId();
    const maskId = "mask-border" + objectId(strokePaints) + rId;
    let g_;
    const body_props: any = {
        fill: "none",
        stroke: '',
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`
        body_props['stroke-dashoffset'] = length / 2;
    }
    const width = frame.width + thickness;
    const height = frame.height + thickness;
    const fillType = strokePaints.fillType;
    if (fillType == FillType.SolidColor) {
        const color = strokePaints.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
        const opacity = strokePaints.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
        body_props.stroke = "url(#" + g_.id + ")";
    }
    const mask_outer_path = outer_mask_path(frame, border, true, radius);
    const mask = h(
        "mask",
        { id: maskId, x: -thickness / 2, y: -thickness / 2, width, height },
        [
            h("path", { d: path, fill: "black" }),
            h("path", { d: mask_outer_path, fill: "white" }),
        ]
    )
    const corner = cornerFill(h, frame, border.sideSetting, body_props.stroke);
    const el = sidePath(h, frame, border.sideSetting, body_props, true);
    const body = h('g', { mask: "url(#" + maskId + ")" }, [...el, corner]);
    if (g_ && g_.node) {
        return h("g", [g_.node, mask, body]);
    } else {
        return h("g", [mask, body]);;
    }
}

const cornerFill = (h: Function, frame: ShapeSize, side: BorderSideSetting, stroke: string) => {
    const { width, height } = frame;
    const { thicknessBottom, thicknessLeft, thicknessRight, thicknessTop } = side;
    const d1 = `M ${-thicknessLeft} ${-thicknessTop} L 0 ${-thicknessTop} L 0 0 L ${-thicknessLeft} 0 Z `;
    const d2 = `M ${width} ${-thicknessTop} L ${width + thicknessRight} ${-thicknessTop} L ${width + thicknessRight} 0 L ${width} 0 Z `;
    const d3 = `M ${width} ${height} L ${width + thicknessRight} ${height} L ${width + thicknessRight} ${height + thicknessBottom} L ${width} ${height + thicknessBottom} Z `;
    const d4 = `M ${-thicknessLeft} ${height} L 0 ${height} L 0 ${height + thicknessBottom} L ${-thicknessLeft} ${height + thicknessBottom} Z`;
    return h('path', { d: d1 + d2 + d3 + d4, fill: stroke, stroke: 'none' })
}

const getCornerSize = (r: number[], frame: ShapeSize) => {
    const { width, height } = frame;
    let radius = [...r];
    const min_side = Math.min(width, height);

    if (r[0] > min_side / 2) {
        if (r[1] > 0 || r[3] > 0) {
            r[1] > 0 && r[3] > 0 ? radius[0] = min_side / 2 : r[1] > 0 ? radius[0] = Math.min(r[0], width / 2, height) : radius[0] = Math.min(r[0], width, height / 2);
        } else {
            r[0] > min_side ? radius[0] = min_side : radius[0] = r[0];
        }
    }
    if (r[1] > min_side / 2) {
        if (r[0] > 0 || r[2] > 0) {
            r[0] > 0 && r[2] > 0 ? radius[1] = min_side / 2 : r[0] > 0 ? radius[1] = Math.min(r[1], width / 2, height) : radius[1] = Math.min(r[1], width, height / 2);
        } else {
            r[1] > min_side ? radius[1] = min_side : radius[1] = r[1];
        }
    }
    if (r[2] > min_side / 2) {
        if (r[3] > 0 || r[1] > 0) {
            r[3] > 0 && r[1] > 0 ? radius[2] = min_side / 2 : r[3] > 0 ? radius[2] = Math.min(r[2], width / 2, height) : radius[2] = Math.min(r[2], width, height / 2);
        } else {
            r[2] > min_side ? radius[2] = min_side : radius[2] = r[2];
        }
    }
    if (r[3] > min_side / 2) {
        if (r[2] > 0 || r[0] > 0) {
            r[2] > 0 && r[0] > 0 ? radius[3] = min_side / 2 : r[2] > 0 ? radius[3] = Math.min(r[3], width / 2, height) : radius[3] = Math.min(r[3], width, height / 2);
        } else {
            r[3] > min_side ? radius[3] = min_side : radius[3] = r[3];
        }
    }
    return radius;
}