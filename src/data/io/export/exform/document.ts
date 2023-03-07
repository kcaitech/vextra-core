import { Document } from "@/data/data/document";

export function exportDocument(data: Document) {
    // export metas
        // symbol
        // page
        // artboard
    // export pages
    // export media
    // export infos?

    const pagesMgr = data.pagesMgr;
    const count = pagesMgr.pageCount;
    let ret = '{'
    ret += '"pages":['
        for (let i = 0; i < count; i++) {
            const id = pagesMgr.getPageIdByIndex(i);
            const name = pagesMgr.getPageNameById(id);
            if (i > 0) ret += ','
            ret += '{'
                + '"id":"' + id + '"'
                + ',"name":"' + name + '"'
                + '}'
        }
    ret += ']'
    ret += '}'
    return ret;
}