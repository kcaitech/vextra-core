import { objectId } from "../basic/objectid";
import { ImageShape } from "../data/classes";
import { render as borderR } from "./border";
import { render as clippathR } from "./clippath";
import { render as shadowR } from "./shadow";

export function render(h: Function, shape: ImageShape, url: string, reflush?: number) {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;

    const frame = shape.frame;

    const path = shape.getPath().toString();
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
    childs.push(...borderR(h, shape.style.borders, frame, path));

    const props: any = {}
    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

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
    const shadows = shape.style.shadows;
    const ex_props = Object.assign({}, props);
    const shape_id = shape.id.slice(0, 4);
    const shadow = shadowR(h, shape.style, frame, shape_id);
    if (shadow.length) {
        delete props.style;
        delete props.transform;
        if(shadows.length) props.filter = `url(#dorp-shadow-${shape_id})`;
        const body = h("g", props, childs);
        return h("g", ex_props, [...shadow, body]);
    }  else {
        return h("g", props, childs);
    }
}