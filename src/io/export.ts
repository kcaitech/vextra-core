/*
[uuid]/document-meta.json // 存pages:{uuid, name}[]列表; 使用到的文档的versionId; 发布的文档，另存一份，有相应的配置选项。更新内容可重新发布，覆盖原文档。
[uuid]/pages/[uuid].json
[uuid]/pages-symrefs/[uuid].json
[uuid]/pages-artboardrefs/[uuid].json
[uuid]/symbols/[uuid].json
[uuid]/artboards/[uuid].json
[uuid]/artboards-symrefs/[uuid].json
[uuid]/medias/[uuid].[svg|jpg|...]
[uuid]/metas/[document-refs.json...] // 文档内引用的其它文档数据记录
*/

import { Document } from "../data/document";
import { } from "../data/baseclasses";
import { Page } from "../data/classes";
import * as types from "../data/typesdefine"
import { exportPage, IExportContext, exportDocumentMeta } from "./baseexport";

export interface ExFromJson {
    document_meta: types.DocumentMeta,
    pages: types.Page[],
    // page_refartboards: string[][],
    document_syms: types.DocumentSyms[], // 不包含artboard引用的symbol，最后用artboards的合并就行
    // artboards: types.Artboard[],
    // artboard_refsyms: string[][],
    // symbols: types.SymbolShape[],
    media_names: string[]
}

class ExfContext implements IExportContext {

    symbols = new Set<string>()
    // artboards = new Set<string>()

    medias = new Set<string>()
    // allartboards = new Set<string>();
    // allsymbols = new Set<string>();
}

export async function exportExForm(document: Document): Promise<ExFromJson> {
    const ctx = new ExfContext();

    // pages
    const pmgr = document.pagesMgr;
    const pages: types.Page[] = [];
    // const page_refartboards: string[][] = [];
    const document_syms: { pageId: string, symbols: string[] }[] = [];

    for (let i = 0, len = document.pagesList.length; i < len; i++) {
        const meta = document.pagesList[i];
        const pagedata: Page | undefined = await pmgr.get(meta.id)
        if (!pagedata) continue;

        const page = exportPage(pagedata, ctx);
        pages.push(page)

        // const refsyms: string[] = [];
        // ctx.symbols.forEach((value) => {
        //     refsyms.push(value);
        // });
        ctx.symbols.clear();
        document_syms.push({ pageId: page.id, symbols: Array.from(ctx.symbols.values()) });

        // const refartboards: string[] = [];
        // ctx.artboards.forEach((value) => {
        //     refartboards.push(value);
        // });
        // ctx.artboards.clear();
        // page_refartboards.push(refartboards);
    }

    // // artboards
    // const artboards: types.Artboard[] = []
    // const artboard_refsyms: string[][] = []
    // const exportedArtboards = new Set<string>()
    // const abMgr = document.artboardMgr;
    // for (let i = 0, len = page_refartboards.length; i < len; i++) {
    //     const arr = page_refartboards[i]
    //     for (let j = 0, jlen = arr.length; j < jlen; j++) {
    //         const refId = arr[j]
    //         if (exportedArtboards.has(refId)) continue;
    //         exportedArtboards.add(refId);

    //         const abdata = await abMgr.get(refId);
    //         if (!abdata) continue;

    //         const ab = exportArtboard(abdata, ctx);
    //         artboards.push(ab)

    //         const refsyms: string[] = [];
    //         ctx.symbols.forEach((value) => {
    //             refsyms.push(value);
    //         });
    //         ctx.symbols.clear();
    //         artboard_refsyms.push(refsyms);
    //     }
    // }
    // exportedArtboards.clear()

    // // symbols
    // const exportedSymbols = new Set<string>()
    // const symbols: types.SymbolShape[] = [];
    // const symsMgr = document.symbolsMgr;
    // const f = async (refsyms: string[][]) => {
    //     for (let i = 0, len = refsyms.length; i < len; i++) {
    //         const arr = refsyms[i]
    //         for (let j = 0, jlen = arr.length; j < jlen; j++) {
    //             const refId = arr[j]
    //             if (exportedSymbols.has(refId)) continue;
    //             exportedSymbols.add(refId);

    //             const symdata = await symsMgr.get(refId)
    //             if (!symdata) continue

    //             const sym = exportSymbolShape(symdata, ctx);
    //             symbols.push(sym);
    //         }
    //     }
    // }
    // await f(page_refsyms)
    // await f(artboard_refsyms)

    // medias
    const media_names: string[] = [];
    for (const mediaId of ctx.medias) if (await document.mediasMgr.get(mediaId) !== undefined) media_names.push(mediaId);
    // metas

    // document meta
    const document_meta = exportDocumentMeta(document, ctx);

    return {
        document_meta,
        pages,
        // page_refartboards,
        document_syms,
        // artboards,
        // artboard_refsyms,
        // symbols,
        media_names
    }
}
