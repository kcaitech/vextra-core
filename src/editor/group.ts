/*
 * Copyright (c) 2023-2024 vextra.io. All rights reserved.
 *
 * This file is part of the vextra.io project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// group 相关
// 1. 编组
// 2. 画板
// 3. BOOL

import { GroupShape, Shape, Document, Page, ShapeType, ScrollBehavior } from "../data";
import { Api } from "../coop/recordapi";
import { ColVector3D } from "../basic/matrix2";
import { Transform } from "../data/transform";

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
    const shapes2rootTransform = shapes.map(s => (s.matrix2Root()));

    // gshape在root上的transform 或 单位矩阵
    const groupTransform = (gshape.transform);
    const groupInverseTransform = groupTransform.getInverse();

    const shapes2groupTransform = shapes2rootTransform.map(t => t.clone().addTransform(groupInverseTransform));

    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;

    shapes2groupTransform.forEach((t, index) => {
        const shape = shapes[index];
        const size = shape.size;

        const col0 = t.transform(ColVector3D.FromXY(0, 0))
        const col1 = t.transform(ColVector3D.FromXY(size.width, 0))
        const col2 = t.transform(ColVector3D.FromXY(size.width, size.height))
        const col3 = t.transform(ColVector3D.FromXY(0, size.height))

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
        .translate(__bounds.left, __bounds.top)
        .addTransform(((savep.matrix2Root()).getInverse()));

    gshape.size.width = __bounds.right - __bounds.left;
    gshape.size.height = __bounds.bottom - __bounds.top;

    // 将GroupShape加入到save parent(层级最高图形的parent)中
    gshape = api.shapeInsert(document, page, savep, gshape, saveidx) as T;

    // 将shapes里的对象从原本parent下移入新建的GroupShape
    for (let i = 0, len = shapes.length; i < len; i++) {
        const s = shapes[i];
        const p = s.parent as GroupShape;
        const idx = p.indexOfChild(s);
        api.shapeMove(page, p, idx, gshape, 0); // 层级低的放前面

        if (p.childs.length <= 0) deleteEmptyGroupShape(document, page, p, api);
    }

    const inverse2 = (gshape.matrix2Root()).getInverse();
    for (let i = 0, len = shapes.length; i < len; i++) {
        api.shapeModifyTransform(page, shapes[i], (shapes2rootTransform[i].addTransform(inverse2)));
    }

    const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
    if (_types.includes(gshape.type)) {
        const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
        const sortedArr = [...gshape.childs].sort((a, b) => {
            if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                return -1;
            } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                return 1;
            }
            return 0;
        });
        for (let j = 0; j < sortedArr.length; j++) {
            const s = sortedArr[j];
            const currentIndex = gshape.childs.indexOf(s);
            if (currentIndex !== j) {
                api.shapeMove(page, gshape, currentIndex, gshape, j);
            }
        }
    }
    return gshape;
}

export function ungroup(document: Document, page: Page, shape: GroupShape, api: Api): Shape[] {
    const savep = shape.parent as GroupShape;
    let idx = savep.indexOfChild(shape);
    const saveidx = idx;
    const childs: Shape[] = [];
    const transformMap: Map<string, Transform> = new Map<string, Transform>();
    for (let i = 0, len = shape.childs.length; i < len; i++) {
        const c = shape.childs[i];
        transformMap.set(c.id, (c.matrix2Root()));
    }
    const env_transform = (savep.matrix2Root()).getInverse(); // 目标父级的transform
    for (let len = shape.childs.length; len > 0; len--) {
        const c = shape.childs[0];
        const transform = transformMap.get(c.id)!;
        api.shapeMove(page, shape, 0, savep, idx);
        api.shapeModifyTransform(page, c, (transform.addTransform(env_transform)));
        idx++;
        childs.push(c);
    }

    api.shapeDelete(document, page, savep, saveidx + childs.length);
    return childs;
}
