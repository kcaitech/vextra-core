import { ShapeType, SymbolUnionShape, SymbolShape } from "../data/classes";
import { renderGroupChilds2 } from "./group";
import { renderWithVars as fillR } from "./fill";
import { renderWithVars as borderR } from "./border"
import { isVisible, randomId } from "./basic";
import { innerShadowId, renderWithVars as shadowR } from "./shadow";
function renderSym(h: Function,
    sym: SymbolShape,
    comsMap: Map<ShapeType, any>): any {

    const p = sym.parent;
    const varsContainer = [];
    if (p && p instanceof SymbolUnionShape) {
        varsContainer.push(p);
    }
    varsContainer.push(sym);
    // 应该同groupshape
    const childs = sym.childs;
    const nodes = renderGroupChilds2(h, childs, comsMap, undefined, varsContainer);
    return nodes;

}

export function render(h: Function,
    shape: SymbolShape,
    comsMap: Map<ShapeType, any>,
    reflush?: number) {

    if (!isVisible(shape, undefined)) return;


    const rotate = (shape.rotation ?? 0);
    const hflip = !!shape.isFlippedHorizontal;
    const vflip = !!shape.isFlippedVertical;
    const frame = shape.frame;

    const path0 = shape.getPath();
    const notTrans = shape.isNoTransform()

    const childs = [];
    // const path0 = shape.getPathOfFrame(frame);
    const path = path0.toString();

    // fill
    childs.push(...fillR(h, shape, frame, path, undefined));
    // border
    childs.push(...borderR(h, shape, frame, path, undefined));

    // symbol
    childs.push(...renderSym(h, shape, comsMap));

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
    }
    else {
        const shadows = shape.style.shadows;
        const ex_props = Object.assign({}, props);
        const shape_id = shape.id.slice(0, 4) + randomId();
        const shadow = shadowR(h, shape_id, shape, frame, path);
        if (shadow.length) {
            delete props.style;
            delete props.transform;
            const inner_url = innerShadowId(shape_id, shadows);
            if (shadows.length) props.filter = `url(#pd_outer-${shape_id}) ${inner_url}`;
            const body = h("g", props, childs);
            return h("g", ex_props, [...shadow, body]);
        } else {
            return h("g", props, childs);
        }
    }
}