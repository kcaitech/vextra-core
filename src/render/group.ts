import { GroupShape, ShapeType } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { render as shadowR } from "./shadow";

export function renderGroupChilds(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>): Array<any> {
    const childs: Array<any> = [];
    const cc = shape.childs.length;

    for (let i = 0; i < cc; i++) {
        const child = shape.childs[i];
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: child, key: child.id });
        childs.push(node);
    }

    return childs;
}

export function render(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>, reflush?: number): any {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;

    const frame = shape.frame;
    const path = shape.getPath().toString();
    const childs: Array<any> = [];
    // fill
    childs.push(...fillR(h, shape.style.fills, frame, path));
    // childs
    childs.push(...renderGroupChilds(h, shape, comsMap));
    // border
    childs.push(...borderR(h, shape.style.borders, frame, path));

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    if (shape.isFlippedHorizontal || shape.isFlippedVertical || shape.rotation) {
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