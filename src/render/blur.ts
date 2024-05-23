import { Blur, BlurType, BorderPosition, ShapeType, SideType } from "../data/baseclasses";
import { render as borderR } from "./border";
import { Shape, ShapeFrame } from "../data/classes";
import { randomId } from "./basic";
import { Border, Fill } from "data/style";
import { objectId } from '../basic/objectid';
const handler: { [key: string]: (h: Function, blur: Blur, id: string, frame: ShapeFrame, borders: Border[], fills: Fill[], path: string, shapeType: ShapeType, radius: number[]) => any } = {};

handler[BlurType.Gaussian] = (h: Function, blur: Blur, id: string, frame: ShapeFrame) => {
    const props: any = {
        id: id,
        x: '-20%',
        y: '-20%',
        height: '140%',
        width: '140%',
        'color-interpolation-filters': "sRGB"
    }
    const fe_flood = {
        'flood-opacity': `0`,
        result: `BackgroundImageFix`
    }
    const fe_blend = {
        mode: "normal",
        in: "SourceGraphic",
        in2: "BackgroundImageFix",
        result: "shape"
    }
    const percentx = (blur.saturation / frame.width) * 100;
    const percenty = (blur.saturation / frame.height) * 100;
    props.x = -(percentx + 20) + "%"
    props.y = -(percenty + 20) + "%"
    props.width = ((percentx * 2) + 140) + "%"
    props.height = ((percenty * 2) + 140) + "%"
    const fe_gaussian_blur = {
        stdDeviation: blur.saturation / 2
    }
    return h('defs', {}, [
        h('filter', props, [
            h('feFlood', fe_flood),
            h('feBlend', fe_blend),
            h('feGaussianBlur', fe_gaussian_blur)
        ])
    ]);
}

handler[BlurType.Background] = (h: Function, blur: Blur, id: string, frame: ShapeFrame, borders: Border[], fills: Fill[], path: string, shapeType: ShapeType, radius: number[]) => {
    if (!fillOpacity(fills)) return;
    const maskId = "mask-blur" + objectId(blur) + randomId();
    const border = getBorder(borders);
    const width = frame.width + border.left + border.right;
    const height = frame.height + border.top + border.bottom;
    let style: any = {
        'backdrop-filter': ` blur(${blur.saturation / 2}px)`,
        width: "100%",
        height: "100%",
    }
    let elArr = [];
    const props: any = {
        x: -border.left, y: -border.top, width, height
    }
    const mask = h(
        "mask",
        { id: maskId, x: -border.left, y: -border.top, width, height },
        [
            h("path", { d: path, stroke: "white", 'stroke-width': border.top, fill: "white" }),
        ]
    )
    if (border.top === border.left && border.top === border.right && border.bottom === border.top) {
        elArr.push(mask);
        style.mask = "url(#" + maskId + ")"
    } else {
        const max_radius = Math.min(frame.width, frame.height);
        let lt = radius[0];
        if(radius[1] > 0 && radius[3] > 0) {
            lt = Math.min(radius[0], max_radius / 2);
        }
    }
    const div = h('div', { style: style })
    const foreignObject = h("foreignObject", props, [div]);
    elArr.push(foreignObject);
    return h('g', elArr);
}

export function render(h: Function, blur: Blur, id: string, frame: ShapeFrame, borders: Border[], fills: Fill[], path: string, shapeType: ShapeType, radius: number[]) {
    if (!blur || !blur.isEnabled) return [];
    const el = handler[blur.type](h, blur, id, frame, borders, fills, path, shapeType, radius);
    if (!el) return [];
    return [el];
}

const fillOpacity = (fills: Fill[]) => {
    for (let i = 0; i < fills.length; i++) {
        const fill = fills[i];
        if (fill.color.alpha > 0) return true;
    }
    return false;
}

const getBorder = (borders: Border[]) => {
    let border = { top: 0, right: 0, bottom: 0, left: 0 }
    for (let i = 0; i < borders.length; i++) {
        const b = borders[i];
        const { thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = b.sideSetting;
        if (b.position === BorderPosition.Inner) continue;
        if (b.position === BorderPosition.Center) {
            border.top = Math.max(border.top, thicknessTop / 2);
            border.right = Math.max(border.right, thicknessRight / 2);
            border.bottom = Math.max(border.bottom, thicknessBottom / 2);
            border.left = Math.max(border.left, thicknessLeft / 2);
        } else {
            border.top = Math.max(border.top, thicknessTop);
            border.right = Math.max(border.right, thicknessRight);
            border.bottom = Math.max(border.bottom, thicknessBottom);
            border.left = Math.max(border.left, thicknessLeft);
        }
    }
    return border;
}

function is_rect(t: ShapeType) {
    const type = [ShapeType.Rectangle, ShapeType.Artboard, ShapeType.Image, ShapeType.Symbol, ShapeType.SymbolRef, ShapeType.SymbolUnion];
    if (type.includes(t)) return true;
    else return false;
}