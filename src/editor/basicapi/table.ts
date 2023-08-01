import { ImageShape, TextShape } from "../../data/shape";
import { TableCell } from "../../data/table";

export function tableSetCellContent(cell: TableCell, content: ImageShape | TextShape | undefined) {
    cell.child = content;
}