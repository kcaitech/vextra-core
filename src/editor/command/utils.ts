import {
    exportArtboard,
    exportGroupShape,
    exportImageShape,
    exportLineShape,
    exportOvalShape,
    exportPathShape,
    exportRectShape,
    exportSymbolRefShape,
    exportTextShape,
    exportTableShape,
    exportPathShape2,
    exportTableCell,
    exportContactShape,
    exportSymbolShape
} from "../../data/baseexport";
import {Matrix} from "../../basic/matrix";
import {Artboard} from "../../data/artboard";
import {
    GroupShape,
    ImageShape,
    LineShape,
    OvalShape,
    PathShape,
    PathShape2,
    RectShape,
    Shape,
    ShapeType,
    SymbolShape,
    TextShape
} from "../../data/shape";
import {TableCell, TableShape} from "../../data/table";
import {ContactShape} from "../../data/contact";
import {Page} from "../../data/page";
import {SymbolRefShape} from "../../data/classes";
import {
    IImportContext,
    importArtboard,
    importContactShape,
    importFlattenShape,
    importGroupShape,
    importImageShape,
    importLineShape,
    importOvalShape,
    importPathShape,
    importPathShape2,
    importRectShape,
    importSymbolRefShape,
    importSymbolShape,
    importTableCell,
    importTableShape,
    importTextShape
} from "../../data/baseimport";
import * as types from "../../data/typesdefine"
import {Document} from "../../data/document";
import {log} from "console";

export function setFrame(page: Page, shape: Shape, x: number, y: number, w: number, h: number, api: Api): boolean {
    const frame = shape.frame;
    let changed = false;
    if (x !== frame.x) {
        api.shapeModifyX(page, shape, x)
        changed = true;
    }
    if (y !== frame.y) {
        api.shapeModifyY(page, shape, y)
        changed = true;
    }
    if (w !== frame.width || h !== frame.height) {
        api.shapeModifyWH(page, shape, w, h)
        changed = true;
    }
    return changed;
}

const float_accuracy = 1e-7;

/**
 * @description 更新frame  todo 对于组合对象, 需要更新一个由子元素撑起的frame --wideframe
 */
