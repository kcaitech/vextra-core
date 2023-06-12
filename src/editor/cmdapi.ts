import { Color } from "../data/style";
import { Document } from "../data/document";
import { Page } from "../data/page";
import { GroupShape, Shape, ShapeType } from "../data/shape";
import { Artboard } from "../data/artboard";
import { translateTo } from "./frame";

export { addFillAt, deleteFillAt, moveFill, setFillColor, setFillEnable } from "./fill";
export { addBorderAt, deleteBorderAt, moveBorder, setBorderColor } from "./border";
export { deleteText, insertText } from "./text";
export { updateFrame } from "./utils";

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
export function pageMove(document: Document, fromIdx: number, toIdx: number) {
    const pagesmgr = document.pagesMgr;
    const item = document.pagesList.splice(fromIdx, 1)[0]
    if (item) {
        document.pagesList.splice(toIdx, 0, item)
    }
}

export function shapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number, needUpdateFrame: Shape[]) {
    parent.addChildAt(shape, index);
    page.onAddShape(shape);
    // updateFrame(shape);
    needUpdateFrame.push(shape);
}
export function shapeDelete(page: Page, parent: GroupShape, index: number, needUpdateFrame: Shape[]) {
    const shape = parent.removeChildAt(index);
    if (shape) {
        page.onRemoveShape(shape);
        if (parent.childs.length > 0) {
            needUpdateFrame.push(parent.childs[0])
        }
    }
}
export function shapeMove(parent: GroupShape, index: number, parent2: GroupShape, index2: number, needUpdateFrame: Shape[]) {
    const shape = parent.childs.splice(index, 1)[0]
    if (shape) {
        parent2.childs.splice(index2, 0, shape);
        // updateFrame(shape)
        needUpdateFrame.push(shape)
        if (parent.id !== parent2.id && parent.childs.length > 0) {
            needUpdateFrame.push(parent.childs[0])
        }
    }
}

export function shapeModifyXY(shape: Shape, x: number, y: number, needUpdateFrame: Shape[]) {
    translateTo(shape, x, y)
    needUpdateFrame.push(shape);
    // const frame = shape.frame;
    // if (x !== frame.x || y !== frame.y) {
    //     frame.x = x;
    //     frame.y = y;
    //     needUpdateFrame.push(shape);
    // }
}
export function shapeModifyWH(shape: Shape, w: number, h: number, needUpdateFrame: Shape[]) {
    const frame = shape.frame;
    if (w !== frame.width || h !== frame.height) {
        frame.width = w;
        frame.height = h;
        needUpdateFrame.push(shape);
    }
}
export function shapeModifyRotate(shape: Shape, rotate: number, needUpdateFrame: Shape[]) {
    if (rotate !== shape.rotation) {
        shape.rotation = rotate;
        needUpdateFrame.push(shape);
    }
}
export function shapeModifyName(shape: Shape, name: string) {
    shape.name = name;
}
export function shapeModifyHFlip(shape: Shape, hflip: boolean | undefined, needUpdateFrame: Shape[]) {
    shape.isFlippedHorizontal = hflip;
    needUpdateFrame.push(shape);
}
export function shapeModifyVFlip(shape: Shape, vflip: boolean | undefined, needUpdateFrame: Shape[]) {
    shape.isFlippedVertical = vflip;
    needUpdateFrame.push(shape);
}

export function shapeModifyBackgroundColor(shape: Shape, color: Color) {
    if (shape.type === ShapeType.Artboard) {
        (shape as Artboard).setArtboardColor(color);
    }
}
