import { DocumentMeta, PageListItem } from "./baseclasses";
export { DocumentMeta, PageListItem, DocumentSyms } from "./baseclasses";
import { Page } from "./page";
import { Artboard } from "./artboard";
import { SymbolShape } from "./shape";
import { BasicArray, ResourceMgr, IDataGuard, Watchable } from "./basic";
import { Style } from "./style";
import { DataGuard } from "./notransact";
export class Document extends Watchable(DocumentMeta) {
    private __pages: ResourceMgr<Page>;
    private __artboards: ResourceMgr<Artboard>;
    private __symbols: ResourceMgr<SymbolShape>
    private __styles: ResourceMgr<Style>
    private __medias: ResourceMgr<{ buff: Uint8Array, base64: string }>
    // private __loader: IDataLoader;
    // private __guard?: IDataGruad;
    private __versionId: string;
    private __name: string;

    constructor(
        id: string,
        versionId: string,
        name: string,
        pagesList?: BasicArray<PageListItem>,
        // loader: IDataLoader,
        guard?: IDataGuard
    ) {
        super(id, name, pagesList ?? new BasicArray())
        this.__versionId = versionId;
        this.__name = name;
        this.__pages = new ResourceMgr<Page>(guard);
        this.__artboards = new ResourceMgr<Artboard>(guard);
        this.__symbols = new ResourceMgr<SymbolShape>(guard);
        this.__medias = new ResourceMgr<{ buff: Uint8Array, base64: string }>();
        this.__styles = new ResourceMgr<Style>();
        if (!guard) guard = new DataGuard();
        return guard.guard(this);
    }
    get pagesMgr() {
        return this.__pages;
    }
    get artboardMgr() {
        return this.__artboards;
    }
    get symbolsMgr() {
        return this.__symbols;
    }
    get mediasMgr() {
        return this.__medias;
    }
    get stylesMgr() {
        return this.__styles;
    }
    insertPage(index: number, page: Page) {
        if (index < 0) return;
        const pageListItem = new PageListItem(page.id, page.name);
        this.pagesList.splice(index, 0, pageListItem);
        this.__pages.add(page.id, page);
    }
    deletePage(id: string): boolean {
        if (this.pagesList.length > 1) {
            const index = this.pagesList.findIndex(p => p.id === id);
            if (index < 0) return false;
            this.pagesList.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }
    deletePageAt(index: number): boolean {
        if (index < 0 || index >= this.pagesList.length) return false;
        this.pagesList.splice(index, 1);
        return true;
    }
    getPageItemAt(index: number): PageListItem | undefined {
        if (index < 0 || index >= this.pagesList.length) return;
        return this.pagesList[index];
    }
    indexOfPage(pageOrId: Page | string): number {
        const id = typeof pageOrId === 'string' ? pageOrId : pageOrId.id;
        return this.pagesList.findIndex(p => p.id === id);
    }
    getPageMetaById(id: string): PageListItem | undefined {
        const page = this.pagesList.find((p: PageListItem) => p.id === id);
        return page;
    }
    getPageIndexById(id: string): number {
        const index = this.pagesList.findIndex(p => p.id === id);
        return index;
    }
}