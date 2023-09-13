import { OverrideShape, ShapeFrame, ShapeType, SymbolRefShape } from "../data/classes";
import { renderGroupChilds } from "./group";
import { render as fillR } from "./fill";
import { render as borderR } from "./border"
import { GroupShape } from "../data/shape";

function renderSym(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>, targetFrame: ShapeFrame, overrides: SymbolRefShape[] | undefined): any {

    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;

    const childs: Array<any> = renderGroupChilds(h, shape, comsMap, overrides);
    const frame = shape.frame;

    if (targetFrame.width === frame.width && targetFrame.height === frame.height) {
        return childs;
    }

    // 不是直接缩放！
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

export function render(h: Function, shape: SymbolRefShape, comsMap: Map<ShapeType, any>, overrides: SymbolRefShape[] | undefined, consumeOverride: OverrideShape[] | undefined, reflush?: number) {
    const sym = shape.peekSymbol();
    if (!sym) {
        return;
    }
    const frame = shape.frame;
    const childs = [];
    const path = shape.getPath().toString();
    // fill
    childs.push(...fillR(h, shape.style.fills, frame, path));
    // border
    childs.push(...borderR(h, shape.style.borders, frame, path));

    // symbol
    const subOverrides = [];
    if (overrides) subOverrides.push(...overrides);
    subOverrides.push(shape);
    childs.push(...renderSym(h, sym, comsMap, shape.frame, subOverrides)); // 有缩放

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