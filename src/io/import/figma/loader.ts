import { BasicArray } from "../../../data/basic";
import { Document, Page, Shape, ShapeFrame, ShapeSize, ShapeType, Style, SymbolShape, Transform } from "../../../data/classes";
import { updatePageFrame } from "../common/basic";
import { IJSON, LoadContext } from "./basic";
import {
    importEllipse,
    importGroup,
    importLine,
    importPage,
    importRectShape,
    importSymbol,
    importSymbolRef,
    importTextShape
} from "./shapeio";
import {UZIPFiles} from "uzip";
import {base64Encode} from "../../../basic/utils";

export function startLoader(file: IJSON, pages: IJSON[], document: Document, nodeChangesMap: Map<string, IJSON>, unzipped: UZIPFiles) {
    // const __remote: LzData = lzdata;
    const __document: Document = document;
    const __handler: { [ket: string]: (ctx: LoadContext, data: IJSON, i: number) => Shape } = {}

    const importer = (ctx: LoadContext, data: IJSON, i: number): Shape | undefined => {
        const _class = data['type']
        const f = __handler[_class]
        if (!f) return;
        const ret: Shape = f(ctx, data, i);
        // if (data['sharedStyleID']) {
        //     __document.stylesMgr.add(data['sharedStyleID'], ret.style)
        // }
        return ret
    }

    const loadPage = async (ctx: LoadContext, id: string): Promise<Page> => {
        // ctx.shapeIds.clear();
        const json: IJSON | undefined = pages.find(p => p.id === id);
        if (!json) {
            const size = new ShapeSize(100, 100);
            const trans = new Transform();
            return new Page(new BasicArray(), id, "", ShapeType.Page, trans, size, new Style(new BasicArray(), new BasicArray(), new BasicArray()), new BasicArray());
        }
        const page = importPage(ctx, json, importer);
        updatePageFrame(page);
        return page;
    }

    const loadMedia = async (id: string): Promise<{ buff: Uint8Array; base64: string; }> => {
        const extIndex = id.lastIndexOf('.');
        const idWithoutExt = extIndex !== -1 ? id.slice(0, extIndex) : id;
        const ext = extIndex !== -1 ? id.substring(extIndex + 1) : '';

        const buffer = unzipped[`images/${idWithoutExt}`];

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
    const ctx: LoadContext = new LoadContext(document.mediasMgr);

    // const importer = this.importer = this.importer.bind(this)
    __handler['ROUNDED_RECTANGLE'] = (ctx: LoadContext, data: IJSON, i: number) => importRectShape(ctx, data, importer, i)
    // __handler['shapeGroup'] = (ctx: LoadContext, data: IJSON, i: number) => importShapeGroupShape(ctx, data, importer, i)
    __handler['FRAME'] = (ctx: LoadContext, data: IJSON, i: number) => importGroup(ctx, data, importer, i)
    // __handler['shapePath'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
    // __handler['artboard'] = (ctx: LoadContext, data: IJSON, i: number) => {
    //     return importArtboard(ctx, data, importer, i)
    // }
    // __handler['bitmap'] = (ctx: LoadContext, data: IJSON, i: number) => {
    //     const image = importImage(ctx, data, importer, i)
    //     image.setImageMgr(document.mediasMgr)
    //     return image;
    // }
    __handler['PAGE'] = (ctx: LoadContext, data: IJSON, i: number) => importPage(ctx, data, importer)
    __handler['TEXT'] = (ctx: LoadContext, data: IJSON, i: number) => importTextShape(ctx, data, importer, i)
    __handler['ELLIPSE'] = (ctx: LoadContext, data: IJSON, i: number) => importEllipse(ctx, data, importer, i)
    __handler['SYMBOL'] = (ctx: LoadContext, data: IJSON, i: number) => importSymbol(ctx, data, importer, i)
    __handler['INSTANCE'] = (ctx: LoadContext, data: IJSON, i: number) => importSymbolRef(ctx, data, importer, i, nodeChangesMap)
    __handler['LINE'] = (ctx: LoadContext, data: IJSON, i: number) => importLine(ctx, data, importer, i)
    // __handler['star'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
    // __handler['triangle'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
    // __handler['polygon'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
    // __handler['symbolMaster'] = (ctx: LoadContext, data: IJSON, i: number) => {
    //     const symbol = importSymbol(ctx, data, importer, i)
    //     symbolsSet.set(symbol.id, symbol)
    //     return symbol
    // }
    // __handler['symbolInstance'] = (ctx: LoadContext, data: IJSON, i: number) => {
    //     const symRef = importSymbolRef(ctx, data, importer, i)
    //     symRef.setSymbolMgr(document.symbolsMgr);
    //     return symRef;
    // }

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