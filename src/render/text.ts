import { TextShape } from "@/data/data/shape";
import { TextBehaviour } from "@/data/data/text";
import { layoutPara } from "@/layout/text";

export function render(h: Function, shape: TextShape, reflush?: number) {
    const text = shape.text;
    const pc = text.paraCount;
    // const vAlign = text.attr?.verticalAlignment ?? TextVerticalAlignment.Top;
    // const baseline: string = ((align: TextVerticalAlignment) => {
    //     switch(align) {
    //         case TextVerticalAlignment.Top: return "hanging";
    //         case TextVerticalAlignment.Middle: return "middle";
    //         case TextVerticalAlignment.Bottom: return "baseline";
    //     }
    // })(vAlign);

    const frame = shape.frame;
    const layoutWidth = ((b: TextBehaviour) => {
        switch(b) {
            case TextBehaviour.Flexible: return Number.MAX_VALUE;
            case TextBehaviour.Fixed: return frame.width;
            case TextBehaviour.FixedWidthAndHeight: return frame.width;
        }
    })(text.attr?.textBehaviour ?? TextBehaviour.Flexible)

    const childs = [];
    let y = 0;

    for (let i = 0; i < pc; i++) {
        const para = text.getParaByIndex(i);
        const layouts = layoutPara(para, layoutWidth);
        const pAttr = para.attr;

        for (let lineIndex = 0, lineCount = layouts.length; lineIndex < lineCount; lineIndex++) {
            const line = layouts[lineIndex];
            let lineHeight = pAttr && pAttr.minimumLineHeight || 0;
            if (pAttr && pAttr.maximumLineHeight === pAttr.minimumLineHeight) {
                lineHeight = pAttr.minimumLineHeight;
            }
            else {
                lineHeight = line.maxFontSize;
            }
            const halfLH = lineHeight / 2;
            y = y + halfLH;

            for (let garrIdx = 0, garrCount = line.length; garrIdx < garrCount; garrIdx++) {
                const gText = []
                const gX = []
                // const gY = []
                const garr = line[garrIdx];

                for (let gIdx = 0, gCount = garr.length; gIdx < gCount; gIdx++) {
                    const graph = garr[gIdx];
                    gText.push(graph.char);
                    gX.push(graph.x);
                    // gY.push(y);
                }

                const span = garr.attr;

                const font = "normal " + (span?.fontSize || 0) + "px " + (span?.fontName);
                childs.push(h('text', { x: gX.join(' '), y, style: { fill: span?.color?.toRGBA(), font, 'alignment-baseline': 'middle' } }, gText.join('')));
            }

            y = y + halfLH;
        }
    }

    return h('g', { transform: 'translate(' + frame.x + ',' + frame.y + ')' , reflush}, childs);
}