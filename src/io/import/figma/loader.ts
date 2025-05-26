/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BasicArray, Border, BorderPosition, BorderSideSetting, BorderStyle, CornerType, Document, Fill, Page, Shape, ShapeType, SideType, Style, SymbolShape, Transform } from "../../../data";
import { IJSON, LoadContext } from "./basic";
import {
    importEllipse,
    importGroup,
    importLine,
    importPage,
    importPathShape,
    importPolygon,
    importSlice,
    importStar,
    importSymbol,
    importSymbolRef,
    importTextShape,
} from "./shapeio";
import { base64Encode } from "../../../basic/utils";
import JSZip from "jszip";

const __handler: { [ket: string]: (ctx: LoadContext, data: IJSON, i: number) => Shape } = {}

export const importer = (ctx: LoadContext, data: IJSON, i: number): Shape | undefined => {
    const _class = data['type']
    const f = __handler[_class]
    if (!f) return;
    return f(ctx, data, i);
}

const symbolsSet = new Map<string, SymbolShape>();

let _nodeChangesMap: Map<string, IJSON>;
let _nodeKeyMap: Map<string, IJSON>;
__handler['ROUNDED_RECTANGLE'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
__handler['VECTOR'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
__handler['FRAME'] = (ctx: LoadContext, data: IJSON, i: number) => importGroup(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
__handler['PAGE'] = (ctx: LoadContext, data: IJSON, i: number) => importPage(ctx, data, importer, _nodeChangesMap, _nodeKeyMap);
__handler['TEXT'] = (ctx: LoadContext, data: IJSON, i: number) => importTextShape(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
__handler['ELLIPSE'] = (ctx: LoadContext, data: IJSON, i: number) => importEllipse(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
__handler['LINE'] = (ctx: LoadContext, data: IJSON, i: number) => importLine(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
__handler['STAR'] = (ctx: LoadContext, data: IJSON, i: number) => importStar(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
__handler['REGULAR_POLYGON'] = (ctx: LoadContext, data: IJSON, i: number) => importPolygon(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
__handler['SYMBOL'] = (ctx: LoadContext, data: IJSON, i: number) => {
    const symbol = importSymbol(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
    symbolsSet.set(symbol.id, symbol);
    return symbol;
}
let symbolsMgr: any;
__handler['INSTANCE'] = (ctx: LoadContext, data: IJSON, i: number) => {
    const symbolRef = importSymbolRef(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
    symbolRef.setSymbolMgr(symbolsMgr);
    return symbolRef;
}
__handler['SLICE'] = (ctx: LoadContext, data: IJSON, i: number) => importSlice(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);
__handler['BOOLEAN_OPERATION'] = (ctx: LoadContext, data: IJSON, i: number) => importGroup(ctx, data, importer, i, _nodeChangesMap, _nodeKeyMap);

export function startLoader(file: IJSON, pages: IJSON[], document: Document, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>, ctx: LoadContext, unzipped: JSZip) {
    symbolsSet.clear();
    _nodeChangesMap = nodeChangesMap;
    _nodeKeyMap = nodeKeyMap;
    symbolsMgr = document.symbolsMgr;

    const loadPage = async (ctx: LoadContext, id: string): Promise<Page> => {
        const json: IJSON | undefined = pages.find(p => p.id === id);
        if (!json) {
            const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
            const strokePaints = new BasicArray<Fill>();
            const border = new Border(BorderPosition.Inner, new BorderStyle(0, 0), CornerType.Miter, side, strokePaints);
            const trans = new Transform();
            return new Page(new BasicArray(), id, "", ShapeType.Page, trans, new Style(new BasicArray(), new BasicArray(), border), new BasicArray());
        }
        const page = importPage(ctx, json, importer, nodeChangesMap, nodeKeyMap);
        // updatePageFrame(page);
        return page;
    }

    const loadMedia = async (id: string): Promise<{ buff: Uint8Array; base64: string; }> => {
        const extIndex = id.lastIndexOf('.');
        const idWithoutExt = extIndex !== -1 ? id.slice(0, extIndex) : id;
        const ext = extIndex !== -1 ? id.substring(extIndex + 1) : '';

        const buffer = await unzipped.file(`images/${idWithoutExt}`)?.async("uint8array") as Uint8Array | undefined;
        if (!buffer) return { buff: new Uint8Array(), base64: "" };

        const uInt8Array = buffer;
        let i = uInt8Array.length;
        const binaryString = new Array(i);
        while (i--) {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        const data = binaryString.join('');

        const base64 = base64Encode(data);

        let url = '';
        if (ext == "png") {
            url = "data:image/png;base64," + base64;
        } else if (ext == "gif") {
            url = "data:image/gif;base64," + base64;
        } else {
            console.log("imageExt", ext);
        }

        return { buff: buffer, base64: url }
    }

    document.mediasMgr.setLoader((id) => loadMedia(id))
    document.pagesMgr.setLoader(async (id) => {
        const page = await loadPage(ctx, id)
        symbolsSet.forEach((v, k) => {
            document.symbolsMgr.add(k, v);
        })
        symbolsSet.clear();
        return page;
    })
}