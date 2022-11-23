import { BoolOp, GroupShape, Shape, ShapeType } from "@/data/shape";
import { difference, intersection, subtract, union } from "./boolop";
import { ELArray, EL, h } from "./basic";

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
        case BoolOp.SimpleUnion:
            path = path0 + path1;
            break;
    }
    return path;
}

function consumeOpShape(shape: GroupShape, startIdx: number, bop: BoolOp, offsetX: number, offsetY: number, consumed?: Array<Shape>): { count: number, path: string } {
    const cc = shape.childsCount;
    let i = startIdx;
    if (i >= cc - 1) {
        return { count: 0, path: "" };
    }
    const child = shape.getChildByIndex(i);
    let next = shape.getChildByIndex(i + 1);
    const cbop = next.boolOp == BoolOp.None ? bop : next.boolOp;

    if (cbop == BoolOp.None) {
        return { count: 0, path: "" };
    }

    const frame0 = child.frame;
    const frame1 = next.frame;
    const path0 = render2path(child, bop, offsetX + frame0.x, offsetY + frame0.y, consumed);
    const path1 = render2path(next, bop, offsetX + frame1.x, offsetY + frame1.y, consumed);
    let path = opPath(cbop, path0, path1);

    if (consumed) consumed.push(child, next);

    i = i + 2;
    while (i < cc) {
        next = shape.getChildByIndex(i);
        const cbop = next.boolOp == BoolOp.None ? bop : next.boolOp;
        if (cbop != BoolOp.None) {
            const frame1 = next.frame;
            const path1 = render2path(next, bop, offsetX + frame1.x, offsetY + frame1.y, consumed);
            path = opPath(cbop, path, path1);
            i = i + 1;

            if (consumed) consumed.push(next);

        } else {
            break;
        }
    }
    return { count: (i - startIdx), path };
}

export function render2path(shape: Shape, bop?: BoolOp, offsetX?: number, offsetY?: number, consumed?: Array<Shape>): string {

    bop = bop || BoolOp.None;
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    // not group
    if (!(shape instanceof GroupShape)) {
        return shape.getPath(offsetX, offsetY);
    }

    const cc = shape.childsCount;
    bop = shape.boolOp == BoolOp.None ? bop : shape.boolOp;

    let joinPath = "";
    for (let i = 0; i < cc;) {

        const { count, path } = consumeOpShape(shape, i, bop, offsetX, offsetX, consumed);
        if (count > 0) {
            joinPath = joinPath + " " + path;
            i = i + count;
            continue;
        }

        const child = shape.getChildByIndex(i);
        const frame0 = child.frame;
        const path0 = render2path(child, bop, offsetX + frame0.x, offsetY + frame0.y, consumed);
        joinPath = joinPath + " " + path0;
        i = i + 1;

        if (consumed) consumed.push(child);
    }

    return joinPath;
}

export function renderGroupChilds(shape: GroupShape, bop: BoolOp, comsMap: Map<ShapeType, any>, consumed?: Array<Shape>): ELArray {
    const childs:ELArray = [];
    const cc = shape.childsCount;
    bop = shape.boolOp == BoolOp.None ? bop : shape.boolOp;

    // if (shape.type === ShapeType.ShapeGroup && bop === BoolOp.Union) {

    // }

    for (let i = 0; i < cc;) {

        const { count, path } = consumeOpShape(shape, i, bop, 0, 0, consumed);
        if (count > 0) {
            const com = comsMap.get(ShapeType.Boolean);
            if (com) {
                childs.push(h(com, { data: shape.getChildByIndex(i), boolop: bop, path}));
            }
            else {
                childs.push(h("path", {d: path}));
            }
            i = i + count;
            continue;
        }

        const child = shape.getChildByIndex(i);
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: child, boolop: bop });
        childs.push(node);
        i = i + 1;
    }

    return childs;
}

export function render(shape: GroupShape, bop: BoolOp, comsMap: Map<ShapeType, any>, reflush?: number, consumed?: Array<Shape>): EL {
    const childs:ELArray = renderGroupChilds(shape, bop, comsMap, consumed);
    const frame = shape.frame;
    return h('g', { transform: 'translate(' + frame.x + ',' + frame.y + ')', reflush: reflush || 0 }, childs);
}