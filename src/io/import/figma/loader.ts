import { BasicArray } from "../../../data/basic";
import { Document, Page, Shape, ShapeFrame, ShapeType, Style, SymbolShape } from "../../../data/classes";
import { IJSON, LoadContext } from "./basic";
import { importPage, importRectShape } from "./shapeio";


function updatePageFrame(p: Page) {
    const pf = p.frame;
    const cc = p.childs.length;
    if (cc === 0) {
        p.frame.x = 0
        p.frame.y = 0
        p.frame.width = 0
        p.frame.height = 0
        return;
    }
    const c = p.childs[0];
    const cf = c.frame;
    let l = cf.x, t = cf.y, r = l + cf.width, b = t + cf.height;
    for (let i = 1; i < cc; i++) {
        const c = p.childs[i];
        const cf = c.frame;
        const cl = cf.x, ct = cf.y, cr = cl + cf.width, cb = ct + cf.height;
        l = Math.min(cl, l);
        t = Math.min(ct, t);
        r = Math.max(cr, r);
        b = Math.max(cb, b);
        // console.log("c", i, cf)
    }
    // console.log("pf", pf)
    // console.log(l, t, r, b)
    // pf.set(pf.x + l, pf.y + t, r - l, b - t);
    pf.x = pf.x + l
    pf.y = pf.y + t
    pf.width = r - l
    pf.height = b - t
    // console.log(pf)

    for (let i = 0; i < cc; i++) {
        const c = p.childs[i];
        const cf = c.frame;
        cf.x = cf.x - l;
        cf.y = cf.y - t;
        // cf.width = cf.width;
        // cf.height = cf.height;
        // console.log("c", i, cf)
    }
}

export function startLoader(file: IJSON, pages: IJSON[], document: Document) {
    // const __remote: LzData = lzdata;
    const __document: Document = document;
    const __handler: { [ket: string]: (ctx: LoadContext, data: IJSON, i: number) => Shape } = {}

    const importer = (ctx: LoadContext, data: IJSON, i: number): Shape => {
        const _class = data['type']
        const f = __handler[_class] || ((ctx, data, i: number) => importRectShape(ctx, data, importer, i))
        const ret: Shape = f(ctx, data, i);
        // if (data['sharedStyleID']) {
        //     __document.stylesMgr.add(data['sharedStyleID'], ret.style)
        // }
        return ret
    }

    const loadPage = async (ctx: LoadContext, id: string): Promise<Page> => {
        // ctx.shapeIds.clear();
        const json: IJSON | undefined = pages.find(p => p.id === id);
        if (!json) return new Page(new BasicArray(), id, "", ShapeType.Page, new ShapeFrame(0, 0, 100, 100), new Style(new BasicArray(), new BasicArray(), new BasicArray()), new BasicArray());
        const page = importPage(ctx, json, importer);
        updatePageFrame(page);
        return page;
    }

    // const loadMedia = async (id: string): Promise<{ buff: Uint8Array; base64: string; }> => {
    //     const buffer: Uint8Array = await __remote.loadRaw('images/' + id)

    //     const uInt8Array = buffer;
    //     let i = uInt8Array.length;
    //     const binaryString = new Array(i);
    //     while (i--) {
    //         binaryString[i] = String.fromCharCode(uInt8Array[i]);
    //     }
    //     const data = binaryString.join('');

    //     const base64 = base64Encode(data);

    //     let url = '';
    //     const ext = id.substring(id.lastIndexOf('.') + 1);
    //     if (ext == "png") {
    //         url = "data:image/png;base64," + base64;
    //     }
    //     else if (ext == "gif") {
    //         url = "data:image/gif;base64," + base64;
    //     }
    //     else {
    //         console.log("imageExt", ext);
    //     }

    //     return { buff: buffer, base64: url }
    // }

    const symbolsSet = new Map<string, SymbolShape>()
    const ctx: LoadContext = new LoadContext(document.mediasMgr);

    // const importer = this.importer = this.importer.bind(this)
    __handler['rectangle'] = (ctx: LoadContext, data: IJSON, i: number) => importRectShape(ctx, data, importer, i)
    // __handler['shapeGroup'] = (ctx: LoadContext, data: IJSON, i: number) => importShapeGroupShape(ctx, data, importer, i)
    // __handler['group'] = (ctx: LoadContext, data: IJSON, i: number) => importGroupShape(ctx, data, importer, i)
    // __handler['shapePath'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
    // __handler['artboard'] = (ctx: LoadContext, data: IJSON, i: number) => {
    //     return importArtboard(ctx, data, importer, i)
    // }
    // __handler['bitmap'] = (ctx: LoadContext, data: IJSON, i: number) => {
    //     const image = importImage(ctx, data, importer, i)
    //     image.setImageMgr(document.mediasMgr)
    //     return image;
    // }
    __handler['page'] = (ctx: LoadContext, data: IJSON, i: number) => importPage(ctx, data, importer)
    // __handler['text'] = (ctx: LoadContext, data: IJSON, i: number) => importTextShape(ctx, data, importer, i)
    // __handler['oval'] = (ctx: LoadContext, data: IJSON, i: number) => importPathShape(ctx, data, importer, i)
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

    // document.mediasMgr.setLoader((id) => loadMedia(id))
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