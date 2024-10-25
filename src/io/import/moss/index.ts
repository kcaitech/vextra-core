import {
    BasicArray, IDataGuard, PageListItem, Document,
    BasicMap, Transform, Page, ShapeType, Style
} from "../../../data";
import { uuid } from "../../../basic/uuid";
import { IImportContext, importPage, importDocumentMeta } from "../../../data/baseimport";
import { base64Encode, base64ToDataUrl } from "../../../basic/utils";

function setLoader(pack: { [p: string]: string | Uint8Array; }, document: Document) {
    document.mediasMgr.setLoader(id => loadMedia(id));
    document.pagesMgr.setLoader(id => loadPage(id));

    async function loadMedia(id: string): Promise<{ buff: Uint8Array; base64: string; }> {
        const buffer = pack[id] as Uint8Array;
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

        return { buff: buffer, base64: url };

    }

    async function loadPage(id: string): Promise<Page> {
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = document;
            curPage: string = id;
            fmtVer: string = document.fmtVer;
        };
        const page = JSON.parse(pack[id] as string) as Page;
        if (!page) {
            const trans = new Transform();
            return new Page(new BasicArray(), id, "", ShapeType.Page, trans, new Style(new BasicArray(), new BasicArray(), new BasicArray()), new BasicArray());
        }
        return importPage(page, ctx);
    }
}

export function importDocument(name: string, mdd: { [p: string]: string | Uint8Array }, guard: IDataGuard) {
    const meta = JSON.parse(mdd['document-meta.json'] as string);
    const pageList = importDocumentMeta(meta,undefined).pagesList;
    const document = new Document(uuid(), name, "", "", pageList, new BasicMap(), guard);
    setLoader(mdd, document);
    return document;
}