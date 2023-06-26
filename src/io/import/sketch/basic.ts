import { MeasureFun } from "../../../data/textlayout";
import { Shape } from "../../../data/shape";

export interface IJSON {
    [key: string]: any
}

export class LoadContext {
    shapeIds: Set<string> = new Set();
    measureFun: MeasureFun;
    constructor(measureFun: MeasureFun) {
        this.measureFun = measureFun;
    }
}

export type ImportFun = (ctx: LoadContext, data: IJSON) => Shape
