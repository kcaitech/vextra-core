import { GroupShape, OverrideShape, ShapeType, SymbolRefShape } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { isVisible } from "./basic";
import { OverrideType, findOverride } from "../data/symproxy";
import { Matrix } from "../basic/matrix";

export function renderGroupChilds(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>, overrides: SymbolRefShape[] | undefined, matrix: Matrix | undefined): Array<any> {
    const childs: Array<any> = [];
    const cc = shape.childs.length;

    for (let i = 0; i < cc; i++) {
        const child = shape.childs[i];
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: child, key: child.id, overrides, matrix });
        childs.push(node);
    }

    return childs;
}

export function render(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>, overrides: SymbolRefShape[] | undefined, consumeOverride: OverrideShape[] | undefined, matrix: Matrix | undefined, reflush?: number): any {

    if (!isVisible(shape, overrides)) return;

    const frame = shape.frame;
    const path0 = shape.getPath();
    if (matrix) path0.transform(matrix);
    const path = path0.toString();
    const childs: Array<any> = [];

    // fill
    if (overrides) {
        const o = findOverride(overrides, shape.id, OverrideType.Fills);
        if (o) {
            childs.push(...fillR(h, o.override.style.fills, frame, path));
            if (consumeOverride) consumeOverride.push(o.override);
        }
        else {
            childs.push(...fillR(h, shape.style.fills, frame, path));
        }
    }
    else {
        childs.push(...fillR(h, shape.style.fills, frame, path));
    }
    // childs
    childs.push(...renderGroupChilds(h, shape, comsMap, overrides, matrix));
    // border
    if (overrides) {
        const o = findOverride(overrides, shape.id, OverrideType.Borders);
        if (o) {
            childs.push(...borderR(h, o.override.style.borders, frame, path));
            if (consumeOverride) consumeOverride.push(o.override);
        }
        else {
            childs.push(...borderR(h, shape.style.borders, frame, path));
        }
    }
    else {
        childs.push(...borderR(h, shape.style.borders, frame, path));
    }

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