import { Blur, BlurType, BorderPosition, ShapeType, SideType } from "../data/baseclasses";
import { render as borderR } from "./border";
import { Shape, ShapeSize } from "../data/classes";
import { randomId } from "./basic";
import { Border, Fill } from "../data/style";
import { objectId } from '../basic/objectid';
const handler: { [key: string]: (h: Function, blur: Blur, id: string, frame: ShapeSize, fills: Fill[], path: string) => any } = {};

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

handler[BlurType.Background] = (h: Function, blur: Blur, id: string, frame: ShapeSize, fills: Fill[], path: string) => {
    if (!fillOpacity(fills)) return;
    const clipId = "clip-blur" + objectId(blur) + randomId();
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
    const clipPath = h(
        "clipPath",
        { id: clipId, x: 0, y: 0, width, height },
        [
            h("path", { d: path, fill: "white" }),
        ]
    )
    elArr.push(clipPath);
    props['clip-path'] = "url(#" + clipId + ")"
    style['backdrop-filter'] = `blur(${blur.saturation / 2}px)`;
    const div = h('div', { style: style }, [h('div', { style: style })])
    const foreignObject = h("foreignObject", props, [div]);
    elArr.push(foreignObject);
    return h('g', elArr);
}

export function render(h: Function, blur: Blur, id: string, frame: ShapeSize, fills: Fill[], path: string) {
    if (!blur || !blur.isEnabled) return [];
    if (blur.type !== BlurType.Gaussian) return [];
    const el = handler[blur.type](h, blur, id, frame, fills, path);
    if (!el) return [];
    return [el];
}

const fillOpacity = (fills: Fill[]) => {
    for (let i = 0; i < fills.length; i++) {
        const fill = fills[i];
        if (fill.color.alpha > 0 && fill.isEnabled) return true;
    }
    return false;
}
