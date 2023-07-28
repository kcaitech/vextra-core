import { PathShape } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border"

export function render(h: Function, shape: PathShape, reflush?: number) {
    // if (this.data.boolOp != BoolOp.None) {
    //     // todo 只画selection
    //     return;
    // }
    if (!shape.isVisible) return;
    const frame = shape.frame;
    const path = shape.getPath().toString();
    const childs = [];

    // fill
    childs.push(...fillR(h, shape.style, frame, path));

    // border
    childs.push(...borderR(h, shape.style, frame, path));

    // ----------------------------------------------------------
    // shadows todo

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