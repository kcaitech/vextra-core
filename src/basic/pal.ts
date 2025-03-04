// platform abstract layer

export type MeasureFun = (code: string, font: string) => TextMetrics | undefined;

export type TextPathFun = (font: string, fontSize: number, italic: boolean, weight: number, charCode: number) => string;

export const gPal: {
    text: {
        textMeasure: MeasureFun,
        getTextPath: TextPathFun,
    }
} = {
    text: {
        textMeasure: (code: string, font: string) => undefined,
        getTextPath: (font: string, fontSize: number, italic: boolean, weight: number, charCode: number) => "",
    },
}
