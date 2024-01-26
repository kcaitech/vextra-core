import { Document, PageListItem } from "../../data/document";
import { Page } from "../../data/page";
import { Op } from "../../coop/common/op";
import { CrdtIndex } from "../../data/crdt";
import { crdtArrayInsert, crdtArrayMove, crdtArrayRemove, crdtSetAttr, crdtShapeInsert, crdtShapeMove, crdtShapeRemove } from "./basic";
import { GroupShape, Shape } from "../../data/shape";

export function pageInsert(document: Document, page: Page, index: number) {
    if (index < 0) return;
    const pagesList = document.pagesList;
    if (index >= pagesList.length) index = pagesList.length;
    const ops: Op[] = [];
    const idx = new CrdtIndex([], 0);
    const item = new PageListItem(idx, page.id, page.name);

    let op;
    op = crdtArrayInsert(pagesList, index, item);
    if (op) ops.push(op);

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
/**
 * 
 * @param document 
 * @param fromIdx 
 * @param toIdx 移动前的index
 */
export function pageMove(document: Document, fromIdx: number, toIdx: number) {
    return crdtArrayMove(document.pagesList, fromIdx, toIdx);
}


export function shapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number, needUpdateFrame: { shape: Shape, page: Page }[]) {
    const op = crdtShapeInsert(page, parent, shape, index);
    page.onAddShape(shape);
    needUpdateFrame.push({ shape, page });
    return op;
}
export function shapeDelete(page: Page, parent: GroupShape, index: number, needUpdateFrame: { shape: Shape, page: Page }[]) {
    const op = crdtShapeRemove(page, parent, index);
    if (op) {
        page.onRemoveShape(op.data as Shape);
        if (parent.childs.length > 0) {
            needUpdateFrame.push({ shape: parent.childs[0], page })
        }
    }
    return op;
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
export function shapeMove(page: Page, parent: GroupShape, index: number, parent2: GroupShape, index2: number, needUpdateFrame: { shape: Shape, page: Page }[]) {
    const op = crdtShapeMove(page, parent, index, parent2, index2);
    if (op) {
        needUpdateFrame.push({ shape: op.data as Shape, page })
        if (parent.id !== parent2.id && parent.childs.length > 0) {
            needUpdateFrame.push({ shape: parent.childs[0], page })
        }
    }
    return op;
}