import { GroupShape, Shape, ShapeType } from "../data/shape";
import { exportArtboard, exportRectShape, exportOvalShape, exportImageShape, IExportContext, exportLineShape, exportTextShape } from "./baseexport";
import { importArtboard, importRectShape, importOvalShape, importImageShape, IImportContext, importLineShape, importTextShape } from "./baseimport";
import * as types from "../data/typesdefine";
import { v4 } from "uuid";
import { Document } from "../data/document";

function set_childs_id(shapes: Shape[]) {
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        shape.id = v4();
        if (shape.childs && shape.childs.length) {
            set_childs_id(shape.childs);
        }
    }
}
class ExfContext implements IExportContext {
    afterExport(obj: any): void {
        if (!obj.typeId) {
            //
        }
        else if (obj.typeId === 'symbol-ref-shape') {
            this.symbols.add(obj.refId)
            this.allsymbols.add(obj.refId)
        }
        else if (obj.typeId === 'image-shape') {
            this.allmedias.add(obj.imageRef)
        }
        else if (obj.typeId === 'artboard-ref') {
            this.artboards.add(obj.refId)
            this.allartboards.add(obj.refId)
        }
    }

    symbols = new Set<string>()
    artboards = new Set<string>()

    allmedias = new Set<string>()
    allartboards = new Set<string>();
    allsymbols = new Set<string>();
}
export interface ExportContent {
    index: number
    content: types.Shape
}
// 导出图形到剪切板
export function export_shape(shapes: Shape[]) {
    const ectx = new ExfContext();
    const result: ExportContent[] = []
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const type = shape.type;
        const r: any = { index: 0 };
        if (type === ShapeType.Rectangle) {
            r.content = exportRectShape(ectx, shape as unknown as types.RectShape);
        } else if (type === ShapeType.Oval) {
            r.content = exportOvalShape(ectx, shape as unknown as types.OvalShape);
        } else if (type === ShapeType.Line) {
            r.content = exportLineShape(ectx, shape as unknown as types.LineShape);
        } else if (type === ShapeType.Image) {
            r.content = exportImageShape(ectx, shape as unknown as types.ImageShape);
        } else if (type === ShapeType.Text) {
            r.content = exportTextShape(ectx, shape as unknown as types.TextShape);
        } else if (type === ShapeType.Artboard) {
            r.content = exportArtboard(ectx, shape as unknown as types.Artboard);
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
            if (obj.typeId === 'image-shape') {
                obj.setImageMgr(document.mediasMgr);
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
                r = importRectShape(ctx, _s.content as types.RectShape);
            } else if (type === ShapeType.Oval) {
                r = importOvalShape(ctx, _s.content as types.OvalShape);
            } else if (type === ShapeType.Line) {
                r = importLineShape(ctx, _s.content as types.LineShape);
            } else if (type === ShapeType.Image) {
                r = importImageShape(ctx, _s.content as types.ImageShape);
            } else if (type === ShapeType.Text) {
                r = importTextShape(ctx, _s.content as types.TextShape);
            } else if (type === ShapeType.Artboard) {
                const childs = (_s.content as GroupShape).childs;
                if (childs && childs.length) {
                    set_childs_id(childs);
                }
                r = importArtboard(ctx, _s.content as types.Artboard);
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