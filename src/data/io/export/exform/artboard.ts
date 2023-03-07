import { Artboard } from "@/data/data/artboard";
import { ExfContext } from "./context";
import { exportChilds, exportShapeCommons, shapesExporter } from "./shape";

export function exportArtboard(shape: Artboard, ctx: ExfContext) {
    return '{'
        + '"type":"artboard",' 
        + exportShapeCommons(shape)
        + ',"childs":' + exportChilds(shape, ctx, shapesExporter)
    + '}';
}