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

import {Document, LibType} from "../data/document";
import {ShapeFrame, ShapeType} from "../data/baseclasses";
import {Border, Fill, Page, Shadow, Style} from "../data/classes";
import * as types from "../data/typesdefine"
import {exportDocumentMeta, exportPage, exportSymbolShape, IExportContext} from "../data/baseexport";
import {BasicArray} from "../data/basic";

export function newStyle(): Style {
    const borders = new BasicArray<Border>();
    const fills = new BasicArray<Fill>();
    const shadows = new BasicArray<Shadow>();
    return new Style(borders, fills, shadows);
}

export interface ExFromJson {
    document_meta: types.DocumentMeta,
    pages: types.Page[],
    // page_refartboards: string[][],
    // document_syms: types.DocumentSyms[], // 不包含artboard引用的symbol，最后用artboards的合并就行
    // artboards: types.Artboard[],
    // artboard_refsyms: string[][],
    // symbols: types.SymbolShape[],
    media_names: string[]
}

class ExfContext implements IExportContext {

    symbols = new Set<string>()
    // artboards = new Set<string>()

    medias = new Set<string>()
    referenced = new Set<string>()
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
    const referenced_syms: { pageId: string, symbols: string[] }[] = [];
    for (let i = 0, len = document.pagesList.length; i < len; i++) {
        const meta = document.pagesList[i];
        const pagedata: Page | undefined = await pmgr.get(meta.id)
        if (!pagedata) continue;
        const page = exportPage(pagedata, ctx);
        pages.push(page);

        // 已经导出的组件
        document_syms.push({pageId: page.id, symbols: Array.from(ctx.symbols.values())});
        ctx.symbols.clear();

        // 文档内所引用的所有组件
        referenced_syms.push({pageId: page.id, symbols: Array.from(ctx.referenced.values())})
        ctx.referenced.clear();

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
    // const exportedSymbols = new Set<string>();
    // const symbols: types.SymbolShape[] = [];
    // const symsMgr = document.symbolsMgr;
    // document_syms.map(i => i.symbols)
    //     .flat(1)
    //     .forEach(i => exportedSymbols.add(i));
    // const _record = new Set<string>();
    // // 文档内寻找被引用但是未导出的组件
    // const _referenced_symbols: any = [];
    // referenced_syms.map(i => i.symbols)
    //     .flat(1)
    //     .forEach((i) => {
    //         if (exportedSymbols.has(i) || _record.has(i)) return;
    //         const _rs = symsMgr.getSync(i);
    //         if (!_rs) return;
    //         _referenced_symbols.push(exportSymbolShape(_rs));
    //         _record.add(i);
    //     });

    // if (_referenced_symbols.length) {
    //     const al = pages.find(i => i.id === LibType.Symbol);
    //     if (al) {
    //         al.childs.push(..._referenced_symbols);
    //     } else {
    //         const frame = new ShapeFrame(0, 0, 1000, 1000);
    //         const lib: types.Page = exportPage(new Page(LibType.Symbol, 'symbol-lib', ShapeType.Page, frame, newStyle(), [] as any, true));
    //         lib.childs.push(..._referenced_symbols)
    //         pages.push(lib);
    //     }
    // }

    // const f = (refsyms: string[][]) => {
    //     for (let i = 0, len = refsyms.length; i < len; i++) {
    //         const arr = refsyms[i]
    //         for (let j = 0, jlen = arr.length; j < jlen; j++) {
    //             const refId = arr[j]
    //             if (exportedSymbols.has(refId)) continue;
    //             exportedSymbols.add(refId);
    //
    //             const symdata = symsMgr.getSync(refId)
    //             if (!symdata) continue
    //
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
        // document_syms,
        // artboards,
        // artboard_refsyms,
        // symbols,
        media_names
    }
}
