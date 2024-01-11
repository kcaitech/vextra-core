import * as classes from "./baseclasses";
import { Basic, BasicMap } from "./basic";
import { SymbolShape, SymbolUnionShape } from "./shape";

export class DocumentSyms extends Basic implements classes.DocumentSyms {
    typeId = 'document-syms'
    symbols: BasicMap<string, (SymbolUnionShape | SymbolShape)>
    constructor(
        symbols: BasicMap<string, (SymbolUnionShape | SymbolShape)>
    ) {
        super();
        this.symbols = symbols
    }
}