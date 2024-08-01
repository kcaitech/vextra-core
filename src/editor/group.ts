// group 相关
// 1. 编组
// 2. 画板
// 3. BOOL

import { GroupShape, Shape, Document, Page, makeShapeTransform1By2, makeShapeTransform2By1 } from "../data";
import { Api } from "./coop/recordapi";
import { ColVector3D } from "../basic/matrix2";
import { PageView } from "../dataview";

export function expandBounds(bounds: {
    left: number,
    top: number,
    right: number,
    bottom: number
}, x: number, y: number) {
    if (x < bounds.left) bounds.left = x;
    else if (x > bounds.right) bounds.right = x;
    if (y < bounds.top) bounds.top = y;
    else if (y > bounds.bottom) bounds.bottom = y;
}

export function deleteEmptyGroupShape(document: Document, page: Page, shape: Shape, api: Api): boolean {
    const p = shape.parent as GroupShape;
    if (!p) return false;
    api.shapeDelete(document, page, p, p.indexOfChild(shape))
    if (p.childs.length <= 0) {
        deleteEmptyGroupShape(document, page, p, api)
    }
    return true;
}

export function group<T extends GroupShape>(document: Document, page: Page, shapes: Shape[], gshape: T, savep: GroupShape, saveidx: number, api: Api): T {
    // 图层在root上的transform
    const shapes2rootTransform = shapes.map(s => makeShapeTransform2By1(s.matrix2Root()));

    // gshape在root上的transform 或 单位矩阵
    const groupTransform = makeShapeTransform2By1(gshape.transform);
    const groupInverseTransform = groupTransform.getInverse();

    const shapes2groupTransform = shapes2rootTransform.map(t => t.clone().addTransform(groupInverseTransform));

    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;

    shapes2groupTransform.forEach((t, index) => {
        const shape = shapes[index];
        const size = shape.size;

        const { col0, col1, col2, col3 } = t.transform([
            ColVector3D.FromXY(0, 0),
            ColVector3D.FromXY(size.width, 0),
            ColVector3D.FromXY(size.width, size.height),
            ColVector3D.FromXY(0, size.height)
        ]);

        if (col0.x < left) {
            left = col0.x;
        } else if (col0.x > right) {
            right = col0.x;
        }
        if (col0.y < top) {
            top = col0.y;
        } else if (col0.y > bottom) {
            bottom = col0.y;
        }

        if (col1.x < left) {
            left = col1.x;
        } else if (col1.x > right) {
            right = col1.x;
        }
        if (col1.y < top) {
            top = col1.y;
        } else if (col1.y > bottom) {
            bottom = col1.y;
        }

        if (col2.x < left) {
            left = col2.x;
        } else if (col2.x > right) {
            right = col2.x;
        }
        if (col2.y < top) {
            top = col2.y;
        } else if (col2.y > bottom) {
            bottom = col2.y;
        }

        if (col3.x < left) {
            left = col3.x;
        } else if (col3.x > right) {
            right = col3.x;
        }
        if (col3.y < top) {
            top = col3.y;
        } else if (col3.y > bottom) {
            bottom = col3.y;
        }
    });

    const __bounds = { left, top, right, bottom };

    groupTransform
        .translate(ColVector3D.FromXY(__bounds.left, __bounds.top))
        .addTransform((makeShapeTransform2By1(savep.matrix2Root()).getInverse()));

    gshape.size.width = __bounds.right - __bounds.left;
    gshape.size.height = __bounds.bottom - __bounds.top;
    gshape.transform = makeShapeTransform1By2(groupTransform);

    // 将GroupShape加入到save parent(层级最高图形的parent)中
    gshape = api.shapeInsert(document, page, savep, gshape, saveidx) as T;

    // 将shapes里的对象从原本parent下移入新建的GroupShape
    for (let i = 0, len = shapes.length; i < len; i++) {
        const s = shapes[i];
        const p = s.parent as GroupShape;
        const idx = p.indexOfChild(s);
        api.shapeMove(page, p, idx, gshape, 0); // 层级低的放前面

        if (p.childs.length <= 0) {
            deleteEmptyGroupShape(document, page, p, api)
        }
    }

    const inverse2 = makeShapeTransform2By1(gshape.matrix2Root()).getInverse();
    for (let i = 0, len = shapes.length; i < len; i++) {
        const c = shapes[i]
        api.shapeModifyTransform(page, c, makeShapeTransform1By2(shapes2rootTransform[i].addTransform(inverse2)));
    }

    return gshape;
}

export function ungroup(document: Document, page: Page, shape: GroupShape, api: Api): Shape[] {
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
            // api.shapeModifyRotate(page, c, (c.rotation || 0) + shape.rotation)
        }
        // todo flip
        // if (shape.isFlippedHorizontal) {
        //     api.shapeModifyHFlip(page, c, !c.isFlippedHorizontal)
        // }
        // if (shape.isFlippedVertical) {
        //     api.shapeModifyVFlip(page, c, !c.isFlippedVertical)
        // }
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

    api.shapeDelete(document, page, savep, saveidx + childs.length);
    return childs;
}
