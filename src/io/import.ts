import {Artboard} from "../data/artboard";
import {Page} from "../data/page";
import {ImageShape, SymbolRefShape, SymbolShape, TextShape} from "../data/shape";
import {IImportContext, importDocumentMeta, importDocumentSyms, importPage} from "./baseimport";
import * as types from "../data/typesdefine"
import {IDataGuard} from "../data/basic";
import {Document, DocumentMeta, DocumentSyms} from "../data/document";
import * as storage from "./storage";
import {base64ToDataUrl} from "../basic/utils";
import {MeasureFun} from "../data/textlayout";
import {Fill} from "../data/style";

interface IJSON {
    [key: string]: any
}

interface IDataLoader {
    loadDocumentMeta(ctx: IImportContext, id: string): Promise<DocumentMeta>

    loadDocumentSyms(ctx: IImportContext, id: string): Promise<DocumentSyms[]>

    loadPage(ctx: IImportContext, id: string): Promise<Page>

    // loadArtboard(ctx: IImportContext, id: string): Promise<Artboard>
    // loadSymbol(ctx: IImportContext, id: string): Promise<SymbolShape>
    loadMedia(ctx: IImportContext, id: string): Promise<{ buff: Uint8Array, base64: string }>
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

    async loadDocumentMeta(ctx: IImportContext, versionId?: string): Promise<DocumentMeta> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/document-meta.json`, versionId)
        return importDocumentMeta(json as types.DocumentMeta, ctx)
    }

    async loadDocumentSyms(ctx: IImportContext, id: string, versionId?: string): Promise<DocumentSyms[]> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/document-syms.json`, versionId)
        return (json as Array<types.DocumentSyms>).map((val) => importDocumentSyms(val, ctx))
    }

    async loadPage(ctx: IImportContext, id: string, versionId?: string): Promise<Page> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/pages/${id}.json`, versionId)
        return importPage(json as types.Page, ctx)
    }

    // async loadArtboard(ctx: IImportContext, id: string, versionId?: string): Promise<Artboard> {
    //     const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/artboards/${id}.json`, versionId)
    //     return importArtboard(json as types.Artboard, ctx)
    // }

    // async loadSymbol(ctx: IImportContext, id: string, versionId?: string): Promise<SymbolShape> {
    //     const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/symbols/${id}.json`, versionId)
    //     return importSymbolShape(json as types.SymbolShape, ctx)
    // }

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

        const base64 = window.btoa(data);

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
        return {buff: buffer, base64: url}
    }
}

export async function importDocument(storage: storage.IStorage, documentPath: string, fid: string, versionId: string, gurad: IDataGuard, measureFun: MeasureFun) {
    const loader = new DataLoader(storage, documentPath);

    const meta = await loader.loadDocumentMeta(new class implements IImportContext {
        afterImport(obj: any): void {
            // throw new Error("Method not implemented.");
        }
    }, versionId);
    const idToVersionId: Map<string, string | undefined> = new Map(meta.pagesList.map(p => [p.id, p.versionId]));

    const document = new Document(meta.id, versionId ?? "", meta.name, meta.pagesList, gurad, measureFun);
    const ctx = new class implements IImportContext {
        afterImport(obj: any): void {
            if (obj instanceof ImageShape || obj instanceof Fill) {
                obj.setImageMgr(document.mediasMgr)
            } else if (obj instanceof SymbolRefShape) {
                obj.setSymbolMgr(document.symbolsMgr)
                // } else if (obj instanceof ArtboardRef) {
                //     obj.setArtboardMgr(document.artboardMgr)
            } else if (obj instanceof Artboard) {
                document.artboardMgr.add(obj.id, obj);
            } else if (obj instanceof SymbolShape) {
                document.symbolsMgr.add(obj.id, obj);
            } else if (obj instanceof TextShape) {
                obj.setMeasureFun(measureFun);
            }
        }
    }

    // const document_syms = new ResourceMgr<DocumentSyms[]>();
    // document_syms.setLoader((id: string) => loader.loadDocumentSyms(ctx, ""));

    document.pagesMgr.setLoader((id: string) => loader.loadPage(ctx, id, idToVersionId.get(id)));
    document.mediasMgr.setLoader((id: string) => loader.loadMedia(ctx, id));
    // document.artboardMgr.setLoader((id: string) => loader.loadArtboard(ctx, id));
    // document.symbolsMgr.setLoader((id: string) => loader.loadSymbol(ctx, id));

    return document;
}