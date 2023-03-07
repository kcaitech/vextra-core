import { Watchable } from "./basic";
import { IDocShadow } from "./ishadow";
import { LzData } from "./lzdata";
import { ArtboardMeta, ArtboardsMeta, PagesMeta } from "./meta";
import { Page } from "./page";
import { Symbol, ISymsMgr, IMediaMgr } from "./shape";
import { Style } from "./style";
import { AtomGroup } from "./transact";

@AtomGroup
export class PagesMgr extends Watchable {
    // private m_lzData: LzData;
    // private m_order: string[];
    private m_map: Map<string, Page> = new Map();
    private __importer: (id:string)=>Promise<Page>;
    private m_meta: PagesMeta;

    constructor(meta: PagesMeta, importer: (id:string)=>Promise<Page>) {
        super();
        // this.m_lzData = lzData;
        this.m_meta = meta;
        // this.m_order = order;
        this.__importer = importer;
    }

    get pageCount(): number {
		return this.m_meta.length;
	}
    getPageIdByIndex(idx: number): string {
        return this.m_meta[idx].id;
    }
    getPageById(id: string): Page | undefined {
        return this.m_map.get(id);
    }
    getPageIndexById(id: string): number {
        return this.m_meta.findIndex((val) => val.id == id);
    }
    getPageNameById(id: string): string {
        return this.m_meta.get(id)?.name || "";
    }
	peekPageByIndex(idx: number): Page | undefined {
		const m = this.m_meta[idx];
        return this.m_map.get(m.id);
	}
	async getPageByIndex(idx: number): Promise<Page> {
		let page = this.peekPageByIndex(idx);
		if (page) {
			return page;
		}
		const ref = this.m_meta[idx].id;
		page = await this.__importer(ref);
        
        // todo
        // page.buildTreeNodeCount();

		this.m_map.set(ref, page);
        this.notify();
		return page;
	}
    setPage(id: string, page: Page) {
        this.m_map.set(id, page);
        this.notify();
    }
}

@AtomGroup
export class ArtboardsMgr extends Watchable {
    private m_meta: Map<string, ArtboardsMeta>;
    constructor(m: [string, ArtboardsMeta][]) {
        super();
        this.m_meta = new Map(m);
    }

    public addMeta(pageId: string, m: ArtboardsMeta) {
        this.m_meta.set(pageId, m);
    }
    public deletedMeta(pageId: string) {
        this.m_meta.delete(pageId);
    }
    public addOneMeta(pageId: string, m: ArtboardMeta) {
        let meta = this.m_meta.get(pageId);
        if (meta === undefined) {
            meta = new ArtboardsMeta();
            this.m_meta.set(pageId, meta);
        }
        meta.set(m.id, m);
    }
    public deleteOneMeta(pageId: string, id: string) {
        const meta = this.m_meta.get(pageId);
        if (meta !== undefined) {
            meta.delete(id);
        }
    }
}

@AtomGroup
export class SymsMgr extends Watchable implements ISymsMgr {
    private m_symbols: Map<string, Symbol> = new Map();
    private m_symWaits: Map<string, (() => void)[]> = new Map();
    private m_symMetas: Map<string, {name: string, pageId: string}> = new Map();
    // get count(): number {
    //     return this.m_symbols.size;
    // }

    forEach(f: (id: string, name: string, pageId: string, data?: Symbol) => void) {
        this.m_symMetas.forEach((val, key) => {
            f(key, val.name, val.pageId, this.m_symbols.get(key));
        })
    }

