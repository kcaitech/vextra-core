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

export function shapeDelete(page: Page, parent: GroupShape, index: number) {
    const shape = parent.removeChildAt(index);
    if (shape) {
        page.onRemoveShape(shape);
        if (parent.childs.length > 0) {
            updateFrame(parent.childs[0])
        }
    }
}

export function shapeModifyXY(shape: Shape, x: number, y: number) {
    const frame = shape.frame;
    if (x !== frame.x || y !== frame.y) {
        frame.x = x;
        frame.y = y;
        updateFrame(shape);
    }
}
export function shapeModifyWH(shape: Shape, w: number, h: number) {
    const frame = shape.frame;
    if (w !== frame.width || h !== frame.height) {
        frame.width = w;
        frame.height = h;
        updateFrame(shape);
    }
}