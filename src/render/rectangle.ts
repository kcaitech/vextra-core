import { Shape } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { innerShadowId, render as shadowR } from "./shadow";

export function render(h: Function, shape: Shape, reflush?: number) {
    // if (this.data.booleanOperation != BooleanOperation.None) {
    //     // todo 只画selection
    //     return;
    // }
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;

    const frame = shape.frame;
    const childs = [];
    const path = shape.getPath().toString();
    // fill
    childs.push(...fillR(h, shape.style.fills, frame, path));
    // border
    childs.push(...borderR(h, shape.style.borders, frame, path));


    const props: any = {}
    if (reflush) {
        props.reflush = reflush;
    }

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    if (shape.isNoTransform()) {
        props.transform = `translate(${frame.x},${frame.y})`;
    } else {
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

    if (childs.length == 0) {
        props["fill-opacity"] = 1;
        props.d = path;
        props.fill = 'none';
        props.stroke = 'none';
        props["stroke-width"] = 0;
        return h('path', props);
    }
    else {
        const shadows = shape.style.shadows;
        const ex_props = Object.assign({}, props);
        const shape_id = shape.id.slice(0, 4);
        const shadow = shadowR(h, shape.style, frame, shape_id, path);
        if (shadow.length) {
            delete props.style;
            delete props.transform;
            const inner_url = innerShadowId(shape_id, shadows);
            if(shadows.length) props.filter = `${inner_url} url(#dorp-shadow-${shape_id})`;
            const body = h("g", props, childs);
            return h("g", ex_props, [...shadow, body]);
        } else {
            return h("g", props, childs);
        }
    }
}