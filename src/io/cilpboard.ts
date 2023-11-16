import {GroupShape, Shape, ShapeFrame, ShapeType, TextShape} from "../data/shape";
import {
    exportArtboard,
    exportGroupShape,
    exportImageShape,
    exportLineShape,
    exportOvalShape,
    exportPathShape,
    exportRectShape,
    exportSymbolRefShape,
    exportSymbolShape,
    exportTableShape,
    exportText,
    exportTextShape
} from "../data/baseexport";
import {
    IImportContext,
    importArtboard,
    importGroupShape,
    importImageShape,
    importLineShape,
    importOvalShape,
    importPathShape,
    importRectShape,
    importSymbolRefShape,
    importTableShape,
    importText,
    importTextShape
} from "../data/baseimport";
import * as types from "../data/typesdefine";
import {v4} from "uuid";
import {Document} from "../data/document";
import {newSymbolRefShape, newTextShape, newTextShapeByText} from "../editor/creator";
import {Api} from "../editor/command/recordapi";
import {translateTo} from "../editor/frame";
import {Page} from "../data/page";

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
        } else if (type === ShapeType.SymbolRef) {
            content = exportSymbolRefShape(shape as unknown as types.SymbolRefShape);
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
    const ctx: IImportContext = new class implements IImportContext {
        document: Document = document;
    };
    const result: Shape[] = [];
    try {
        for (let i = 0, len = source.length; i < len; i++) {
            const _s = source[i], type = _s.type;
            let r: Shape | undefined = undefined;
            if (type === ShapeType.Symbol) {
                if (!document.symbolsMgr.getSync(_s.id)) continue;
                const f = new ShapeFrame(_s.frame.x, _s.frame.y, _s.frame.width, _s.frame.height);
                if ((_s as any).isUnionSymbolShape) {
                    const dlt = (_s as any).childs[0];
                    if (!dlt) continue;
                    f.width = dlt.frame.width;
                    f.height = dlt.frame.height;
                }
                r = newSymbolRefShape(_s.name, f, _s.id, document.symbolsMgr);
                r && result.push(r);
                continue;
            }

            _s.id = v4();
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
                const children = (_s as GroupShape).childs;
                children && children.length && set_childs_id(children);
                r = importArtboard(_s as types.Artboard, ctx);
            } else if (type === ShapeType.Group) {
                const children = (_s as GroupShape).childs;
                children && children.length && set_childs_id(children);
                r = importGroupShape(_s as types.GroupShape, ctx);
            } else if (type === ShapeType.Table) {
                const children = (_s as GroupShape).childs;
                children && children.length && set_childs_id(children);
                r = importTableShape(_s as types.TableShape, ctx);
            } else if (type === ShapeType.SymbolRef) {
                r = importSymbolRefShape(_s as types.SymbolRefShape, ctx);
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
        return newTextShapeByText(name, text);
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

export function modify_frame_after_insert(api: Api, page: Page, shapes: Shape[]) {
    for (let i = 0, len = shapes.length; i < len; i++) {
        const shape = shapes[i];
        translateTo(api, page, shape, shape.frame.x, shape.frame.y);
    }
}

export function XYsBounding(points: { x: number, y: number }[]) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < points.length; i++) {
        xs.push(points[i].x);
        ys.push(points[i].y);
    }
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    return {top, bottom, left, right};
}

export function get_frame(shapes: Shape[]): { x: number, y: number }[] {
    const points: { x: number, y: number }[] = [];
    for (let i = 0, len = shapes.length; i < len; i++) {
        const s = shapes[i];
        const m = s.matrix2Root();
        const f = s.frame;
        const ps: { x: number, y: number }[] = [
            {x: 0, y: 0},
            {x: f.width, y: 0},
            {x: f.width, y: f.height},
            {x: 0, y: f.height}
        ];
        for (let i = 0; i < 4; i++) points.push(m.computeCoord3(ps[i]));
    }
    const b = XYsBounding(points);
    return [{x: b.left, y: b.top}, {x: b.right, y: b.top}, {x: b.right, y: b.bottom}, {x: b.left, y: b.bottom}];
}