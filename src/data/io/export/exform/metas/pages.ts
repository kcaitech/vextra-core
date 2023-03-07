import { Document } from "@/data/data/document";

// id
// name
export function exportPagesMeta(data: Document) {
    const pagesMgr = data.pagesMgr;
    const count = pagesMgr.pageCount;
    let ret = '['
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
    return ret;
}