/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

/*
[uuid]/document-meta.json // 存pages:{uuid, name}[]列表; 使用到的文档的versionId; 发布的文档，另存一份，有相应的配置选项。更新内容可重新发布，覆盖原文档。
[uuid]/pages/[uuid].json
[uuid]/medias/[uuid].[svg|jpg|...]
[uuid]/freesymbols.json // 文档内引用的,未在page里的symbol
*/

import { Document, Page } from "../data";
import * as types from "../data/typesdefine"
import { exportDocumentMeta, exportPage, IExportContext } from "../data/baseexport";
import JSZip from "jszip";

export interface ExFromJson {
    document_meta: types.DocumentMeta,
    pages: types.Page[],
    media_names: string[]
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

    // medias
    const media_names: string[] = [];
    for (const mediaId of ctx.medias) {
        try {
            const exist = await document.mediasMgr.get(mediaId);
            if (exist) media_names.push(mediaId);
        } catch (e) {
            console.error(e);
        }
    }
    // metas

    // document meta
    const document_meta = exportDocumentMeta(document, ctx);
    // 清除多余freesymbols，防止文檔膨脹
    const freesymbols: { [key: string]: types.SymbolShape } = document_meta.freesymbols as any;
    if (freesymbols) {
        const unionInUse = (sym: types.SymbolShape) => {
            for (let i = 0, len = sym.childs.length; i < len; ++i) {
                if (ctx.refsymbols.has(sym.childs[i].id)) return true;
            }
            return false;
        }
        const symInUse = (sym: types.SymbolShape) => {
            return sym.typeId === "symbol-union-shape" ? unionInUse(sym) : ctx.refsymbols.has(sym.id);
        }
        Object.keys(freesymbols).forEach(k => {
            if (!symInUse(freesymbols[k])) delete freesymbols[k]
        })
    }
    return {
        document_meta,
        pages,
        media_names
    }
}

export async function exportDocumentZip(__data: Document, type: 'blob' | 'arraybuffer' | 'uint8array' = 'blob'): Promise<Blob | ArrayBuffer | Uint8Array> {
    const data = await exportExForm(__data)
        .catch((error) => {
            throw error
        });
    if (!data) throw new Error('invalid data');
    function packPages(folder: JSZip) {
        for (const page of data.pages) {
            const blob = new Blob([JSON.stringify(page)]);
            folder.file(page.id + '.json', blob);
        }
    }
    async function packImages(folder: JSZip) {
        if (!data.media_names.length) return;
        const manager = __data.mediasMgr;
        for (const ref of data.media_names) {
            const media = await manager.get(ref);
            if (!media) continue;
            folder.file(ref, media.buff);
        }
    }
    const zip = new JSZip();
    zip.file('document-meta.json', new Blob([JSON.stringify(data.document_meta)]));
    packPages(zip.folder('pages')!);
    await packImages(zip.folder('images')!);
    return await zip.generateAsync({ type });
}
