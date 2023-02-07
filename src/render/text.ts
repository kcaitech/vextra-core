import { TextShape } from "@/data/shape";
import { TextVerticalAlignment } from "@/data/text";

// https://zhuanlan.zhihu.com/p/338634062
const getCanvas = (() => {
    let canvas: HTMLCanvasElement | undefined;
    return () => {
        if (!canvas) canvas = document.createElement("canvas");
        return canvas;
    }
})();

function getTextWidth(text: string, font: string): number {
    // re-use canvas object for better performance
    const canvas = getCanvas();
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

export function render(h: Function, shape: TextShape, reflush?: number) {
    const text = shape.text;
    const pc = text.paraCount;
    const vAlign = text.defaultAttr?.verticalAlignment ?? TextVerticalAlignment.Top;
    // const baseline: string = ((align: TextVerticalAlignment) => {
    //     switch(align) {
    //         case TextVerticalAlignment.Top: return "hanging";
    //         case TextVerticalAlignment.Middle: return "middle";
    //         case TextVerticalAlignment.Bottom: return "baseline";
    //     }
    // })(vAlign);
    const childs = [];
    let y = 0;
    for (let i = 0; i < pc; i++) {
        const para = text.getParaByIndex(i);
        const paraText = para.text;
        const sc = para.spansCount;
        const pAttr = para.defaultAttr;
        let lineHeight = pAttr && pAttr.minimumLineHeight || 0;

        if (pAttr && pAttr.maximumLineHeight === pAttr.minimumLineHeight) {
            lineHeight = pAttr.minimumLineHeight;
        }
        else {
            for (let j = 0; j < sc; j++) {
                const span = para.getSpanByIndex(j);
                const size: number = span.fontSize || 0;
                lineHeight = Math.max(lineHeight, size);
            }
            if (pAttr && lineHeight > pAttr.maximumLineHeight) {
                lineHeight = pAttr.maximumLineHeight;
            }
        }

        y = y + lineHeight / 2;
        let x = 0;
        let index = 0;
        for (let j = 0; j < sc;) {
            const span = para.getSpanByIndex(j);
            const text = paraText.substring(index, index + span.length);
            const font = "normal " + span.fontSize + "px " + span.fontName;
            childs.push(h('text', { x, y, style: { fill: span.color?.toRGBA(), font, 'alignment-baseline': 'middle' } }, text));
            j++;
            if (j < sc) {
                index = index + span.length;
                x = x + getTextWidth(text, font);
            }
        }
        y = y + lineHeight / 2;
    }
    const frame = shape.frame;
    // childs.push(h('rect', { "fill-opacity": 0, stroke: 'gray', 'stroke-width': 1, x: 0, y: 0, width: frame.width, height: frame.height}))
    return h('g', { transform: 'translate(' + frame.x + ',' + frame.y + ')' , reflush}, childs);
}