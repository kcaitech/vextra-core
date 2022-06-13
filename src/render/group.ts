import { BoolOp, Shape, ShapeType } from "@/data/shape";
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
    }
    return path;
}

function consumeOpShape(shape: Shape, startIdx: number, bop: BoolOp, offsetX: number, offsetY: number): { count: number, path: string } {
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
    const path0 = render2path(child, bop, offsetX + frame0.x, offsetY + frame0.y);
    const path1 = render2path(next, bop, offsetX + frame1.x, offsetY + frame1.y);
    let path = opPath(cbop, path0, path1);

    i = i + 2;
    while (i < cc) {
        next = shape.getChildByIndex(i);
        const cbop = next.boolOp == BoolOp.None ? bop : next.boolOp;
        if (cbop != BoolOp.None) {
            const frame1 = next.frame;
            const path1 = render2path(next, bop, offsetX + frame1.x, offsetY + frame1.y);
            path = opPath(cbop, path, path1);
            i = i + 1;
        } else {
            break;
        }
    }
    return { count: (i - startIdx), path };
}

export function render2path(shape: Shape, bop?: BoolOp, offsetX?: number, offsetY?: number): string {

    bop = bop || BoolOp.None;
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;

    // not group
    if (shape.childsCount == 0) {
        return shape.getPath(offsetX, offsetY);
    }

    const cc = shape.childsCount;
    bop = shape.boolOp == BoolOp.None ? bop : shape.boolOp;

    let joinPath = "";
    for (let i = 0; i < cc;) {

        const { count, path } = consumeOpShape(shape, i, bop, offsetX, offsetX);
        if (count > 0) {
            joinPath = joinPath + " " + path;
            i = i + count;
            continue;
        }

        const child = shape.getChildByIndex(i);
        const frame0 = child.frame;
        const path0 = render2path(child, bop, offsetX + frame0.x, offsetY + frame0.y);
        joinPath = joinPath + " " + path0;
        i = i + 1;
    }

    return joinPath;
}

export function render(shape: Shape, bop: BoolOp, comsMap: Map<ShapeType, any>): EL {
    const childs:ELArray = [];
    const cc = shape.childsCount;
    bop = shape.boolOp == BoolOp.None ? bop : shape.boolOp;

    for (let i = 0; i < cc;) {

        const { count, path } = consumeOpShape(shape, i, bop, 0, 0);
        if (count > 0) {
            childs.push(h("path", {d: path}));
            i = i + count;
            continue;
        }

        const child = shape.getChildByIndex(i);
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: child, boolop: bop });
        childs.push(node);
        i = i + 1;
    }

    const frame = shape.frame;
    return h('g', { transform: 'translate(' + frame.x + ',' + frame.y + ')' }, childs);
}