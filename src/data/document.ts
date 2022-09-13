import { EventEmitter } from "@/basic/event";
import { LzData } from "./lzdata";
import { Page } from "./page";
import { Symbol, ISymbolManager } from "./shape";

export class Document extends EventEmitter implements ISymbolManager {
    private m_lzData: LzData;
	private m_pagesRef: string[];
	private m_pages: Page[];
	private m_pageImporter: Function;
    private m_symbols: Map<string, Symbol> = new Map();
    private m_symWaits: Map<string, (() => void)[]> = new Map();

	constructor(lzData: LzData, pagesRef: string[], pageImporter: Function) {
		super();
		this.m_lzData = lzData;
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
