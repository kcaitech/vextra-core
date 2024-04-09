import { Shape } from "../../../data/shape";
import { ResourceMgr } from "../../../data/basic";
import { Page } from "../../../data/page";

export interface IJSON {
    [key: string]: any
}
export class LoadContext {
    // shapeIds: Set<string> = new Set();
    mediasMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    constructor(mediasMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.mediasMgr = mediasMgr;
    }
}

export type ImportFun = (ctx: LoadContext, data: IJSON, i: number) => Shape


export function updatePageFrame(p: Page) {
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
