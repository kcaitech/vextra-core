import { MeasureFun } from "../../../data/textlayout";
import { Shape } from "../../../data/shape";
import { ResourceMgr } from "../../../data/basic";

export interface IJSON {
    [key: string]: any
}

export class LoadContext {
    shapeIds: Set<string> = new Set();
    measureFun: MeasureFun;
    mediasMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    constructor(measureFun: MeasureFun, mediasMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.measureFun = measureFun;
        this.mediasMgr = mediasMgr;
    }
}

export type ImportFun = (ctx: LoadContext, data: IJSON) => Shape
