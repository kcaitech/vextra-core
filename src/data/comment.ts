/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import * as classes from "./baseclasses";
export { UserInfo } from "./baseclasses"
export class Comment extends (classes.Comment) {
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

    status:number;
    constructor(
        pageId: string,
        id: string,
        frame: classes.ShapeFrame,
        user: classes.UserInfo,
        createAt: string,
        content: string,
        parasiticBody: classes.Shape,
        parentId?: string,
        rootId?: string,
    ) {
        super(pageId, id, frame, user, createAt, content, parasiticBody);
        this.status = 0;
        this.parentId = parentId;
        this.rootId = rootId;
    }
    setStatus(status: number) {
        this.status = status
    }
}