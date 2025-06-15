/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { exportArtboard, exportGroupShape, exportImageShape, exportLineShape, exportOvalShape, exportPathShape, exportRectShape, exportSymbolRefShape, exportTextShape, exportTableShape, exportPathShape2, exportTableCell, exportContactShape, exportSymbolShape, exportSymbolUnionShape, exportCutoutShape, exportPolygonShape, exportStarShape } from "../data/baseexport";
import { Artboard } from "../data/artboard";
import { GroupShape, ImageShape, LineShape, OvalShape, PathShape, PathShape2, RectShape, Shape, ShapeType, SymbolUnionShape, SymbolShape, TextShape, CutoutShape, PolygonShape, StarShape } from "../data/shape";
import { TableCell, TableShape } from "../data/table";
import { ContactShape } from "../data/contact";
import { Page } from "../data/page";
import { SymbolRefShape } from "../data/classes";
import { IImportContext, importArtboard, importContactShape, importGroupShape, importImageShape, importLineShape, importOvalShape, importPathShape, importPathShape2, importRectShape, importSymbolUnionShape, importSymbolRefShape, importSymbolShape, importTableCell, importTableShape, importTextShape, importCutoutShape, importBoolShape, importPolygonShape, importStarShape } from "../data/baseimport";
import { Document } from "../data/document";
import { FMT_VER_latest } from "../data/fmtver";


import { Cmd, INet, ISave4Restore, LocalCmd, SelectionState } from "./types";
import { ArrayOp, ArrayOpSelection } from "../operator";
import { transform } from "./arrayoptransform";

export function isDiffStringArr(lhs: string[], rhs: string[]): boolean {
    if (lhs.length !== rhs.length) return true;
    for (let i = 0; i < lhs.length; ++i) {
        if (lhs[i] !== rhs[i]) return true;
    }
    return false;
}

export function isDiffSelectionState(lhs: SelectionState, rhs: SelectionState): boolean {
    if (lhs.shapes.length !== rhs.shapes.length) return true;
    if (isDiffStringArr(lhs.shapes, rhs.shapes)) return true;

    if (lhs.table === rhs.table && lhs.text === rhs.text) return false; // undefined
    if (lhs.table && rhs.table) {
        const lt = lhs.table;
        const rt = rhs.table;
        if (lt.isRowOrCol !== rt.isRowOrCol || lt.rows.length !== rt.rows.length || lt.cols.length !== rt.cols.length) return true;
        if (isDiffStringArr(lt.rows, rt.rows)) return true;
        if (isDiffStringArr(lt.cols, rt.cols)) return true;
    } else if (lhs.table !== rhs.table) {
        return true;
    }
    if (lhs.text && rhs.text) {
        // id: string, // 可不要
        // path: string[], // 要有
        // order: number, // MAX
        // start: number, // 
        // length: number,
        if (lhs.text.start !== rhs.text.start || lhs.text.length !== rhs.text.length) return true;
    }
    else if (lhs.text !== rhs.text) {
        return true;
    }
    return false;
}

export function cloneSelectionState(selection: SelectionState): SelectionState {
    return {
        shapes: selection.shapes,
        table: selection.table,
        text: selection.text ? selection.text.clone() : undefined
    }
}


interface Operator {
    shapeModifyXY(page: Page, shape: Shape, x: number, y: number): void;
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number): void;
}

export function setFrame(page: Page, shape: Shape, x: number, y: number, w: number, h: number, api: Operator): boolean {
    const transfrom = shape.transform;
    const frame = shape.size;
    let changed = false;
    if (x !== transfrom.m02 || y !== transfrom.m12) {
        api.shapeModifyXY(page, shape, x, y)
        changed = true;
    }
    if (w !== frame.width || h !== frame.height) {
        api.shapeModifyWH(page, shape, w, h)
        changed = true;
    }
    return changed;
}

// const float_accuracy = 1e-7;

// function __updateShapeFrame(page: Page, shape: Shape, api: Api): boolean {
//     const p: GroupShape | undefined = shape.parent as GroupShape;
//     // check
//     if (!p || p.childs.length === 0) return false;
//     if ((p.type === ShapeType.Artboard || p.type === ShapeType.SymbolRef || p.type === ShapeType.Symbol || p.type === ShapeType.SymbolUnion)) return false;
//     const idx = p.childs.findIndex(s => s.id === shape.id);
//     if (idx < 0) return false;

