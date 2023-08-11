import { Shape } from "../data/classes";
import { render as renderB } from "./line_borders";

export function render(h: Function, shape: Shape, reflush?: number) {
    if (!shape.isVisible) return;
    const frame = shape.frame;
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
    let childs = new Array();
    if (shape.style.borders.length) {
        const path = shape.getPath().toString();
        childs = childs.concat(renderB(h, shape.style, path));
        return h('g', props, childs);
    } else {
        props.stroke = '#000000', props['stroke-width'] = 1, props.d = shape.getPath().toString();
        return h('path', props);
    }
}