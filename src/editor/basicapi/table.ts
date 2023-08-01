import { Text } from "../../data/text";
import { TableCell, TableCellType } from "../../data/table";

export function tableSetCellContent(cell: TableCell, contentType: TableCellType | undefined, content: string | Text) {
    cell.cellType = contentType;
    if (contentType === TableCellType.Image && typeof content === 'string') {
        cell.imageRef = content;
    }
    else if (contentType === TableCellType.Text && content instanceof Text) {
        cell.text = content;
    }
}