import { Color } from "../../data/style";
import { Document } from "../../data/document";
import { Page } from "../../data/page";
import { GroupShape, RectRadius, RectShape, Shape, ShapeType } from "../../data/shape";
import { Artboard } from "../../data/artboard";

export { addFillAt, deleteFillAt, deleteFills, moveFill, setFillColor, setFillEnable } from "./fill";
export {
    addBorderAt,
    deleteBorderAt,
    moveBorder,
    setBorderColor,
    setBorderEnable,
    setBorderThickness,
    setBorderPosition,
    setBorderStyle,
    setBorderStartMarkerType,
    setBorderEndMarkerType,
    deleteBorders
} from "./border";
export { deleteText, insertText } from "./text";

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

export function shapeInsert(page: Page, parent: GroupShape, shape: Shape, index: number, needUpdateFrame: { shape: Shape, page: Page }[]) {
    parent.addChildAt(shape, index);
    page.onAddShape(shape);
    // updateFrame(shape);
    needUpdateFrame.push({ shape, page });
}
export function shapeDelete(page: Page, parent: GroupShape, index: number, needUpdateFrame: { shape: Shape, page: Page }[]) {
    const shape = parent.removeChildAt(index);
    if (shape) {
        page.onRemoveShape(shape);
        if (parent.childs.length > 0) {
            needUpdateFrame.push({ shape: parent.childs[0], page })
        }
    }
}
export function shapeMove(page: Page, parent: GroupShape, index: number, parent2: GroupShape, index2: number, needUpdateFrame: { shape: Shape, page: Page }[]) {
    const shape = parent.childs.splice(index, 1)[0]
    if (shape) {
        parent2.childs.splice(index2, 0, shape);
        // updateFrame(shape)
        needUpdateFrame.push({ shape, page })
        if (parent.id !== parent2.id && parent.childs.length > 0) {
            needUpdateFrame.push({ shape: parent.childs[0], page })
        }
    }
}

export function shapeModifyX(page: Page, shape: Shape, x: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // translateTo(shape, x, y)
    // needUpdateFrame.push(shape);
    const frame = shape.frame;
    if (x !== frame.x) {
        frame.x = x;
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyY(page: Page, shape: Shape, y: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // translateTo(shape, x, y)
    // needUpdateFrame.push(shape);
    const frame = shape.frame;
    if (y !== frame.y) {
        // frame.x = x;
        frame.y = y;
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyWH(page: Page, shape: Shape, w: number, h: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    const frame = shape.frame;
    if (w !== frame.width || h !== frame.height) {
        frame.width = w;
        frame.height = h;
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyRotate(page: Page, shape: Shape, rotate: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    if (rotate !== shape.rotation) {
        shape.rotation = rotate;
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyConstrainerProportions(shape: Shape, prop: boolean) {
    shape.constrainerProportions = prop;
}
export function shapeModifyName(shape: Shape, name: string) {
    shape.name = name;
}
export function shapeModifyVisible(shape: Shape, isVisible: boolean) {
    shape.isVisible = isVisible;
}
export function shapeModifyLock(shape: Shape, isLocked: boolean) {
    shape.isLocked = isLocked;
}
export function shapeModifyHFlip(page: Page, shape: Shape, hflip: boolean | undefined, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    shape.isFlippedHorizontal = hflip;
    if (needUpdateFrame) needUpdateFrame.push({ shape, page });
}
export function shapeModifyVFlip(page: Page, shape: Shape, vflip: boolean | undefined, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    shape.isFlippedVertical = vflip;
    if (needUpdateFrame) needUpdateFrame.push({ shape, page });
}
export function shapeModifyResizingConstraint(shape: Shape, resizingConstraint: number) {
    shape.setResizingConstraint(resizingConstraint);
}
export function shapeModifyRadius(shape: RectShape, radius: RectRadius) {
    shape.fixedRadius = radius;
}
export function shapeModifyBackgroundColor(shape: Shape, color: Color) {
    if (shape.type === ShapeType.Artboard) {
        (shape as Artboard).setArtboardColor(color);
    }
}
