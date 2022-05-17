import { Page } from "@/data/page";
import { Env } from "./envio";
import { importShape } from "./shapeio";
import { IJSON } from "./styleio";
import { LzData } from "@/data/lzdata";

export async function importPage(lzData:LzData, ref: string): Promise<Page> {
    const env = new Env();

    const buffer: Buffer = await lzData.load(ref);
	const data: IJSON = JSON.parse(buffer.toString());
		
    const page: Page = importShape(Page, env, undefined, lzData, data);
    page.initGradients(env.gradients);

    return page;
}
