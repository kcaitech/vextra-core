import { Watchable } from "./basic";
import { LzData } from "./lzdata";
import { PagesMeta } from "./meta";
import { Page } from "./page";
import { Symbol, ISymbolManager } from "./shape";

export class Document extends Watchable implements ISymbolManager {
    private m_lzData: LzData;
	private m_pagesRef: string[];
	private m_pages: Page[];
	private m_pageImporter: Function;
    private m_symbols: Map<string, Symbol> = new Map();
    private m_symWaits: Map<string, (() => void)[]> = new Map();
    private m_meta: PagesMeta;

	constructor(lzData: LzData, meta: PagesMeta, pagesRef: string[], pageImporter: Function) {
		super();
		this.m_lzData = lzData;
        this.m_meta = meta;
		this.m_pages = [];
		this.m_pagesRef = pagesRef;
		this.m_pageImporter = pageImporter;
		// lzData.load('document.json').on('ready', (data) => {
		// 	data = JSON.parse(data);
		// 	this._init(data);
		// 	this.emit('ready');
		// });
        
        // for debugger
        (window as any).__document = this;
	}

    get meta(): PagesMeta {
        return this.m_meta;
    }
	
	get pageCount(): number {
		return this.m_pagesRef.length;
	}
	peekPageByIndex(idx: number): Page {
		return this.m_pages && this.m_pages[idx];
	}
	async getPageByIndex(idx: number): Promise<Page> {
		let page = this.m_pages && this.m_pages[idx];
		if (page) {
			return page;
		}
		const ref = this.m_pagesRef[idx];
		page = await this.m_pageImporter(this.m_lzData, ref, this);
		this.m_pages[idx] = page;
        this.notify();
		return page;
	}

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
