import { ShapeType, TableShape } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { render as rCell } from "./tablecell";

export function render(h: Function, shape: TableShape, comsMap: Map<ShapeType, any>, reflush?: number): any {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;
    const frame = shape.frame;
    const nodes = [];
    const path = shape.getPath().toString();
    const childspath = shape.childs.map((c) => {
        const path = c.getPath();
        return path.toString();
    });
    const cc = shape.childs.length;

    // fill
    nodes.push(...fillR(h, shape.style, frame, path));
    for (let i = 0; i < cc; i++) {
        const child = shape.childs[i];
        const fill = fillR(h, child.style, child.frame, childspath[i]);
        nodes.push(h("g", { transform: `translate(${child.frame.x},${child.frame.y})` }, fill));
    }

    // content
    for (let i = 0; i < cc; i++) {
        const child = shape.childs[i];
        const node = rCell(h, child)
        if (node) nodes.push(node);
    }

    // todo 边框位置
    // border
    nodes.push(...borderR(h, shape.style, frame, path));
    for (let i = 0; i < cc; i++) {
        const child = shape.childs[i];
        const style = child.style.borders.length > 0 ? child.style : shape.style;

        // todo 边框会互相覆盖
        const node = borderR(h, style, child.frame, childspath[i]) // todo 上下左右
        nodes.push(h("g", { transform: `translate(${child.frame.x},${child.frame.y})` }, node));
    }

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
    return h('g', props, nodes);
}