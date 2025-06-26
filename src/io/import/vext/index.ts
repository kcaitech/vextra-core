/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    IDataGuard, Document, Page
    } from "../../../data";
import { uuid } from "../../../basic/uuid";
import { IImportContext, importPage, importDocumentMeta } from "../../../data/baseimport";
import { base64Encode, base64ToDataUrl } from "../../../basic/utils";
import JSZip from "jszip";
import { isBrowser, isNode } from "../../../basic/consts";

function setLoader(pack: { [p: string]: string | Uint8Array; }, document: Document) {
    document.mediasMgr.setLoader(id => loadMedia(id));
    document.pagesMgr.setLoader(id => loadPage(id));

    async function loadMedia(id: string): Promise<{ buff: Uint8Array; base64: string; }> {
        const buffer = pack[id] as Uint8Array;
        if (!buffer) {
            return { buff: new Uint8Array(), base64: '' };
        }
        const uInt8Array = buffer;
        let i = uInt8Array.length;
        const binaryString = new Array(i);
        while (i--) {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        const data = binaryString.join('');

        const base64 = base64Encode(data);

        let url = '';
        const ext = id.substring(id.lastIndexOf('.') + 1);
        if (ext === 'png') {
            url = base64ToDataUrl('png', base64);
        } else if (ext === 'gif') {
            url = base64ToDataUrl('gif', base64);
        } else if (ext === 'svg') {
            url = base64ToDataUrl('svg', base64);
        } else if (ext === 'jpeg') {
            url = base64ToDataUrl('jpeg', base64);
        } else {
            console.log('imageExt', ext);
        }

        return { buff: buffer, base64: url };

    }

    async function loadPage(id: string): Promise<Page> {
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = document;
            curPage: string = id;
            fmtVer: string = document.fmtVer;
        };
        if (!pack[id]) {
            throw new Error(`Page ${id} not found`);
        }
        const page = JSON.parse(pack[id] as string) as Page;
        // if (!page) {
        //     const trans = new Transform();
        //     const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
        //     const strokePaints = new BasicArray<Fill>();
        //     const border = new Border(BorderPosition.Inner, new BorderStyle(0, 0), CornerType.Miter, side, strokePaints);
        //     return new Page(new BasicArray(), id, "", ShapeType.Page, trans, new Style(new BasicArray(), new BasicArray(), border), new BasicArray());
        // }
        return importPage(page, ctx);
    }
}

export function importDocument(name: string, mdd: { [p: string]: string | Uint8Array }, guard: IDataGuard) {
    const meta = importDocumentMeta(JSON.parse(mdd['document-meta.json'] as string));
    const document = new Document(uuid(), name, guard, {
        pageList: meta.pagesList,
        stylelib: meta.stylelib as any
    });
    setLoader(mdd, document);
    return document;
}

function getFiles(filePack: File | string): Promise<{ [p: string]: JSZip.JSZipObject }> {
    if (isBrowser) {
        if (!(filePack instanceof File)) {
            return Promise.reject(new Error('browser 不支持通过文件路径导入'));
        }
        //
        // 浏览器环境处理 File 对象
        return getFilesBrowser(filePack);
    } else if (isNode) {
        if (typeof filePack !== 'string') {
            return Promise.reject(new Error('node 不支持通过文件对象导入'));
        }
        // Node.js 环境处理 Buffer 或文件路径
        return getFilesNode(filePack);
    } else {
        return Promise.reject(new Error('不支持的环境或文件类型'));
    }
}

function getFilesBrowser(filePack: File): Promise<{ [p: string]: JSZip.JSZipObject }> {
    const reader = new FileReader();
    reader.readAsArrayBuffer(filePack);
    return new Promise((resolve, reject) => {
        reader.onload = (event) => {
            const buff = event.target!.result as ArrayBuffer;
            if (!buff) reject(new Error('无法获取文档内容'));
            const zip = new JSZip();
            zip.loadAsync(buff).then(res => {
                resolve(res.files);
            }).catch(reject);
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
    });
}

async function getFilesNode(filePack: string): Promise<{ [p: string]: JSZip.JSZipObject }> {
    let buffer: Buffer;
    
    const fs = await import('fs');
    buffer = fs.readFileSync(filePack);
    
    const zip = new JSZip();
    const res = await zip.loadAsync(buffer);
    return res.files;
}

export async function importDocumentZip(filePack: File | string, repo: IDataGuard) {
    const __files = await getFiles(filePack);
    const names = Object.keys(__files);
    const __doc: {
        [p: string]: string | Uint8Array | ArrayBuffer;
    } = {};
    
    for (let name of names) {
        const file = __files[name];
        if (file.dir) continue;
        let type: 'string' | 'arraybuffer' = 'string';
        if (name.startsWith('images')) type = 'arraybuffer';
        let content: string | Uint8Array | ArrayBuffer = await file.async(type);
        if (type === "arraybuffer") {
            content = new Uint8Array(content as ArrayBuffer);
        }
        if (name.startsWith('pages')) name = name.replace('.json', '');
        __doc[name.replace(/images\/|pages\//, '')] = content;
    }

    // 获取文件名
    let fileName: string;
    if (isBrowser) {
        if (!(filePack instanceof File)) {
            return Promise.reject(new Error('browser 不支持通过文件路径导入'));
        }
        fileName = filePack.name;
    } else if (isNode) {
        if (typeof filePack !== 'string') {
            return Promise.reject(new Error('node 不支持通过文件对象导入'));
        }
        // 从文件路径提取文件名
        const path = await import('path');
        fileName = path.basename(filePack);
    } else {
        return Promise.reject(new Error('不支持的环境或文件类型'));
    }

    return importDocument(fileName, __doc as { [p: string]: string | Uint8Array; }, repo);
}
