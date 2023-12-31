import { GroupShape, Shape, ShapeType, SymbolRefShape, SymbolShape } from "../data/classes";
import { renderWithVars as fillR } from "./fill";
import { renderWithVars as borderR } from "./border";
import { isVisible, randomId } from "./basic";
import { innerShadowId, renderWithVars as shadowR } from "./shadow";

export function renderGroupChilds2(h: Function, childs: Array<Shape>, comsMap: Map<ShapeType, any>,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): Array<any> {
    const nodes: Array<any> = [];
    const cc = childs.length;

    for (let i = 0; i < cc; i++) {
        const child = childs[i];
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: child, key: child.id, varsContainer });
        nodes.push(node);
    }

    return nodes;
}

export function renderGroupChilds3(h: Function, shape: GroupShape, childs: Array<Shape>, comsMap: Map<ShapeType, any>,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    // const nodes: Array<any> = [];
    // const cc = childs.length;

    const frame = shape.frame;
    let rotate = (shape.rotation ?? 0);
    let hflip = !!shape.isFlippedHorizontal;
    let vflip = !!shape.isFlippedVertical;
    const nodes: Array<any> = renderGroupChilds2(h, childs, comsMap, varsContainer);
    return { nodes, frame, notTrans: shape.isNoTransform(), hflip, vflip, rotate };

}

export function renderGroupChilds(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): Array<any> {
    return renderGroupChilds2(h, shape.childs, comsMap, varsContainer);
}

export function render(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    reflush?: number): any {
    if (!isVisible(shape, varsContainer)) return;

    const {
        nodes,
        frame,
        notTrans,
        hflip,
        vflip,
        rotate
    } = renderGroupChilds3(h, shape, shape.childs, comsMap, varsContainer);

    const path = shape.getPathStr();
    const childs: Array<any> = [];

    // fill
    childs.push(...fillR(h, shape, frame, path, varsContainer));

    // childs
    childs.push(...nodes);
    // border
    childs.push(...borderR(h, shape, frame, path, varsContainer));

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

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
    const shadows = shape.style.shadows;
    const shape_id = shape.id.slice(0, 4) + randomId();
    const shadow = shadowR(h, shape_id, shape, frame, path, varsContainer);
    if (shadow.length) {
        const ex_props = Object.assign({}, props);
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