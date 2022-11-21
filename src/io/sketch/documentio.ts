import { Document, PagesMgr, SymsMgr } from "@/data/document";
import { LzData } from '@/data/lzdata';
import { PagesMeta } from "@/data/meta";
import { Page } from "@/data/page";
import { importMeta } from "./metaio";
import { importPage } from "./pageio";
import { IJSON } from "./styleio";

export async function importDocument(lzData: LzData) {
    const buffer = await lzData.load('document.json');
    const data: IJSON = JSON.parse(buffer.toString());
    const pageIds = (data["pages"] || []).map((d: IJSON) => {
        // return d['_ref'] + '.json';
        const ref: string = d['_ref'];
        return ref.substring(ref.indexOf('/') + 1);
    });

    // todo
    const meta: PagesMeta = await importMeta(lzData);
    const symsMgr = new SymsMgr();
    const pagesMgr = new PagesMgr(pageIds, meta, (id: string): Promise<Page> => {
        return importPage(lzData, 'pages/'+id+'.json', symsMgr);
    });

    return new Document(data["do_objectID"], meta, symsMgr, pagesMgr);
}