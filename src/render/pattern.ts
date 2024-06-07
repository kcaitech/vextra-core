import { ImageShape } from "../data/shape";
import { randomId } from "./basic";
export function patternRender(h: Function, shape: ImageShape, id: string, path: string, url: string): any {
    const frame = shape.frame;
    const props: any = {
        'xlink:href': url,
        width: frame.width,
        height: frame.height,
        x: 0,
        y: 0,
        'preserveAspectRatio': 'none meet',
    };
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