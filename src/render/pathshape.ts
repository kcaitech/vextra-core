import { PathShape, SymbolRefShape, SymbolShape } from "../data/classes";
import { renderWithVars as fillR } from "./fill";
import { renderWithVars as borderR } from "./border"
import { isVisible, randomId } from "./basic";
import { innerShadowId, renderWithVars as shadowR } from "./shadow";

export function render(h: Function, shape: PathShape,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    reflush?: number) {

    if (!isVisible(shape, varsContainer)) return;

    const frame = shape.frame;

    let rotate = (shape.rotation ?? 0);
    let hflip = !!shape.isFlippedHorizontal;
    let vflip = !!shape.isFlippedVertical;

    const path = shape.getPathStr();
    const notTrans = shape.isNoTransform()

    const childs = [];

    // fill
    childs.push(...fillR(h, shape, frame, path, varsContainer));
    // border
    childs.push(...borderR(h, shape, frame, path, varsContainer));

    // ----------------------------------------------------------
    // shadows todo

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    if (notTrans) {
        props.transform = `translate(${frame.x},${frame.y})`;
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
    if (childs.length == 0) {
        props["fill-opacity"] = 1;
        props.d = path;
        props.fill = 'none';
        props.stroke = 'none';
        props["stroke-width"] = 0;
        return h('path', props);
    } else {
        const shadows = shape.style.shadows;
        const shape_id = shape.id.slice(0, 4) + randomId();
        const shadow = shadowR(h, shape_id, shape, frame, path, varsContainer);
        if (shadow.length) {
            const ex_props = Object.assign({}, props);
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
}