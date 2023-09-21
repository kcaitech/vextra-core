import { ShapeType, SymbolRefShape } from "../data/classes";
import { renderGroupChilds2 } from "./group";
import { render as fillR } from "./fill";
import { render as borderR } from "./border"

function renderSym(h: Function, ref: SymbolRefShape, comsMap: Map<ShapeType, any>): any {

    // const isVisible = ref.isVisible ?? true;
    // if (!isVisible) return [];

    const vchilds = ref.virtualChilds;
    const childs: Array<any> = vchilds ? renderGroupChilds2(h, vchilds, comsMap) : [];
    return childs;
}

export function render(h: Function, shape: SymbolRefShape, comsMap: Map<ShapeType, any>, reflush?: number) {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return

    const sym = shape.peekSymbol(true);
    if (!sym) {
        return;
    }
    const frame = shape.frame;
    const childs = [];
    const path0 = shape.getPath();
    const path = path0.toString();
    // fill
    childs.push(...fillR(h, shape.style.fills, frame, path));
    // border
    childs.push(...borderR(h, shape.style.borders, frame, path));

    // symbol
    childs.push(...renderSym(h, shape, comsMap));

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

    if (childs.length == 0) {
        props["fill-opacity"] = 1;
        props.d = path;
        props.fill = 'none';
        props.stroke = 'none';
        props["stroke-width"] = 0;
        return h('path', props);
    }
    else {
        return h("g", props, childs);
    }
}