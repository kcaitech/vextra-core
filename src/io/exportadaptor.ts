export * from "./baseexport"
import * as basic from "./baseexport"
import * as types from "../data/typesdefine"
import { IExportContext } from "./baseexport";

/* symbol shape */
export function exportSymbolShape(source: types.SymbolShape, ctx?: IExportContext): types.SymbolShape {
    const obj = basic.exportSymbolShape(source, ctx);
    if (ctx?.symbols) ctx.symbols.add(obj.id);
    return obj;
}

/* image shape */
export function exportImageShape(source: types.ImageShape, ctx?: IExportContext): types.ImageShape {
    const obj = basic.exportImageShape(source, ctx);
    if (ctx?.medias) ctx.medias.add(obj.imageRef);
    return obj;
}

/* fill */
export function exportFill(source: types.Fill, ctx?: IExportContext): types.Fill {
    const obj = basic.exportFill(source, ctx);
    if (ctx?.medias && obj.imageRef) ctx.medias.add(obj.imageRef);
    return obj;
}

/* table cell */
export function exportTableCell(source: types.TableCell, ctx?: IExportContext): types.TableCell {
    const obj = basic.exportTableCell(source, ctx);
    if (ctx?.medias && obj.imageRef) ctx.medias.add(obj.imageRef);
    return obj;
}