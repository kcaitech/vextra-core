import { renderBorders } from "../render";
import { Shape, ShapeType, TableCell, TableShape } from "../data/classes";
import { EL, elh } from "./el";
import { GroupShapeView } from "./groupshape";
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";

export class TableView extends GroupShapeView {

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.updateChildren();
    }

    getDataChilds(): Shape[] {
        return [];
    }

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        if (args.includes('cells')) this.m_need_updatechilds = true;
    }

    protected updateChildren(): void {

        const reuse = new Map<string, DataView>();
        this.m_children.forEach((c) => {
            reuse.set(c.m_data.id, c);
        });

        const shape = this.m_data as TableShape;
        const comsMap = this.m_ctx.comsMap;
        const layout = shape.getLayout();

        let idx = 0;
        for (let i = 0, len = layout.grid.rowCount; i < len; ++i) {
            for (let j = 0, len = layout.grid.colCount; j < len; ++j) {
                const cellLayout = layout.grid.get(i, j);
                const cell = shape.getCellAt(cellLayout.index.row, cellLayout.index.col);
                if (cell && cellLayout.index.row === i && cellLayout.index.col === j) {
                    const cdom = reuse.get(cell.id);
                    if (cdom) {
                        reuse.delete(cell.id);
                        this.moveChild(cdom, idx);
                    } else {
                        // const comsMap = this.m_ctx.comsMap;
                        const Com = comsMap.get(cell.type) || comsMap.get(ShapeType.Rectangle)!;
                        const props = { data: cell,  transx: this.m_transx, varsContainer: this.m_varsContainer, frame: cellLayout.frame, isVirtual: this.m_isVirtual };
                        const ins = new Com(this.m_ctx, props) as DataView;
                        this.addChild(ins, idx);
                    }
                    ++idx;
                }
            }
        }
        if (this.m_children.length > idx) {
            this.removeChilds(idx, this.m_children.length - idx);
        }
    }

    protected renderBorders(): EL[] {
        const shape = this.m_data as TableShape;
        const layout = shape.getLayout();
        const cell_border_nodes = [];
        const nodes = renderBorders(elh, this.getBorders(), this.frame, this.getPathStr());
        for (let i = 0, len = layout.grid.rowCount; i < len; ++i) {
            for (let j = 0, len = layout.grid.colCount; j < len; ++j) {
                const cellLayout = layout.grid.get(i, j);
                if (cellLayout.index.row !== i || cellLayout.index.col !== j) continue;
                const child = shape.getCellAt(cellLayout.index.row, cellLayout.index.col);// cellLayout.cell;
                const path = TableCell.getPathOfFrame(cellLayout.frame);
                const pathstr = path.toString();
                if (child && child.style.borders.length > 0) {
                    const style = child.style
                    const border = renderBorders(elh, style.borders, cellLayout.frame, pathstr)
                    cell_border_nodes.push(elh("g", { transform: `translate(${cellLayout.frame.x},${cellLayout.frame.y})` }, border));
                }
                else {
                    const style = shape.style;
                    const border = renderBorders(elh, style.borders, cellLayout.frame, pathstr)
                    nodes.push(elh("g", { transform: `translate(${cellLayout.frame.x},${cellLayout.frame.y})` }, border));
                }
            }
        }
        // 单元格的边框要后画
        nodes.push(...cell_border_nodes);
        return nodes;
    }
}