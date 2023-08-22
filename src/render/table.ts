import { TableShape } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { render as rCell } from "./tablecell";

export function render(h: Function, shape: TableShape, reflush?: number): any {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;
    const frame = shape.frame;

    const layout = shape.getLayout();

    const nodes = [];
    const path = shape.getPath().toString();

    // fill & content
    for (let i = 0, len = layout.grid.rowCount; i < len; ++i) {

        for (let j = 0, len = layout.grid.colCount; j < len; ++j) {
            const cellLayout = layout.grid.get(i, j);
            if (cellLayout.index.row === i && cellLayout.index.col === j) {
                const path = cellLayout.cell.getPathOfFrame(cellLayout.frame);
                const pathstr = path.toString();
                const child = cellLayout.cell;
                const fill = fillR(h, child.style.fills, cellLayout.frame, pathstr);
                nodes.push(h("g", { transform: `translate(${cellLayout.frame.x},${cellLayout.frame.y})` }, fill));

                // content
                nodes.push(rCell(h, child, cellLayout.frame));
            }
        }
    }

    // border
    nodes.push(...borderR(h, shape.style.borders, frame, path));
    for (let i = 0, len = layout.grid.rowCount; i < len; ++i) {

        for (let j = 0, len = layout.grid.colCount; j < len; ++j) {
            const cellLayout = layout.grid.get(i, j);
            if (cellLayout.index.row === i && cellLayout.index.col === j) {
                const path = cellLayout.cell.getPathOfFrame(cellLayout.frame);
                const pathstr = path.toString();
                const child = cellLayout.cell;
                const style = child.style.borders.length > 0 ? child.style : shape.style;
                const border = borderR(h, style.borders, cellLayout.frame, pathstr)
                nodes.push(h("g", { transform: `translate(${cellLayout.frame.x},${cellLayout.frame.y})` }, border));
            }
        }
    }

    const props: any = {}
    if (reflush) props.reflush = reflush;
    // if (shape.isFlippedHorizontal || shape.isFlippedVertical || shape.rotation) {
    //     const cx = frame.x + frame.width / 2;
    //     const cy = frame.y + frame.height / 2;
    //     const style: any = {}
    //     style.transform = "translate(" + cx + "px," + cy + "px) "
    //     if (shape.isFlippedHorizontal) style.transform += "rotateY(180deg) "
    //     if (shape.isFlippedVertical) style.transform += "rotateX(180deg) "
    //     if (shape.rotation) style.transform += "rotate(" + shape.rotation + "deg) "
    //     style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
    //     props.style = style;
    // }
    // else {
    //     props.transform = `translate(${frame.x},${frame.y})`
    // }
    props.transform = `translate(${frame.x},${frame.y})`;
    return h('g', props, nodes);
}