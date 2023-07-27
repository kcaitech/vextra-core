import { objectId } from "../basic/objectid";
import { ImageShape } from "../data/classes";
import { render as borderR } from "./border";
import { render as clippathR } from "./clippath"

export function render(h: Function, shape: ImageShape, url: string, reflush?: number) {
    if (!shape.isVisible) return;
    const frame = shape.frame;

    const path = shape.getPath(true).toString();
    const id = "clippath-image-" + objectId(shape);
    const cp = clippathR(h, id, path);
    const childs = [cp];

    const img = h("image", {
        'xlink:href': url,
        width: frame.width,
        height: frame.height,
        x: 0,
        y: 0,
        'preserveAspectRatio': 'none meet',
        "clip-path": "url(#" + id + ")"
    });
    childs.push(img);

    // border
    childs.push(...borderR(h, shape, path));

    const props: any = {}
    props.width = frame.width;
    props.height = frame.height;
    if (!shape.isNoTransform()) {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (shape.isFlippedHorizontal) style.transform += "rotateY(180deg) "
        if (shape.isFlippedVertical) style.transform += "rotateX(180deg) "
        if (shape.rotation) style.transform += "rotate(" + shape.rotation + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
    }
    else {
        props.transform = `translate(${frame.x},${frame.y})`
    }
    if (reflush) props.reflush = reflush;

    return h("g", props, childs);
}