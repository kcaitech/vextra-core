import { GroupShape, Shape, ShapeType } from "../data/shape";
import { RectShape } from "../data/typesdefine";
import { exportArtboard, exportRectShape, exportOvalShape, exportImageShape, IExportContext } from "./baseexport";
import { importArtboard, importRectShape, importOvalShape, importImageShape, IImportContext } from "./baseimport";
import * as types from "../data/typesdefine";

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
const noeffectCtx = new class implements IImportContext {
    afterImport(obj: any): void { }
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
        }
        const parent = shape.parent;
        if (parent) {
            const childs = (parent as GroupShape).childs;
            r.index = Math.max(0, childs.findIndex(i => i.id === shape.id));
            result.push(r);
        }
    }
    return result;
}
// 导入图形
export function import_shape(shapes: Shape[]) {

}