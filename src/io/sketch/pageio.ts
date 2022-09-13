import { Page } from "@/data/page";
import { Env } from "./envio";
import { importShape } from "./shapeio";
import { IJSON } from "./styleio";
import { LzData } from "@/data/lzdata";
import { ISymbolManager } from "@/data/shape";

export async function importPage(lzData:LzData, ref: string, symMgr: ISymbolManager): Promise<Page> {
    const env = new Env(symMgr);

    const buffer: Buffer = await lzData.load(ref);
	const data: IJSON = JSON.parse(buffer.toString());

    const page: Page = importShape(env, undefined, lzData, data) as Page;
    // page.initGradients(env.gradients);

    return page;
}
