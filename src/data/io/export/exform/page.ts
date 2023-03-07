import { Page } from "@/data/data/page";
import { Shape, ShapeType } from "@/data/data/shape";
import { exportArtboard } from "./artboard";
import { ExfContext } from "./context";
import { exportChilds, exportShapeCommons, shapesExporter } from "./shape";

export function exportPage(page: Page, ctx: ExfContext) {
    return '{'
        + '"type":"page",' 
        + exportShapeCommons(page)
        + ',"childs":' + exportChilds(page, ctx, (shape: Shape) => {
            if (shape.type === ShapeType.Artboard) return exportArtboard;
            return shapesExporter(shape);
        })
    + '}';
}