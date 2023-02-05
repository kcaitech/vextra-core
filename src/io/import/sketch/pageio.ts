import { Page } from "@/data/page";
import { Env } from "./envio";
import { importShape } from "./shapeio";
import { IJSON, LzData } from "@/data/lzdata";
import { ISymsMgr } from "@/data/shape";
import { MediaMgr, SymsMgr } from "@/data/document";

function updatePageFrame(p: Page) {
    const pf = p.frame;
    const cc = p.childsCount;
    if (cc === 0) {
        p.frame.set(0, 0, 0, 0);
        return;
    }
    const c = p.getChildByIndex(0);
    const cf = c.frame;
    let l = cf.x, t = cf.y, r = l + cf.width, b = t + cf.height;
    for (let i = 1; i < cc; i++) {
        const c = p.getChildByIndex(i);
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
    pf.set(pf.x + l, pf.y + t, r - l, b - t);
    // console.log(pf)

    for (let i = 0; i < cc; i++) {
        const c = p.getChildByIndex(i);
        const cf = c.frame;
        cf.set(cf.x - l, cf.y - t, cf.width, cf.height);
        // console.log("c", i, cf)
    }
}

export async function importPage(lzData:LzData, ref: string, symMgr: SymsMgr, mediaMgr: MediaMgr): Promise<Page> {
    
    const data: IJSON = await lzData.load(ref);
    Object.freeze(data);
    const id: string = data['do_objectID'];
    const env = new Env(id, symMgr, mediaMgr);
    const page: Page = importShape(env, undefined, lzData, data) as Page;
    // page.initGradients(env.gradients);
    // page.updateFrame();
    updatePageFrame(page);

    return page;
}
