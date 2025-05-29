/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { objectId } from "../basic/objectid";
import { WatchableObject } from "./basic";
import { Shape, SymbolShape } from "./shape";
import { SymbolRefShape } from "./symbolref";

export class SymbolMgr extends WatchableObject {
    private __resource = new Map<string, { symbols: Array<SymbolShape>, refs: Map<number, SymbolRefShape> }>()
    private __guard?: (data: Shape) => Shape;
    private __crdtpath: string[];

    private __regist: Map<string, string>;

    constructor(crdtpath: string[], regist: Map<string, string>, guard?: (data: Shape) => Shape) {
        super();
        this.__regist = regist;
        this.__guard = guard;
        this.__crdtpath = crdtpath;
    }

    getCrdtPath(): string[] {
        return this.__crdtpath;
    }
    get size() {
        return this.__resource.size;
    }
    get keys() {
        return Array.from(this.__resource.keys());
    }

    get(id: string): SymbolShape | undefined {
        return this._get(id)
    }

    add(id: string, r: SymbolShape) {
        r = this.__guard && this.__guard(r) as SymbolShape || r
        let arr = this.__resource.get(id)
        if (!arr) {
            arr = { symbols: [], refs: new Map() };
            this.__resource.set(id, arr);
        }
        arr.symbols.push(r);

        this._notify(id);

        return r;
    }

    clearDuplicate(id: string) {
        const val = this.__resource.get(id)?.symbols
        if (!val || val.length <= 1) return;

        const s = new Set();
        for (let i = val.length - 1; i >= 0; --i) {
            const v = val[i];
            const p = v.getPage();
            const t = p ? p.id : 'freesymbols';
            if (s.has(t)) {
                val.splice(i, 1);
            } else {
                s.add(t);
            }
        }
    }

    private _get(id: string) {
        const val = this.__resource.get(id)?.symbols
        if (!val) return undefined;

        const reg = this.__regist.get(id);
        if (!reg) return val[val.length - 1];

        let sym;
        // todo val 有多个时，需要提示用户修改
        for (let i = val.length - 1; i >= 0; --i) {
            const v = val[i];
            const p = v.getPage();
            if (!p && reg === 'freesymbols') {
                sym = v;
                break;
            } else if (p && p.id === reg) {
                sym = v;
                break;
            }
        }
        return sym;
    }

    private _notify(id: string) {
        const run = () => {
            const sym = this._get(id);
            if (!sym) return;

            const item = this.__resource.get(id)!;
            item.refs.forEach(ref => ref.onSymbolReady());
        }
        setTimeout(run);
    }

    getRefs(id: string): Map<number, SymbolRefShape> | undefined {
        return this.__resource.get(id)?.refs;
    }
    removeRef(id: string, ref: SymbolRefShape) {
        const item = this.__resource.get(id);
        if (!item) return;
        item.refs.delete(objectId(ref)); // 使用objectId，以防止全局id重复
    }
    addRef(id: string, ref: SymbolRefShape) {
        ref = this.__guard && this.__guard(ref) as SymbolRefShape || ref
        let item = this.__resource.get(id);
        if (!item) {
            item = { symbols: [], refs: new Map() };
            this.__resource.set(id, item);
        }
        item.refs.set(objectId(ref), ref);
    }
}