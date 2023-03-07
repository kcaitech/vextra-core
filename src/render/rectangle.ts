import { Shape } from "@/data/data/shape";
import { render as fillR } from "@/render/fill";
import { render as borderR } from "@/render/border"

export function render(h: Function, shape: Shape, reflush?: number) {

    // if (this.data.booleanOperation != BooleanOperation.None) {
    //     // todo 只画selection
    //     return;
    // }

    const frame = shape.frame;
    const childs = [];
    const path = shape.getPath(true);
    // fill
    childs.push(...fillR(h, shape, path));
    // border
    childs.push(...borderR(h, shape, path));

    if (childs.length == 0) {
        // todo
        return h('rect', { "fill-opacity": 1, stroke: 'none', 'stroke-width': 0, x: frame.x, y: frame.y, width: frame.width, height: frame.height,
        reflush: reflush });
    }
    // else if (childs.length == 1) {
    //     return transform(childs[0], h);
    // }
    else {
        return h("g", {reflush: reflush}, childs);
    }
}