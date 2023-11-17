// platform abstract layer

export type MeasureFun = (code: number, font: string) => TextMetrics | undefined;

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
    union: BOPFun
}

export type TextPathFun = (font: string, fontSize: number, charCode: number) => string;

export interface IPalPath {
    difference(path: IPalPath): boolean,
    intersection(path: IPalPath): boolean,
    subtract(path: IPalPath): boolean,
    union(path: IPalPath): boolean
    addPath(path: IPalPath): boolean
    toSVGString(): string;
    delete(): void;
}

export const gPal: {
    text: {
        textMeasure: MeasureFun,
        getTextPath: TextPathFun,
    },
    boolop: BoolOpFuns,
    makePalPath: (path: string) => IPalPath,
} = {
    text: {
        textMeasure: (code: number, font: string) => undefined,
        getTextPath: (font: string, fontSize: number, charCode: number) => "",
    },
    boolop: {
        difference: (path0: string, path1: string) => "",
        intersection: (path0: string, path1: string) => "",
        subtract: (path0: string, path1: string) => "",
        union: (path0: string, path1: string) => ""
    },
    makePalPath: (path: string): IPalPath => {
        throw new Error("not implemented")
    }
}
