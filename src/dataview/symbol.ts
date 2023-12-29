import { SymbolShape } from "../data/shape";
import { GroupShapeView } from "./groupshape";
import { renderBorders, renderFills } from "../render";
import { EL, elh } from "./el";

export class SymbolView extends GroupShapeView {
    get data() {
        return this.m_data as SymbolShape;
    }

    get variables() {
        return this.data.variables;
    }

    get isSymbolUnionShape() {
        return this.data.isSymbolUnionShape;
    }

    get symtags() {
        return this.data.symtags;
    }

    // fills
    protected renderFills(): EL[] {
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr());
    }
    // borders
    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr());
    }
}