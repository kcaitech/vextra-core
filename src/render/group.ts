import { GroupShape, Shape, ShapeType } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { isVisible } from "./basic";

export function renderGroupChilds2(h: Function, childs: Array<Shape>, comsMap: Map<ShapeType, any>): Array<any> {
    const nodes: Array<any> = [];
    const cc = childs.length;

    for (let i = 0; i < cc; i++) {
        const child = childs[i];
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: child, key: child.id });
        nodes.push(node);
    }

    return nodes;
}

export function renderGroupChilds(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>): Array<any> {
    return renderGroupChilds2(h, shape.childs, comsMap);
}

export function render(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>, reflush?: number): any {

    if (!isVisible(shape)) return;

    const frame = shape.frame;
    const path0 = shape.getPath();
    const path = path0.toString();
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
    return h('g', props, childs);
}