function __updateShapeFrame(page: Page, shape: Shape, api: Api): boolean {
    const p: Shape | undefined = shape.parent;
    if (!p || (p instanceof Artboard)) return false;
    const need_modify_parent_frame = !(p instanceof SymbolRefShape || p instanceof SymbolShape);
    const cf = shape.boundingBox();
    let xychanged = false;
    for (; ;) { // update xy
        if (cf.x >= 0 && cf.y >= 0) break;
        // 向上调整x,y
        let deltaX = cf.x < 0 ? -cf.x : 0;
        let deltaY = cf.y < 0 ? -cf.y : 0;

        api.shapeModifyX(page, shape, shape.frame.x + deltaX)
        api.shapeModifyY(page, shape, shape.frame.y + deltaY)

        if (p.isNoTransform()) {
            if (need_modify_parent_frame) {
                if (deltaX > 0) api.shapeModifyX(page, p, p.frame.x - deltaX); // p.frame.x -= deltaX;
                if (deltaY > 0) api.shapeModifyY(page, p, p.frame.y - deltaY); // p.frame.y -= deltaY
            }
            if (deltaX > 0) api.shapeModifyWideX(page, p, p.frame.x - deltaX);
            if (deltaY > 0) api.shapeModifyWideY(page, p, p.frame.y - deltaY);
        } else {
            const m = p.matrix2Parent();
            const x1 = -deltaX;
            const y1 = -deltaY;
            const target = m.computeCoord(x1, y1);
            const cur = m.computeCoord(0, 0);
            const dx = target.x - cur.x;
            const dy = target.y - cur.y;
            if (need_modify_parent_frame) {
                api.shapeModifyX(page, p, p.frame.x + dx);
                api.shapeModifyY(page, p, p.frame.y + dy);
            }
            api.shapeModifyWideX(page, p, p.frame.x + dx);
            api.shapeModifyWideY(page, p, p.frame.y + dy);
        }


        p.childs.forEach((c: Shape) => { // 调整子元素相对父元素的位置
            if (c.id === shape.id) return;
            api.shapeModifyX(page, c, c.frame.x + deltaX);
            api.shapeModifyY(page, c, c.frame.y + deltaY);
        })
        xychanged = true;
        break;
    }

    let whchanged = false;
    for (; ;) {
        // // 更新parent的frame
        const pg = p as GroupShape;
        const pf = p.frame;
        const cc = pg.childs.length;
        const cf = shape.boundingBox();
        let l = cf.x, t = cf.y, r = l + cf.width, b = t + cf.height;
        if (cc > 1) for (let i = 0; i < cc; i++) {
            const c = pg.childs[i];
            if (c.id === shape.id) continue;
            const cf = c.boundingBox();
            const cl = cf.x, ct = cf.y, cr = cl + cf.width, cb = ct + cf.height;
            l = Math.min(cl, l);
            t = Math.min(ct, t);
            r = Math.max(cr, r);
            b = Math.max(cb, b);
        }
        // 
        if (p.isNoTransform()) {
            if (need_modify_parent_frame) {
                whchanged = setFrame(page, p, pf.x + l, pf.y + t, r - l, b - t, api);
            }
            api.shapeModifyWideX(page, p, pf.x + l);
            api.shapeModifyWideY(page, p, pf.y + t);
            api.shapeModifyWideWH(page, p, r - l, b - t);

        } else {
            const m = p.matrix2Parent();

            const w = r - l;
            const h = b - t;

            const cx1 = w / 2;
            const cy1 = h / 2;
            const m1 = new Matrix();
            m1.trans(-cx1, -cy1);
            if (p.rotation) m1.rotate(p.rotation / 360 * 2 * Math.PI);
            if (p.isFlippedHorizontal) m1.flipHoriz();
            if (p.isFlippedVertical) m1.flipVert();
            m1.trans(cx1, cy1);
            m1.trans(pf.x, pf.y);

            const xy = m.computeCoord(0, 0);
            const xy1 = m1.computeCoord(0, 0);

            let dx = xy.x - xy1.x;
            let dy = xy.y - xy1.y;

            if (Math.abs(l) > float_accuracy || Math.abs(t) > float_accuracy) {
                const x1 = l;
                const y1 = t;
                const target = m.computeCoord(l, t);
                const cur = m.computeCoord(0, 0);
                dx += target.x - cur.x;
                dy += target.y - cur.y;
            }
            if (need_modify_parent_frame) {
                whchanged = setFrame(page, p, pf.x + dx, pf.y + dy, w, h, api)
            }
            api.shapeModifyWideX(page, p, pf.x + dx);
            api.shapeModifyWideY(page, p, pf.y + dy);
            api.shapeModifyWideWH(page, p, w, h);
        }

        if (whchanged && (Math.abs(l) > float_accuracy || Math.abs(t) > float_accuracy)) { // 仅在对象被删除后要更新？
            for (let i = 0; i < cc; i++) {
                const c = pg.childs[i];
                api.shapeModifyX(page, c, c.frame.x - l)
                api.shapeModifyY(page, c, c.frame.y - t)
            }
        }
        break;
    }

    return xychanged || whchanged;
}

interface Api {
    shapeModifyX(page: Page, shape: Shape, x: number): void;

    shapeModifyY(page: Page, shape: Shape, y: number): void;

    shapeModifyWH(page: Page, shape: Shape, w: number, h: number): void;

    shapeModifyWideX(page: Page, shape: Shape, x: number): void;

    shapeModifyWideY(page: Page, shape: Shape, y: number): void;

    shapeModifyWideWH(page: Page, shape: Shape, w: number, h: number): void;
}

export function updateShapesFrame(page: Page, shapes: Shape[], api: Api) {
    type Node = { shape: Shape, updated: boolean, childs: Node[], changed: boolean, needupdate: boolean }
    const updatetree: Map<string, Node> = new Map();
    shapes.forEach((s) => {
        let n: Node | undefined = updatetree.get(s.id);
        if (n) {
            n.needupdate = true;
            return;
        }
        n = {shape: s, updated: false, childs: [], changed: false, needupdate: true}
        updatetree.set(s.id, n);

        let p = s.parent;
        while (p) {
            let pn: Node | undefined = updatetree.get(p.id);
            if (pn) {
                pn.childs.push(n);
            } else {
                pn = {shape: p, updated: false, childs: [n], changed: false, needupdate: false}
                updatetree.set(p.id, pn);
            }
            n = pn;
            p = p.parent;
        }
    });

    const root: Node | undefined = updatetree.get(page.id);
    if (!root) throw new Error("")

    while (updatetree.size > 0 && !root.updated) {
        // get first node of childs is empty or all updated!
        let next = root;
        while (next) {
            if (next.childs.length === 0) break;
            let nextchild;
            for (let i = 0, len = next.childs.length; i < len; i++) {
                const child = next.childs[i];
                if (!child.updated) {
                    nextchild = child; // 下一个未更新的子节点
                    break;
                }
            }
            if (!nextchild) break;
            next = nextchild;
        }
        const needupdate = next.needupdate || ((childs) => {
            for (let i = 0; i < childs.length; i++) {
                if (childs[i].changed) return true;
            }
            return false;
        })(next.childs)
        const changed = needupdate && __updateShapeFrame(page, next.shape, api);
        next.updated = true;
        next.changed = changed;
    }
    page.__collect.notify('collect'); // 收集辅助线采用的关键点位
}

