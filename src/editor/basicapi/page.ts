import { Document, PageListItem } from "../../data/document";
import { Page } from "../../data/page";
import { crdtArrayMove, crdtGetArrIndex, crdtIdSet } from "../../coop/client/crdt";
import { Op, OpType } from "../../coop/common/op";

// insertPage(index: number, page: Page) {
//     if (index < 0) return;
//     const pageListItem = new PageListItem(page.id, page.name);
//     this.pagesList.splice(index, 0, pageListItem);
//     this.__pages.add(page.id, page);
// }

// deletePage(id: string): boolean {
//     if (this.pagesList.length > 1) {
//         const index = this.pagesList.findIndex(p => p.id === id);
//         if (index < 0) return false;
//         this.pagesList.splice(index, 1);
//         return true;
//     } else {
//         return false;
//     }
// }

// deletePageAt(index: number): boolean {
//     if (index < 0 || index >= this.pagesList.length) return false;
//     this.pagesList.splice(index, 1);
//     return true;
// }

export function pageInsert(uid: string, document: Document, page: Page, index: number) {
    // document.insertPage(index, page)
    if (index < 0) return;
    const pagesList = document.pagesList;
    if (index >= pagesList.length) index = pagesList.length;
    const ops: Op[] = [];
    const idx = crdtGetArrIndex(uid, pagesList, index);
    const item = new PageListItem(idx, page.id, page.name);
    ops.push(crdtArrayMove(pagesList, {
        id: item.id,
        data: item,
        to: idx,
        path: ["document", "pagesList"],
        type: OpType.CrdtArr,
        order: Number.MAX_SAFE_INTEGER
    }));
    // pagesList.splice(index, 0, pageListItem);
    // todo
    ops.push(crdtIdSet(document.pagesMgr, {
        id: page.id,
        data: page,
        path: ["document", "pages"],
        type: OpType.Idset,
        order: Number.MAX_SAFE_INTEGER
    }));
    // document.__pages.add(page.id, page);
    return ops;
}
export function pageDelete(document: Document, index: number) {
    const pagesList = document.pagesList;
    if (index < 0 || index >= pagesList.length) return;
    if (pagesList.length <= 1) return;
    const ops: Op[] = [];
    const item = pagesList[index];
    ops.push(crdtArrayMove(pagesList, { // todo 删除需要特别处理
        id: item.id,
        data: undefined,
        to: undefined,
        path: ["document", "pagesList"],
        type: OpType.CrdtArr,
        order: Number.MAX_SAFE_INTEGER
    }));
    // const index = pagesList.findIndex(p => p.id === id);
    ops.push(crdtIdSet(document.pagesMgr, {
        id: item.id,
        data: undefined,
        path: ["document", "pages"],
        type: OpType.Idset,
        order: Number.MAX_SAFE_INTEGER
    }));
    // pagesList.splice(index, 1);
    return ops;

    // return document.deletePageAt(index)
}
export function pageModifyName(document: Document, pageId: string, name: string) {
    const item = document.pagesList.find(p => p.id === pageId);
    if (item) item.name = name;
}
export function pageMove(document: Document, fromIdx: number, toIdx: number) {
    const item = document.pagesList.splice(fromIdx, 1)[0]
    if (item) {
        document.pagesList.splice(toIdx, 0, item)
    }
}