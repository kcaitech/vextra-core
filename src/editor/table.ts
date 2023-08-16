import { TableCell, TableShape } from "../data/table";
import { ShapeEditor } from "./shape";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
import { newText } from "./creator";
import { StrikethroughType, TableCellType, TextBehaviour, TextHorAlign, TextTransformType, TextVerAlign, UnderlineType } from "../data/baseclasses";
import { adjColum, adjRow } from "./tableadjust";
import { Color } from "data/style";
import { importTextAttr } from "io/importadaptor";
import { fixTableShapeFrameByLayout } from "./utils";
import { Api } from "./command/recordapi";

export class TableEditor extends ShapeEditor {

    constructor(shape: TableShape, page: Page, repo: CoopRepository) {
        super(shape, page, repo)
    }

    get shape(): TableShape {
        return this.__shape as TableShape;
    }

    // 水平拆分单元格
    horSplitCell(cell: TableCell) {
        const api = this.__repo.start("horSplitCell", {});
        try {
            if (cell.rowSpan && cell.rowSpan > 1) {
                api.tableModifyCellSpan(this.__page, cell, cell.rowSpan - 1, cell.colSpan || 1);
            }
            else {
                // 当前行后插入行
                // 将当前行可见的单元格，rowSpan+1
                // 当前单元格rowSpan-1
                const indexCell = this.shape.indexOfCell(cell);
                if (!indexCell) {
                    throw new Error("cell not inside table")
                }
                const weight = this.shape.rowHeights[indexCell.rowIdx] / 2;
                api.tableInsertRow(this.__page, this.shape, indexCell.rowIdx + 1, weight, []);
                api.tableModifyRowHeight(this.__page, this.shape, indexCell.rowIdx, weight);

                const cells = this.shape.getTableCells(indexCell.rowIdx, indexCell.rowIdx, 0, this.shape.colWidths.length, true);
                cells.forEach((c) => {
                    if (c.id !== cell.id) {
                        api.tableModifyCellSpan(this.__page, c, (c.rowSpan || 1) + 1, c.colSpan || 1);
                    }
                });
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }
    // 垂直拆分单元格
    verSplitCell(cell: TableCell) {
        const api = this.__repo.start("verSplitCell", {});
        try {
            if (cell.colSpan && cell.colSpan > 1) {
                api.tableModifyCellSpan(this.__page, cell, cell.rowSpan || 1, cell.colSpan - 1);
            }
            else {
                // 当前列后插入列
                // 将当前列可见的单元格，colSpan+1
                // 当前单元格colSpan-1
                const indexCell = this.shape.indexOfCell(cell);
                if (!indexCell) {
                    throw new Error("cell not inside table")
                }
                const weight = this.shape.colWidths[indexCell.colIdx] / 2;
                api.tableInsertCol(this.__page, this.shape, indexCell.colIdx + 1, weight, []);
                api.tableModifyColWidth(this.__page, this.shape, indexCell.colIdx, weight);

                const cells = this.shape.getTableCells(0, this.shape.rowHeights.length, indexCell.colIdx, indexCell.colIdx, true);
                cells.forEach((c) => {
                    if (c.id !== cell.id) {
                        api.tableModifyCellSpan(this.__page, c, c.rowSpan || 1, (c.colSpan || 1) + 1);
                    }
                });
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // 合并单元格
    mergeCells(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
        const api = this.__repo.start('mergeCells', {});
        try {
            const cells = this.shape.getTableCells(rowStart, rowStart, colStart, colStart, false);
            const cellsVisible = this.shape.getTableCells(rowStart, rowEnd, colStart, colEnd, true);

            if (cells.length === 0) {
                throw new Error("not find cell")
            }
            if (cellsVisible.length === 0 || cellsVisible[0].id !== cells[0].id) {
                throw new Error("cell not visible")
            }

            const cell = cells[0];
            api.tableModifyCellSpan(this.__page, cell, rowEnd - rowStart + 1, colEnd - colStart + 1);
            // merge content
            cellsVisible.forEach((c) => {
                if ((c.cellType ?? TableCellType.None) === TableCellType.None) return;
                if (c.cellType === TableCellType.Image) {
                    // 图片咋搞？
                    if ((cell.cellType ?? TableCellType.None) === TableCellType.None) {
                        api.tableSetCellContentType(this.__page, c, TableCellType.Image);
                        api.tableSetCellContentImage(this.__page, cell, c.imageRef);
                    }
                }
                else if (c.cellType === TableCellType.Text) {
                    if (cell.cellType === TableCellType.Text) {
                        api.insertComplexText(this.__page, cell as any, cell.text!.length, c.text!);
                    }
                }
                api.tableSetCellContentType(this.__page, c, undefined);
                api.tableSetCellContentImage(this.__page, c, undefined);
                api.tableSetCellContentText(this.__page, c, undefined);
            })

            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    setCellContentImage(cell: TableCell, ref: string) {
        const api = this.__repo.start('setCellContentImage', {});
        try {
            api.tableSetCellContentType(this.__page, cell, TableCellType.Image);
            api.tableSetCellContentImage(this.__page, cell, ref);
            api.tableSetCellContentText(this.__page, cell, undefined);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    setCellContentText(cell: TableCell, text?: string) {
        const _text = newText();
        _text.setTextBehaviour(TextBehaviour.Fixed);
        _text.setPadding(5, 0, 3, 0);
        if (this.shape.textAttr) { // todo
            _text.attr = importTextAttr(this.shape.textAttr);
        }
        if (text && text.length > 0) _text.insertText(text, 0);
        const api = this.__repo.start('setCellContentText', {});
        try {
            api.tableSetCellContentType(this.__page, cell, TableCellType.Text);
            api.tableSetCellContentText(this.__page, cell, _text);
            api.tableSetCellContentImage(this.__page, cell, undefined);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // 调整列宽
    setColWidth(idx: number, width: number) {
        const total = this.shape.colWidths.reduce((pre, w) => pre + w, 0);
        const curWidth = this.shape.colWidths[idx] / total * this.shape.frame.width;
        if (width === curWidth) return;
        const weight = this.shape.colWidths[idx] * width / curWidth;
        const api = this.__repo.start('setColWidth', {});
        try {
            api.tableModifyColWidth(this.__page, this.shape, idx, weight);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width - curWidth + width, this.shape.frame.height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * 
     * @param fromIdx 
     * @param toIdx 
     * @param width table坐标系空间宽度
     */
    adjColWidth(fromIdx: number, toIdx: number, width: number) {
        const api = this.__repo.start('adjColWidth', {});
        try {
            adjColum(this.__page, this.shape, fromIdx, toIdx, width, api);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // 调整行高
    setRowHeight(idx: number, height: number) {
        const total = this.shape.rowHeights.reduce((pre, h) => pre + h, 0);
        const curHeight = this.shape.rowHeights[idx] / total * this.shape.frame.height;
        if (height === curHeight) return;
        const weight = this.shape.rowHeights[idx] * height / curHeight;
        const api = this.__repo.start('setRowHeight', {});
        try {
            api.tableModifyRowHeight(this.__page, this.shape, idx, weight);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width, this.shape.frame.height - curHeight + height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    /**
     * 
     * @param fromIdx 
     * @param toIdx 
     * @param height table坐标系空间长度
     */
    adjRowHeight(fromIdx: number, toIdx: number, height: number) {
        const api = this.__repo.start('adjColWidth', {});
        try {
            adjRow(this.__page, this.shape, fromIdx, toIdx, height, api);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertRow(idx: number, height: number, data?: TableCell[]) {
        const total = this.shape.rowHeights.reduce((pre, h) => pre + h, 0);
        const weight = height / this.shape.frame.height * total;
        const api = this.__repo.start('insertRow', {});
        try {
            api.tableInsertRow(this.__page, this.shape, idx, weight, data ?? []);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width, this.shape.frame.height + height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    removeRow(idx: number) {
        const total = this.shape.rowHeights.reduce((pre, h) => pre + h, 0);
        const curHeight = this.shape.rowHeights[idx] / total * this.shape.frame.height;
        const api = this.__repo.start('removeRow', {});
        try {
            api.tableRemoveRow(this.__page, this.shape, idx);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width, this.shape.frame.height - curHeight);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    insertCol(idx: number, width: number, data?: any[]) {
        const total = this.shape.colWidths.reduce((pre, h) => pre + h, 0);
        const weight = width / this.shape.frame.width * total;
        const api = this.__repo.start('insertCol', {});
        try {
            api.tableInsertCol(this.__page, this.shape, idx, weight, data ?? []);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width + width, this.shape.frame.height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    removeCol(idx: number) {
        const total = this.shape.colWidths.reduce((pre, w) => pre + w, 0);
        const curWidth = this.shape.colWidths[idx] / total * this.shape.frame.width;
        const api = this.__repo.start('removeCol', {});
        try {
            api.tableRemoveCol(this.__page, this.shape, idx);
            api.shapeModifyWH(this.__page, this.shape, this.shape.frame.width - curWidth, this.shape.frame.height);
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    private fixFrameByLayout(cell: TableCell, api: Api) {
        fixTableShapeFrameByLayout(api, this.__page, cell);
    }

    // text attr
    public setTextColor(color: Color | undefined) {
        const api = this.__repo.start("setTableTextColor", {});
        try {
            api.tableModifyTextColor(this.__page, this.shape, color);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyColor(this.__page, cell as any, 0, cell.text.length, color);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextHighlightColor(color: Color | undefined) {
        const api = this.__repo.start("setTableTextHighlightColor", {});
        try {
            api.tableModifyTextHighlightColor(this.__page, this.shape, color);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyHighlightColor(this.__page, cell as any, 0, cell.text.length, color);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFontName(fontName: string) {
        const api = this.__repo.start("setTableTextFontName", {});
        try {
            api.tableModifyTextFontName(this.__page, this.shape, fontName);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyFontName(this.__page, cell as any, 0, cell.text.length, fontName);
                    this.fixFrameByLayout(cell, api);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
    public setTextFontSize(fontSize: number) {
        const api = this.__repo.start("setTableTextFontSize", {});
        try {
            api.tableModifyTextFontSize(this.__page, this.shape, fontSize);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyFontSize(this.__page, cell as any, 0, cell.text.length, fontSize);
                    this.fixFrameByLayout(cell, api);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 对象属性
    public setTextVerAlign(verAlign: TextVerAlign) {
        const api = this.__repo.start("setTableTextVerAlign", {});
        try {
            api.tableModifyTextVerAlign(this.__page, this.shape, verAlign);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.shapeModifyTextVerAlign(this.__page, cell as any, verAlign);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 段属性
    public setTextHorAlign(horAlign: TextHorAlign) {
        const api = this.__repo.start("setTableTextHorAlign", {});
        try {
            api.tableModifyTextHorAlign(this.__page, this.shape, horAlign);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyHorAlign(this.__page, cell as any, horAlign, 0, cell.text.length);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setLineHeight(lineHeight: number) {
        const api = this.__repo.start("setLineHeight", {});
        try {
            api.tableModifyTextMinLineHeight(this.__page, this.shape, lineHeight);
            api.tableModifyTextMaxLineHeight(this.__page, this.shape, lineHeight);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    const length = cell.text.length;
                    api.textModifyMinLineHeight(this.__page, cell as any, lineHeight, 0, length);
                    api.textModifyMaxLineHeight(this.__page, cell as any, lineHeight, 0, length);
                    this.fixFrameByLayout(cell, api);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 字间距 段属性
    public setCharSpacing(kerning: number) {
        const api = this.__repo.start("setTableCharSpace", {});
        try {
            api.tableModifyTextKerning(this.__page, this.shape, kerning);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyKerning(this.__page, cell as any, kerning, 0, cell.text.length);
                    this.fixFrameByLayout(cell, api);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    // 段间距 段属性
    public setParaSpacing(paraSpacing: number) {
        const api = this.__repo.start("setTableParaSpacing", {});
        try {
            api.tableModifyTextParaSpacing(this.__page, this.shape, paraSpacing);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyParaSpacing(this.__page, cell as any, paraSpacing, 0, cell.text.length);
                    this.fixFrameByLayout(cell, api);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextUnderline(underline: boolean) {
        const api = this.__repo.start("setTableTextUnderline", {});
        try {
            api.tableModifyTextUnderline(this.__page, this.shape, underline ? UnderlineType.Single : undefined);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyUnderline(this.__page, cell as any, underline ? UnderlineType.Single : undefined, 0, cell.text.length);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextStrikethrough(strikethrough: boolean) {
        const api = this.__repo.start("setTableTextStrikethrough", {});
        try {
            api.tableModifyTextStrikethrough(this.__page, this.shape, strikethrough ? StrikethroughType.Single : undefined);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyStrikethrough(this.__page, cell as any, strikethrough ? StrikethroughType.Single : undefined, 0, cell.text.length);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextBold(bold: boolean) {
        const api = this.__repo.start("setTableTextBold", {});
        try {
            api.tableModifyTextBold(this.__page, this.shape, bold);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyBold(this.__page, cell as any, bold, 0, cell.text.length);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextItalic(italic: boolean) {
        const api = this.__repo.start("setTableTextItalic", {});
        try {
            api.tableModifyTextItalic(this.__page, this.shape, italic);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyItalic(this.__page, cell as any, italic, 0, cell.text.length);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }

    public setTextTransform(transform: TextTransformType | undefined) {
        const api = this.__repo.start("setTableTextTransform", {});
        try {
            api.tableModifyTextTransform(this.__page, this.shape, transform);
            const cells = this.shape.childs as any as TableCell[];
            cells.forEach((cell) => {
                if (cell.cellType === TableCellType.Text && cell.text) {
                    api.textModifyTransform(this.__page, cell as any, transform, 0, cell.text.length);
                    this.fixFrameByLayout(cell, api);
                }
            })
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return false;
    }
}