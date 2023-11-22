import { SymbolShape, ShapeType } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { isVisible } from "./basic";
import { renderGroupChilds2 } from "./group";

function renderSym(h: Function,
    sym: SymbolShape,
    comsMap: Map<ShapeType, any>): any {

    const p = sym.parent;
    const varsContainer = [];
    if (p && p instanceof SymbolShape && p.isUnionSymbolShape) {
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
    if (!isVisible(shape, undefined, undefined)) return;

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
    return h('g', props, childs);
}