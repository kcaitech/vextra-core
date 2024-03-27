import { GroupShape, Shape, ShapeFrame, ShapeType, SymbolUnionShape, TextShape } from "../data/shape";
import {
    exportArtboard, exportBoolShape,
    exportContactShape,
    exportCutoutShape,
    exportGradient,
    exportGroupShape,
    exportImageShape,
    exportLineShape,
    exportOvalShape,
    exportPathShape,
    exportPathShape2,
    exportRectShape,
    exportSymbolRefShape,
    exportSymbolShape,
    exportSymbolUnionShape,
    exportTableShape,
    exportText,
    exportTextShape,
    IExportContext
} from "../data/baseexport";
import {
    IImportContext,
    importArtboard,
    importBoolShape,
    importContactShape,
    importCutoutShape,
    importGradient,
    importGroupShape,
    importImageShape,
    importLineShape,
    importOvalShape,
    importPathShape,
    importPathShape2,
    importRectShape,
    importSymbolRefShape,
    importSymbolShape,
    importSymbolUnionShape,
    importTableShape,
    importText,
    importTextShape
} from "../data/baseimport";
import * as types from "../data/typesdefine";
import { v4 } from "uuid";
import { Document } from "../data/document";
import { newSymbolRefShape, newTextShape, newTextShapeByText } from "../editor/creator";
import { Api } from "../editor/coop/recordapi";
import { translateTo } from "../editor/frame";
import { Page } from "../data/page";

export function set_childs_id(shapes: Shape[], matched?: Set<string>) {
    for (let i = 0, len = shapes.length; i < len; i++) {
        const shape = shapes[i] as GroupShape;
        if (!shape) {
            continue;
        }
        if (!matched?.has(shape.id)) {
            shape.id = v4();
        }

        if (shape.childs && shape.childs.length) {
            set_childs_id(shape.childs, matched);
        }
    }
}

class ExfContext implements IExportContext {

    symbols = new Set<string>()
    // artboards = new Set<string>()

    medias = new Set<string>()
    referenced = new Set<string>()
    // allartboards = new Set<string>();
    // allsymbols = new Set<string>();
}

// 导出图形到剪切板
export function export_shape(shapes: Shape[]) {
    const ctx = new ExfContext();
    const result: Shape[] = []
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i], type = shape.type;
        let content: any;
        if (type === ShapeType.Rectangle) {
            content = exportRectShape(shape as unknown as types.RectShape, ctx);
        } else if (type === ShapeType.Oval) {
            content = exportOvalShape(shape as unknown as types.OvalShape, ctx);
        } else if (type === ShapeType.Line) {
            content = exportLineShape(shape as unknown as types.LineShape, ctx);
        } else if (type === ShapeType.Image) {
            content = exportImageShape(shape as unknown as types.ImageShape, ctx);
        } else if (type === ShapeType.Text) {
            content = exportTextShape(shape as unknown as types.TextShape, ctx);
        } else if (type === ShapeType.Path) {
            content = exportPathShape(shape as unknown as types.PathShape, ctx);
        } else if (type === ShapeType.Path2) {
            content = exportPathShape2(shape as unknown as types.PathShape2, ctx);
        } else if (type === ShapeType.Artboard) {
            content = exportArtboard(shape as unknown as types.Artboard, ctx);
        } else if (type === ShapeType.Group) {
            content = exportGroupShape(shape as unknown as types.GroupShape, ctx);
        } else if (type === ShapeType.Table) {
            content = exportTableShape(shape as unknown as types.TableShape, ctx);
        } else if (type === ShapeType.Symbol) {
            content = exportSymbolShape(shape as unknown as types.SymbolShape, ctx);
        } else if (type === ShapeType.SymbolRef) {
            content = exportSymbolRefShape(shape as unknown as types.SymbolRefShape, ctx);
        } else if (type === ShapeType.Contact) {
            content = exportContactShape(shape as unknown as types.ContactShape, ctx);
        } else if (type === ShapeType.Cutout) {
            content = exportCutoutShape(shape as unknown as types.CutoutShape, ctx);
        } else if (type === ShapeType.SymbolUnion) {
            content = exportSymbolUnionShape(shape as unknown as types.SymbolUnionShape, ctx);
        } else if (type === ShapeType.BoolShape) {
            content = exportBoolShape(shape as unknown as types.BoolShape, ctx);
        }
        if (content) {
            result.push(content);
        }
    }
    return { shapes: result, ctx }
}

