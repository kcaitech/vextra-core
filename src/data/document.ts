/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { DocumentMeta, PageListItem } from "./baseclasses";
import { Page } from "./page";
import { BasicArray, BasicMap, IDataGuard, ResourceMgr, WatchableObject } from "./basic";
import { StyleSheet, StyleMangerMember } from "./style";
import { GroupShape, Shape, SymbolShape, TextShape } from "./shape";
import { TableShape } from "./table";
import { SymbolRefShape } from "./symbolref";
import { SymbolMgr } from "./symbolmgr";
import { FMT_VER_latest } from "./fmtver";

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
        if (path.length === 1) { // document
            if (path0 === this.id) return this;
            throw new Error("The shape is not found");
        }
        let target = this as any;
        const path1 = path[1];
        let i = 2;
        if (path1 === 'pages') {
            target = this.__pages;
        } else if (path1 === 'freesymbols') {
            if (!this.freesymbols) this.freesymbols = new BasicMap();
            target = this.freesymbols;
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
    private __symbols: SymbolMgr
    private __styles: ResourceMgr<StyleMangerMember>
    private __medias: ResourceMgr<{ buff: Uint8Array, base64: string }>
    private __versionId: string;
    private __name: string;
    __correspondent: SpecialActionCorrespondent; // 额外动作通信

    constructor(
        id: string,
        name: string,
        versionId: string, // 版本id
        lastCmdId: string, // 此版本最后一个cmd的id
        pagesList: BasicArray<PageListItem>,
        symbolregist: BasicMap<string, string>,
        guard: IDataGuard,
        freesymbols?: BasicMap<string, SymbolShape>,
        stylelib?: BasicArray<StyleSheet>,
    ) {
        super(id, name, FMT_VER_latest, pagesList ?? new BasicArray(), lastCmdId, symbolregist)
        this.__versionId = versionId;
        this.__name = name;
        this.__pages = new ResourceMgr<Page>([id, 'pages'], (data: Page) => guard.guard(data));
        this.__symbols = new SymbolMgr([id, 'symbols'], symbolregist, (data: Shape) => guard.guard(data));
        this.__medias = new ResourceMgr<{ buff: Uint8Array, base64: string }>([id, 'medias']);
        this.__styles = new ResourceMgr<StyleMangerMember>([id, 'styles']);
        this.__correspondent = new SpecialActionCorrespondent();
        this.freesymbols = freesymbols;
        this.stylelib = stylelib;
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
    getSymbolSync(id: string) {
        return this.symbolsMgr.get(id);
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