    addSymbol(id: string, name: string, pageId: string, data?: Symbol): void {
        this.m_symMetas.set(id, {name, pageId});

        if (data) {
            this.m_symbols.set(id, data);
            const waits = this.m_symWaits.get(id);
            (waits || []).forEach((f) => f());
            this.m_symWaits.delete(id);
        }
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

// "_ref": "images\/ae3909b2d282c78d2261e74a4738d64b8a51e4ab.png"
@AtomGroup
export class MediaMgr extends Watchable implements IMediaMgr {
    // 缓存在lazy加载页面时会写入数据，不能记入到事务中
    private __refs: Set<string> = new Set();
    private __medias: Map<string, {url?: string, buffer: Uint8Array}> = new Map();
    private __lzData: LzData;

    constructor(lzData: LzData) {
        super();
        this.__lzData = lzData;
    }

    addRef(ref: string) {
        this.__refs.add(ref);
    }

    /*

const buffer = new ArrayBuffer(8);
const z = new Uint8Array(buffer, 1, 4);


function typedArrayToBuffer(array: Uint8Array): ArrayBuffer {
    return array.buffer.slice(array.byteOffset, array.byteLength + array.byteOffset)
}
     * 
     * @param ref 
     * 
     * 
     * @returns 
     */

    async loadRaw(ref: string): Promise<Uint8Array> {
        const media = this.__medias.get(ref);
        if (media) {
            return media.buffer;
        }
        const buffer = await this.__lzData.loadRaw(ref);
        if (buffer) {
            this.__medias.set(ref, {buffer});
            this.__refs.add(ref);
        }
        return buffer;
    }

    async loadImage(ref: string): Promise<string> {
        const media = this.__medias.get(ref);
        if (media && media.url) {
            return media.url;
        }
        // const imageRef = this.m_imageRef;
        const buffer = media && media.buffer ? media.buffer : await this.__lzData.loadRaw(ref);
        // this.m_buffers.set(ref, buffer);
        if (!buffer) {
            return "";
        }

        const uInt8Array = buffer; // new Uint8Array(buffer)
        let i = uInt8Array.length;
        const binaryString = new Array(i);
        while (i--) {
            binaryString[i] = String.fromCharCode(uInt8Array[i]);
        }
        const data = binaryString.join('');

        const base64 = window.btoa(data);

        let url = '';
        const ext = ref.substring(ref.lastIndexOf('.') + 1);
        if (ext == "png") {
            url = "data:image/png;base64," + base64;
        }
        else if (ext == "gif") {
            url = "data:image/gif;base64," + base64;
        }
        else {
            console.log("imageExt", ext);
        }

        this.__medias.set(ref, {url, buffer});
        this.__refs.add(ref);
        return url;
    }
}

@AtomGroup
export class StyleMgr extends Watchable {
    private __shareds: Map<string, Style> = new Map();

    addShared(id: string, style: Style) {
        this.__shareds.set(id, style);
    }
}

@AtomGroup
export class Document extends Watchable {

    private m_id: string;
    private m_fullscreen: boolean;
    // private m_meta: PagesMeta;
    private m_symsMgr: SymsMgr;
    private m_pagesMgr: PagesMgr;
    private m_mediaMgr: MediaMgr;
    private m_styleMgr: StyleMgr;
    private m_artboardMgr: ArtboardsMgr;
    private __shadows: IDocShadow[] = [];
    // private __editor: DocEditor | undefined;
    // private __repo: Repository | undefined;

	constructor(id: string, symsMgr: SymsMgr, pagesMgr: PagesMgr, mediaMgr: MediaMgr, artMgr: ArtboardsMgr, styleMgr: StyleMgr) {
		super();
        this.m_id = id;
        // this.m_meta = meta;
        this.m_symsMgr = symsMgr;
        this.m_pagesMgr = pagesMgr;
        this.m_mediaMgr = mediaMgr;
        this.m_artboardMgr = artMgr;
        this.m_styleMgr = styleMgr;
        this.m_fullscreen = false;
	}

    get id(): string {
        return this.m_id;
    }

    get isFullscreen(): boolean {
        return this.m_fullscreen;
    }

    setScreen(toFull: boolean): void {
        this.m_fullscreen = toFull
    }

    addShadow(shadow: IDocShadow) {
        this.__shadows.push(shadow);
    }
    delShadow(shadow: IDocShadow) {
        const index = this.__shadows.indexOf(shadow);
        if (index >= 0) {
            this.__shadows.splice(index, 1);
        }
    }
    get shadows() { // for editor
        return this.__shadows;
    }

    // initRepo(repo: Repository) {
    //     this.__repo = repo;
    // }

    // get editor(): DocEditor {
    //     if (this.__repo === undefined) {
    //         throw new Error("repo Not initialized!")
    //     }
    //     if (this.__editor === undefined) {
    //         this.__editor = new DocEditor(this.__repo, this.__shadows);
    //     }
    //     return this.__editor;
    // }

    // get meta(): PagesMeta {
    //     return this.m_meta;
    // }
    get pagesMgr(): PagesMgr {
        return this.m_pagesMgr;
    }
    get symsMgr(): SymsMgr {
        return this.m_symsMgr;
    }
    get mediaMgr(): MediaMgr {
        return this.m_mediaMgr;
    }
}
