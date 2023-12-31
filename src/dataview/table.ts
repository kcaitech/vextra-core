import { renderBorders } from "../render";
import { Shape, ShapeType, SymbolRefShape, SymbolShape, TableCell, TableGridItem, TableShape } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";
import { locateCell, locateCellIndex } from "../data/tablelocate";
import { TableCellView } from "./tablecell";
import { RenderTransform } from "./basic";

export class TableView extends ShapeView {

    private m_cells: Map<string, TableCellView> = new Map();

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props, false);
        this.updateChildren();
        this._bubblewatcher = this._bubblewatcher.bind(this);
        this.m_data.bubblewatch(this._bubblewatcher);
        this.afterInit();
    }

    get data(): TableShape {
        return this.m_data as TableShape;
    }

    get cells(): Map<string, TableCellView> {
        return this.m_cells;
    }

    protected _bubblewatcher(...args: any[]) {
        // this.onChildChange(...args);
        if (args.includes('borders')) this.m_ctx.setDirty(this);
    }

    onDestory(): void {
        super.onDestory();
        this.m_data.bubbleunwatch(this._bubblewatcher);
    }

    // protected onChildChange(...args: any[]) {
    // }

    protected isNoSupportDiamondScale(): boolean {
        return true;
    }

    getDataChilds(): Shape[] {
        return [];
    }

    private m_need_updatechilds: boolean = false;

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        // if (args.includes('cells')) 
        this.m_need_updatechilds = true;
    }

    // 单元格不展示
    get naviChilds(): ShapeView[] | undefined {
        return undefined;
    }

    protected _layout(shape: Shape, transform: RenderTransform | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): void {
        super._layout(shape, transform, varsContainer);
        if (this.m_need_updatechilds) {
            this.m_need_updatechilds = false;
            this.updateChildren();
        }
    }

    // todo table支持组件，直接override shape? 或者至少要datas & rowHeights & colWidths
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
                    const props = { data: cell, transx: this.m_transx, varsContainer: this.varsContainer, frame: cellLayout.frame, isVirtual: this.m_isVirtual };
                    if (cdom) {
                        reuse.delete(cell.id);
                        this.moveChild(cdom, idx);
                        cdom.layout(props);
                    } else {
                        // const comsMap = this.m_ctx.comsMap;
                        const Com = comsMap.get(cell.type) || comsMap.get(ShapeType.Rectangle)!;
                        const ins = new Com(this.m_ctx, props) as DataView;
                        this.addChild(ins, idx);
                        this.m_cells.set(ins.id, ins as TableCellView);
                    }
                    ++idx;
                }
            }
        }
        if (this.m_children.length > idx) {
            this.removeChilds(idx, this.m_children.length - idx).forEach((c) => {
                this.m_cells.delete(c.id);
                c.destory();
            });
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

    getVisibleCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
        return this.data.getVisibleCells(rowStart, rowEnd, colStart, colEnd);
    }

    getCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
        return this.data.getCells(rowStart, rowEnd, colStart, colEnd);
    }

    getLayout() {
        return this.data.getLayout();
    }

    locateCell(x: number, y: number): (TableGridItem & { cell: TableCell | undefined }) | undefined {
        const item = locateCell(this.getLayout(), x, y) as (TableGridItem & { cell: TableCell | undefined }) | undefined;
        if (item) item.cell = this.data.getCellAt(item.index.row, item.index.col);
        return item;
    }

    locateCellIndex(x: number, y: number): { row: number, col: number } | undefined {
        return locateCellIndex(this.getLayout(), x, y);
    }

    locateCell2(cell: TableCell): (TableGridItem & { cell: TableCell | undefined }) | undefined {
        return this.data.locateCell2(cell);
    }

    indexOfCell(cell: TableCell | TableCellView): { rowIdx: number, colIdx: number, visible: boolean } | undefined {
        return cell instanceof TableCellView ? this.data.indexOfCell(cell.data) : this.data.indexOfCell(cell);
    }
}