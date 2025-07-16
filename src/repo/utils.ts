/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { exportArtboard, exportGroupShape, exportLineShape, 
    exportOvalShape, exportPathShape, exportRectShape, 
    exportSymbolRefShape, exportTextShape, 
    exportTableShape, exportTableCell, 
    exportContactShape, exportSymbolShape, exportSymbolUnionShape, 
    exportCutoutShape, exportPolygonShape, exportStarShape } from "../data/baseexport";
import { Artboard } from "../data/artboard";
import { GroupShape, LineShape, OvalShape, PathShape, 
    RectShape, Shape, ShapeType, SymbolUnionShape, 
    SymbolShape, TextShape, CutoutShape, PolygonShape, StarShape } from "../data/shape";
import { TableCell, TableShape } from "../data/table";
import { ContactShape } from "../data/contact";
import { Page } from "../data/page";
import { SymbolRefShape } from "../data/classes";
import { IImportContext, importArtboard, importContactShape, importGroupShape,  
    importLineShape, importOvalShape, importPathShape, 
    importRectShape, importSymbolUnionShape, importSymbolRefShape, importSymbolShape, 
    importTableCell, importTableShape, importTextShape, importCutoutShape, importBoolShape, 
    importPolygonShape, importStarShape } from "../data/baseimport";
import { Document } from "../data/document";
import { FMT_VER_latest } from "../data/fmtver";


import { Cmd, INet, ISave4Restore, LocalCmd, SelectionState } from "./types";

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

export function setFrame(page: Page, shape: Shape, x: number, y: number, w: number, h: number, op: Operator): boolean {
    const transfrom = shape.transform;
    const frame = shape.size;
    let changed = false;
    if (x !== transfrom.m02 || y !== transfrom.m12) {
        op.shapeModifyXY(page, shape, x, y)
        changed = true;
    }
    if (w !== frame.width || h !== frame.height) {
        op.shapeModifyWH(page, shape, w, h)
        changed = true;
    }
    return changed;
}

const imhdl: { [key: string]: (source: any, ctx?: IImportContext) => any } = {};
imhdl['bool-shape'] = importBoolShape;
imhdl['group-shape'] = importGroupShape;
imhdl['path-shape'] = importPathShape;
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
        case ShapeType.Line: return (exportLineShape(shape as LineShape))
        case ShapeType.Oval: return (exportOvalShape(shape as OvalShape))
        case ShapeType.Path: return (exportPathShape(shape as PathShape))
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
    const saveselection = cmd.saveselection;
    const cur = selection.save();
    if (isDiffSelectionState(cur, saveselection)) {
        selection.restore(saveselection);
    }
}