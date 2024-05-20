import { ImageShape } from "../data/shape";
import { randomId } from "./basic";
export function patternRender(h: Function, shape: ImageShape, id: string, path: string, url: string): any {
    const frame = shape.frame;
    const clip = shape.isClip;
    const pattern_frame = shape.patternFrame;
    const style: any = {};
    const props: any = {
        'xlink:href': url,
        width: frame.width,
        height: frame.height,
        x: 0,
        y: 0,
        'preserveAspectRatio': 'none meet',
    };
    if (pattern_frame) {
        props.width = frame.width * pattern_frame.width;
        props.height = frame.height * pattern_frame.height;
        props.x = pattern_frame.x * pattern_frame.width;
        props.y = pattern_frame.y * pattern_frame.height;
        style.transform = "translate(" + (pattern_frame.width / 2) + "px," + (pattern_frame.height / 2) + "px) ";
        if (!!pattern_frame.isFlippedHorizontal) style.transform += "rotateY(180deg) ";
        if (!!pattern_frame.isFlippedVertical) style.transform += "rotateX(180deg) ";
        if (pattern_frame.rotation) style.transform += "rotate(" + pattern_frame.rotation + "deg) ";
        style.transform += "translate(" + (-pattern_frame.width / 2) + "px," + (-pattern_frame.height / 2) + "px)";
        props.style = style;
    }
    const img = h("image", props);
    const pattern = h('pattern', {
        width: frame.width + 1,
        height: frame.height + 1,
        x: 0,
        y: 0,
        patternUnits: 'userSpaceOnUse',
        id: id,
    }, [img]);
    return pattern;
}

export function renderMaskPattern(h: Function, path: string, shape: ImageShape, url: string): any {

}

const clip_props = (shape: ImageShape) => {
    const frame = shape.frame;
    const pattern_frame = shape.patternFrame;
    if (!pattern_frame) return {};
    const props: any = {}
    const style: any = {};
    if (shape.isNoTransform()) {
        if (frame.x !== 0 || frame.y !== 0) style.transform = `translate(${frame.x}px,${frame.y}px)`
    } else {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (shape.isFlippedHorizontal) style.transform += "rotateY(180deg) "
        if (shape.isFlippedVertical) style.transform += "rotateX(180deg) "
        if (shape.rotation) style.transform += "rotate(" + shape.rotation + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
    }
    props.style = style;
    return props;
}