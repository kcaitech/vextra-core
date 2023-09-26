import { GroupShape, Shape, ShapeType, SymbolShape, TextShape } from "../data/shape";
import { exportArtboard, exportRectShape, exportOvalShape, exportImageShape, exportLineShape, exportTextShape, exportPathShape, exportGroupShape, exportText, exportTableShape, exportSymbolShape, exportShapeFrame } from "../data/baseexport";
import { importArtboard, importRectShape, importOvalShape, importImageShape, IImportContext, importLineShape, importTextShape, importPathShape, importGroupShape, importText, importTableShape, importSymbolShape, importShapeFrame } from "../data/baseimport";
import * as types from "../data/typesdefine";
import { v4 } from "uuid";
import { Document } from "../data/document";
import { newSymbolRefShape, newTextShape, newTextShapeByText } from "../editor/creator";

export function set_childs_id(shapes: Shape[]) {
    for (let i = 0, len = shapes.length; i < len; i++) {
        const shape = shapes[i];
        if (!shape) continue;
        shape.id = v4();
        if (shape.childs && shape.childs.length) set_childs_id(shape.childs);
    }
}

// 导出图形到剪切板
export function export_shape(shapes: Shape[]) {
    const result: Shape[] = []
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i], type = shape.type;
        let content: any;
        if (type === ShapeType.Rectangle) {
            content = exportRectShape(shape as unknown as types.RectShape);
        } else if (type === ShapeType.Oval) {
            content = exportOvalShape(shape as unknown as types.OvalShape);
        } else if (type === ShapeType.Line) {
            content = exportLineShape(shape as unknown as types.LineShape);
        } else if (type === ShapeType.Image) {
            content = exportImageShape(shape as unknown as types.ImageShape);
        } else if (type === ShapeType.Text) {
            content = exportTextShape(shape as unknown as types.TextShape);
        } else if (type === ShapeType.Path) {
            content = exportPathShape(shape as unknown as types.PathShape);
        } else if (type === ShapeType.Artboard) {
            content = exportArtboard(shape as unknown as types.Artboard);
        } else if (type === ShapeType.Group) {
            content = exportGroupShape(shape as unknown as types.GroupShape);
        } else if (type === ShapeType.Table) {
            content = exportTableShape(shape as unknown as types.TableShape);
        } else if (type === ShapeType.Symbol) {
            content = exportSymbolShape(shape as unknown as types.SymbolShape);
        }
        if (content) {
            content.style.contacts && (content.style.contacts = undefined);
            result.push(content);
        }
    }
    return result;
}

// 从剪切板导入图形
export function import_shape(document: Document, source: types.Shape[]) {
    const ctx: IImportContext = new class implements IImportContext { document: Document = document };
    // const ctx = new class implements IImportContext {
    //     afterImport(obj: any): void {
    //         if (obj instanceof ImageShape || obj instanceof Fill || obj instanceof TableCell) {
    //             obj.setImageMgr(document.mediasMgr)
    //         } else if (obj instanceof SymbolRefShape) {
    //             obj.setSymbolMgr(document.symbolsMgr)
    //             // } else if (obj instanceof ArtboardRef) {
    //             //     obj.setArtboardMgr(document.artboardMgr)
    //         } else if (obj instanceof Artboard) {
    //             document.artboardMgr.add(obj.id, obj);
    //         } else if (obj instanceof SymbolShape) {
    //             document.symbolsMgr.add(obj.id, obj);
    //         } else if (obj instanceof FlattenShape) {
    //             obj.isBoolOpShape = true;
    //         }
    //     }
    // }
    const result: Shape[] = [];
    try {
        for (let i = 0, len = source.length; i < len; i++) {
            const _s = source[i], type = _s.type;
            _s.id = v4();
            let r: Shape | undefined = undefined;
            if (type === ShapeType.Rectangle) {
                r = importRectShape(_s as types.RectShape);
            } else if (type === ShapeType.Oval) {
                r = importOvalShape(_s as types.OvalShape);
            } else if (type === ShapeType.Line) {
                r = importLineShape(_s as types.LineShape);
            } else if (type === ShapeType.Image) {
                r = importImageShape(_s as types.ImageShape, ctx);
            } else if (type === ShapeType.Text) {
                r = importTextShape(_s as types.TextShape, ctx);
            } else if (type === ShapeType.Path) {
                r = importPathShape(_s as types.PathShape);
            } else if (type === ShapeType.Artboard) {
                const childs = (_s as GroupShape).childs;
                childs && childs.length && set_childs_id(childs);
                importArtboard(_s as types.Artboard, ctx); // 此时已经进入文档
                r = importArtboard(_s as types.Artboard);
            } else if (type === ShapeType.Group) {
                const childs = (_s as GroupShape).childs;
                childs && childs.length && set_childs_id(childs);
                r = importGroupShape(_s as types.GroupShape, ctx);
            } else if (type === ShapeType.Table) {
                const childs = (_s as GroupShape).childs;
                childs && childs.length && set_childs_id(childs);
                r = importTableShape(_s as types.TableShape, ctx);
            } else if (type === ShapeType.Symbol) {
                const childs = (_s as GroupShape).childs;
                childs && childs.length && set_childs_id(childs);
                r = importSymbolShape(_s as types.SymbolShape);
            }
            r && result.push(r);
        }
    } catch (error) {
        console.log(error);
    }
    return result;
}
/**
 * 生成对象副本
 * @param src 原对象
 * @returns 
 */
export function transform_data(document: Document, src: Shape[]): Shape[] {
    return import_shape(document, export_shape(src));
}
/**
 * @description 导出段落
 * @param text 
 * @returns 
 */
export function export_text(text: types.Text): types.Text {
    return exportText(text);
}
/**
 * @description 导入段落
 * @param text 
 * @param { boolean } gen 直接生成一个文字图层，否则返回整理之后的text副本
 * @returns 
 */
export function import_text(document: Document, text: types.Text, gen?: boolean): types.Text | TextShape {
    if (gen) {
        const name = text.paras[0].text || 'text';
        const shape = newTextShapeByText(name, text);
        return shape;
    }
    return importText(text);
}
/**
 * @description 段落整理
 * @param text 
 * @param { boolean } gen 直接生成一个文字图层，否则返回整理之后的text副本
 */
export function trasnform_text(document: Document, text: types.Text, gen?: boolean): TextShape | types.Text {
    const _text = importText(exportText(text));
    if (gen) {
        const name = text.paras[0].text || 'text';
        return newTextShape(name)
    }
    return _text;
}
export async function symbol2ref(document: Document, symbol: SymbolShape) {
    const is_existed = await document.symbolsMgr.get(symbol.id);
    if (is_existed) {
        const frame = importShapeFrame(exportShapeFrame(symbol.frame));
        const name = symbol.name;
        // return newSymbolRefShape(name, frame, symbol.id);
        return symbol;
    } else {
        return symbol;
    }
}