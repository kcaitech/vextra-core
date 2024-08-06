// platform abstract layer

export type MeasureFun = (code: string, font: string) => TextMetrics | undefined;

// export interface IZip {
//     entryDataJson(entry: string): Promise<{ [key: string]: any }>;
//     entryData(entry: string): Promise<Uint8Array>;
//     close(): void;
//     on(event: 'ready', handler: () => void): void;
//     on(event: 'error', handler: (error: any) => void): void;
// }

type BOPFun = (path0: string, path1: string) => string;
export type BoolOpFuns = {
    difference: BOPFun,
    intersection: BOPFun,
    subtract: BOPFun,
    union: BOPFun,
    stroke(ops?: StrokeOpts): string;
}

export type TextPathFun = (font: string, fontSize: number, italic: boolean, weight: number, charCode: number) => string;

enum Join {
    "MITER",
    "ROUND",
    "BEVEL"
}

enum Cap {
    "BUTT",
    "ROUND",
    "SQUARE",
}

export interface StrokeOpts {
    // Default values are set in chaining.js which allows clients
    // to set any number of them. Otherwise, the binding code complains if
    // any are omitted.
    width?: number;
    miter_limit?: number;
    res_scale?: number;
    join?: Join;
    cap?: Cap;
};

export interface IPalPath {
    difference(path: IPalPath): boolean,
    intersection(path: IPalPath): boolean,
    subtract(path: IPalPath): boolean,
    union(path: IPalPath): boolean
    addPath(path: IPalPath): boolean
    toSVGString(): string;
    delete(): void;
    stroke(ops?: StrokeOpts): string;
    dash(on: number, off: number, phase: number): boolean;
}

export const gPal: {
    text: {
        textMeasure: MeasureFun,
        getTextPath: TextPathFun,
    },
    boolop: BoolOpFuns,
    makePalPath: (path: string) => IPalPath
} = {
    text: {
        textMeasure: (code: string, font: string) => undefined,
        getTextPath: (font: string, fontSize: number, italic: boolean, weight: number, charCode: number) => "",
    },
    boolop: {
        difference: (path0: string, path1: string) => "",
        intersection: (path0: string, path1: string) => "",
        subtract: (path0: string, path1: string) => "",
        union: (path0: string, path1: string) => "",
        stroke: () => ""
    },
    makePalPath: (path: string): IPalPath => {
        throw new Error("not implemented")
    }
}