/**
 * @description 导入之前匹配连接线
 */
function match_for_contact(source: Shape[]) {
    const already_change = new Set<string>();

    const all = new Map<string, Shape>();
    const contacts: types.ContactShape[] = [];

    finder(source);

    if (!contacts.length) {
        return already_change;
    }

    const units: { contact: Shape, from: Shape | undefined, to: Shape | undefined }[] = [];

    for (let i = 0, l = contacts.length; i < l; i++) {
        const c = contacts[i];

        const from = all.get(c.from?.shapeId || '') || undefined;
        const to = all.get(c.to?.shapeId || '') || undefined;

        units.push({ contact: c as unknown as Shape, from, to });
    }

    const modified = new Set<Shape>();

    for (let i = 0, l = units.length; i < l; i++) {
        const { contact, from, to } = units[i];

        if (!from) {
            (contact as unknown as types.ContactShape).from = undefined;
        } else {
            if (modified.has(from)) {
                (contact as unknown as types.ContactShape).from!.shapeId = from.id;
            } else {
                from.id = v4();

                (contact as unknown as types.ContactShape).from!.shapeId = from.id;

                already_change.add(from.id);

                modified.add(from);
            }
        }

        if (!to) {
            (contact as unknown as types.ContactShape).to = undefined;
        } else {
            if (modified.has(to)) {
                (contact as unknown as types.ContactShape).to!.shapeId = to.id;
            } else {
                to.id = v4();

                (contact as unknown as types.ContactShape).to!.shapeId = to.id;

                already_change.add(to.id);

                modified.add(to);
            }
        }
    }

    return already_change;

    function finder(shapes: Shape[]) {
        for (let i = 0, l = shapes.length; i < l; i++) {
            const s = shapes[i];

            all.set(s.id, s);

            if (s.type === ShapeType.Contact) {
                contacts.push(s as unknown as types.ContactShape);
            }

            if (s.type === ShapeType.Group || s.type === ShapeType.Artboard) {
                const __shapes = (s as GroupShape).childs;
                finder(__shapes);
            }
        }
    }
}

