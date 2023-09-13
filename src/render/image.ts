import { OverrideType, findOverride } from "../data/symproxy";
import { objectId } from "../basic/objectid";
import { ImageShape, OverrideShape, SymbolRefShape } from "../data/classes";
import { isVisible } from "./basic";
import { render as borderR } from "./border";
import { render as clippathR } from "./clippath"

export function render(h: Function, shape: ImageShape, imgPH: string, overrides: SymbolRefShape[] | undefined, consumeOverride: OverrideShape[] | undefined, reflush?: number) {

    if (!isVisible(shape, overrides)) return;

    const frame = shape.frame;

    const path = shape.getPath().toString();
    const id = "clippath-image-" + objectId(shape);
    const cp = clippathR(h, id, path);
    const childs = [cp];

    let url;
    if (overrides) {
        const o = findOverride(overrides, shape.id, OverrideType.Image);
        if (o) {
            url = o.override.peekImage(true);
            if (consumeOverride) consumeOverride.push(o.override);
        }
        else {
            url = shape.peekImage(true);
        }
    }
    else {
        url = shape.peekImage(true);
    }

    const img = h("image", {
        'xlink:href': url ?? imgPH,
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

    return h("g", props, childs);
}