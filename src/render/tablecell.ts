import { OverrideShape, ShapeFrame, SymbolRefShape } from "../data/classes";
import { TableCell, TableCellType } from "../data/classes";
import { renderTextLayout } from "./text";
import { render as fillR } from "./fill";
import { OverrideType, findOverride } from "../data/symproxy";

export function render(h: Function, shape: TableCell, frame: ShapeFrame, imgPH: string, overrides: SymbolRefShape[] | undefined, consumeOverride: OverrideShape[] | undefined, reflush?: number): any {
    // const isVisible = shape.isVisible ?? true;
    // if (!isVisible) return;

    const path = TableCell.getPathOfFrame(frame).toString();
    const childs = [];

    // fill
    if (overrides) {
        const o = findOverride(overrides, shape.id, OverrideType.Fills);
        if (o) {
            childs.push(...fillR(h, o.override.style.fills, frame, path));
            if (consumeOverride) consumeOverride.push(o.override);
        }
        else {
            childs.push(...fillR(h, shape.style.fills, frame, path));
        }
    }
    else {
        childs.push(...fillR(h, shape.style.fills, frame, path));
    }

    const cellType = shape.cellType ?? TableCellType.None;
    if (cellType === TableCellType.None) return;

    if (cellType === TableCellType.Image) {
        let url;
        if (overrides) {
            const o = findOverride(overrides, shape.id, OverrideType.Image);
            if (o) {
                url = o.override.peekImage(true);
                if (consumeOverride) consumeOverride.push(o.override);
            }
            else {
                url = shape.peekImage(true);
            }
        }
        else {
            url = shape.peekImage(true);
        }

        const img = h("image", {
            'xlink:href': url ?? imgPH,
            width: frame.width,
            height: frame.height,
            x: 0,
            y: 0,
            'preserveAspectRatio': 'xMidYMid meet'
        });
        childs.push(img);
    }
    else if (cellType === TableCellType.Text) {
        if (overrides) {
            const o = findOverride(overrides, shape.id, OverrideType.Text);
            if (o) {
                const layout = o.override.getLayout(shape);
                if (layout) childs.push(...renderTextLayout(h, layout))
                if (consumeOverride) consumeOverride.push(o.override);
            }
            else {
                const layout = shape.getLayout();
                if (layout) childs.push(...renderTextLayout(h, layout));
            }
        }
        else {
            const layout = shape.getLayout();
            if (layout) childs.push(...renderTextLayout(h, layout));
        }
    }

    const props = { transform: `translate(${frame.x},${frame.y})`, reflush }

    return h('g', props, childs);
}