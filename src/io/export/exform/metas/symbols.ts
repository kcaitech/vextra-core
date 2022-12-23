import { Document } from "@/data/document";
import { Symbol } from "@/data/shape";
// id
// pageid
// name
export function exportSymbolsMeta(data: Document) {
    const symsMgr = data.symsMgr;
    let ret = '[';
    let count = 0;
    symsMgr.forEach((id: string, name: string, pageId: string, data?: Symbol) => {
        if (count > 0) ret += ','
        ret += '{'
            + '"id":"' + id + '"'
            + ',"name":"' + name + '"'
            + ',"pageId":"' + pageId + '"'
            + '}'
        count++;
    })
    ret += ']'
    return ret;
}