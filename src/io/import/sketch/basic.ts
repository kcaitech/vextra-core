import { Shape } from "../../../data/shape";

export interface IJSON {
    [key: string]: any
}

export class LoadContext {
    shapeIds: Set<string> = new Set();
}

export type ImportFun = (ctx: LoadContext, data: IJSON) => Shape
