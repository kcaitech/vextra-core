import { renderBorders } from "../render";
import { OverrideType, Shape, ShapeFrame, ShapeType, Style, SymbolRefShape, SymbolShape, TableCell, TableCellType, TableGridItem, TableLayout, TableShape } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";
import { locateCell, locateCellIndex } from "../data/tablelocate";
import { TableCellView } from "./tablecell";
import { RenderTransform, findOverride, getShapeViewId } from "./basic";
import { layoutTable } from "../data/tablelayout";
import { getTableCells, getTableVisibleCells } from "../data/tableread";
import { BasicArray } from "../data/basic";
import { newTableCellText } from "../data/textutils";

export class TableView extends ShapeView {

    private m_cells: Map<string, TableCellView> = new Map();

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props, false);
        this.updateChildren();
        // this._bubblewatcher = this._bubblewatcher.bind(this);
        // this.m_data.bubblewatch(this._bubblewatcher);
        this.afterInit();
    }

    get data(): TableShape {
        return this.m_data as TableShape;
    }

    get cells(): Map<string, TableCellView> {
        return this.m_cells;
    }

    bubblewatcher(...args: any[]) {
        if (args.includes('text')) {
            return;
        }
        if (args.includes('rowSpan') || args.includes('colSpan')) this.m_layout = undefined;
        this.updateChildren();
        this.m_ctx.setDirty(this);
    }

    // onDestory(): void {
    //     super.onDestory();
    //     this.m_data.bubbleunwatch(this._bubblewatcher);
    // }

    // protected onChildChange(...args: any[]) {
    // }

    protected isNoSupportDiamondScale(): boolean {
        return this.m_data.isNoSupportDiamondScale;
    }

    getDataChilds(): Shape[] {
        return [];
    }

    // private m_need_updatechilds: boolean = false;

    private m_layout: TableLayout | undefined;
    private m_savewidth: number = 0;
    private m_saveheight: number = 0;
    // private __heightTotalWeights: number;
    // private __widthTotalWeights: number;

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        // if (args.includes('cells')) 
        // this.m_need_updatechilds = true;
        if (args.includes('rowHeights') || args.includes('colWidths') || args.includes('variables')) this.m_layout = undefined;
    }

    // 单元格不展示
    get naviChilds(): ShapeView[] | undefined {
        return undefined;
    }

    protected _layout(shape: Shape, transform: RenderTransform | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): void {

        super._layout(shape, transform, varsContainer);
        // if (this.m_need_updatechilds) {
        //     this.m_need_updatechilds = false;
        this.updateChildren();
        // }
    }

    _getCellAt2(rowIdx: number, colIdx: number): TableCell | undefined {
        if (rowIdx < 0 || colIdx < 0 || rowIdx >= this.rowCount || colIdx >= this.colCount) {
            throw new Error("cell index outof range: " + rowIdx + " " + colIdx)
        }
        const cellId = this.rowHeights[rowIdx].id + "," + this.colWidths[colIdx].id;
        const refId = this.data.id + '/' + cellId;
        const _vars = findOverride(refId, OverrideType.TableCell, this.varsContainer || []);
        if (_vars && _vars.length > 0) {
            return _vars[_vars.length - 1].value;
        }
        return this.data.cells.get(cellId);
    }

    _getCellAt(rowIdx: number, colIdx: number): TableCell {
        if (rowIdx < 0 || colIdx < 0 || rowIdx >= this.rowCount || colIdx >= this.colCount) {
            throw new Error("cell index outof range: " + rowIdx + " " + colIdx)
        }
        const cellId = this.rowHeights[rowIdx].id + "," + this.colWidths[colIdx].id;
        const refId = this.data.id + '/' + cellId;
        const _vars = findOverride(refId, OverrideType.TableCell, this.varsContainer || []);
        if (_vars && _vars.length > 0) {
            return _vars[_vars.length - 1].value;
        }
        let cell = this.data.cells.get(cellId);
        if (cell) return cell;

        // 构造一个

        cell = new TableCell(new BasicArray(),
            cellId,
            "",
            ShapeType.TableCell,
            new ShapeFrame(0, 0, 0, 0),
            new Style(new BasicArray(), new BasicArray(), new BasicArray()),
            TableCellType.Text,
            newTableCellText(this.data.textAttr));

        return cell;
    }

    getLayout(): TableLayout {
        const frame = this.frame;
        if (this.m_layout && this.m_saveheight === frame.height && this.m_savewidth === frame.width) return this.m_layout;
        this.m_layout = layoutTable(this.data, frame, (ri: number, ci: number) => (this._getCellAt(ri, ci)));
        this.m_saveheight = frame.height;
        this.m_savewidth = frame.width;
        return this.m_layout;
    }

    // todo table支持组件，直接override shape? 或者至少要datas & rowHeights & colWidths
    protected updateChildren(): void {

        const reuse = new Map<string, DataView>();
        this.m_children.forEach((c) => {
            reuse.set(c.m_data.id, c);
        });

        // const shape = this.m_data as TableShape;
        const comsMap = this.m_ctx.comsMap;
        const layout = this.getLayout();

        let idx = 0;
        for (let i = 0, len = layout.grid.rowCount; i < len; ++i) {
            for (let j = 0, len = layout.grid.colCount; j < len; ++j) {
                const cellLayout = layout.grid.get(i, j);
                const rowIdx = cellLayout.index.row;
                const colIdx = cellLayout.index.col;
                if (rowIdx !== i || colIdx !== j) continue;
                // if (cellLayout.index.row === i && cellLayout.index.col === j) {
                const cellId = this.rowHeights[rowIdx].id + "," + this.colWidths[colIdx].id;
                const cdom = reuse.get(cellId) as TableCellView | undefined;
                const props = { data: cdom?.data as TableCell, transx: this.m_transx, varsContainer: this.varsContainer, frame: cellLayout.frame, isVirtual: this.m_isVirtual, index: cellLayout.index };
                if (cdom) {
                    const cell = this._getCellAt2(rowIdx, colIdx);
                    if (cell) props.data = cell;
                    reuse.delete(cellId);
                    this.moveChild(cdom, idx);
                    cdom.layout(props);
                } else {
                    const cell = this._getCellAt(rowIdx, colIdx);
                    props.data = cell;
                    // const comsMap = this.m_ctx.comsMap;
                    const Com = comsMap.get(cell.type) || comsMap.get(ShapeType.Rectangle)!;
                    const ins = new Com(this.m_ctx, props) as DataView;
                    this.addChild(ins, idx);
                    this.m_cells.set(ins.id, ins as TableCellView);
                }
                ++idx;
                // }
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
        const layout = this.getLayout();
        const cell_border_nodes = [];
        const nodes = renderBorders(elh, this.getBorders(), this.frame, this.getPathStr());
        for (let i = 0, len = layout.grid.rowCount; i < len; ++i) {
            for (let j = 0, len = layout.grid.colCount; j < len; ++j) {
                const cellLayout = layout.grid.get(i, j);
                if (cellLayout.index.row !== i || cellLayout.index.col !== j) continue;
                const child = this._getCellAt(cellLayout.index.row, cellLayout.index.col);// cellLayout.cell;
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

    _getVisibleCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): {
        cell: TableCell | undefined,
        rowIdx: number,
        colIdx: number
    }[] {
        return getTableVisibleCells(this.data, (ri: number, ci: number) => (this._getCellAt(ri, ci)), this.getLayout(), rowStart, rowEnd, colStart, colEnd);
    }

    getVisibleCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
        return this._getVisibleCells(rowStart, rowEnd, colStart, colEnd).map((v) => ({
            cell: v.cell ? this.cells.get(getShapeViewId(v.cell.id, this.varsContainer)) : undefined,
            rowIdx: v.rowIdx,
            colIdx: v.colIdx
        }));
    }

    _getCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): { cell: TableCell | undefined, rowIdx: number, colIdx: number }[] {
        return getTableCells(this.data, (ri: number, ci: number) => (this._getCellAt(ri, ci)), rowStart, rowEnd, colStart, colEnd);
    }

    getCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
        return this._getCells(rowStart, rowEnd, colStart, colEnd).map((v) => ({
            cell: v.cell ? this.cells.get(getShapeViewId(v.cell.id, this.varsContainer)) : undefined,
            rowIdx: v.rowIdx,
            colIdx: v.colIdx
        }));
    }
    get heightTotalWeights() {
        return this.rowHeights.reduce((p, c) => (p + c.value), 0);
    }
    get widthTotalWeights() {
        return this.colWidths.reduce((p, c) => (p + c.value), 0);
    }

    get rowCount() {
        return this.data.rowCount;
    }
    get colCount() {
        return this.data.colCount;
    }
    get rowHeights() {
        return this.data.rowHeights;
    }
    get colWidths() {
        return this.data.colWidths;
    }
    getCellAt(rowIdx: number, colIdx: number): TableCellView | undefined {
        if (rowIdx < 0 || colIdx < 0 || rowIdx >= this.rowCount || colIdx >= this.colCount) {
            throw new Error("cell index outof range: " + rowIdx + " " + colIdx)
        }
        const cellId = this.rowHeights[rowIdx].id + "," + this.colWidths[colIdx].id;
        // const cell = this._getCellAt(rowIdx, colIdx);
        // if (cell) {
        const _cellId = getShapeViewId(cellId, this.varsContainer);
        return this.cells.get(_cellId);
        // }
    }

    locateCell(x: number, y: number): (TableGridItem & { cell: TableCellView | undefined }) | undefined {
        const item = locateCell(this.getLayout(), x, y) as (TableGridItem & { cell: TableCellView | undefined }) | undefined;
        if (item) {
            const cell = this.getCellAt(item.index.row, item.index.col);
            if (cell) {
                item.cell = cell;
            }
        }
        return item;
    }

    locateCellIndex(x: number, y: number): { row: number, col: number } | undefined {
        return locateCellIndex(this.getLayout(), x, y);
    }

    // locateCell2(cell: TableCell): (TableGridItem & { cell: TableCellView | undefined }) | undefined {
    //     return this.data.locateCell2(cell);
    // }

    _indexOfCell2(cell: TableCell): { rowIdx: number, colIdx: number } | undefined {
        // cell indexs
        const ids = cell.id.split(',');
        if (ids.length !== 2) throw new Error("cell index error");
        const rowIdx = this.rowHeights.findIndex(v => v.id === ids[0]);
        const colIdx = this.colWidths.findIndex(v => v.id === ids[1]);
        if (rowIdx < 0 || colIdx < 0) return;
        return { rowIdx, colIdx }
    }
    _indexOfCell(cell: TableCell): { rowIdx: number, colIdx: number, visible: boolean } | undefined {
        // cell indexs
        const cellIdx = this._indexOfCell2(cell);
        if (!cellIdx) return;
        const { rowIdx, colIdx } = cellIdx;
        const layout = this.getLayout();
        const item = layout.grid.get(rowIdx, colIdx);
        const visible = item.index.row === rowIdx && item.index.col === colIdx;
        return { rowIdx, colIdx, visible }
    }

    indexOfCell(cell: TableCell | TableCellView): { rowIdx: number, colIdx: number, visible: boolean } | undefined {
        return cell instanceof TableCellView ? this._indexOfCell(cell.data) : this._indexOfCell(cell);
    }
}