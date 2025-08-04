/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page } from "../data/page";
import {
    IImportContext,
    importDocumentMeta,
    importPage
} from "../data/baseimport";
import * as types from "../data/typesdefine"
import { BasicArray, BasicMap, IDataGuard } from "../data/basic";
import { Document, DocumentMeta } from "../data/document";
import * as storage from "./storage";
import { base64Encode, base64ToDataUrl } from "../basic/utils";
import { SymbolShape } from "../data/classes";
import pako from "pako";
import { StyleSheet } from "../data/style"
interface IJSON {
    [key: string]: any
}

interface IDataLoader {
    loadDocumentMeta(id: string): Promise<DocumentMeta>

    loadPage(ctx: IImportContext, id: string): Promise<Page>

    loadMedia(ctx: IImportContext, id: string): Promise<{ buff: Uint8Array, base64: string }>
}

function isGzip(data: Uint8Array) {
    // 检查前两个字节是否为 gzip 标志 (1f 8b)
    return data[0] === 0x1f && data[1] === 0x8b;
}

function ungzip(data: Uint8Array) {
    return isGzip(data) ? pako.ungzip(data) : data
}

class RemoteLoader {
    protected storage: storage.IStorage;

    constructor(storage: storage.IStorage) {
        this.storage = storage;
    }

    loadRaw(uri: string, versionId?: string): Promise<Uint8Array> {
        return this.storage.get(uri, versionId);
    }

    loadJson(uri: string, versionId?: string): Promise<IJSON> {
        return new Promise((resolve, reject) => {
            this.storage.get(uri, versionId).then((data: Uint8Array) => {
                data = ungzip(data)
                const json = JSON.parse(new TextDecoder().decode(data));
                resolve(json);
            }).catch((err: any) => {
                reject(err);
            });
        });
    }
}

export class DataLoader implements IDataLoader {
    protected remoteLoader: RemoteLoader;
    protected documentPath: string;

    constructor(storage: storage.IStorage, documentPath: string) {
        this.remoteLoader = new RemoteLoader(storage);
        this.documentPath = documentPath;
    }

    public setStorage(storage: storage.IStorage) {
        this.remoteLoader = new RemoteLoader(storage);
    }

    async loadDocumentMeta(versionId?: string): Promise<DocumentMeta> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/document-meta.json`, versionId)
        const meta = importDocumentMeta(json as types.DocumentMeta, undefined)
        if (meta.fmtVer) meta.fmtVer = meta.fmtVer.toString()
        return meta;
    }

    async loadPage(ctx: IImportContext, id: string, versionId?: string): Promise<Page> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/pages/${id}.json`, versionId)
        return importPage(json as types.Page, ctx)
    }

    async loadMedia(ctx: IImportContext, id: string, versionId?: string): Promise<{
        buff: Uint8Array;
        base64: string;
    }> {
        const buffer: Uint8Array = await this.remoteLoader.loadRaw(`${this.documentPath}/medias/${id}`, versionId)

        const uInt8Array = buffer;
        let i = uInt8Array.length;
        const binaryString = new Array(i);
        while (i--) {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        const data = binaryString.join('');

        const base64 = base64Encode(data);

        let url = '';
        const ext = id.substring(id.lastIndexOf('.') + 1);
        if (ext === 'png') {
            url = base64ToDataUrl('png', base64);
        } else if (ext === 'gif') {
            url = base64ToDataUrl('gif', base64);
        } else if (ext === 'svg') {
            url = base64ToDataUrl('svg', base64);
        } else if (ext === 'jpeg') {
            url = base64ToDataUrl('jpeg', base64);
        } else {
            console.log('imageExt', ext);
        }
        return { buff: buffer, base64: url }
    }
}

