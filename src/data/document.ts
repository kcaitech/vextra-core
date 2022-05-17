import { EventEmitter } from "@/basic/event";
import { LzData } from "./lzdata";
import { Page } from "./page";

export class Document extends EventEmitter {
    private m_lzData: LzData;
	private m_pagesRef: string[];
	private m_pages: Page[];
	private m_pageImporter: Function;

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
		page = await this.m_pageImporter(this.m_lzData, ref);
		this.m_pages[idx] = page;
		return page;
	}
}
