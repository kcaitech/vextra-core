import { GroupShape, Page, Shape, Style, TextBehaviour, TextShape } from "../data/classes";

interface _Api {
    shapeModifyWH(page: Page, shape: Shape, w: number, h: number): void;
}
const defaultFontSize = 12;
export function fixTextShapeFrameByLayout(api: _Api, page: Page, shape: TextShape) {
    const textBehaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    switch (textBehaviour) {
        case TextBehaviour.FixWidthAndHeight: break;
        case TextBehaviour.Fixed:
            {
                const layout = shape.getLayout();
                const fontsize = shape.text.attr?.fontSize ?? defaultFontSize;
                api.shapeModifyWH(page, shape, shape.frame.width, Math.max(fontsize, layout.contentHeight));
                break;
            }
        case TextBehaviour.Flexible:
            {
                const layout = shape.getLayout();
                const fontsize = shape.text.attr?.fontSize ?? defaultFontSize;
                api.shapeModifyWH(page, shape, Math.max(fontsize, layout.contentWidth), Math.max(fontsize, layout.contentHeight));
                break;
            }
    }
}