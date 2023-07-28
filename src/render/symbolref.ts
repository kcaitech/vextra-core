import { ShapeFrame, ShapeType, SymbolRefShape, SymbolShape } from "../data/classes";
import { renderGroupChilds } from "./group";
import { render as fillR } from "./fill";
import { render as borderR } from "./border"

function renderSym(h: Function, shape: SymbolShape, comsMap: Map<ShapeType, any>, targetFrame: ShapeFrame): any {
    // if (!shape.isVisible) return [];
    const childs: Array<any> = renderGroupChilds(h, shape, comsMap);
    const frame = shape.frame;

    if (targetFrame.width === frame.width && targetFrame.height === frame.height) {
        return childs;
    }

    const props: any = {}
    const scaleX = targetFrame.width / frame.width;
    const scaleY = targetFrame.height / frame.height;
    const style: any = {}
    style.transform = "translate(" + (targetFrame.width / 2) + "px," + (targetFrame.height / 2) + "px) "
    style.transform += `scale(${scaleX}, ${scaleY})`
    style.transform += "translate(" + (-frame.width / 2) + "px," + (-frame.height / 2) + "px)"
    props.style = style;

    return [h('g', props, childs)];
}

export function render(h: Function, shape: SymbolRefShape, comsMap: Map<ShapeType, any>, reflush?: number) {
    const sym = shape.peekSymbol();
    if (!sym) {
        return;
    }
    const frame = shape.frame;
    const childs = [];
    const path = shape.getPath(true).toString();
    // fill
    childs.push(...fillR(h, shape.style, frame, path));
    // border
    childs.push(...borderR(h, shape.style, frame, path));

    // symbol
    childs.push(...renderSym(h, sym, comsMap, shape.frame)); // 有缩放

    const props: any = {}
    if (reflush) props.reflush = reflush;

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