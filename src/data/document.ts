import { DocumentMeta, PageListItem } from "./baseclasses";
import { Page } from "./page";
import { BasicArray, BasicMap, IDataGuard, MultiResourceMgr, ResourceMgr, WatchableObject } from "./basic";
import { Style } from "./style";
import { GroupShape, SymbolShape, TextShape } from "./shape";
import { TableShape } from "./table";
import { SymbolRefShape } from "./symbolref";

export { DocumentMeta, PageListItem } from "./baseclasses";

class SpecialActionCorrespondent extends WatchableObject {
    constructor() {
        super();
    }
}

function getTextFromGroupShape(shape: GroupShape | undefined): string {
    if (!shape) return "";
    let result = "";
    for (const child of shape.childs) {
        if (child instanceof SymbolRefShape) {
            // todo
            // if (!!child.symData) result += getTextFromGroupShape(child.symData);
        } else if (child instanceof GroupShape) {
            result += getTextFromGroupShape(child);
        } else if (child instanceof TableShape) {
            child.cells.forEach(cell => {
                if (cell.text) result += cell.text.toString();
            });
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

    getCrdtPath(): string[] {
        return [this.id];
    }

    /**
     * for command
     */
    getOpTarget(path: string[]): any {
        if (path.length === 0) throw new Error("path is empty");
        const path0 = path[0];
        if (path.length === 1) {
            if (path0 === this.id) return this;
            throw new Error("The shape is not found");
        }
        let target = this as any;
        const path1 = path[1];
        let i = 2;
        if (path1 === 'pages') {
            target = this.__pages;
            // } else if (path1 === 'artboards') {
            //     target = this.__artboards;
        } else if (path1 === 'symbols') {
            target = this.__symbols;
        } else if (path1 === 'styles') {
            target = this.__styles;
        } else if (path1 === 'medias') {
            target = this.__medias;
        } else {
            i = 1;
        }
        for (; i < path.length; i++) {
            const k = path[i];
            if (target instanceof Map) {
                target = target.get(k);
            } else if (target instanceof Array) {
                target = target.find((v) => v.id === k);
            } else {
                target = target[k];
            }
            if (!target) {
                // console.warn("not find target " + k, "path :" + path.join(','))
                return;
            }
        }
        return target;
    }

    private __pages: ResourceMgr<Page>;
    private __symbols: MultiResourceMgr<SymbolShape>
    private __styles: ResourceMgr<Style>
    private __medias: ResourceMgr<{ buff: Uint8Array, base64: string }>
    private __versionId: string;
    private __name: string;
    __freesymbolsLoader?: () => Promise<any>;
    __correspondent: SpecialActionCorrespondent; // 额外动作通信

    constructor(
        id: string,
        versionId: string, // 版本id
        lastCmdId: string, // 此版本最后一个cmd的id
        symbolregist: BasicMap<string, string>,
        name: string,
        pagesList: BasicArray<PageListItem>,
        guard: IDataGuard
    ) {
        super(id, name, pagesList ?? new BasicArray(), lastCmdId, symbolregist)
        this.__versionId = versionId;
        this.__name = name;
        this.__pages = new ResourceMgr<Page>([id, 'pages'], (data: Page) => guard.guard(data));
        // this.__artboards = new ResourceMgr<Artboard>([id, 'artboards'], (data: Artboard) => guard.guard(data));
        this.__symbols = new MultiResourceMgr<SymbolShape>([id, 'symbols'],
            (data: SymbolShape) => {
                // check ?
                return guard.guard(data);
            });
        this.__symbols.parent = this; // 要用到symbolregist
        this.__medias = new ResourceMgr<{ buff: Uint8Array, base64: string }>([id, 'medias']);
        this.__styles = new ResourceMgr<Style>([id, 'styles']);
        this.__correspondent = new SpecialActionCorrespondent();
        return guard.guard(this);
    }

    get versionId() {
        return this.__versionId;
    }

    get pagesMgr() {
        return this.__pages;
    }

    // get artboardMgr() {
    //     return this.__artboards;
    // }

    get symbolsMgr() {
        return this.__symbols;
    }

    get mediasMgr() {
        return this.__medias;
    }

    get stylesMgr() {
        return this.__styles;
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
        for (const page of this.pagesList) result += getTextFromGroupShape(await this.__pages.get(page.id));
        return result;
    }
}