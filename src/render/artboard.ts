import { renderGroupChilds as gR } from "./group";
import { render as borderR } from "./border";
import { Artboard, ShapeType, Color } from '../data/classes';

const defaultColor = Color.DefaultColor;
// artboard单独一个svg节点，需要设置overflow
export function render(h: Function, shape: Artboard, comsMap: Map<ShapeType, any>, reflush?: number) {
    if (!shape.isVisible) return;
    const ab_props: any = {
        version: "1.1",
        xmlns: "http://www.w3.org/2000/svg",
        "xmlns:xlink": "http://www.w3.org/1999/xlink",
        "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
        preserveAspectRatio: "xMinYMin meet",
        reflush,
        overflow: "hidden"
    }
    const childs = [];
    const frame = shape.frame;
    ab_props.width = frame.width, ab_props.height = frame.height;
    ab_props.viewBox = `0 0 ${frame.width} ${frame.height}`;
    // background 背景色垫底
    const fills = shape.style.fills;
    if (fills && fills.length) {
        for (let i = 0; i < fills.length; i++) {
            const color = fills[i].color || defaultColor;
            childs.push(h("rect", {
                x: 0, y: 0, width: frame.width, height: frame.height,
                fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")"
            }))
        }
    }
    childs.push(...gR(h, shape, comsMap)); // 后代元素放中间
    const b_len = shape.style.borders.length;
    if (shape.isNoTransform()) {
        if (b_len) {
            const props: any = {}
            if (reflush) props.reflush = reflush;
            props.transform = `translate(${frame.x},${frame.y})`;
            const path = shape.getPath().toString();
            ab_props.x = 0, ab_props.y = 0;
            return h("g", props, [h('svg', ab_props, childs), ...borderR(h, shape.style, frame, path)]);
        } else {
            ab_props.x = frame.x, ab_props.y = frame.y;
            return h('svg', ab_props, childs);
        }
    } else {
        const props: any = {}
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (shape.isFlippedHorizontal) style.transform += "rotateY(180deg) "
        if (shape.isFlippedVertical) style.transform += "rotateX(180deg) "
        if (shape.rotation) style.transform += "rotate(" + shape.rotation + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
        if (reflush) props.reflush = reflush;
        ab_props.x = 0, ab_props.y = 0;
        if (b_len) {
            const path = shape.getPath().toString();
            return h("g", props, [h('svg', ab_props, childs), ...borderR(h, shape.style, frame, path)], h('use', { 'xlink:href': '#arrow1' }));
        } else {
            return h("g", props, [h('svg', ab_props, childs)]);
        }
    }
}