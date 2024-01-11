import * as classes from "./baseclasses";
import { BasicMap } from "./basic";
import { SymbolShape, SymbolUnionShape } from "./shape";

export class DocumentSyms implements classes.DocumentSyms {
    typeId = 'document-syms'
    symbols: BasicMap<string, (SymbolUnionShape | SymbolShape)>
    constructor(
        symbols: BasicMap<string, (SymbolUnionShape | SymbolShape)>
    ) {
        this.symbols = symbols
    }
}