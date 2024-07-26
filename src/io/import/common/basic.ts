import {Shape, Variable} from "../../../data/shape";
import {BasicMap, ResourceMgr} from "../../../data/basic";
import { Page } from "../../../data";

export interface IJSON {
    [key: string]: any
}
export class LoadContext {
    // shapeIds: Set<string> = new Set();
    mediasMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    rawVariables = new Map<string, IJSON>();
    variables = new BasicMap<string, Variable>();
    constructor(mediasMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.mediasMgr = mediasMgr;
    }
}

export type ImportFun = (ctx: LoadContext, data: IJSON, i: number) => Shape

export type ImportFun1 = (ctx: LoadContext, data: IJSON, i: number) => Shape | undefined


export function updatePageFrame(p: Page) {
    const pf = p.frame;
    const cc = p.childs.length;
    if (cc === 0) {
        p.transform.translateX = 0;
        p.transform.translateY = 0;
        p.size.width = 0
        p.size.height = 0
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
    p.transform.translateX = pf.x + l;
    p.transform.translateY = pf.y + t;
    p.size.width = r - l
    p.size.height = b - t
    // console.log(pf)

    for (let i = 0; i < cc; i++) {
        const c = p.childs[i];
        c.transform.translateX -= l;
        c.transform.translateY -= t;
        // cf.width = cf.width;
        // cf.height = cf.height;
        // console.log("c", i, cf)
    }
}
