import { DocumentMeta, PageListItem } from "./baseclasses";
import { Page } from "./page";
import { Artboard } from "./artboard";
import { BasicArray, IDataGuard, ResourceMgr, WatchableObject } from "./basic";
import { Style } from "./style";
import { GroupShape, SymbolShape, TextShape } from "./shape";
import { TableCell, TableShape } from "./table";
import { SymbolRefShape } from "./symbolref";

export { DocumentMeta, PageListItem, DocumentSyms } from "./baseclasses";

export enum LibType {
    Symbol = 'symbol-lib',
    Media = 'media-lib'
}

class SpecialActionCorrespondent extends WatchableObject {
    constructor() {
        super();
    }
}

function getTextFromGroupShape(shape: GroupShape): string {
    let result = "";
    for (const child of shape.childs) {
        if (child instanceof SymbolRefShape && !!child.symData) {
            result += getTextFromGroupShape(child.symData);
        } else if (child instanceof GroupShape) {
            result += getTextFromGroupShape(child);
        } else if (child instanceof TableShape) {
            result += (child.datas.filter(cell => !!cell) as BasicArray<(TableCell)>)
                .reduce((previousValue, currentValue) => previousValue + currentValue.text?.toString() ?? "", "");
        } else if (child instanceof TextShape) {
            result += child.text.toString();
        }
    }
    return result;
}

export class Document extends (DocumentMeta) {

    // watchable
    public __watcher: Set<((...args: any[]) => void)> = new Set();
    public watch(watcher: ((...args: any[]) => void)): (() => void) {
        this.__watcher.add(watcher);
        return () => {
            this.__watcher.delete(watcher);
        };
    }
    public unwatch(watcher: ((...args: any[]) => void)): boolean {
        return this.__watcher.delete(watcher);
    }
    public notify(...args: any[]) {
        if (this.__watcher.size === 0) return;
        // 在set的foreach内部修改set会导致无限循环
        Array.from(this.__watcher).forEach(w => {
            w(...args);
        });
    }

    private __pages: ResourceMgr<Page>;
    private __artboards: ResourceMgr<Artboard>;
    private __symbols: ResourceMgr<SymbolShape>
    private __styles: ResourceMgr<Style>
    private __medias: ResourceMgr<{ buff: Uint8Array, base64: string }>
    // private __loader: IDataLoader;
    // private __guard?: IDataGruad;
    private __versionId: string;
    private __name: string;
    __correspondent: SpecialActionCorrespondent; // 额外动作通信

    constructor(
        id: string,
        versionId: string, // 版本id
        lastCmdId: string, // 此版本最后一个cmd的id
        name: string,
        pagesList: BasicArray<PageListItem>,
        guard: IDataGuard
    ) {
        super(id, name, pagesList ?? new BasicArray(), lastCmdId)
        this.__versionId = versionId;
        this.__name = name;
        this.__pages = new ResourceMgr<Page>(guard);
        this.__artboards = new ResourceMgr<Artboard>(guard);
        this.__symbols = new ResourceMgr<SymbolShape>(guard);
        this.__medias = new ResourceMgr<{ buff: Uint8Array, base64: string }>();
        this.__styles = new ResourceMgr<Style>();
        this.__correspondent = new SpecialActionCorrespondent();
        return guard.guard(this);
    }

    get versionId() {
        return this.__versionId;
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
        return this.pagesList.find((p: PageListItem) => p.id === id);
    }

    getPageIndexById(id: string): number {
        return this.pagesList.findIndex(p => p.id === id);
    }

    async getText(): Promise<string> {
        let result = "";
        for (const _page of this.pagesList) {
            const page = await this.__pages.get(_page.id);
            if (!page) continue;
            result += getTextFromGroupShape(page);
        }
        return result;
    }
}