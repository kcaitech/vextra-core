import {uuid} from "../../../basic/uuid";
import {BasicArray, BasicMap, IDataGuard} from "../../../data/basic";
import {Document, PageListItem} from "../../../data/document";
import {IJSON} from "./basic";
import {figToJson} from "./fig2json";
import {startLoader} from "./loader";
import * as UZIP from "uzip";

// import { getFigJsonData } from "./tojson";


function insert2childs(childs: { parentIndex: { position: string } }[], node: {
    parentIndex: { position: string }
}, start: number, end: number/* 包含 */) {
    // 比较少时直接逐一比较
    if ((end - start) < 5) {
        for (let i = start; i <= end; ++i) {
            const c = childs[i];
            if (c.parentIndex.position > node.parentIndex.position) {
                childs.splice(i, 0, node);
                return;
            }
        }
        childs.splice(end, 0, node);
        return;
    }
    const mid = Math.round((start + end) / 2);
    const c = childs[mid];
    if (c.parentIndex.position > node.parentIndex.position) {
        insert2childs(childs, node, start, mid - 1);
    } else {
        insert2childs(childs, node, mid + 1, end);
    }
}

export async function importDocument(file: File, gurad: IDataGuard /*inflateRawSync: (data: Uint8Array)=> Uint8Array*/): Promise<Document> {

    const buffer = await file.arrayBuffer();

    const json = figToJson((buffer)) as IJSON;
    const unzipped = UZIP.parse(buffer);

    const nodeChanges = json['nodeChanges'];
    if (!nodeChanges || !Array.isArray(nodeChanges)) throw new Error("data error");

    const nodeChangesMap = new Map<string, IJSON>();
    for (const node of nodeChanges) nodeChangesMap.set([node['guid']['localID'], node['guid']['sessionID']].join(','), node);

    // 先生成对象树
    const nodesmap = new Map<string, IJSON>();
    const pages: IJSON[] = [];
    nodeChanges.forEach(node => {
        const type = node['type'];
        if (type === "DOCUMENT") return;

        const guid = node['guid'];
        const nodeid = [guid['localID'], guid['sessionID']].join(',');
        const parentIndex = node['parentIndex'];
        const pguid = parentIndex['guid'];
        const parentid = [pguid['localID'], pguid['sessionID']].join(',');
        const visible = node['visible'];

        const pnode = nodeChangesMap.get(parentid);
        if (pnode && !Array.isArray(pnode.childs)) pnode.childs = [];

        if (type === 'CANVAS') {
            if (!visible) return;
            nodesmap.set(nodeid, node);
            pages.push(node);
        }

        // if (![
        //     'ROUNDED_RECTANGLE',
        //     'ELLIPSE',
        // ].includes(type)) return;

        if (pnode) {
            insert2childs(pnode.childs, node, 0, pnode.childs.length - 1);
        }
    })

    const pageList = new BasicArray<PageListItem>();
    pages.forEach((p, i) => {
        p.id = uuid();
        pageList.push(new PageListItem([i] as BasicArray<number>, p.id, p.name));
    })

    const document = new Document(uuid(), "", "", new BasicMap(), file.name, pageList, gurad);

    startLoader(json, pages, document, nodeChangesMap, unzipped);

    return document;
}