import { ShapeFrame, SymbolRefShape, SymbolShape } from "../data/classes";
import { TableCell, TableCellType } from "../data/classes";
import { renderTextLayout } from "./text";
import { render as fillR } from "./fill";
import { TextLayout } from "../data/textlayout";

export function render(h: Function, shape: TableCell, frame: ShapeFrame, imgPH: string, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, 
    layout: TextLayout | undefined,
    reflush?: number): any {
    // const isVisible = shape.isVisible ?? true;
    // if (!isVisible) return;

    const path = TableCell.getPathOfFrame(frame).toString();
    const childs = [];

    // fill
    childs.push(...fillR(h, shape.style.fills, frame, path));

    const cellType = shape.cellType ?? TableCellType.None;
    if (cellType === TableCellType.None) return;

    if (cellType === TableCellType.Image) {
        const url = shape.peekImage(true);

        const img = h("image", {
            'xlink:href': url ?? imgPH,
            width: frame.width,
            height: frame.height,
            x: 0,
            y: 0,
            'preserveAspectRatio': 'xMidYMid meet'
        });
        childs.push(img);
    } else if (cellType === TableCellType.Text) {
        // const layout = shape.getLayout();
        if (layout) childs.push(...renderTextLayout(h, layout));
    }

    const props = { transform: `translate(${frame.x},${frame.y})`, reflush }

    return h('g', props, childs);
}