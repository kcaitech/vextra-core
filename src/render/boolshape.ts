import { Shape } from "@/data/shape";
import { render as fillR } from "@/render/fill";
import { render as borderR } from "@/render/border"

export function render(h: Function, shape: Shape, path: string, reflush?: number) {

    const childs = [];

    // fill
    childs.push(...fillR(h, shape, path));

    // border
    childs.push(...borderR(h, shape, path));

    // ----------------------------------------------------------
    // shadows todo

    if (childs.length == 0) {
        return h('path', {
            d: path,
            "fill-opacity": 1,
            fill: 'none',
            stroke: 'none',
            'stroke-width': 0,
            reflush
            // transform: "translate(" + frame.x + " " + frame.y + ")",
        });
    }
    // else if (childs.length == 1) {
    //     return transform(childs[0], h);
    // }
    else {
        return h("g", {reflush}, childs);
    }
}