//     let changed = false;
//     const cc = p.childs.length;
//     const cf = p.childs[0].boundingBox();
//     let l = cf.x, t = cf.y, r = l + cf.width, b = t + cf.height;
//     for (let i = 1; i < cc; i++) {
//         const c = p.childs[i];
//         const cf = c.boundingBox();
//         const cl = cf.x, ct = cf.y, cr = cl + cf.width, cb = ct + cf.height;
//         l = Math.min(cl, l);
//         t = Math.min(ct, t);
//         r = Math.max(cr, r);
//         b = Math.max(cb, b);
//     }
//     if ((Math.abs(l) > float_accuracy || Math.abs(t) > float_accuracy)) { // 仅在对象被删除后要更新？
//         for (let i = 0; i < cc; i++) {
//             const c = p.childs[i];
//             const transfrom = c.transform;
//             api.shapeModifyX(page, c, transfrom.m02 - l)
//             api.shapeModifyY(page, c, transfrom.m12 - t)
//         }
//     }

//     const w = r - l;
//     const h = b - t;
//     if (p.isNoTransform()) {
//         const ptransfrom = p.transform;
//         changed = setFrame(page, p, ptransfrom.m02 + l, ptransfrom.m12 + t, w, h, api);
//     } else {
//         const ptransfrom = p.transform;
//         const m = p.matrix2Parent();
//         const xy = m.computeRef(l, t);
//         changed = setFrame(page, p, ptransfrom.m02 + xy.x, ptransfrom.m12 + xy.y, w, h, api);
//     }

//     return changed;
// }

// export function updateShapesFrame(page: Page, shapes: Shape[], api: Api) {
//     if (shapes.length === 0) return;
//     type Node = { shape: Shape, updated: boolean, childs: Node[], changed: boolean, needupdate: boolean }
//     const updatetree: Map<string, Node> = new Map();
//     shapes.forEach((s) => {
//         let n: Node | undefined = updatetree.get(s.id);
//         if (n) {
//             n.needupdate = true;
//             return;
//         }
//         n = { shape: s, updated: false, childs: [], changed: false, needupdate: true }
//         updatetree.set(s.id, n);

//         let p = s.parent;
//         while (p) {
//             let pn: Node | undefined = updatetree.get(p.id);
//             if (pn) {
//                 pn.childs.push(n);
//             }
//             else {
//                 pn = { shape: p, updated: false, childs: [n], changed: false, needupdate: false }
//                 updatetree.set(p.id, pn);
//             }
//             n = pn;
//             p = p.parent;
//         }
//     });

//     const root: Node | undefined = updatetree.get(page.id);
//     if (!root) throw new Error("")

//     while (updatetree.size > 0 && !root.updated) {
//         // get first node of childs is empty or all updated!
//         let next = root;
//         while (next) {
//             if (next.childs.length === 0) break;
//             let nextchild;
//             for (let i = 0, len = next.childs.length; i < len; i++) {
//                 const child = next.childs[i];
//                 if (!child.updated) {
//                     nextchild = child; // 下一个未更新的子节点
//                     break;
//                 }
//             }
//             if (!nextchild) break;
//             next = nextchild;
//         }
//         const needupdate = next.needupdate || ((childs) => {
//             for (let i = 0; i < childs.length; i++) {
//                 if (childs[i].changed) return true;
//             }
//             return false;
//         })(next.childs)
//         const changed = needupdate && __updateShapeFrame(page, next.shape, api);
//         next.updated = true;
//         next.changed = changed;
//     }
//     page.__collect.notify('collect'); // 收集辅助线采用的关键点位
// }

