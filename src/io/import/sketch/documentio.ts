import { ArtboardsMgr, Document, MediaMgr, PagesMgr, SymsMgr } from "@/data/document";
import { IJSON, LzData } from '@/data/lzdata';
import { Page } from "@/data/page";
import { importMeta } from "./metaio";
import { importPage } from "./pageio";

export async function importDocument(lzData: LzData) {
    const data: IJSON = await lzData.load('document.json');
    // const data: IJSON = JSON.parse(buffer.toString());

    // todo
    const pageIds = (data["pages"] || []).map((d: IJSON) => {
        // return d['_ref'] + '.json';
        const ref: string = d['_ref'];
        return ref.substring(ref.indexOf('/') + 1);
    });

    // todo
    const meta = await importMeta(lzData, pageIds);
    const symsMgr = new SymsMgr();
    const mediaMgr = new MediaMgr(lzData);
    const pagesMgr = new PagesMgr(meta.pagesMeta, (id: string): Promise<Page> => {
        return importPage(lzData, 'pages/'+id+'.json', symsMgr, mediaMgr);
    });
    const artMgr = new ArtboardsMgr(meta.artboardsMeta);

    return new Document(data["do_objectID"], symsMgr, pagesMgr, mediaMgr, artMgr);
}