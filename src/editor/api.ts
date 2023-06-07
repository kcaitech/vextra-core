import { Color } from "../data/style";
import { Document } from "../data/document";
import { Page } from "../data/page";
import { GroupShape, Shape, ShapeType } from "../data/shape";
import { updateFrame } from "./utils";
import { Artboard } from "../data/artboard";
import { setFillColor } from "./fill";

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
export function shapeMove(parent: GroupShape, index: number, parent2: GroupShape, index2: number) {
    const shape = parent.childs.splice(index, 1)[0]
    if (shape) {
        parent2.childs.splice(index2, 0, shape);
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
export function shapeModifyRotate(shape: Shape, rotate: number) {
    if (rotate !== shape.rotation) {
        shape.rotation = rotate;
        updateFrame(shape);
    }
}
export function shapeModifyName(shape: Shape, name: string) {
    shape.name = name;
}
export function shapeModifyHFlip(shape: Shape, hflip: boolean | undefined) {
    shape.isFlippedHorizontal = hflip;
}
export function shapeModifyVFlip(shape: Shape, vflip: boolean | undefined) {
    shape.isFlippedVertical = vflip;
}

export function shapeModifyBackgroundColor(shape: Shape, color: Color) {
    if (shape.type === ShapeType.Artboard) {
        (shape as Artboard).setArtboardColor(color);
    }
}

export function fillInsert(shape: Shape, ) {

}
export function fillDelete(shape: Shape) {

}
export function fillMove(shape: Shape) {

}
export function fillModifyColor(shape: Shape, idx: number, color: Color) {
    setFillColor(shape.style, idx, color);
}

export function borderInsert(shape: Shape) {

}
export function borderDelete(shape: Shape) {

}
export function borderMove(shape: Shape) {

}
export function borderModifyColor(shape: Shape) {

}