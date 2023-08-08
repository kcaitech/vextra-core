import { Text } from "../../data/text";
import { TableCell, TableCellType, TableShape } from "../../data/table";
import { Page } from "../../data/classes";

export function tableSetCellContentType(cell: TableCell, contentType: TableCellType | undefined) {
    cell.setContentType(contentType);
}

export function tableSetCellContentText(cell: TableCell, text: Text | undefined) {
    cell.setContentText(text);
}

export function tableSetCellContentImage(cell: TableCell, ref: string | undefined) {
    cell.setContentImage(ref);
}

export function tableModifyColWidth(table: TableShape, idx: number, width: number) {
    table.setColWidth(idx, width);
}

export function tableModifyRowHeight(page: Page, table: TableShape, idx: number, height: number) {
    table.setRowHeight(idx, height);
}

export function tableInsertRow(table: TableShape, idx: number, height: number, data?: TableCell[]) {
    table.insertRow(idx, height, data);
}

export function tableRemoveRow(table: TableShape, idx: number) {
    return table.removeRow(idx);
}

export function tableInsertCol(table: TableShape, idx: number, width: number, data?: TableCell[]) {
    table.insertCol(idx, width, data);
}

export function tableRemoveCol(table: TableShape, idx: number) {
    return table.removeCol(idx);
}

export function tableModifyCellSpan(cell: TableCell, rowSpan: number | undefined, colSpan: number | undefined) {
    cell.setCellSpan(rowSpan, colSpan);
}