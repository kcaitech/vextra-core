import { Blur, BlurType, BorderPosition } from "../data/baseclasses";
import { Border, Fill, ShapeSize } from "../data";
import { randomId } from "./basic";
import { objectId } from '../basic/objectid';

const handler: {
    [key: string]: (h: Function, blur: Blur, id: string, frame: ShapeSize, fills: Fill[], borders: Border[], path: string) => any
} = {};

handler[BlurType.Gaussian] = (h: Function, blur: Blur, id: string, frame: ShapeSize) => {
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

handler[BlurType.Background] = (h: Function, blur: Blur, id: string, frame: ShapeSize, fills: Fill[], borders: Border[], path: string) => {
    // const alphaFill = opacity(fills);
    const alphaBorder = opacity(borders);
    // if (!alphaFill && !alphaBorder) return;
    const _id = "mask-blur" + objectId(blur) + randomId();
    const width = frame.width;
    const height = frame.height;
    let style: any = {
        width: "100%",
        height: "100%",
    }
    let elArr = [];
    const props: any = {
        x: 0, y: 0, width, height
    }
    const children = [h("path", { d: path, fill: "white" })];
    if (alphaBorder) {
        for (let i = 0; i < borders.length; i++) {
            const border = borders[i];
            let sw = border.sideSetting.thicknessTop;
            if (border.position === BorderPosition.Inner) continue;
            if (border.position === BorderPosition.Outer) sw *= 2;
            const props: any = { d: path, fill: 'white', stroke: 'white', 'stroke-width': sw };
            if (border.borderStyle.gap) props['stroke-dasharray'] = 10
            children.push(h('path', props));
        }
    }
    const mask = h("mask", { id: _id }, children);
    elArr.push(mask);
    style['backdrop-filter'] = `blur(${blur.saturation / 2}px)`;
    style['mask'] = "url(#" + _id + ")";
    const div = h('div', { style: style });
    const foreignObject = h("foreignObject", props, div);
    elArr.push(foreignObject);
    return h('g', elArr);
}

export function render(h: Function, blur: Blur, id: string, frame: ShapeSize, fills: Fill[], borders: Border[], path: string) {
    if (!blur || !blur.isEnabled) return [];
    const el = handler[blur.type](h, blur, id, frame, fills, borders, path);
    if (!el) return [];
    return [el];
}

const opacity = (t: (Fill | Border)[]) => {
    for (let i = 0; i < t.length; i++) {
        const __t = t[i];
        if (__t.color.alpha > 0 && __t.isEnabled) return true;
    }
    return false;
}
