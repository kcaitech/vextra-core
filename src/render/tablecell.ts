import { ShapeFrame } from "../data/typesdefine";
import { TableCell, TableCellType } from "../data/classes";
import { renderTextLayout } from "./text";

export function render(h: Function, shape: TableCell, frame: ShapeFrame): any {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;

    const cellType = shape.cellType ?? TableCellType.None;
    if (cellType === TableCellType.None) return;

    const childs = [];
    if (cellType === TableCellType.Image) {
        const url = shape.peekImage(true);

        const img = h("image", {
            'xlink:href': url,
            width: frame.width,
            height: frame.height,
            x: 0,
            y: 0,
            'preserveAspectRatio': 'xMidYMid meet'
        });
        childs.push(img);
    }
    else if (cellType === TableCellType.Text) {
        const layout = shape.getLayout();
        if (layout) childs.push(...renderTextLayout(h, layout))
    }

    const props = { transform: `translate(${frame.x},${frame.y})` }

    return h('g', props, childs);
}