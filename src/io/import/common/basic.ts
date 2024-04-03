import { Shape } from "../../../data/shape";
import { ResourceMgr } from "../../../data/basic";

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
