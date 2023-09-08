import { OverrideShape, ShapeFrame } from "../data/classes";
import { TableCell, TableCellType } from "../data/classes";
import { renderTextLayout } from "./text";
import { render as fillR } from "./fill";

export function render(h: Function, shape: TableCell, frame: ShapeFrame, imgPH: string, override: OverrideShape | undefined, reflush?: number): any {
    // const isVisible = shape.isVisible ?? true;
    // if (!isVisible) return;

    const path = TableCell.getPathOfFrame(frame).toString();
    const childs = [];

    // fill
    if (override && override.override_fills) {
        childs.push(...fillR(h, override.style.fills, frame, path));
    }
    else {
        childs.push(...fillR(h, shape.style.fills, frame, path));
    }

    const cellType = shape.cellType ?? TableCellType.None;
    if (cellType === TableCellType.None) return;

    if (cellType === TableCellType.Image) {
        const url = (override && override.override_image ? override?.peekImage(true) : shape.peekImage(true)) ?? imgPH;

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
        if (override && override.override_text) {
            const layout = override.getLayout(shape);
            if (layout) childs.push(...renderTextLayout(h, layout))
        }
        else {
            const layout = shape.getLayout();
            if (layout) childs.push(...renderTextLayout(h, layout))
        }
    }

    const props = { transform: `translate(${frame.x},${frame.y})`, reflush }

    return h('g', props, childs);
}