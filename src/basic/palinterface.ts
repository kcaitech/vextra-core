// platform abstract layer interfaces

export type MeasureFun = (code: number, font: string) => TextMetrics | undefined;

export interface IZip {
    entryDataJson(entry: string): Promise<{ [key: string]: any }>;
    entryData(entry: string): Promise<Uint8Array>;
    close(): void;
    on(event: 'ready', handler: () => void): void;
    on(event: 'error', handler: (error: any) => void): void;
}

type BOPFun = (path0: string, path1: string) => string;
export type BoolOpFuns = {
    difference: BOPFun,
    intersection: BOPFun,
    subtract: BOPFun,
    union: BOPFun
}
