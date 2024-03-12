/*
[uuid]/document-meta.json // 存pages:{uuid, name}[]列表; 使用到的文档的versionId; 发布的文档，另存一份，有相应的配置选项。更新内容可重新发布，覆盖原文档。
[uuid]/pages/[uuid].json
[uuid]/medias/[uuid].[svg|jpg|...]
[uuid]/freesymbols.json // 文档内引用的,未在page里的symbol
*/

import { Document } from "../data/document";
import { Border, Fill, Page, Shadow, Style } from "../data/classes";
import * as types from "../data/typesdefine"
import { exportDocumentMeta, exportPage, exportSymbolShape, exportSymbolUnionShape, IExportContext } from "../data/baseexport";
import { BasicArray } from "../data/basic";
import { SymbolUnionShape } from "../data/baseclasses";

export function newStyle(): Style {
    const borders = new BasicArray<Border>();
    const fills = new BasicArray<Fill>();
    const shadows = new BasicArray<Shadow>();
    return new Style(borders, fills, shadows);
}

export interface ExFromJson {
    document_meta: types.DocumentMeta,
    pages: types.Page[],
    media_names: string[],
    freesymbols: types.SymbolShape[],
}

class ExfContext implements IExportContext {
    symbols = new Set<string>()
    refsymbols = new Set<string>()
    medias = new Set<string>()
}

export async function exportExForm(document: Document): Promise<ExFromJson> {
    const ctx = new ExfContext();
    // pages
    const pmgr = document.pagesMgr;
    const pages: types.Page[] = [];
    for (let i = 0, len = document.pagesList.length; i < len; i++) {
        const meta = document.pagesList[i];
        const pagedata: Page | undefined = await pmgr.get(meta.id)
        if (!pagedata) continue;
        const page = exportPage(pagedata, ctx);
        pages.push(page);
    }

    const freesymbols: types.SymbolShape[] = [];
    // // 导出未在page中导出的symbol
    for (let k of ctx.symbols) {
        ctx.refsymbols.delete(k);
    }
    const freesymbolsSet = new Set<string>();
    const symMgr = document.symbolsMgr;
    for (let k of ctx.refsymbols) {
        if (freesymbolsSet.has(k)) continue;
        // 未导出的symbol

        const val = symMgr.getSync(k);
        if (!val || val.length === 0) continue;

        const symbol = val[0]; // 一定都没有page，要不不会遗留在refsymbols里

        if (symbol.parent instanceof SymbolUnionShape) {
            freesymbols.push(exportSymbolUnionShape(symbol.parent));
            symbol.parent.childs.forEach(c => freesymbolsSet.add(c.id))
            freesymbolsSet.add(symbol.id);
        } else {
            freesymbols.push(exportSymbolShape(symbol))
            freesymbolsSet.add(symbol.id);
        }
    }

    // medias
    const media_names: string[] = [];
    for (const mediaId of ctx.medias) if (await document.mediasMgr.get(mediaId) !== undefined) media_names.push(mediaId);
    // metas

    // document meta
    const document_meta = exportDocumentMeta(document, ctx);
    return {
        document_meta,
        pages,
        media_names,
        freesymbols
    }
}
