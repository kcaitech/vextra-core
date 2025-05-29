/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Document, Page, Shape, SymbolShape } from "../../../data/classes";
import { LzData } from "./lzdata";
import { IJSON, LoadContext } from "./basic";
import { importArtboard, importGroupShape, importImage, importPage, importPathShape, importRectShape, importShapeGroupShape, importSymbol, importSymbolRef, importTextShape } from "./shapeio";
import { base64Encode } from "../../../basic/utils";
import { updatePageFrame } from "../common/basic";


export function startLoader(lzdata: LzData, document: Document) {
    const __remote: LzData = lzdata;
    const __document: Document = document;
    const __handler: { [ket: string]: (ctx: LoadContext, data: IJSON, i: number) => Shape } = {}

    const importer = (ctx: LoadContext, data: IJSON, i: number): Shape => {
        const _class = data['_class']
        const f = __handler[_class] || ((ctx, data, i: number) => importRectShape(ctx, data, importer, i))
        const ret: Shape = f(ctx, data, i);
        // if (data['sharedStyleID']) {
        //     __document.stylesMgr.add(data['sharedStyleID'], ret.style)
        // }
        return ret
    }

    const loadPage = async (ctx: LoadContext, id: string): Promise<Page> => {
        // ctx.shapeIds.clear();
        const json: IJSON = await __remote.loadJson('pages/' + id + '.json')
        const page = importPage(ctx, json, importer)
        updatePageFrame(page)
        return page;
    }

    const loadMedia = async (id: string): Promise<{ buff: Uint8Array; base64: string; }> => {
        const buffer: Uint8Array = await __remote.loadRaw('images/' + id)

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
        if (ext == "png") {
            url = "data:image/png;base64," + base64;
        }
        else if (ext == "gif") {
            url = "data:image/gif;base64," + base64;
        }
        else {
            console.log("imageExt", ext);
        }

        return { buff: buffer, base64: url }
    }

    const symbolsSet = new Map<string, SymbolShape>()
    const ctx: LoadContext = new LoadContext(document.mediasMgr, document.stylesMgr);

    // const importer = this.importer = this.importer.bind(this)
    __handler['rectangle'] = (ctx: LoadContext, data: IJSON, i: number) => importRectShape(ctx, data, importer, i)
    __handler['shapeGroup'] = (ctx: LoadContext, data: IJSON, i: number) => importShapeGroupShape(ctx, data, importer, i)
    __handler['group'] = (ctx: LoadContext, data: IJSON, i: number) => importGroupShape(ctx, data, importer, i)
    __handler['shapePath'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
    __handler['artboard'] = (ctx: LoadContext, data: IJSON, i: number) => {
        return importArtboard(ctx, data, importer, i)
    }
    __handler['bitmap'] = (ctx: LoadContext, data: IJSON, i: number) => {
        const image = importImage(ctx, data, importer, i)
        // image.setImageMgr(document.mediasMgr)
        return image;
    }
    __handler['page'] = (ctx: LoadContext, data: IJSON, i: number) => importPage(ctx, data, importer)
    __handler['text'] = (ctx: LoadContext, data: IJSON, i: number) => importTextShape(ctx, data, importer, i)
    __handler['oval'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
    __handler['star'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
    __handler['triangle'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
    __handler['polygon'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
    __handler['symbolMaster'] = (ctx: LoadContext, data: IJSON, i: number) => {
        const symbol = importSymbol(ctx, data, importer, i)
        symbolsSet.set(symbol.id, symbol)
        return symbol
    }
    __handler['symbolInstance'] = (ctx: LoadContext, data: IJSON, i: number) => {
        const symRef = importSymbolRef(ctx, data, importer, i)
        symRef.setSymbolMgr(document.symbolsMgr);
        return symRef;
    }

    document.mediasMgr.setLoader((id) => loadMedia(id))
    document.pagesMgr.setLoader(async (id) => {
        const page = await loadPage(ctx, id)
        // document.pagesMgr.add(page.id, page) // 在pagesMgr里也会add
        symbolsSet.forEach((v, k) => {
            // document.symbolregist.set(k, id);
            document.symbolsMgr.add(k, v);
        })
        symbolsSet.clear();
        return page;
    })
}