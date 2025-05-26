/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { uuid } from "../../../basic/uuid";
import { BasicArray, BasicMap, IDataGuard, Document, PageListItem } from "../../../data";
import { IJSON, LoadContext } from "./basic";
import { figToJson } from "./fig2json";
import { importer, startLoader } from "./loader";
import { importStylesFromId, importSymbol, importSymbolUnion, toStrId } from "./shapeio";
import JSZip from "jszip";

function compare(l: string, r: string) {
    if (l === r) return 0;

    const loopCount = Math.min(l.length, r.length);
    for (let i = 0; i < loopCount; i++) {
        const res = l.charCodeAt(i) - r.charCodeAt(i);
        if (res !== 0) return res > 0 ? 1 : -1;
    }

    return l.length > r.length ? 1 : -1;
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
            if (compare(item.parentIndex.position, node.parentIndex.position) > 0) {
                list.splice(i, 0, node);
                return;
            }
        }
        list.splice(end + 1, 0, node);
        return;
    }
    const middleIndex = Math.round((start + end) / 2);
    const middleItem = list[middleIndex];
    if (compare(middleItem.parentIndex.position, node.parentIndex.position) > 0) {
        insert2childs(list, node, start, middleIndex);
    } else {
        insert2childs(list, node, middleIndex + 1, end);
    }
}

export async function importDocument(file: File, gurad: IDataGuard /*inflateRawSync: (data: Uint8Array)=> Uint8Array*/): Promise<Document> {

    const buffer = await file.arrayBuffer();

    const json = await figToJson((buffer)) as IJSON;
    const unzipped = await JSZip.loadAsync(buffer);

    const nodeChanges = json['nodeChanges'];
    if (!nodeChanges || !Array.isArray(nodeChanges)) throw new Error("data error");

    const nodeChangesMap = new Map<string, IJSON>();
    const nodeKeyMap = new Map<string, IJSON>();
    for (const node of nodeChanges) {
        node.kcId = uuid();
        nodeChangesMap.set(toStrId(node['guid']), node);

        const key = node.key;
        if (key) nodeKeyMap.set(key, node);

        const overrideKey = node.overrideKey;
        if (overrideKey) nodeChangesMap.set(toStrId(overrideKey), node);
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
            node.parent = pnode;
        }
    }

    pages.sort((a, b) => {
        return compare(a.parentIndex.position, b.parentIndex.position);
    });
    const pageList = new BasicArray<PageListItem>();
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        page.id = uuid();
        pageList.push(new PageListItem([i] as BasicArray<number>, page.id, page.name));
    }

    const freesymbols = new BasicMap();

    const document = new Document(uuid(), file.name.replace(/.fig$/, ''), gurad, { pageList });

    const ctx: LoadContext = new LoadContext(document.mediasMgr, document.stylesMgr);
    startLoader(json, pages, document, nodeChangesMap, nodeKeyMap, ctx, unzipped);

    const internalPage = nodeChanges.find(node => !node.visible && node.name === 'Internal Only Canvas');
    const internalPageSymbolChilds = internalPage?.childs?.filter((item: any) => item.type === 'SYMBOL' || (item.type === 'FRAME' && !item.resizeToFit && item.isStateGroup));
    if (Array.isArray(internalPageSymbolChilds)) for (let i = 0; i < internalPageSymbolChilds.length; i++) {
        const item = internalPageSymbolChilds[i];
        const shape = (item.type === 'SYMBOL' ? importSymbol : importSymbolUnion)(ctx, item, importer, i, nodeChangesMap, nodeKeyMap);
        freesymbols.set(shape.id, shape);
        document.symbolsMgr.add(shape.id, freesymbols.get(shape.id) as any);
    }

    for (const node of nodeChanges) importStylesFromId(node, node, nodeChangesMap, nodeKeyMap);

    return document;
}