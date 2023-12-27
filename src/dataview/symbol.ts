import { GroupShapeView } from "./groupshape";
import { renderBorders, renderFills } from "../render";
import { EL, elh } from "./el";

export class SymbolView extends GroupShapeView {
    // fills
    protected renderFills(): EL[] {
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr());
    }
    // borders
    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr());
    }
}