export async function importDocument(storage: storage.IStorage, documentPath: string, fid: string, versionId: string, gurad: IDataGuard) {
    const loader = new DataLoader(storage, documentPath);

    const meta = await loader.loadDocumentMeta(versionId);
    const idToVersionId: Map<string, string | undefined> = new Map(meta.pagesList.map(p => [p.id, p.versionId]));
    const fmtVer = meta.fmtVer ?? 0;

    const libs = new BasicArray<StyleSheet>()
    if (meta.stylelib) {
        for (let i = 0; i < meta.stylelib.length; i++) {
            const sheet = meta.stylelib[i];
            libs.push(new StyleSheet([i], sheet.id, sheet.name, sheet.variables));
        }
    }

    const { id, name, lastCmdVer, pagesList, symbolregist, freesymbols } = meta;

    const document = new Document(id, name, gurad, {
        versionId,
        lastCmdVer,
        pageList: pagesList,
        freeSymbols: freesymbols as BasicMap<string, SymbolShape>,
        symbolRegister: symbolregist,
        stylelib: libs
    });

    document.pagesMgr.setLoader((id: string) => {
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = document;
            curPage: string = id;
            fmtVer: string = fmtVer
        };
        return loader.loadPage(ctx, id, idToVersionId.get(id))
    });
    document.mediasMgr.setLoader((id: string) => {
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = document;
            curPage: string = "";
            fmtVer: string = fmtVer
        };
        return loader.loadMedia(ctx, id)
    });

    return { document, loader };
}

export class LocalDataLoader extends DataLoader {
    constructor(storage: storage.IStorage, documentPath: string) {
        super(storage, documentPath);
    }
    async loadDocumentMeta(versionId?: string): Promise<DocumentMeta> {
        const json: IJSON = await this.remoteLoader.loadJson('document-meta', versionId)
        return importDocumentMeta(json as types.DocumentMeta, undefined)
    }

    async loadPage(ctx: IImportContext, id: string, versionId?: string): Promise<Page> {
        const json: IJSON = await this.remoteLoader.loadJson(id, versionId)
        return importPage(json as types.Page, ctx)
    }

    async loadMedia(ctx: IImportContext, id: string, versionId?: string): Promise<{
        buff: Uint8Array;
        base64: string;
    }> {
        const buffer: Uint8Array = await this.remoteLoader.loadRaw(`medias/${id}`, versionId)
        const uInt8Array = buffer;
        let i = uInt8Array.length;
        const binaryString = new Array(i);
        while (i--) {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        const data = binaryString.join('');
        return { buff: buffer, base64: data }
    }
}

// export async function importLocalDocument(storage: storage.IStorage, documentPath: string, fid: string, versionId: string, gurad: IDataGuard) {
//     const loader = new LocalDataLoader(storage, documentPath);

//     const meta = await loader.loadDocumentMeta(versionId);
//     const idToVersionId: Map<string, string | undefined> = new Map(meta.pagesList.map(p => [p.id, p.versionId]));
//     const fmtVer = meta.fmtVer ?? 0;
//     const libs = new BasicArray<StyleSheet>()
//     if (meta.stylelib) {
//         for (let i = 0; i < meta.stylelib.length; i++) {
//             const sheet = meta.stylelib[i];
//             libs.push(new StyleSheet([i], sheet.id, sheet.name, sheet.variables));
//         }
//     }

//     const { id, name, lastCmdVer, pagesList, symbolregist, freesymbols } = meta;

//     const document = new Document(id, name, gurad, {
//         versionId,
//         symbolRegister: symbolregist,
//         lastCmdVer,
//         pageList: pagesList,
//         freeSymbols: freesymbols as BasicMap<string, SymbolShape>,
//         stylelib: libs
//     });

//     document.pagesMgr.setLoader((id: string) => {
//         const ctx: IImportContext = new class implements IImportContext {
//             document: Document = document;
//             curPage: string = id;
//             fmtVer: string = fmtVer
//         };
//         return loader.loadPage(ctx, id, idToVersionId.get(id))
//     });
//     document.mediasMgr.setLoader((id: string) => {
//         const ctx: IImportContext = new class implements IImportContext {
//             document: Document = document;
//             curPage: string = "";
//             fmtVer: string = fmtVer
//         };
//         return loader.loadMedia(ctx, id)
//     });

//     return {
//         document: document,
//         loader: loader,
//     };
// }