/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    BasicArray, IDataGuard, Document, Transform, Page, ShapeType, Style,
    BorderSideSetting,
    SideType,
    Border,
    BorderPosition,
    BorderStyle,
    CornerType,
    Fill
} from "../../../data";
import { uuid } from "../../../basic/uuid";
import { IImportContext, importPage, importDocumentMeta } from "../../../data/baseimport";
import { base64Encode, base64ToDataUrl } from "../../../basic/utils";

function setLoader(pack: { [p: string]: string | Uint8Array; }, document: Document) {
    document.mediasMgr.setLoader(id => loadMedia(id));
    document.pagesMgr.setLoader(id => loadPage(id));

    async function loadMedia(id: string): Promise<{ buff: Uint8Array; base64: string; }> {
        const buffer = pack[id] as Uint8Array;
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
        const page = JSON.parse(pack[id] as string) as Page;
        if (!page) {
            const trans = new Transform();
            const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
            const strokePaints = new BasicArray<Fill>();
            const border = new Border(BorderPosition.Inner, new BorderStyle(0, 0), CornerType.Miter, side, strokePaints);
            return new Page(new BasicArray(), id, "", ShapeType.Page, trans, new Style(new BasicArray(), new BasicArray(), border), new BasicArray());
        }
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