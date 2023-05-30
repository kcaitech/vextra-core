import { Document } from "../data/document";
import { Page } from "../data/page";
import { GroupShape, Shape } from "../data/shape";
import { updateFrame } from "./utils";

export function pageInsert(document: Document, page: Page, index: number) {
    document.insertPage(index, page)
}
export function pageDelete(document: Document, index: number) {
    document.deletePageAt(index)
}
export function pageModifyName(document: Document, pageId: string, name: string) {
    const item = document.pagesList.find(p => p.id === pageId);
    if (item) item.name = name;
}

export function shapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number) {
    parent.addChildAt(shape, index);
    page.onAddShape(shape);
    updateFrame(shape);
}