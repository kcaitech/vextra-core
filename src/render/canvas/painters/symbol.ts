import { ShapeView } from "../../../dataview";
import { ArtboardCanvasRenderer } from "./artboard";

export class SymbolCanvasRenderer extends ArtboardCanvasRenderer {
    constructor(view: ShapeView) {
        super(view);
    }
}