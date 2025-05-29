/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { FoldDirIter, FoldDirTree } from "../basic/folddirtree";
import { WatchableObject } from "../data/basic";
import { Page } from "../data/page";
import { Shape, GroupShape } from "../data/shape";

export type ShapeDirListIter = FoldDirIter<Shape | GroupShape>;

/**
 * notify 如果index 为 -1 时，些节点是不可见的，不需要更新界面
 */
export class ShapeDirList extends WatchableObject {

    private __dirtree: FoldDirTree<Shape | GroupShape>
    private __watchers: Map<string, (...args: any[]) => void> = new Map()
    // private __saveUnfolds: Set<string> = new Set();

    constructor(page: Page) {
        super();
        this.__dirtree = new FoldDirTree<Shape | GroupShape>({ data: page, saveFoldedDirState: true });
        this.__dirtree.onAfterFold((it) => {
            while (it.hasNext()) {
                const d = it.next();
                if (!d.fold) {
                    const l = this.__watchers.get(d.data.id)
                    if (l) {
                        this.__watchers.delete(d.data.id)
                        d.data.unwatch(l);
                    }
                }
            }
        })
        this.__dirtree.onAfterUnfold((data) => {
            const id = data.id;
            const shape = data;
            const l = (...args: any[]) => {
                // insert delete
                this.onShapeChange(shape, ...args)
            }
            data.watch(l);
            this.__watchers.set(id, l);
        })

        this.expand(page);
    }

    private onShapeChange(shape: Shape, ...args: any[]) {
        if (args.indexOf('childs') < 0) return;

        this.__dirtree.updateChilds(shape);

        this.notify("changed");
    }

    has(d: string | Shape): boolean {
        return this.__dirtree.has(d);
    }

    get length(): number {
        return this.__dirtree.length - 1; // 不算root
    }
    iterAt(index: number): ShapeDirListIter {
        return this.__dirtree.iterAt(index + 1);
    }
    private __expand(shape: Shape): boolean {
        const ret = this.__dirtree.unfold(shape);
        // if (ret) this.__saveUnfolds.add(shape.id);
        return ret;
    }
    expand(shape: Shape): boolean {
        const saveLen = this.length;
        if (this.__expand(shape)) {
            this.notify("expand", this.indexOf(shape), this.length - saveLen);
            return true;
        }
        return false;
    }
    shrink(shape: Shape): boolean {
        const saveLen = this.length;
        if (this.__dirtree.fold(shape)) {
            this.notify("shrink", this.indexOf(shape), saveLen - this.length);
            return true;
        }
        return false;
    }

    isExpand(shape: Shape): boolean {
        return !this.__dirtree.isFold(shape);
    }

    toggleExpand(shape: Shape): boolean {
        if (this.isExpand(shape)) {
            return this.shrink(shape);
        }
        else {
            return this.expand(shape);
        }
    }

    indexOf(shape: Shape): number {
        return this.__dirtree.indexOf(shape) - 1;
    }
}