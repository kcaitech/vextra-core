import { MediaMgr, SymsMgr } from "@/data/data/document";
import { IJSON, LzData } from "@/data/data/lzdata";
import { Page } from "@/data/data/page";
import { Env } from "./env";
import { importShape } from "./shape";

export async function importPage(lzData: LzData, ref: string, symMgr: SymsMgr, mediaMgr: MediaMgr): Promise<Page> {

    const data: IJSON = await lzData.load(ref);
    return importPageFromData(lzData, data, symMgr, mediaMgr);
}

export function importPageFromData(lzData: LzData, data: IJSON, symMgr: SymsMgr, mediaMgr: MediaMgr): Page {

    // const data: IJSON = await lzData.load(ref);
    const id: string = data['id'];
    const env = new Env(id, symMgr, mediaMgr);
    const page: Page = importShape(env, undefined, lzData, data) as Page;
    // page.initGradients(env.gradients);
    // page.updateFrame();
    // updatePageFrame(page);

    return page;
}