import { SymbolShape, ShapeType, SymbolUnionShape } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { isVisible, randomId } from "./basic";
import { renderGroupChilds2 } from "./group";
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

export function render(h: Function, shape: SymbolShape, comsMap: Map<ShapeType, any>, reflush?: number): any {

    // todo
    if (!isVisible(shape, undefined)) return;

    const frame = shape.frame;
    const path0 = shape.getPath();
    const path = path0.toString();
    const childs: Array<any> = [];

    // fill
    childs.push(...fillR(h, shape.style.fills, frame, path));
    // childs
    childs.push(...renderSym(h, shape, comsMap));
    // border
    childs.push(...borderR(h, shape.style.borders, frame, path));

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    if (frame.width > frame.height) {
        props.transform = `translate(0, ${(frame.width - frame.height) / 2})`;
    } else {
        props.transform = `translate(${(frame.height - frame.width) / 2}, 0)`;
    }
    const shadows = shape.style.shadows;
    const ex_props = Object.assign({}, props);
    const shape_id = shape.id.slice(0, 4) + randomId();
    const shadow = shadowR(h, shape_id, shape, path);
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