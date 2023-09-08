import { OverrideShape, PathShape } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border"
import { isVisible } from "./basic";

export function render(h: Function, shape: PathShape, override: OverrideShape | undefined, reflush?: number) {
    // if (this.data.boolOp != BoolOp.None) {
    //     // todo 只画selection
    //     return;
    // }

    if (!isVisible(shape, override)) return;

    const frame = shape.frame;
    const path = shape.getPath().toString();
    const childs = [];

    // fill
    if (override && override.override_fills) {
        childs.push(...fillR(h, override.style.fills, frame, path));
    }
    else {
        childs.push(...fillR(h, shape.style.fills, frame, path));
    }
    // border
    if (override && override.override_borders) {
        childs.push(...borderR(h, override.style.borders, frame, path));
    }
    else {
        childs.push(...borderR(h, shape.style.borders, frame, path));
    }

    // ----------------------------------------------------------
    // shadows todo

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