// 从剪切板导入图形
export function import_shape_from_clipboard(document: Document, page: Page, source: Shape[], medias?: any) {
    const ctx: IImportContext = new class implements IImportContext {
        document: Document = document;
        curPage: string = page.id;
    };
    const result: Shape[] = [];

    const matched = match_for_contact(source);

    try {
        for (let i = 0, len = source.length; i < len; i++) {
            const _s = source[i];
            const type = _s.type;
            let r: Shape | undefined = undefined;

            if (type === ShapeType.Symbol) {
                const registed = document.symbolregist.get(_s.id);
                const ref = document.symbolsMgr.get(_s.id);
                // 剪切的一定有'freesymbols'，但复制或者外部粘贴进来的，不一定。
                if ((!registed && !ref) || registed === 'freesymbols') {
                    r = importSymbolShape(_s as any as types.SymbolShape, ctx);
                    result.push(r);
                    continue;
                }
                if (!ref) {
                    continue;
                }
                const f = new ShapeFrame(_s.frame.x, _s.frame.y, _s.frame.width, _s.frame.height);
                if ((_s instanceof SymbolUnionShape)) {
                    const dlt = (_s as any).childs[0];
                    if (!dlt) continue;
                    f.width = dlt.frame.width;
                    f.height = dlt.frame.height;
                }
                r = newSymbolRefShape(_s.name, f, _s.id, document.symbolsMgr);
                // rotate & flip
                if (r) {
                    r.rotation = _s.rotation;
                    r.isFlippedHorizontal = _s.isFlippedHorizontal;
                    r.isFlippedVertical = _s.isFlippedVertical;
                    result.push(r);
                }
                continue;
            }

            if (!matched.has(_s.id)) {
                _s.id = v4();
            }

            if (type === ShapeType.Rectangle) {
                r = importRectShape(_s as any as types.RectShape);
            } else if (type === ShapeType.Oval) {
                r = importOvalShape(_s as any as types.OvalShape);
            } else if (type === ShapeType.Line) {
                r = importLineShape(_s as any as types.LineShape);
            } else if (type === ShapeType.Image) {
                r = importImageShape(_s as any as types.ImageShape, ctx);
            } else if (type === ShapeType.Text) {
                r = importTextShape(_s as any as types.TextShape, ctx);
            } else if (type === ShapeType.Path) {
                r = importPathShape(_s as any as types.PathShape);
            } else if (type === ShapeType.Path2) {
                r = importPathShape2(_s as any as types.PathShape2);
            } else if (type === ShapeType.Artboard) {
                const children = (_s as any).childs;
                children && children.length && set_childs_id(children, matched);
                r = importArtboard(_s as any, ctx);
            } else if (type === ShapeType.Group) {
                const children = (_s as GroupShape).childs;

                children && children.length && set_childs_id(children, matched);

                r = importGroupShape(_s as any, ctx);
            } else if (type === ShapeType.Table) {
                const children = (_s as any as GroupShape).childs;
                children && children.length && set_childs_id(children, matched);

                r = importTableShape(_s as any as types.TableShape, ctx);
            } else if (type === ShapeType.SymbolRef) {
                if (!document.symbolsMgr.get((_s as any as types.SymbolRefShape).refId)) {
                    continue;
                }
                r = importSymbolRefShape(_s as any as types.SymbolRefShape, ctx);
            } else if (type === ShapeType.Contact) {
                r = importContactShape(_s as any as types.ContactShape, ctx)
            } else if (type === ShapeType.Cutout) {
                r = importCutoutShape(_s as any as types.CutoutShape, ctx);
            } else if (type === ShapeType.SymbolUnion) {
                const children = (_s as any as SymbolUnionShape).childs;
                if (!Array.isArray(children)) continue;
                // check
                let isFree = true;
                for (let i = 0; i < children.length; ++i) {
                    const cid = children[i].id;
                    const registed = document.symbolregist.get(cid);
                    const ref = document.symbolsMgr.get(cid);
                    if (registed && registed !== 'freesymbols' || (!registed && ref)) {
                        isFree = false;
                        break;
                    }
                }
                if (!isFree) set_childs_id(children, matched);
                r = importSymbolUnionShape(_s as any as SymbolUnionShape, ctx);
            } else if (type === ShapeType.BoolShape) {
                r = importBoolShape(_s as any as types.BoolShape, ctx);
            }

            if (r) {
                result.push(r);
            }
        }
        after_paster(document, medias);
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
export function transform_data(document: Document, page: Page, src: Shape[]): Shape[] {
    return import_shape_from_clipboard(document, page, export_shape(src).shapes);
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
    return { top, bottom, left, right };
}

export function get_frame(shapes: Shape[]): { x: number, y: number }[] {
    const points: { x: number, y: number }[] = [];
    for (let i = 0, len = shapes.length; i < len; i++) {
        const s = shapes[i];
        const m = s.matrix2Root();
        const f = s.frame;
        const ps: { x: number, y: number }[] = [
            { x: 0, y: 0 },
            { x: f.width, y: 0 },
            { x: f.width, y: f.height },
            { x: 0, y: f.height }
        ];
        for (let i = 0; i < 4; i++) points.push(m.computeCoord3(ps[i]));
    }
    const b = XYsBounding(points);
    return [{ x: b.left, y: b.top }, { x: b.right, y: b.top }, { x: b.right, y: b.bottom }, { x: b.left, y: b.bottom }];
}

export function after_paster(document: Document, media: any) {
    if (!media) {
        return;
    }
    const refs = Array.from(Object.keys(media) || []) as string[];
    refs.forEach(ref => {
        const m = media[ref];

        if (!m) {
            return;
        }

        if (document.mediasMgr.getSync(ref)) {
            delete media[ref];
            return;
        }

        const base64 = atob(m.split('base64,')[1]);

        const buff = new Uint8Array(base64.length);
        for (let i = 0; i < base64.length; i++) {
            buff[i] = base64.charCodeAt(i);
        }

        const _media = { base64: m, buff };

        media[ref] = _media;

        media[ref] = _media;

        document.mediasMgr.add(ref, _media);
    })
}

export function cloneGradient(g: types.Gradient) {
    return importGradient(exportGradient(g));
}

