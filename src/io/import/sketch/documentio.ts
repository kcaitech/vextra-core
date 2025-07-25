/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { uuid } from "../../../basic/uuid";
import { BasicArray, IDataGuard } from "../../../data/basic";
import { Document, PageListItem } from "../../../data/document";
import { LzData } from "./lzdata";
import { IJSON } from "./basic";
import { startLoader } from "./loader";
import { LzDataLocal } from "./lzdatalocal";
import { Zip } from "./zip";
import { isNode } from "../../../basic/consts";

async function importPageList(lzData: LzData, pageIds: string[]): Promise<BasicArray<PageListItem>> {
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
        const id = pageIds[i];

        // if (id === LibType.Symbol) continue; // 组件库页面
        let name = metaMap.get(id);
        if (!name) {
            const p = await lzData.loadJson(`pages/${id}.json`);
            name = p['name'];
        }
        pageList.push(new PageListItem([i] as BasicArray<number>, id, name || 'Unknow'))
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
    const document = new Document(id, name, gurad, { pageList });

    startLoader(lzData, document);

    return document;
}

export async function importDocumentZip(file: File | string, gurad: IDataGuard): Promise<Document> {
    const lzdata = new LzDataLocal(new Zip(file));
    // 获取文件名
    let fileName: string;
    if (typeof file === 'string') {
        if (!isNode) {
            throw new Error('browser 不支持通过文件路径导入');
        }
        // 从文件路径提取文件名
        const path = await import('path');
        fileName = path.basename(file);
    } else {
        fileName = file.name.replace(/.sketch$/, '');
    }
    return importDocument(fileName, lzdata, gurad);
}