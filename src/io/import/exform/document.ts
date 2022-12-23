import { ArtboardsMgr, Document, MediaMgr, PagesMgr, SymsMgr } from "@/data/document";
import { IJSON, LzData } from "@/data/lzdata";
import { PageMeta, PagesMeta } from "@/data/meta";
import { Page } from "@/data/page";
import { importPage, importPageFromData } from "./page";

export async function importDocument(lzData: LzData, data: IJSON, page: IJSON) {
    // const data: IJSON = await lzData.load('document.json');
    // const data: IJSON = JSON.parse(buffer.toString());
    // const pageIds = (data["pages"] || []).map((d: IJSON) => {
    //     // return d['_ref'] + '.json';
    //     const ref: string = d['_ref'];
    //     return ref.substring(ref.indexOf('/') + 1);
    // });

    // todo
    const meta: PagesMeta = new PagesMeta((data["pages"] || []).map((d: IJSON) => {
        const id = d["id"];
        const name = d["name"];
        return [id, new PageMeta(id, name)]
    }))
    const symsMgr = new SymsMgr();
    const mediaMgr = new MediaMgr(lzData);
    const pagesMgr = new PagesMgr(meta, (id: string): Promise<Page> => {
        return importPage(lzData, id, symsMgr, mediaMgr);
    });
    const p = importPageFromData(lzData, page, symsMgr, mediaMgr);
    pagesMgr.setPage(p.id, p);
    const artMgr = new ArtboardsMgr([]);

    return new Document(data["id"], symsMgr, pagesMgr, mediaMgr, artMgr);
}