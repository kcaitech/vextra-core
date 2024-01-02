import { ShapeType, SymbolRefShape, SymbolShape, TableCell, TableShape, Variable } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { isVisible } from "./basic";

export function render(h: Function, shape: TableShape, comsMap: Map<ShapeType, any>, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    bubbleupdate?: () => void,
    reflush?: number): any {

    if (!isVisible(shape, varsContainer)) return;

    const frame = shape.frame;

    const layout = shape.getLayout();

    const nodes = [];
    const path = shape.getPath().toString();

    // table fill
    nodes.push(...fillR(h, shape.style.fills, frame, path));

    // cells fill & content
    for (let i = 0, len = layout.grid.rowCount; i < len; ++i) {
        for (let j = 0, len = layout.grid.colCount; j < len; ++j) {
            const cellLayout = layout.grid.get(i, j);
            const cell = shape.getCellAt(cellLayout.index.row, cellLayout.index.col);
            if (cell && cellLayout.index.row === i && cellLayout.index.col === j) {
                const com = comsMap.get(cell.type) || comsMap.get(ShapeType.Rectangle);
                const node = h(com, { data: cell, key: cell.id, frame: cellLayout.frame, varsContainer, bubbleupdate });
                nodes.push(node);
            }
        }
    }

    // border
    const cell_border_nodes = [];
    nodes.push(...borderR(h, shape.style.borders, frame, path));
    for (let i = 0, len = layout.grid.rowCount; i < len; ++i) {
        for (let j = 0, len = layout.grid.colCount; j < len; ++j) {
            const cellLayout = layout.grid.get(i, j);
            if (cellLayout.index.row !== i || cellLayout.index.col !== j) continue;

            const child = shape.getCellAt(cellLayout.index.row, cellLayout.index.col);// cellLayout.cell;
            const path = TableCell.getPathOfFrame(cellLayout.frame);
            const pathstr = path.toString();
            if (child && child.style.borders.length > 0) {
                const style = child.style
                const border = borderR(h, style.borders, cellLayout.frame, pathstr)
                cell_border_nodes.push(h("g", { transform: `translate(${cellLayout.frame.x},${cellLayout.frame.y})` }, border));
            }
            else {
                const style = shape.style;
                const border = borderR(h, style.borders, cellLayout.frame, pathstr)
                nodes.push(h("g", { transform: `translate(${cellLayout.frame.x},${cellLayout.frame.y})` }, border));
            }
        }
    }
    // 单元格的边框要后画
    nodes.push(...cell_border_nodes);

    const props: any = {}
    if (reflush) props.reflush = reflush;
    if (shape.isFlippedHorizontal || shape.isFlippedVertical || shape.rotation) {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (shape.isFlippedHorizontal) style.transform += "rotateY(180deg) "
        if (shape.isFlippedVertical) style.transform += "rotateX(180deg) "
        if (shape.rotation) style.transform += "rotate(" + shape.rotation + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
    }
    else {
        props.transform = `translate(${frame.x},${frame.y})`;
    }
    return h('g', props, nodes);
}