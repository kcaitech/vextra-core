import { TableCell, TableShape } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { render as rCell } from "./tablecell";
import { innerShadowId, render as shadowR } from "./shadow";

export function render(h: Function, shape: TableShape, reflush?: number): any {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;
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
                const path = TableCell.getPathOfFrame(cellLayout.frame);
                const pathstr = path.toString();
                const child = cell;
                const fill = fillR(h, child.style.fills, cellLayout.frame, pathstr);
                nodes.push(h("g", { transform: `translate(${cellLayout.frame.x},${cellLayout.frame.y})` }, fill));

                // content
                nodes.push(rCell(h, child, cellLayout.frame));
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
    const shadows = shape.style.shadows;
        const ex_props = Object.assign({}, props);
        const shape_id = shape.id.slice(0, 4);
        const shadow = shadowR(h, shape.style, frame, shape_id, path, shape);
        if (shadow.length) {
            delete props.style;
            delete props.transform;
            const inner_url = innerShadowId(shape_id, shadows);
            if(shadows.length) props.filter = `${inner_url} url(#dorp-shadow-${shape_id})`;
            const body = h("g", props, nodes);
            return h("g", ex_props, [...shadow, body]);
        } else {
            return h('g', props, nodes);
        }
}