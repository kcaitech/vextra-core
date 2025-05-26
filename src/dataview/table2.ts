/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    OverrideType,
    Shape,
    ShapeFrame,
    ShapeType,
    Style,
    TableGridItem,
    TableLayout,
    TableShape2,
    Transform,
    Artboard,
    ShapeSize,
    TableCellAttr,
    BorderSideSetting,
    Border,
    BorderStyle,
    Color,
    Fill,
} from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";
import { locateCell, locateCellIndex } from "../data/tablelocate";
import { findOverride, getShapeViewId } from "./basic";
import { layoutTable } from "../data/tablelayout";
import { getTableCells, getTableVisibleCells } from "../data/tableread";
import { BasicArray } from "../data/basic";
import { BorderPosition, CornerType, FillType, Point2D, SideType } from "../data/typesdefine";
import { render as renderLine } from "../render/SVG/effects/line_borders";
import { ArtboardView } from "./artboard";
import { v4 as uuid } from "uuid";

export class TableView2 extends ShapeView {

    private m_cells: Map<string, ArtboardView> = new Map();

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.updateChildren();
    }

    get data(): TableShape2 {
        return this.m_data as TableShape2;
    }

    get cells(): Map<string, ArtboardView> {
        return this.m_cells;
    }

    get isImageFill() {
        return false;
    }

    bubblewatcher(...args: any[]) {
        if (args.includes('text')) {
            return;
        }
        if (args.includes('rowSpan') || args.includes('colSpan')) this.m_layout = undefined;
        this.updateChildren();
        this.m_ctx.setDirty(this);
    }

    getDataChilds(): Shape[] {
        return [];
    }

    private m_layout: TableLayout | undefined;
    private m_savewidth: number = 0;
    private m_saveheight: number = 0;

    // onDataChange(...args: any[]): void {
    //     super.onDataChange(...args);
    //     if (args.includes('rowHeights') || args.includes('colWidths') || args.includes('variables')) this.m_layout = undefined;
    // }

    // 单元格不展示
    get naviChilds(): ShapeView[] | undefined {
        return undefined;
    }

    // protected _layout(
    //     parentFrame: ShapeFrame | undefined,
    //     scale: { x: number, y: number } | undefined,
    // ): void {
    //     super._layout(parentFrame, scale);
    //     this.updateChildren();
    // }

    _getCellAttr(rowIdx: number, colIdx: number): TableCellAttr | undefined {
        if (rowIdx < 0 || colIdx < 0 || rowIdx >= this.rowCount || colIdx >= this.colCount) {
            throw new Error("cell index outof range: " + rowIdx + " " + colIdx)
        }
        const cellId = this.rowHeights[rowIdx].id + "," + this.colWidths[colIdx].id;
        const refId = this.data.id + '/' + cellId;
        const _vars = findOverride(refId, OverrideType.TableCell, this.varsContainer || []); // todo
        if (_vars && _vars.length > 0) {
            return _vars[_vars.length - 1].value;
        }
        return this.data.cellAttrs.get(cellId);
    }

    _getCellAt2(rowIdx: number, colIdx: number): Artboard | undefined {
        if (rowIdx < 0 || colIdx < 0 || rowIdx >= this.rowCount || colIdx >= this.colCount) {
            throw new Error("cell index outof range: " + rowIdx + " " + colIdx)
        }
        const cellId = this.rowHeights[rowIdx].id + "," + this.colWidths[colIdx].id;
        const refId = this.data.id + '/' + cellId;
        const _vars = findOverride(refId, OverrideType.TableCell, this.varsContainer || []);
        if (_vars && _vars.length > 0) {
            return _vars[_vars.length - 1].value;
        }
        return this.data.cells.get(cellId) as Artboard;
    }

    _getCellAt(rowIdx: number, colIdx: number): Artboard {
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
        if (cell) return cell as Artboard;

        // 构造一个
        const strokePaint = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(0.5, 0, 0, 0))
        const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
        const strokePaints = new BasicArray<Fill>();
        strokePaints.push(strokePaint);
        const border = new Border(BorderPosition.Center, new BorderStyle(0, 0), CornerType.Miter, side, strokePaints);

        cell = new Artboard(new BasicArray(),
            cellId,
            "",
            ShapeType.Artboard,
            new Transform(),
            new Style(new BasicArray(), new BasicArray(), border),
            new BasicArray(),
            new ShapeSize());

        return cell as Artboard;
    }

    getLayout(): TableLayout {
        const frame = this.frame;
        if (this.m_layout && this.m_saveheight === frame.height && this.m_savewidth === frame.width) return this.m_layout;
        this.m_layout = layoutTable(this.data, frame, (ri: number, ci: number) => (this._getCellAttr(ri, ci)));
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
                const cdom = reuse.get(cellId) as ArtboardView | undefined;
                const props = {
                    data: cdom?.data as Artboard,
                    scale: this.m_props.scale,
                    varsContainer: this.varsContainer,
                    frame: cellLayout.frame,
                    isVirtual: this.m_isVirtual,
                    index: cellLayout.index,
                    layoutSize: this.size
                };
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
                    this.m_cells.set(ins.id, ins as ArtboardView);
                }
                ++idx;
                // }
            }
        }
        if (this.m_children.length > idx) {
            this.removeChilds(idx, this.m_children.length - idx).forEach((c) => {
                this.m_cells.delete(c.id);
                c.destroy();
            });
        }
    }

    protected renderBorder(): EL[] {
        const shape = this.m_data as TableShape2;
        const layout = this.getLayout();

        type PathSeg = { from: Point2D, to: Point2D, style: Style }[];
        const rows = new Map<number, PathSeg>();
        const cols = new Map<number, PathSeg>();

        const _merge = (from: Point2D, to: Point2D, style: Style, seg: PathSeg, x: 'x' | 'y') => {
            if (seg.length == 0) {
                seg.push({ from, to, style })
                return;
            }
            for (let i = 0; i < seg.length && from[x] < to[x]; ++i) { // 有序
                const s = seg[i];
                const intersect = from[x] < s.to[x] && to[x] > s.from[x];
                if (!intersect) {
                    if (from[x] < s.from[x]) {
                        seg.splice(i, 0, { from, to, style })
                        return; // done
                    }
                    continue;
                }
                // x 相交
                // 前面要处理
                if (from[x] < s.from[x]) {
                    seg.splice(i, 0, { from: { x: from.x, y: from.y }, to: { x: s.from.x, y: s.from.y }, style })
                    from[x] = s.from[x];
                    continue;
                }
                if (from[x] === s.from[x]) {
                    if (to[x] >= s.to[x]) {
                        s.style = style;
                        from[x] = s.to[x];
                        continue;
                    }
                    else {
                        s.from[x] = to[x];
                        seg.splice(i, 0, { from, to, style })
                        return; // done
                    }
                }
                else {
                    if (to[x] >= s.to[x]) {
                        seg.splice(i + 1, 0, { from: { x: from.x, y: from.y }, to: { x: s.to.x, y: s.to.y }, style })
                        s.to[x] = from[x];
                        continue;
                    }
                    else {
                        seg.splice(i + 1, 0, { from: { x: to.x, y: to.y }, to: { x: s.to.x, y: s.to.y }, style: s.style })
                        seg.splice(i + 1, 0, { from, to, style })
                        s.to[x] = from[x];
                        return; // done
                    }
                }
            }
            if (from[x] < to[x]) {
                seg.push({ from, to, style })
            }
        }

        const mergerow = (from: Point2D, to: Point2D, style: Style, seg: PathSeg) => {
            // y 相同
            // x 相交
            _merge(from, to, style, seg, 'x');
        }

        const mergecol = (from: Point2D, to: Point2D, style: Style, seg: PathSeg) => {
            // x 相同
            _merge(from, to, style, seg, 'y');
        }

        const rendercell = (frame: ShapeFrame, style: Style) => {
            // l
            {
                const from = { x: frame.x, y: frame.y }
                const to = { x: frame.x, y: frame.y + frame.height }

                let seg = cols.get(from.x);
                if (!seg) {
                    seg = [];
                    cols.set(from.x, seg);
                }
                mergecol(from, to, style, seg);
            }
            // t
            {
                const from = { x: frame.x, y: frame.y }
                const to = { x: frame.x + frame.width, y: frame.y }
                let seg = rows.get(from.y);
                if (!seg) {
                    seg = [];
                    rows.set(from.y, seg);
                }
                mergerow(from, to, style, seg);
            }
            // r
            {
                const from = { x: frame.x + frame.width, y: frame.y }
                const to = { x: from.x, y: frame.y + frame.height }
                let seg = cols.get(from.x);
                if (!seg) {
                    seg = [];
                    cols.set(from.x, seg);
                }
                mergecol(from, to, style, seg);
            }
            // b
            {
                const from = { x: frame.x, y: frame.y + frame.height };
                const to = { x: frame.x + frame.width, y: from.y }
                let seg = rows.get(from.y);
                if (!seg) {
                    seg = [];
                    rows.set(from.y, seg);
                }
                mergerow(from, to, style, seg);
            }
        }

        // 收集边框信息
        // 单元格的要后画一次
        const cellsinfos: { frame: ShapeFrame, style: Style }[] = [];
        for (let i = 0, len = layout.grid.rowCount; i < len; ++i) {
            for (let j = 0, len = layout.grid.colCount; j < len; ++j) {
                const cellLayout = layout.grid.get(i, j);
                if (cellLayout.index.row !== i || cellLayout.index.col !== j) {
                    continue;
                }
                const child = this._getCellAt2(cellLayout.index.row, cellLayout.index.col);

                const frame = cellLayout.frame;
                if (child && child.style.borders.strokePaints.length > 0) {
                    cellsinfos.push({ frame, style: child.style });
                    continue;
                }

                rendercell(frame, shape.style);
            }
        }

        cellsinfos.forEach((c) => rendercell(c.frame, c.style));

        // render
        const nodes: EL[] = [];
        const render2el = (v: PathSeg, x: 'x' | 'y') => {
            for (let i = 0, len = v.length; i < len; ++i) {
                const item = v[i];
                const from = item.from;
                const to = item.to;
                const style = item.style;
                while (i < len - 1) {
                    const n = v[i + 1];
                    if (n.style !== style) break;
                    if (to[x] !== n.from[x]) break;
                    to.x = n.to.x;
                    to.y = n.to.y;
                    ++i;
                }

                const path = 'M' + from.x + ' ' + from.y + ' L' + to.x + ' ' + to.y;
                nodes.push(...renderLine(elh, style, style.borders, undefined, undefined, path, shape));
            }
        }
        // cols
        for (let [k, v] of cols) {
            render2el(v, 'y');
        }
        // rows
        for (let [k, v] of rows) {
            render2el(v, 'x');
        }

        return nodes;
    }

    _getVisibleCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): {
        cell: Artboard | undefined,
        rowIdx: number,
        colIdx: number
    }[] {
        return getTableVisibleCells((ri: number, ci: number) => (this._getCellAt(ri, ci)), this.getLayout(), rowStart, rowEnd, colStart, colEnd);
    }

    getVisibleCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
        return this._getVisibleCells(rowStart, rowEnd, colStart, colEnd).map((v) => ({
            cell: v.cell ? this.cells.get(getShapeViewId(v.cell.id, this.varsContainer)) : undefined,
            rowIdx: v.rowIdx,
            colIdx: v.colIdx
        }));
    }

    _getCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number): { cell: Artboard | undefined, rowIdx: number, colIdx: number }[] {
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
    getCellAt(rowIdx: number, colIdx: number): ArtboardView | undefined {
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

    locateCell(x: number, y: number): (TableGridItem & { cell: ArtboardView | undefined }) | undefined {
        const item = locateCell(this.getLayout(), x, y) as (TableGridItem & { cell: ArtboardView | undefined }) | undefined;
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

    _indexOfCell2(cell: Artboard): { rowIdx: number, colIdx: number } | undefined {
        // cell indexs
        const ids = cell.id.split(',');
        if (ids.length !== 2) throw new Error("cell index error");
        const rowIdx = this.rowHeights.findIndex(v => v.id === ids[0]);
        const colIdx = this.colWidths.findIndex(v => v.id === ids[1]);
        if (rowIdx < 0 || colIdx < 0) return;
        return { rowIdx, colIdx }
    }
    _indexOfCell(cell: Artboard): { rowIdx: number, colIdx: number, visible: boolean } | undefined {
        // cell indexs
        const cellIdx = this._indexOfCell2(cell);
        if (!cellIdx) return;
        const { rowIdx, colIdx } = cellIdx;
        const layout = this.getLayout();
        const item = layout.grid.get(rowIdx, colIdx);
        const visible = item.index.row === rowIdx && item.index.col === colIdx;
        return { rowIdx, colIdx, visible }
    }

    indexOfCell(cell: Artboard | ArtboardView): { rowIdx: number, colIdx: number, visible: boolean } | undefined {
        return cell instanceof ArtboardView ? this._indexOfCell(cell.data) : this._indexOfCell(cell);
    }
}