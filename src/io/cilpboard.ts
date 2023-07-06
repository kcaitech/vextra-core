import { GroupShape, ImageShape, Shape, ShapeType, SymbolRefShape, SymbolShape, TextShape } from "../data/shape";
import { exportArtboard, exportRectShape, exportOvalShape, exportImageShape, exportLineShape, exportTextShape, exportPathShape, exportGroupShape } from "./baseexport";
import { importArtboard, importRectShape, importOvalShape, importImageShape, IImportContext, importLineShape, importTextShape, importPathShape, importGroupShape } from "./baseimport";
import * as types from "../data/typesdefine";
import { v4 } from "uuid";
import { Document } from "../data/document";
import { Artboard } from "../data/classes";

function set_childs_id(shapes: Shape[]) {
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        shape.id = v4();
        if (shape.childs && shape.childs.length) {
            set_childs_id(shape.childs);
        }
    }
}

export interface ExportContent {
    index: number
    content: types.Shape
}
// 导出图形到剪切板
export function export_shape(shapes: Shape[]) {
    const result: ExportContent[] = []
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const type = shape.type;
        const r: any = { index: 0 };
        if (type === ShapeType.Rectangle) {
            r.content = exportRectShape(shape as unknown as types.RectShape);
        } else if (type === ShapeType.Oval) {
            r.content = exportOvalShape(shape as unknown as types.OvalShape);
        } else if (type === ShapeType.Line) {
            r.content = exportLineShape(shape as unknown as types.LineShape);
        } else if (type === ShapeType.Image) {
            r.content = exportImageShape(shape as unknown as types.ImageShape);
        } else if (type === ShapeType.Text) {
            r.content = exportTextShape(shape as unknown as types.TextShape);
        } else if (type === ShapeType.Path) {
            r.content = exportPathShape(shape as unknown as types.PathShape);
        } else if (type === ShapeType.Artboard) {
            r.content = exportArtboard(shape as unknown as types.Artboard);
        } else if (type === ShapeType.Group) {
            r.content = exportGroupShape(shape as unknown as types.GroupShape);
        }
        const parent = shape.parent;
        if (parent) {
            const childs = (parent as GroupShape).childs;
            r.index = Math.max(0, childs.findIndex(i => i.id === shape.id));
            if (r.content) {
                result.push(r);
            }
        }
    }
    return result;
}

// 从剪切板导入图形
export function import_shape(document: Document, source: { index: number, content: types.Shape }[]) {
    const ctx = new class implements IImportContext {
        afterImport(obj: any): void {
            if (obj instanceof ImageShape) {
                obj.setImageMgr(document.mediasMgr)
            } else if (obj instanceof SymbolRefShape) {
                obj.setSymbolMgr(document.symbolsMgr)
                // } else if (obj instanceof ArtboardRef) {
                //     obj.setArtboardMgr(document.artboardMgr)
            } else if (obj instanceof Artboard) {
                document.artboardMgr.add(obj.id, obj);
            } else if (obj instanceof SymbolShape) {
                document.symbolsMgr.add(obj.id, obj);
            } else if (obj instanceof TextShape) {
                obj.setMeasureFun(document.measureFun);
            }
        }
    }
    const result: Shape[] = [];
    try {
        for (let i = 0; i < source.length; i++) {
            const _s = source[i];
            _s.content.id = v4();
            let r: Shape | undefined = undefined;
            const type = _s.content.type;
            if (type === ShapeType.Rectangle) {
                r = importRectShape(_s.content as types.RectShape);
            } else if (type === ShapeType.Oval) {
                r = importOvalShape(_s.content as types.OvalShape);
            } else if (type === ShapeType.Line) {
                r = importLineShape(_s.content as types.LineShape);
            } else if (type === ShapeType.Image) {
                r = importImageShape(_s.content as types.ImageShape, ctx);
            } else if (type === ShapeType.Text) {
                r = importTextShape(_s.content as types.TextShape, ctx);
            } else if (type === ShapeType.Path) {
                r = importPathShape(_s.content as types.PathShape);
            } else if (type === ShapeType.Artboard) {
                const childs = (_s.content as GroupShape).childs;
                if (childs && childs.length) {
                    set_childs_id(childs);
                }
                r = importArtboard(_s.content as types.Artboard, ctx);
            } else if (type === ShapeType.Group) {
                const childs = (_s.content as GroupShape).childs;
                if (childs && childs.length) {
                    set_childs_id(childs);
                }
                r = importGroupShape(_s.content as types.GroupShape, ctx);
            }
            if (r) {
                result.push(r);
            }
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