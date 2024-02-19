
import { uuid } from "../../../basic/uuid";
import { BasicArray, BasicMap, IDataGuard } from "../../../data/basic";
import {Document, PageListItem} from "../../../data/document";
import { LzData } from "./lzdata";
import { IJSON } from "./basic";
import { DataLoader } from "./dataloader";

async function importPageList(lzData: LzData, pageIds: string[]): Promise<BasicArray<PageListItem> > {
    const metaJson: IJSON = await lzData.loadJson('meta.json');
    // const metaJson: IJSON = JSON.parse(buffer.toString());
    const pagesAndArtboards: IJSON = metaJson['pagesAndArtboards'];

    const meta: [string, string][] = Object.keys(pagesAndArtboards).map((key: string) => {
        const item: IJSON = pagesAndArtboards[key];
        const name: string = item['name'];
        return [key, name];
    });
    const metaMap: Map<string, string> = new Map(meta);

    const pageList = new BasicArray<PageListItem>();

    for (let i = 0, len = pageIds.length; i < len; i++) {
        const id = pageIds[i]
        // if (id === LibType.Symbol) continue; // 组件库页面
        const name = metaMap.get(id) || 'Unknow'
        pageList.push(new PageListItem([i] as BasicArray<number>, id, name))
    }

    return pageList;
}

export async function importDocument(name: string, lzData: LzData, gurad: IDataGuard) {
    const data: IJSON = await lzData.loadJson('document.json');
    const pageIds = (data["pages"] || []).map((d: IJSON) => {
        const ref: string = d['_ref'];
        return ref.substring(ref.indexOf('/') + 1);
    });
    const pageList = await importPageList(lzData, pageIds);
    let id = data["do_objectID"];
    if (!id || id.length === 0) id = uuid();
    const document = new Document(id, "", "", new BasicMap(), name, pageList, gurad);
    
    new DataLoader(lzData, document);

    return document;
}