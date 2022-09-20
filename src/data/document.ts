import { Watchable } from "./basic";
import { LzData } from "./lzdata";
import { PagesMeta } from "./meta";
import { Page } from "./page";
import { Symbol, ISymbolManager } from "./shape";

export class PagesMgr extends Watchable {
    // private m_lzData: LzData;
    private m_order: string[];
    private m_map: Map<string, Page> = new Map();
    private m_importer: (id:string)=>Promise<Page>;
    private m_meta: PagesMeta;

    constructor(order: string[], meta: PagesMeta, importer: (id:string)=>Promise<Page>) {
        super();
        // this.m_lzData = lzData;
        this.m_meta = meta;
        this.m_order = order;
        this.m_importer = importer;
    }

    get pageCount(): number {
		return this.m_order.length;
	}
    getPageIdByIndex(idx: number): string {
        return this.m_order[idx];
    }
    getPageNameById(id: string): string {
        return this.m_meta.get(id)?.name || "";
    }
	peekPageByIndex(idx: number): Page | undefined {
		const id = this.m_order[idx];
        return this.m_map.get(id);
	}
	async getPageByIndex(idx: number): Promise<Page> {
		let page = this.peekPageByIndex(idx);
		if (page) {
			return page;
		}
		const ref = this.m_order[idx];
		page = await this.m_importer(ref);
		this.m_map.set(ref, page);
        this.notify();
		return page;
	}
}

export class SymsMgr extends Watchable implements ISymbolManager {
    private m_symbols: Map<string, Symbol> = new Map();
    private m_symWaits: Map<string, (() => void)[]> = new Map();

    addSymbol(id: string, data: Symbol): void {
        this.m_symbols.set(id, data);
        const waits = this.m_symWaits.get(id);
        (waits || []).forEach((f) => f());
    }
    deleteSymbol(id: string) {
        this.m_symbols.delete(id);
    }
    async getSymbol(id: string): Promise<Symbol> {
        const s = this.m_symbols.get(id);
        if (s) return s;
        return new Promise<Symbol> ((resolve) => {
            let waits = this.m_symWaits.get(id);
            if (!waits) {
                waits = [];
                this.m_symWaits.set(id, waits);
            }
            waits.push(() => {
                resolve(<Symbol>this.m_symbols.get(id));
            });
        })
    }
}

export class Document extends Watchable {

    private m_meta: PagesMeta;
    private m_symsMgr: SymsMgr;
    private m_pagesMgr: PagesMgr;

	constructor(meta: PagesMeta, symsMgr: SymsMgr, pagesMgr: PagesMgr) {
		super();
        this.m_meta = meta;
        this.m_symsMgr = symsMgr;
        this.m_pagesMgr = pagesMgr;
        // for debugger
        (window as any).__document = this;
	}

    get meta(): PagesMeta {
        return this.m_meta;
    }

    get pagesMgr(): PagesMgr {
        return this.m_pagesMgr;
    }

    get symsMgr(): SymsMgr {
        return this.m_symsMgr;
    }
}
