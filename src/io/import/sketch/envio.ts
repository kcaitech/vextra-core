import { ISymbolManager } from "@/data/shape";

export class Env {
    private m_symMgr: ISymbolManager;
    // private m_gradients: Map<string, Gradient> = new Map<string, Gradient>();

    constructor(symMgr: ISymbolManager) {
        this.m_symMgr = symMgr;
    }

    get symbolManager() {
        return this.m_symMgr;
    }

    // get gradients() {
    //     return this.m_gradients;
    // }
}