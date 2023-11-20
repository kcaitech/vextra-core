import { Shape } from "../data/classes";
import { render as renderB } from "./line_borders";
import { innerShadowId, outerShadowId, render as shadowR } from "./shadow";

export function render(h: Function, shape: Shape, reflush?: number) {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;

    const frame = shape.frame;
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
    let childs = new Array();
    if (shape.style.borders.length) {
        const path = shape.getPath().toString();
        childs = childs.concat(renderB(h, shape.style, path, shape));
        const shadows = shape.style.shadows;
        const ex_props = Object.assign({}, props);
        const shape_id = shape.id.slice(0, 4);
        const shadow = shadowR(h, shape_id, path, shape);
        if (shadow.length) {
            delete props.style;
            delete props.transform;
            const inner_url = innerShadowId(shape_id, shadows);
            const outer_url = outerShadowId(shape_id, shadows);
            if(shadows.length) props.filter = `${inner_url} ${outer_url}`;
            const body = h("g", props, childs);
            return h("g", ex_props, [...shadow, body]);
        } else {
            return h("g", props, childs);
        }
    } else {
        props.stroke = '#000000', props['stroke-width'] = 1, props.d = shape.getPath().toString();
        return h('path', props);
    }
}