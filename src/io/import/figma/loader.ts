import {BasicArray, Document, Page, Shape, ShapeType, Style, SymbolShape, Transform} from "../../../data";
import {IJSON, LoadContext} from "./basic";
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
import {UZIPFiles} from "uzip";
import {base64Encode} from "../../../basic/utils";

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

export function startLoader(file: IJSON, pages: IJSON[], document: Document, nodeChangesMap: Map<string, IJSON>, nodeKeyMap: Map<string, IJSON>, ctx: LoadContext, unzipped: UZIPFiles) {
    symbolsSet.clear();
    _nodeChangesMap = nodeChangesMap;
    _nodeKeyMap = nodeKeyMap;
    symbolsMgr = document.symbolsMgr;

    const loadPage = async (ctx: LoadContext, id: string): Promise<Page> => {
        const json: IJSON | undefined = pages.find(p => p.id === id);
        if (!json) {
            const trans = new Transform();
            return new Page(new BasicArray(), id, "", ShapeType.Page, trans, new Style(new BasicArray(), new BasicArray(), new BasicArray()), new BasicArray());
        }
        const page = importPage(ctx, json, importer, nodeChangesMap, nodeKeyMap);
        // updatePageFrame(page);
        return page;
    }

    const loadMedia = async (id: string): Promise<{ buff: Uint8Array; base64: string; }> => {
        const extIndex = id.lastIndexOf('.');
        const idWithoutExt = extIndex !== -1 ? id.slice(0, extIndex) : id;
        const ext = extIndex !== -1 ? id.substring(extIndex + 1) : '';

        const buffer = unzipped[`images/${idWithoutExt}`];
        if (!buffer) return {buff: new Uint8Array(), base64: ""};

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

        return {buff: buffer, base64: url}
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