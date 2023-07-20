import { MeasureFun } from "data/textlayout";
import { Document, Page, Shape, SymbolShape } from "../../../data/classes";
import { IJSON, LzData } from "../../lzdata";
import { LoadContext } from "./basic";
import { importArtboard, importGroupShape, importImage, importPage, importPathShape, importRectShape, importShapeGroupShape, importSymbol, importSymbolRef, importTextShape } from "./shapeio";


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

export class DataLoader {
    private __remote: LzData;
    private __document: Document;
    private __handler: {[ket: string]: (ctx: LoadContext, data: IJSON)=> Shape} = {}
    constructor(lzdata: LzData, document: Document, measureFun: MeasureFun) {
        this.__remote = lzdata;
        this.__document = document;

        const symbolsSet = new Map<string, SymbolShape>()
        const ctx: LoadContext = new LoadContext(measureFun, document.mediasMgr);

        const importer = this.importer = this.importer.bind(this)
        this.__handler['rectangle'] = (ctx: LoadContext, data: IJSON) => importRectShape(ctx, data, importer)
        this.__handler['shapeGroup'] = (ctx: LoadContext, data: IJSON) => importShapeGroupShape(ctx, data, importer)
        this.__handler['group'] = (ctx: LoadContext, data: IJSON) => importGroupShape(ctx, data, importer)
        this.__handler['shapePath'] = (ctx: LoadContext, data: IJSON) => importPathShape(ctx, data, importer)
        this.__handler['artboard'] = (ctx: LoadContext, data: IJSON) => {
            return importArtboard(ctx, data, importer)
        }
        this.__handler['bitmap'] = (ctx: LoadContext, data: IJSON) => {
            const image = importImage(ctx, data, importer)
            image.setImageMgr(document.mediasMgr)
            return image;
        }
        this.__handler['page'] = (ctx: LoadContext, data: IJSON) => importPage(ctx, data, importer)
        this.__handler['text'] = (ctx: LoadContext, data: IJSON) => importTextShape(ctx, data, importer)
        this.__handler['oval'] = (ctx: LoadContext, data: IJSON) => importPathShape(ctx, data, importer)
        this.__handler['star'] = (ctx: LoadContext, data: IJSON) => importPathShape(ctx, data, importer)
        this.__handler['triangle'] = (ctx: LoadContext, data: IJSON) => importPathShape(ctx, data, importer)
        this.__handler['polygon'] = (ctx: LoadContext, data: IJSON) => importPathShape(ctx, data, importer)
        this.__handler['symbolMaster'] = (ctx: LoadContext, data: IJSON) => {
            const symbol = importSymbol(ctx, data, importer)
            symbolsSet.set(symbol.id, symbol)
            return symbol
        }
        this.__handler['symbolInstance'] = (ctx: LoadContext, data: IJSON) => {
            const symRef = importSymbolRef(ctx, data, importer)
            symRef.setSymbolMgr(document.symbolsMgr);
            return symRef;
        }

        document.mediasMgr.setLoader((id) => this.loadMedia(id))
        document.pagesMgr.setLoader(async (id) => {
            const page = await this.loadPage(ctx, id)
            document.pagesMgr.add(page.id, page)
            symbolsSet.forEach((v, k) => {
                document.symbolsMgr.add(k, v);
            })
            symbolsSet.clear();
            return page;
        })

        // const loaded = new Set<string>()
        // const loadNext = async () => {
        //     const id = document.pagesList.find((val) => !loaded.has(val.id))
        //     if (!id) return
        //     loaded.add(id.id)
        //     const page = await this.loadPage(id.id)
        //     document.pagesMgr.add(id.id, page)

        //     symbolsSet.forEach((v, k) => {
        //         document.symbolsMgr.add(k, v);
        //     })
        //     symbolsSet.clear();

        //     loadNext()
        // }
        // loadNext()
    }

    importer(ctx: LoadContext, data: IJSON): Shape {
        const _class = data['_class']
        const f = this.__handler[_class] || ((ctx, data) => importRectShape(ctx, data, this.importer))
        const ret: Shape = f(ctx, data);
        if (data['sharedStyleID']) {
            this.__document.stylesMgr.add(data['sharedStyleID'], ret.style)
        }
        return ret
    }

    async loadPage(ctx: LoadContext, id: string): Promise<Page> {
        ctx.shapeIds.clear();
        const json: IJSON = await this.__remote.loadJson('pages/' + id + '.json')
        const page = importPage(ctx, json, this.importer)
        updatePageFrame(page)
        return page;
    }

    async loadMedia(id: string): Promise<{ buff: Uint8Array; base64: string; }> {
        const buffer: Uint8Array = await this.__remote.loadRaw('images/' + id)

        const uInt8Array = buffer;
        let i = uInt8Array.length;
        const binaryString = new Array(i);
        while (i--) {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        const data = binaryString.join('');

        const base64 = window.btoa(data);

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
}