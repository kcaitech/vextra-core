import {Artboard, ArtboardRef} from "../data/artboard";
import {Page} from "../data/page";
import {ImageShape, SymbolRefShape, SymbolShape} from "../data/shape";
import {IImportContext, importArtboard, importDocumentMeta, importPage, importSymbolShape} from "./baseimport";
import * as types from "../data/typesdefine"
import {IDataGuard} from "../data/basic";
import {Document, DocumentMeta} from "../data/document";
import * as storage from "./storage";

interface IJSON {
    [key: string]: any
}

interface IDataLoader {
    loadDocumentMeta(ctx: IImportContext, id: string): Promise<DocumentMeta>
    loadPage(ctx: IImportContext, id: string): Promise<Page>
    loadArtboard(ctx: IImportContext, id: string): Promise<Artboard>
    loadSymbol(ctx: IImportContext, id: string): Promise<SymbolShape>
    loadMedia(ctx: IImportContext, id: string): Promise<{ buff: Uint8Array, base64: string }>
}

class RemoteLoader {
    private storageClient: storage.Storage;

    constructor(storageOptions: storage.StorageOptions) {
        this.storageClient = new storage.Storage(storageOptions);
    }

    loadRaw(uri: string): Promise<Uint8Array> {
        return this.storageClient.get(uri);
    }

    loadJson(uri: string): Promise<IJSON> {
        return new Promise((resolve, reject) => {
            this.storageClient.get(uri).then((data: Uint8Array) => {
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

    constructor(storageOptions: storage.StorageOptions, documentPath: string) {
        this.remoteLoader = new RemoteLoader(storageOptions);
        this.documentPath = documentPath;
    }

    async loadDocumentMeta(ctx: IImportContext, id: string): Promise<DocumentMeta> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/document-meta.json`)
        return importDocumentMeta(json as types.DocumentMeta, ctx)
    }

    async loadPage(ctx: IImportContext, id: string): Promise<Page> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/pages/${id}.json`)
        return importPage(json as types.Page, ctx)
    }

    async loadArtboard(ctx: IImportContext, id: string): Promise<Artboard> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/artboards/${id}.json`)
        return importArtboard(json as types.Artboard, ctx)
    }

    async loadSymbol(ctx: IImportContext, id: string): Promise<SymbolShape> {
        const json: IJSON = await this.remoteLoader.loadJson(`${this.documentPath}/symbols/${id}.json`)
        return importSymbolShape(json as types.SymbolShape, ctx)
    }

    async loadMedia(ctx: IImportContext, id: string): Promise<{ buff: Uint8Array; base64: string; }> {
        const buffer: Uint8Array = await this.remoteLoader.loadRaw(`${this.documentPath}/medias/${id}`)

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
        if (ext == "png") {
            url = "data:image/png;base64," + base64;
        } else if (ext == "gif") {
            url = "data:image/gif;base64," + base64;
        } else {
            console.log("imageExt", ext);
        }

        return {buff: buffer, base64: url}
    }
}

export async function importDocument(storageOptions: storage.StorageOptions, documentPath: string, fid: string, versionId: string, gurad?: IDataGuard) {
    const loader = new DataLoader(storageOptions, documentPath);

    const meta = await loader.loadDocumentMeta(new class implements IImportContext {
        afterImport(obj: any): void {
            // throw new Error("Method not implemented.");
        }
    }, '');

    const document = new Document(fid, versionId, meta.name, meta.pagesList, gurad);
    const ctx = new class implements IImportContext {
        afterImport(obj: any): void {
            if (obj instanceof ImageShape) {
                obj.setImageMgr(document.mediasMgr)
            } else if (obj instanceof SymbolRefShape) {
                obj.setSymbolMgr(document.symbolsMgr)
            } else if (obj instanceof ArtboardRef) {
                obj.setArtboardMgr(document.artboardMgr)
            }
        }
    }

    document.pagesMgr.setLoader((id: string) => loader.loadPage(ctx, id));
    document.artboardMgr.setLoader((id: string) => loader.loadArtboard(ctx, id));
    document.symbolsMgr.setLoader((id: string) => loader.loadSymbol(ctx, id));
    document.mediasMgr.setLoader((id: string) => loader.loadMedia(ctx, id));

    return document;
}