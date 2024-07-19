import {uuid} from "../../../basic/uuid";
import {BasicArray, BasicMap, IDataGuard, Document, PageListItem} from "../../../data";
import {IJSON} from "./basic";
import {figToJson} from "./fig2json";
import {startLoader} from "./loader";
import * as UZIP from "uzip";

function compare(l: string, r: string) {
    if (l.length < r.length) return -1;
    else if (l.length > r.length) return 1;
    if (l === r) return 0;
    return l.charCodeAt(l.length - 1) > r.charCodeAt(r.length - 1) ? 1 : -1;
}


function insert2childs(
    list: {
        parentIndex: { position: string },
        [key: string]: any,
    }[],
    node: {
        parentIndex: { position: string },
        [key: string]: any,
    },
    start: number,
    end: number, // 包含
) {
    // 比较少时直接逐一比较
    if ((end - start) < 5) {
        for (let i = start; i <= end; i++) {
            const item = list[i];
            if (compare(item.parentIndex.position, node.parentIndex.position)) {
                list.splice(i, 0, node);
                return;
            }
        }
        list.splice(end + 1, 0, node);
        return;
    }
    const middleIndex = Math.round((start + end) / 2);
    const middleItem = list[middleIndex];
    if (compare(middleItem.parentIndex.position, node.parentIndex.position)) {
        insert2childs(list, node, start, middleIndex);
    } else {
        insert2childs(list, node, middleIndex + 1, end);
    }
}

export async function importDocument(file: File, gurad: IDataGuard /*inflateRawSync: (data: Uint8Array)=> Uint8Array*/): Promise<Document> {

    const buffer = await file.arrayBuffer();

    const json = figToJson((buffer)) as IJSON;
    const unzipped = UZIP.parse(buffer);

    const nodeChanges = json['nodeChanges'];
    if (!nodeChanges || !Array.isArray(nodeChanges)) throw new Error("data error");

    const nodeChangesMap = new Map<string, IJSON>();
    for (const node of nodeChanges) {
        node.kcId = uuid();
        nodeChangesMap.set([node['guid']['localID'], node['guid']['sessionID']].join(','), node);
    }

    // 先生成对象树
    const nodesmap = new Map<string, IJSON>();
    const pages: IJSON[] = [];
    for (const node of nodeChanges) {
        const type = node['type'];
        if (type === "DOCUMENT") continue;

        const guid = node['guid'];
        const nodeid = [guid['localID'], guid['sessionID']].join(',');
        const parentIndex = node['parentIndex'];
        const pguid = parentIndex['guid'];
        const parentid = [pguid['localID'], pguid['sessionID']].join(',');
        const visible = node['visible'];

        const pnode = nodeChangesMap.get(parentid);
        if (pnode && !Array.isArray(pnode.childs)) pnode.childs = [];

        if (type === 'CANVAS') {
            if (!visible) continue;
            nodesmap.set(nodeid, node);
            pages.push(node);
        }

        if (pnode) {
            insert2childs(pnode.childs, node, 0, pnode.childs.length - 1);
        }
    }

    for (const node of nodeChanges) {
        if (Array.isArray(node.childs)) node.childs.reverse();
    }

    const pageList = new BasicArray<PageListItem>();
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        page.id = uuid();
        pageList.push(new PageListItem([i] as BasicArray<number>, page.id, page.name));
    }

    const document = new Document(uuid(), file.name, "", "", pageList, new BasicMap(), gurad);

    console.log(json)
    console.log(nodeChangesMap)
    startLoader(json, pages, document, nodeChangesMap, unzipped);

    return document;
}