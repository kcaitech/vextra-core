import { BoolOp, GroupShape, Shape, ShapeType } from "@/data/shape";
import { difference, intersection, subtract, union } from "./boolop";
import { render as fillR } from "@/render/fill";
import { render as borderR } from "@/render/border"
// import { ELArray, EL, h } from "./basic";

function opPath(bop: BoolOp, path0: string, path1: string): string {
    let path = "";
    switch (bop) {
        case BoolOp.Difference:
            path = difference(path0, path1);
            break;
        case BoolOp.Intersect:
            path = intersection(path0, path1);
            break;
        case BoolOp.Sbutract:
            path = subtract(path0, path1);
            break;
        case BoolOp.Union:
            path = union(path0, path1);
            break;
        // case BoolOp.SimpleUnion:
        //     path = path0 + path1;
        //     break;
    }
    return path;
}

export function render2path(shape: Shape, offsetX?: number, offsetY?: number, consumed?: Array<Shape>): string {

    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    if (!(shape instanceof GroupShape) || shape.childsCount === 0) {
        return shape.getPath(offsetX, offsetY);
    }

    const cc = shape.childsCount;
    const child0 = shape.getChildByIndex(0);
    const frame0 = child0.frame;
    const path0 = render2path(child0, offsetX + frame0.x, offsetY + frame0.y, consumed);
    consumed?.push(child0);

    let joinPath = path0;
    for (let i = 1; i < cc; i++) {
        const child1 = shape.getChildByIndex(i);
        const frame1 = child1.frame;
        const path1 = render2path(child1, offsetX + frame1.x, offsetY + frame1.y, consumed);
        const pathop = child1.boolOp;
        if (pathop === BoolOp.None) {
            joinPath = joinPath + path1;
        } else {
            joinPath = joinPath.length === 0 ? path1 : opPath(pathop, joinPath, path1)
        }
        if (consumed) consumed.push(child1);
    }

    return joinPath;
}

export function render(h: Function, shape: GroupShape, bop: BoolOp, comsMap: Map<ShapeType, any>, reflush?: number, consumed?: Array<Shape>): any {
    const path = render2path(shape, 0, 0, consumed);

    const frame = shape.frame;
    const childs = [];

    // fill
    childs.push(...fillR(h, shape, path));

    // border
    childs.push(...borderR(h, shape, path));

    // ----------------------------------------------------------
    // shadows todo

    if (childs.length == 0) {
        return h('path', {
            reflush,
            d: path,
            "fill-opacity": 1,
            fill: 'none',
            stroke: 'none',
            'stroke-width': 0,
            transform: "translate(" + frame.x + " " + frame.y + ")",
        });
    }
    else {
        return h("g", { reflush }, childs);
    }
}