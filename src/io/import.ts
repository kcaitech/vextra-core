import { Page } from "../data/page";
import { IImportContext, importDocumentMeta, importPage, importSymbolShape, importSymbolUnionShape } from "../data/baseimport";
import * as types from "../data/typesdefine"
import { IDataGuard } from "../data/basic";
import { Document, DocumentMeta } from "../data/document";
import * as storage from "./storage";
import { base64Encode, base64ToDataUrl } from "../basic/utils";
import { SymbolShape } from "../data/classes";

interface IJSON {
    [key: string]: any
}

interface IDataLoader {
    loadDocumentMeta(id: string): Promise<DocumentMeta>
    loadPage(ctx: IImportContext, id: string): Promise<Page>
    loadMedia(ctx: IImportContext, id: string): Promise<{ buff: Uint8Array, base64: string }>
    loadFreeSymbols(ctx: IImportContext, id: string, versionId?: string): Promise<SymbolShape[]>
}

class RemoteLoader {
    private storage: storage.IStorage;

    constructor(storage: storage.IStorage) {
        this.storage = storage;
    }

    loadRaw(uri: string, versionId?: string): Promise<Uint8Array> {
        return this.storage.get(uri, versionId);
    }

    loadJson(uri: string, versionId?: string): Promise<IJSON> {
        return new Promise((resolve, reject) => {
            this.storage.get(uri, versionId).then((data: Uint8Array) => {
                const json = JSON.parse(new TextDecoder().decode(data));
                resolve(json);
            }).catch((err: any) => {
                reject(err);
            });
        });
    }
}

export class DataLoader implements IDataLoader {

    private remoteLoader: RemoteLoader;
    private documentPath: string;

    constructor(storage: storage.IStorage, documentPath: string) {
        this.remoteLoader = new RemoteLoader(storage);
        this.documentPath = documentPath;
    }

    async loadDocumentMeta(versionId?: string): Promise<DocumentMeta> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/document-meta.json`, versionId)
        return importDocumentMeta(json as types.DocumentMeta, undefined)
    }

    async loadPage(ctx: IImportContext, id: string, versionId?: string): Promise<Page> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/pages/${id}.json`, versionId)
        return importPage(json as types.Page, ctx)
    }

    async loadFreeSymbols(ctx: IImportContext, versionId?: string): Promise<SymbolShape[]> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/freesymbols.json`, versionId)
        const syms = json as types.SymbolShape[] || [];
        return syms.map((s) => {
            if (s.typeId === 'symbol-union-shape') return importSymbolUnionShape(s, ctx);
            return importSymbolShape(s, ctx)
        })
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

    const document = new Document(meta.id, versionId ?? "", meta.lastCmdId, meta.symbolregist, meta.name, meta.pagesList, gurad);
    const ctx: IImportContext = new class implements IImportContext { document: Document = document; curPage: string = "" };

    document.pagesMgr.setLoader((id: string) => {
        ctx.curPage = id;
        const page = loader.loadPage(ctx, id, idToVersionId.get(id))
        ctx.curPage = '';
        return page;
    });
    document.mediasMgr.setLoader((id: string) => loader.loadMedia(ctx, id));

    let hasLoadFreeSymbols = false;
    document.__freesymbolsLoader = async () => {
        if (hasLoadFreeSymbols) return undefined;
        ctx.curPage = "freesymbols";
        await loader.loadFreeSymbols(ctx, versionId);
        ctx.curPage = "";
        hasLoadFreeSymbols = true;
    }

    return document;
}