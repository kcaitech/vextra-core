export * from "./baseimport"
import * as basic from "./baseimport"
import * as impl from "../data/classes"
import * as types from "../data/typesdefine"
import { IImportContext } from "./baseimport"

/* image shape */
export function importImageShape(source: types.ImageShape, ctx?: IImportContext): impl.ImageShape {
    if (!source.points || source.points.length === 0) { // 兼容旧数据
        if (!source.points) source.points = [];
        // 需要用固定的，这样如果不同用户同时打开此文档，对points做的操作，对应的point id也是对的
        const id1 = "b259921b-4eba-461d-afc3-c4c58c1fa337"
        const id2 = "62ea3ee3-3378-4602-a918-7e05f426bb8e"
        const id3 = "1519da3c-c692-4e1d-beb4-01a85cc56738"
        const id4 = "e857f541-4e7f-491b-96e6-2ca38f1d4c09"
        const p1: types.CurvePoint = {
            id: id1,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 0, y: 0 }
        }; // lt
        const p2: types.CurvePoint =
        {
            id: id2,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 1, y: 0 }
        }; // rt
        const p3: types.CurvePoint = {
            id: id3,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 1, y: 1 }
        }; // rb
        const p4: types.CurvePoint = {
            id: id4,
            cornerRadius: 0,
            curveFrom: { x: 0, y: 0 },
            curveTo: { x: 0, y: 0 },
            hasCurveFrom: false,
            hasCurveTo: false,
            curveMode: types.CurveMode.Straight,
            point: { x: 0, y: 1 }
        }; // lb
        source.points.push(p1, p2, p3, p4);
    }
    const obj = basic.importImageShape(source, ctx);
    if (ctx?.document) obj.setImageMgr(ctx.document.mediasMgr);
    return obj;
}

/* fill */
export function importFill(source: types.Fill, ctx?: IImportContext): impl.Fill {
    const obj = basic.importFill(source, ctx);
    if (ctx?.document) obj.setImageMgr(ctx.document.mediasMgr);
    return obj;
}

/* table cell */
export function importTableCell(source: types.TableCell, ctx?: IImportContext): impl.TableCell {
    const obj = basic.importTableCell(source, ctx);
    if (ctx?.document) obj.setImageMgr(ctx.document.mediasMgr);
    return obj;
}

/* symbol ref shape */
export function importSymbolRefShape(source: types.SymbolRefShape, ctx?: IImportContext): impl.SymbolRefShape {
    const obj = basic.importSymbolRefShape(source, ctx);
    if (ctx?.document) obj.setSymbolMgr(ctx.document.symbolsMgr);
    return obj;
}

/* artboard shape */
export function importArtboard(source: types.Artboard, ctx?: IImportContext): impl.Artboard {
    const obj = basic.importArtboard(source, ctx);
    if (ctx?.document) ctx.document.artboardMgr.add(obj.id, obj);
    return obj;
}

/* symbol shape */
export function importSymbolShape(source: types.SymbolShape, ctx?: IImportContext): impl.SymbolShape {
    const obj = basic.importSymbolShape(source, ctx);
    if (ctx?.document) ctx.document.symbolsMgr.add(obj.id, obj);
    return obj;
}

/* flatten shape */
export function importFlattenShape(source: types.FlattenShape, ctx?: IImportContext): impl.FlattenShape {
    const obj = basic.importGroupShape(source, ctx);
    obj.isBoolOpShape = true;
    return obj;
}