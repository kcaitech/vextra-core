import { Border, BorderPosition, BorderSideSetting, CornerType, CurveMode, CurvePoint, FillType, Gradient, Path, Shape, ShapeFrame, SideType, parsePath } from "../data/classes";
import { render as renderGradient } from "./gradient";
import { objectId } from '../basic/objectid';
import { randomId } from "./basic";
import { BasicArray } from "../data/basic";
import { Matrix } from "../basic/matrix";

const handler: { [key: string]: (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape) => any } = {};

handler[BorderPosition.Inner] = function (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape): any {
    const rId = randomId();
    const clipId = "clippath-border" + objectId(border) + rId;
    // const frame = shape.frame;
    const thickness = get_thickness(border.sideSetting);

    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': 2 * thickness,
        "stroke-linejoin": border.cornerType,
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
    elArr.push(
        h("clipPath", { id: clipId }, h("path", {
            d: path,
            "clip-rule": "evenodd",
        })),
        h('path', body_props)
    );
    return h("g", elArr);
}

handler[BorderPosition.Center] = function (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape): any {
    // const frame = shape.frame;
    const thickness = get_thickness(border.sideSetting);
    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        "stroke-linejoin": border.cornerType,
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

handler[BorderPosition.Outer] = function (h: Function, frame: ShapeFrame, border: Border, path: string, shape: Shape): any {
    // const frame = shape.frame;
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = border.sideSetting;
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
    if (Math.max(...radius) > 0 || sideType !== SideType.Custom) body_props['stroke-linejoin'] = 'miter';
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
    const maskPath = mask_path(shape, border);
    const surplus_path = mask_surplus_path(frame, shape.radius, border.sideSetting)
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
    return handler[border.position](h, frame, border, path, shape);
}

const mask_path = (shape: Shape, border: Border) => {
    const cornerType = border.cornerType
    const { width, height } = shape.frame;
    const radius = shape.radius;
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = border.sideSetting;
    if (Math.max(...radius) > 0 || sideType !== SideType.Custom || cornerType !== CornerType.Bevel) {
        return outer_radius_border_path(radius, shape.frame, border.sideSetting, cornerType);
    } else {
        //切角
        const w = width + thicknessRight + thicknessLeft;
        const h = height + thicknessTop + thicknessBottom;
        const p1 = new CurvePoint([] as any, '', 0, -thicknessTop, CurveMode.Straight);
        const p2 = new CurvePoint([] as any, '', width, -thicknessTop, CurveMode.Straight);
        const p3 = new CurvePoint([] as any, '', width + thicknessRight, 0, CurveMode.Straight);
        const p4 = new CurvePoint([] as any, '', width + thicknessRight, height, CurveMode.Straight);
        const p5 = new CurvePoint([] as any, '', width, height + thicknessBottom, CurveMode.Straight);
        const p6 = new CurvePoint([] as any, '', 0, height + thicknessBottom, CurveMode.Straight);
        const p7 = new CurvePoint([] as any, '', -thicknessLeft, height, CurveMode.Straight);
        const p8 = new CurvePoint([] as any, '', -thicknessLeft, 0, CurveMode.Straight);
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

const outer_radius_border_path = (radius: number[], frame: ShapeFrame, side: BorderSideSetting, cornerType: CornerType) => {
    const { width, height } = frame
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = side;
    const p1 = new CurvePoint([] as any, '', 0, 0, CurveMode.Straight);
    const p2 = new CurvePoint([] as any, '', 1, 0, CurveMode.Straight);
    const p3 = new CurvePoint([] as any, '', 1, 1, CurveMode.Straight);
    const p4 = new CurvePoint([] as any, '', 0, 1, CurveMode.Straight);

    if (Math.max(...radius) > 0) {
        const lt = thicknessLeft === 0 ? thicknessTop : thicknessTop === 0 ? thicknessLeft : Math.min(thicknessLeft, thicknessTop);
        const lb = thicknessLeft === 0 ? thicknessBottom : thicknessBottom === 0 ? thicknessLeft : Math.min(thicknessLeft, thicknessBottom);
        const rt = thicknessRight === 0 ? thicknessTop : thicknessTop === 0 ? thicknessRight : Math.min(thicknessRight, thicknessTop);
        const rb = thicknessRight === 0 ? thicknessBottom : thicknessBottom === 0 ? thicknessRight : Math.min(thicknessRight, thicknessBottom);
        p1.radius = radius[0] + lt;
        p2.radius = radius[1] + rt;
        p3.radius = radius[2] + rb;
        p4.radius = radius[3] + lb;
    } else if (cornerType === CornerType.Round && sideType === SideType.Custom) {
        const lt = thicknessLeft > 0 && thicknessTop > 0 ? Math.min(thicknessLeft, thicknessTop) : 0;
        const rt = thicknessRight > 0 && thicknessTop > 0 ? Math.min(thicknessRight, thicknessTop) : 0;
        const rb = thicknessRight > 0 && thicknessBottom > 0 ? Math.min(thicknessRight, thicknessBottom) : 0;
        const lb = thicknessLeft > 0 && thicknessBottom > 0 ? Math.min(thicknessLeft, thicknessBottom) : 0;
        p1.radius = lt;
        p2.radius = rt;
        p3.radius = rb;
        p4.radius = lb;
    }
    let w = width, h = height
    switch (sideType) {
        case SideType.Top:
            w = width; h = height + thicknessTop;
            break;
        case SideType.Bottom:
            w = width; h = height + thicknessBottom;
            break;
        case SideType.Left:
            w = width + thicknessLeft; h = height;
            break;
        case SideType.Right:
            w = width + thicknessRight; h = height;
            break;
        case SideType.Custom:
            w = width + thicknessRight + thicknessLeft; h = height + thicknessTop + thicknessBottom;
            break;
        default:
            w = width; h = height;
    }

    const path = new Path(parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4), true, w, h, undefined));
    path.translate(-thicknessLeft, -thicknessTop);
    return path.toString();
}

// 外边框 某条边没有厚度时，遮罩盖不全会溢出一点像素显示？，多加一层遮盖
const mask_surplus_path = (frame: ShapeFrame, radius: number[], side: BorderSideSetting) => {
    const { sideType, thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = side;
    let w = frame.width, h = frame.height;
    let _p1 = { x: 0, y: 0 }, _p2 = { x: w, y: 0 }, _p3 = { x: w, y: h }, _p4 = { x: 0, y: h };
    if (thicknessTop === 0) {
        if (thicknessLeft > 0) {
            radius[0] > 0 ? _p1.x = radius[0] : _p1.x = 0;
            _p1.y = -2;
        }else {
            _p1.x = -2; _p1.y = -2;
        }
        if (thicknessRight > 0) {
            radius[1] > 0 ? _p2.x -= radius[1] : _p2.x = w;
            _p2.y = -2;
        }else {
            _p2.x -= 2; _p2.y = -2;
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
        }else {
            _p4.x = -2; _p4.y += 2;
        }
        if (thicknessRight > 0) {
            radius[2] > 0 ? _p3.x -= radius[2] : _p3.x = w;
        }else {
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
    const path = new Path(parsePath(new BasicArray<CurvePoint>(p1, p2, p3, p4), true, m_x, m_y, undefined));
    const m = new Matrix();
    m.preScale(m_x, m_y);
    path.transform(new Matrix(m.inverse));
    return path.toString();
}