import { ShapeFrame } from "../data/typesdefine";
import { Blur, BlurType } from "../data/baseclasses";
const handler: { [key: string]: (h: Function, blur: Blur, id: string, frame: ShapeFrame) => any } = {};

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

export function render(h: Function, blur: Blur, id: string, frame: ShapeFrame) {
    if (!blur || !blur.isEnabled) return [];
    return [handler[blur.type](h, blur, id, frame)];
}