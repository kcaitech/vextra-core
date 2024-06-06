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