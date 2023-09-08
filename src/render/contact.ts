import { Matrix } from "../basic/matrix";
import { Shape } from "../data/classes";
import { render as renderB } from "./contact_borders";

export function render(h: Function, shape: Shape, path: string, reflush?: number) {
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
    // const tps = shape.getTemp();
    // if (tps && tps.length) {
    //     const matrixx = new Matrix();
    //     matrixx.preScale(frame.width, frame.height);
    //     for (let i = 0; i < tps.length; i++) {
    //         const p = matrixx.computeCoord3(tps[i].point);
    //         childs.push(h('rect', { x: p.x - 3, y: p.y - 3, width: 6, height: 6, fill: 'red' }));
    //     }
    // }
    if (shape.style.borders.length) {
        childs = childs.concat(renderB(h, shape.style, path, shape));
        return h('g', props, childs);
    } else {
        props.stroke = '#000000', props['stroke-width'] = 1, props.d = path;
        return h('path', props);
    }
}