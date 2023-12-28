import { SymbolShape } from "../data/shape";
import { GroupShapeView } from "./groupshape";

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
}