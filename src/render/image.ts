import { ImageShape, SymbolRefShape, SymbolShape } from "../data/classes";
import { isVisible, randomId } from "./basic";
import { renderWithVars as borderR } from "./border";
import { render as clippathR } from "./clippath"
import { innerShadowId, renderWithVars as shadowR } from "./shadow";

let clip_id: number = 0;
export function render(h: Function, shape: ImageShape, imgPH: string,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    reflush?: number) {

    if (!isVisible(shape, varsContainer)) return;

    const frame = shape.frame;
    let rotate = (shape.rotation ?? 0);
    let hflip = !!shape.isFlippedHorizontal;
    let vflip = !!shape.isFlippedVertical;

    const path = shape.getPathStr();
    const notTrans = shape.isNoTransform()


    const id = "clippath-image-" + (clip_id++);
    const cp = clippathR(h, id, path);
    const childs = [cp];

    const url = shape.peekImage(true);

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
    childs.push(...borderR(h, shape, frame, path, varsContainer));

    const props: any = {}
    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    props.width = frame.width;
    props.height = frame.height;
    if (notTrans) {
        props.transform = `translate(${frame.x},${frame.y})`
    } else {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (hflip) style.transform += "rotateY(180deg) "
        if (vflip) style.transform += "rotateX(180deg) "
        if (rotate) style.transform += "rotate(" + rotate + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
    }
    if (reflush) props.reflush = reflush;
    const shadows = shape.style.shadows;
    const ex_props = Object.assign({}, props);
    const shape_id = shape.id.slice(0, 4) + randomId();
    const shadow = shadowR(h, shape_id, shape, frame, path, varsContainer);
    if (shadow.length) {
        delete props.style;
        delete props.transform;
        delete props.opacity;
        const inner_url = innerShadowId(shape_id, shadows);
        if (shadows.length) props.filter = `url(#pd_outer-${shape_id}) ${inner_url}`;
        const body = h("g", props, childs);
        return h("g", ex_props, [...shadow, body]);
    } else {
        return h("g", props, childs);
    }
}