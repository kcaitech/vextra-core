import { exportArtboard, exportImageShape, exportLineShape, exportOvalShape, exportPathShape, exportRectShape, exportSymbolRefShape, exportSymbolShape, exportTextShape } from "../io/baseexport";
import { Matrix } from "../basic/matrix";
import { Artboard } from "../data/artboard";
import { GroupShape, ImageShape, LineShape, OvalShape, PathShape, RectShape, Shape, ShapeFrame, ShapeType, SymbolRefShape, SymbolShape, TextShape } from "../data/shape";

export function setFrame(frame: ShapeFrame, x: number, y: number, w: number, h: number): boolean {
    let changed = false;
    if (x !== frame.x) {
        frame.x = x;
        changed = true;
    }
    if (y !== frame.y) {
        frame.y = y;
        changed = true;
    }
    if (w !== frame.width) {
        frame.width = w;
        changed = true;
    }
    if (h !== frame.height) {
        frame.height = h;
        changed = true;
    }
    return changed;
}

function updateFrameXY(shape: Shape) {
    const realFrame = shape.boundingBox();
    const p: Shape | undefined = shape.parent;

    if (realFrame.x < 0 || realFrame.y < 0) {
        // 向上调整x,y
        let deltaX = realFrame.x < 0 ? -realFrame.x : 0;
        let deltaY = realFrame.y < 0 ? -realFrame.y : 0;

        if (p && !(p instanceof Artboard)) {
            shape.frame.x += deltaX;
            shape.frame.y += deltaY; // 现在在父级坐标系

            if (p.isNoTransform()) {
                if (deltaX > 0) p.frame.x -= deltaX;
                if (deltaY > 0) p.frame.y -= deltaY
            } else {
                const m = p.matrix2Parent();
                const x1 = -deltaX;
                const y1 = -deltaY;
                const target = m.computeCoord(x1, y1);
                const cur = m.computeCoord(0, 0);
                const dx = target.x - cur.x;
                const dy = target.y - cur.y;
                p.frame.x += dx;
                p.frame.y += dy;
            }

            p.childs.forEach((c: Shape) => {
                if (c.id === shape.id) return;
                c.frame.x += deltaX;
                c.frame.y += deltaY;
            })

            updateFrameXY(p);
        }
    }
}

function updateFrameWH(shape: Shape) {
    const float_accuracy = 1e-7;

    const p: Shape | undefined = shape.parent;
    // // 更新parent的frame
    if (p && !(p instanceof Artboard)) {
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
        let changed = false;
        if (p.isNoTransform()) {
            changed = setFrame(pf, pf.x + l, pf.y + t, r - l, b - t);
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

            changed = setFrame(pf, pf.x + dx, pf.y + dy, w, h)
        }

        if (changed && (Math.abs(l) > float_accuracy || Math.abs(t) > float_accuracy)) { // 仅在对象被删除后要更新？
            for (let i = 0; i < cc; i++) {
                const c = pg.childs[i];
                const cf = c.frame;
                cf.x = cf.x - l;
                cf.y = cf.y - t;
            }
        }

        if (changed) updateFrameWH(p);
    }
}

export function updateFrame(shape: Shape) {
    updateFrameXY(shape);
    updateFrameWH(shape);
}

export function exportShape(shape: Shape): string {
    switch (shape.type) {
        case ShapeType.Artboard: return JSON.stringify(exportArtboard(shape as Artboard))
        case ShapeType.Image: return JSON.stringify(exportImageShape(shape as ImageShape)) // todo
        case ShapeType.Line: return JSON.stringify(exportLineShape(shape as LineShape))
        case ShapeType.Oval: return JSON.stringify(exportOvalShape(shape as OvalShape))
        case ShapeType.Path: return JSON.stringify(exportPathShape(shape as PathShape))
        case ShapeType.Rectangle: return JSON.stringify(exportRectShape(shape as RectShape))
        case ShapeType.SymbolRef: return JSON.stringify(exportSymbolRefShape(shape as SymbolRefShape))
        case ShapeType.Symbol: return JSON.stringify(exportSymbolShape(shape as SymbolShape))
        case ShapeType.Text: return JSON.stringify(exportTextShape(shape as TextShape))
        default: throw new Error("unknow shape type: " + shape.type)
    }
}
export function getFormatFromBase64(base64: string) {
    const fileheader = new Map([
        ['data:image/svg+xml', 'svg'],
        ['data:image/gif', 'gif'],
        ['data:image/jpeg', 'jpeg'],
        ['data:image/png', 'png'],
    ])
    const header = base64.substring(0, base64.indexOf(';'));
    return fileheader.get(header);
}
export function base64ToDataUrl(format: string, base64: string) {
    const de_fileheader = new Map([
        ['svg', `data:image/svg+xml;base64,${base64}`,],
        ['gif', `data:image/gif;base64,${base64}`],
        ['jpeg', `data:image/jpeg;base64,${base64}`],
        ['png', `data:image/png;base64,${base64}`]
    ])
    return de_fileheader.get(format) || '';
}