const imhdl: { [key: string]: (source: any, ctx?: IImportContext) => any } = {};
imhdl['bool-shape'] = importBoolShape;
imhdl['group-shape'] = importGroupShape;
imhdl['image-shape'] = importImageShape;
imhdl['path-shape'] = importPathShape;
imhdl['path-shape2'] = importPathShape2;
imhdl['rect-shape'] = importRectShape;
imhdl['symbol-ref-shape'] = importSymbolRefShape;
imhdl['text-shape'] = importTextShape;
imhdl['artboard'] = importArtboard;
imhdl['line-shape'] = importLineShape;
imhdl['oval-shape'] = importOvalShape;
imhdl['table-shape'] = importTableShape;
imhdl['table-cell'] = importTableCell;
imhdl['contact-shape'] = importContactShape;
imhdl['symbol-shape'] = importSymbolShape;
imhdl['symbol-union-shape'] = importSymbolUnionShape;
imhdl['cutout-shape'] = importCutoutShape;
imhdl['polygon-shape'] = importPolygonShape;
imhdl['star-shape'] = importStarShape;
export function importShape(data: string | Object, document: Document, page: Page, fmtVer: string = FMT_VER_latest) {
    const source: { [key: string]: any } = typeof data === 'string' ? JSON.parse(data) : data;
    const ctx: IImportContext = new class implements IImportContext { document: Document = document; curPage: string = page.id; fmtVer: string = fmtVer };
    const h = imhdl[source.typeId];
    if (h) return h(source, ctx);
    throw new Error("unknow shape type: " + source.typeId)
}

export function exportShape(shape: Shape): Object {
    switch (shape.type) {
        case ShapeType.Artboard: return (exportArtboard(shape as Artboard))
        case ShapeType.Image: return (exportImageShape(shape as ImageShape)) // todo 图片？？
        case ShapeType.Line: return (exportLineShape(shape as LineShape))
        case ShapeType.Oval: return (exportOvalShape(shape as OvalShape))
        case ShapeType.Path: return (exportPathShape(shape as PathShape))
        case ShapeType.Path2: return (exportPathShape2(shape as PathShape2))
        case ShapeType.Rectangle: return (exportRectShape(shape as RectShape))
        case ShapeType.SymbolRef: return (exportSymbolRefShape(shape as SymbolRefShape))
        case ShapeType.Text: return (exportTextShape(shape as TextShape))
        case ShapeType.Group: return (exportGroupShape(shape as GroupShape))
        // case ShapeType.FlattenShape: return exportFlattenShape(shape as FlattenShape);
        case ShapeType.Table: return exportTableShape(shape as TableShape)
        case ShapeType.TableCell: return exportTableCell(shape as TableCell);
        case ShapeType.Contact: return exportContactShape(shape as ContactShape);
        case ShapeType.Cutout: return exportCutoutShape(shape as CutoutShape);
        case ShapeType.Symbol: return exportSymbolShape(shape as SymbolShape);
        case ShapeType.SymbolUnion: return exportSymbolUnionShape(shape as SymbolUnionShape);
        case ShapeType.Polygon: return exportPolygonShape(shape as PolygonShape);
        case ShapeType.Star: return exportStarShape(shape as StarShape);
        default: throw new Error("unknow shape type: " + shape.type)
    }
}


export class MockNet implements INet {
    hasConnected(): boolean {
        return false;
    }
    async pullCmds(from: number, to: number): Promise<Cmd[]> {
        return [];
    }
    async postCmds(cmds: Cmd[]): Promise<boolean> {
        return false;
    }

    watchCmds(watcher: (cmds: Cmd[]) => void) {
        return () => { };
    }

    watchError(watcher: (errorInfo: any) => void): void {

    }
}

export function defaultSU(selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd): void {
    if (!cmd.saveselection) return;
    let saveselection = cmd.saveselection;
    if (!isUndo && saveselection.text) {
        // 需要变换
        const selectTextOp = saveselection.text;
        const idx = cmd.ops.indexOf(selectTextOp);
        if (idx < 0) {
            throw new Error(); // 出现了
        }
        const rhs = cmd.ops.slice(idx + 1).reduce((rhs, op) => {
            if (!isDiffStringArr(op.path, selectTextOp.path)) rhs.push(op as ArrayOp);
            return rhs;
        }, [] as ArrayOp[])
        const trans = transform([selectTextOp], rhs);
        saveselection = cloneSelectionState(saveselection);
        saveselection.text = trans.lhs[0] as ArrayOpSelection;
    }
    const cur = selection.save();
    if (isDiffSelectionState(cur, saveselection)) {
        selection.restore(saveselection);
    }
}