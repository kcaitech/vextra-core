// group 相关
// 1. 编组
// 2. 画板
// 3. BOOL

import { Page } from "../data/page";
import { Matrix } from "../basic/matrix";
import { GroupShape, Shape } from "../data/shape";
import { Api } from "./command/recordapi";

export function expandBounds(bounds: { left: number, top: number, right: number, bottom: number }, x: number, y: number) {
    if (x < bounds.left) bounds.left = x;
    else if (x > bounds.right) bounds.right = x;
    if (y < bounds.top) bounds.top = y;
    else if (y > bounds.bottom) bounds.bottom = y;
}

export function deleteEmptyGroupShape(page: Page, shape: Shape, api: Api): boolean {
    const p = shape.parent as GroupShape;
    if (!p) return false;
    api.shapeDelete(page, p, p.indexOfChild(shape))
    if (p.childs.length <= 0) {
        deleteEmptyGroupShape(page, p, api)
    }
    return true;
}

export function group(page: Page, shapes: Shape[], gshape: GroupShape, savep: GroupShape, saveidx: number, api: Api): GroupShape {
    // 计算frame
    //   计算每个shape的绝对坐标
    const boundsArr = shapes.map((s) => {
        const box = s.boundingBox()
        const p = s.parent!;
        const m = p.matrix2Root();
        const lt = m.computeCoord(box.x, box.y);
        const rb = m.computeCoord(box.x + box.width, box.y + box.height);
        return { x: lt.x, y: lt.y, width: rb.x - lt.x, height: rb.y - lt.y }
    })
    const firstXY = boundsArr[0]
    const bounds = { left: firstXY.x, top: firstXY.y, right: firstXY.x, bottom: firstXY.y };

    boundsArr.reduce((pre, cur) => {
        expandBounds(pre, cur.x, cur.y);
        expandBounds(pre, cur.x + cur.width, cur.y + cur.height);
        return pre;
    }, bounds)

    const realXY = shapes.map((s) => s.frame2Root())

    const m = new Matrix(savep.matrix2Root().inverse)
    const xy = m.computeCoord(bounds.left, bounds.top)

    gshape.frame.width = bounds.right - bounds.left;
    gshape.frame.height = bounds.bottom - bounds.top;
    gshape.frame.x = xy.x;
    gshape.frame.y = xy.y;

    // 4、将GroupShape加入到save parent(层级最高图形的parent)中
    gshape = api.shapeInsert(page, savep, gshape, saveidx) as GroupShape;

    // 2、将shapes里对象从parent中退出
    // 3、将shapes里的对象从原本parent下移入新建的GroupShape
    for (let i = 0, len = shapes.length; i < len; i++) {
        const s = shapes[i];
        const p = s.parent as GroupShape;
        const idx = p.indexOfChild(s);
        api.shapeMove(page, p, idx, gshape, 0); // 层级低的放前面

        if (p.childs.length <= 0) {
            deleteEmptyGroupShape(page, p, api)
        }
    }

    // 往上调整width & height
    // update childs frame
    for (let i = 0, len = shapes.length; i < len; i++) {
        const c = shapes[i]

        const r = realXY[i]
        const target = m.computeCoord(r.x, r.y);
        const cur = c.matrix2Parent().computeCoord(0, 0);

        api.shapeModifyX(page, c, c.frame.x + target.x - cur.x - xy.x);
        api.shapeModifyY(page, c, c.frame.y + target.y - cur.y - xy.y)
    }
    return gshape;
}
export function ungroup(page: Page, shape: GroupShape, api: Api): Shape[] {
    const savep = shape.parent as GroupShape;
    let idx = savep.indexOfChild(shape);
    const saveidx = idx;
    const m = shape.matrix2Parent();
    const childs: Shape[] = [];

    for (let i = 0, len = shape.childs.length; i < len; i++) {
        const c = shape.childs[i]
        const m1 = c.matrix2Parent();
        m1.multiAtLeft(m);
        const target = m1.computeCoord(0, 0);

        if (shape.rotation) {
            api.shapeModifyRotate(page, c, (c.rotation || 0) + shape.rotation)
        }
        if (shape.isFlippedHorizontal) {
            api.shapeModifyHFlip(page, c, !c.isFlippedHorizontal)
        }
        if (shape.isFlippedVertical) {
            api.shapeModifyVFlip(page, c, !c.isFlippedVertical)
        }
        const m2 = c.matrix2Parent();
        const cur = m2.computeCoord(0, 0);

        api.shapeModifyX(page, c, c.frame.x + target.x - cur.x);
        api.shapeModifyY(page, c, c.frame.y + target.y - cur.y);
    }
    for (let len = shape.childs.length; len > 0; len--) {
        const c = shape.childs[0];
        api.shapeMove(page, shape, 0, savep, idx)
        idx++;
        childs.push(c);
    }

    api.shapeDelete(page, savep, saveidx + childs.length);
    return childs;
}
