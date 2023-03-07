import { MediaMgr, SymsMgr } from "@/data/data/document";

export class Env {
    private m_pageId: string;
    private m_symMgr: SymsMgr;
    private m_mediaMgr: MediaMgr;
    // private m_gradients: Map<string, Gradient> = new Map<string, Gradient>();

    constructor(pageId: string, symMgr: SymsMgr, mediaMgr: MediaMgr) {
        this.m_pageId = pageId;
        this.m_symMgr = symMgr;
        this.m_mediaMgr = mediaMgr;
    }
    get pageId() {
        return this.m_pageId;
    }
    get symbolManager() {
        return this.m_symMgr;
    }
    get mediaMgr() {
        return this.m_mediaMgr;
    }

    // get gradients() {
    //     return this.m_gradients;
    // }
}