export function importShape(data: string, document: Document) {
    const source: { [key: string]: any } = JSON.parse(data);
    const ctx: IImportContext = new class implements IImportContext {
        document: Document = document
    };
    // if (source.typeId == 'shape') {
    //     return importShape(source as types.Shape, ctx)
    // }
    if (source.typeId == 'flatten-shape') {
        return importFlattenShape(source as types.FlattenShape, ctx)
    }
    if (source.typeId == 'group-shape') {
        return importGroupShape(source as types.GroupShape, ctx)
    }
    if (source.typeId == 'image-shape') {
        return importImageShape(source as types.ImageShape, ctx)
    }
    if (source.typeId == 'path-shape') {
        return importPathShape(source as types.PathShape, ctx)
    }
    if (source.typeId == 'path-shape2') {
        return importPathShape2(source as types.PathShape2, ctx)
    }
    if (source.typeId == 'rect-shape') {
        return importRectShape(source as types.RectShape, ctx)
    }
    if (source.typeId == 'symbol-ref-shape') {
        return importSymbolRefShape(source as types.SymbolRefShape, ctx)
    }
    if (source.typeId == 'text-shape') {
        return importTextShape(source as types.TextShape, ctx)
    }
    if (source.typeId == 'artboard') {
        return importArtboard(source as types.Artboard, ctx)
    }
    if (source.typeId == 'line-shape') {
        return importLineShape(source as types.LineShape, ctx)
    }
    if (source.typeId == 'oval-shape') {
        return importOvalShape(source as types.OvalShape, ctx)
    }
    if (source.typeId == 'table-shape') {
        return importTableShape(source as types.TableShape, ctx)
    }
    if (source.typeId == 'table-cell') {
        return importTableCell(source as types.TableCell, ctx)
    }
    if (source.typeId == 'contact-shape') {
        return importContactShape(source as types.ContactShape, ctx)
    }
    if (source.typeId == 'symbol-shape') {
        return importSymbolShape(source as types.SymbolShape, ctx);
    }
    throw new Error("unknow shape type: " + source.typeId)
}

export function exportShape(shape: Shape): Object {
    switch (shape.type) {
        case ShapeType.Artboard:
            return (exportArtboard(shape as Artboard))
        case ShapeType.Image:
            return (exportImageShape(shape as ImageShape)) // todo 图片？？
        case ShapeType.Line:
            return (exportLineShape(shape as LineShape))
        case ShapeType.Oval:
            return (exportOvalShape(shape as OvalShape))
        case ShapeType.Path:
            return (exportPathShape(shape as PathShape))
        case ShapeType.Path2:
            return (exportPathShape2(shape as PathShape2))
        case ShapeType.Rectangle:
            return (exportRectShape(shape as RectShape))
        case ShapeType.SymbolRef:
            return (exportSymbolRefShape(shape as SymbolRefShape))
        case ShapeType.Text:
            return (exportTextShape(shape as TextShape))
        case ShapeType.Group:
            return (exportGroupShape(shape as GroupShape))
        // case ShapeType.FlattenShape: return exportFlattenShape(shape as FlattenShape);
        case ShapeType.Table:
            return exportTableShape(shape as TableShape)
        case ShapeType.TableCell:
            return exportTableCell(shape as TableCell);
        case ShapeType.Contact:
            return exportContactShape(shape as ContactShape);
        case ShapeType.Symbol:
            return exportSymbolShape(shape as SymbolShape);
        default:
            throw new Error("unknow shape type: " + shape.type)
    }
}
