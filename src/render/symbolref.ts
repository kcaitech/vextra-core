import { ShapeType, SymbolRef } from "@/data/shape";
import { renderGroupChilds as gR } from "@/render/group";
import { render as fillR } from "@/render/fill";
import { render as borderR } from "@/render/border"

export function render(h: Function, shape: SymbolRef, comsMap: Map<ShapeType, any>, reflush?: number) {
    const sym = shape.peekSymbol();
    if (!sym) {
        return;
    }
    const frame = shape.frame;
    const childs = [];
    const path = shape.getPath(true);
    // fill
    childs.push(...fillR(h, shape, path));
    // border
    childs.push(...borderR(h, shape, path));

    // symbol
    childs.push(...gR(h, sym, comsMap));

    if (childs.length == 0) {
        // todo
        return h('rect', {
            reflush,
            "fill-opacity": 1,
            stroke: 'none',
            'stroke-width': 0,
            x: frame.x,
            y: frame.y,
            width: frame.width,
            height: frame.height
        });
    }
    // else if (childs.length == 1) {
    //     return transform(childs[0], h);
    // }
    else {
        return h("g", { transform: 'translate(' + frame.x + ',' + frame.y + ')', reflush }, childs);
    }
}