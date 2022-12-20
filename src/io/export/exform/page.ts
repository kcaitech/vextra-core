import { Page } from "@/data/page";
import { Shape, ShapeType } from "@/data/shape";
import { exportArtboard } from "./artboard";
import { exportChilds, exportShapeCommons, shapesExporter } from "./shape";

export function exportPage(page: Page) {
    return '{'
        + '"type":page,' 
        + exportShapeCommons(page)
        + ',"childs":' + exportChilds(page, (shape: Shape) => {
            if (shape.type === ShapeType.Artboard) return exportArtboard;
            return shapesExporter(shape);
        })
    + '}';
}