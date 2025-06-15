/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Document, PageListItem } from "../../data/document";
import { Page } from "../../data/page";
import { Op } from "../basic/op";
import { crdtArrayInsert, crdtArrayMove, crdtArrayRemove, crdtSetAttr, crdtShapeInsert, crdtShapeMove, crdtShapeRemove } from "./basic";
import { GroupShape, Shape, SymbolShape } from "../../data/shape";
import { ShapeFrame, SymbolUnionShape } from "../../data/shape";
import { BasicArray, BasicMap } from "../../data/basic";
import { IImportContext, importSymbolShape, importSymbolUnionShape } from "../../data/baseimport";
import { FMT_VER_latest } from "../../data/fmtver";
import { ShapeSize } from "../../data/typesdefine";

export function pageInsert(document: Document, page: Page, index: number) {
    if (index < 0) return;
    const pagesList = document.pagesList;
    if (index >= pagesList.length) index = pagesList.length;
    const ops: Op[] = [];
    const idx = new BasicArray<number>();
    const item = new PageListItem(idx, page.id, page.name);

    let op;
    op = crdtArrayInsert(pagesList, index, item);
    if (Array.isArray(op)) ops.push(...op);
    else if (op) ops.push(op);
    op = crdtSetAttr(document.pagesMgr, page.id, page);
    if (op) ops.push(op);

    return ops;
}
export function pageDelete(document: Document, index: number) {
    const pagesList = document.pagesList;
    if (index < 0 || index >= pagesList.length) return;
    if (pagesList.length <= 1) return;
    const ops: Op[] = [];
    const item = pagesList[index];

    let op;
    op = crdtArrayRemove(pagesList, index);
    if (op) ops.push(op);

    op = crdtSetAttr(document.pagesMgr, item.id, undefined);
    if (op) ops.push(op);

    return ops;
}
export function pageModifyName(document: Document, pageId: string, name: string) {
    const item = document.pagesList.find(p => p.id === pageId);
    return item && crdtSetAttr(item, "name", name);
}

function registSymbol(document: Document, symbolId: string, pageId: string) {
    return crdtSetAttr(document.symbolregist, symbolId, pageId);
}

/**
 * 
 * @param document 
 * @param fromIdx 
 * @param toIdx 移动前的index
 */
export function pageMove(document: Document, fromIdx: number, toIdx: number) {
    return crdtArrayMove(document.pagesList, fromIdx, toIdx);
}

function _checkNum(x: number) {
    // check
    if (Number.isNaN(x) || (!Number.isFinite(x))) throw new Error(String(x));
}
function _checkFrame(shape: Shape) {
    if (!shape.hasSize()) return;
    const frame: ShapeSize = shape.size;
    if (frame.width === 0 || frame.height === 0) throw new Error();
    // _checkNum(frame.x);
    // _checkNum(frame.y);
    _checkNum(frame.width);
    _checkNum(frame.height);
}

export function shapeInsert(document: Document, page: Page, parent: GroupShape, shape: Shape, index: number) {
    // shape不可以一次性插入多个对象，需要分开插入
    // 从根开始插入

    _checkFrame(shape);

    const ops: Op[] = [];

    const recursive = (p: GroupShape, shape: Shape, index: number) => {

        let childs: Shape[] | undefined = undefined;
        if (shape instanceof GroupShape) {
            childs = shape.childs.slice(0);
            (shape).childs.length = 0;
        }
        const op = crdtShapeInsert(page, p, shape, index);
        page.onAddShape(op[op.length - 1].data2 as Shape, false);
        ops.push(...op);

        if (childs) for (let i = 0; i < childs.length; ++i) {
            recursive(shape as GroupShape, childs[i], i);
        }

        if (shape instanceof SymbolShape && (!(shape instanceof SymbolUnionShape))) {
            ops.push(registSymbol(document, shape.id, page.id));
            if (document.freesymbols && document.freesymbols.has(shape.id)) {
                ops.push(crdtSetAttr(document.freesymbols, shape.id, undefined));
            }
            document.symbolsMgr.clearDuplicate(shape.id);
        }
    }
    recursive(parent, shape, index);

    // needUpdateFrame.push({ shape, page });

    return ops;
}
export function shapeDelete(document: Document, page: Page, parent: GroupShape, index: number) {

    // shape不可以一次删除多个对象，要分开删除
    // 从叶子开始删除
    const ops: Op[] = [];
    const recursive = (parent: GroupShape, shape: Shape, index: number, level: number) => {
        let saveShape: SymbolShape | undefined;
        if (shape instanceof SymbolShape && (!(level > 0 && parent instanceof SymbolShape))) {
            // 备份symbolshape
            const ctx = new class implements IImportContext {
                document: Document = document;
                curPage: string = page.id;
                fmtVer: string = FMT_VER_latest;
            }
            saveShape = shape instanceof SymbolUnionShape ? importSymbolUnionShape(shape, ctx) : importSymbolShape(shape, ctx);
        }
        if (shape instanceof GroupShape) {
            const childs = shape.childs;
            for (let i = childs.length - 1; i >= 0; --i) {
                const c = childs[i];
                recursive(shape, c, i, level + 1);
            }
        }
        const op = crdtShapeRemove(page, parent, index);
        if (op) {
            ops.push(op);
            if (shape instanceof SymbolShape && (!(shape instanceof SymbolUnionShape))) {
                ops.push(registSymbol(document, shape.id, "freesymbols"));
                document.symbolsMgr.clearDuplicate(shape.id);
            }
            if (saveShape) {
                if (!document.freesymbols) document.freesymbols = new BasicMap();
                ops.push(crdtSetAttr(document.freesymbols, saveShape.id, saveShape));
                document.symbolsMgr.clearDuplicate(saveShape.id);
            }
            page.onRemoveShape(op.origin as Shape, false);
        }
    }
    const shape = parent.childs[index];
    recursive(parent, shape, index, 0);

    // if (ops.length > 0 && parent.childs.length > 0) {
    //     needUpdateFrame.push({ shape: parent.childs[0], page })
    // }

    return ops;
}
/**
 * 
 * @param page 
 * @param parent 
 * @param index 
 * @param parent2 
 * @param index2 移动后的index
 * @param needUpdateFrame 
 * @returns 
 */
export function shapeMove(page: Page, parent: GroupShape, index: number, parent2: GroupShape, index2: number) {
    const op = crdtShapeMove(page, parent, index, parent2, index2);
    // if (op && op.length > 0) {
    //     needUpdateFrame.push({ shape: op[op.length - 1].data2 as Shape, page })
    //     if (parent.id !== parent2.id && parent.childs.length > 0) {
    //         needUpdateFrame.push({ shape: parent.childs[0], page })
    //     }
    // }
    return op;
}