/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Op, OpType } from "./op";

export enum ArrayOpType {
    None,
    Insert,
    Remove,
    Attr,
    Selection,
}

export class ArrayOp implements Op {
    id: string;
    path: string[];
    type: OpType;
    order: number;

    start: number;
    length: number;
    type1: ArrayOpType;

    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
        type1: ArrayOpType
    ) {
        this.id = id; // [pageid]/[textshapeid]/text; [pageid]/[shapeid]/variables/[varid]; [pageid]/[tableshapeid]/[cellid]/text;
        this.path = path;
        this.type = OpType.Array
        this.order = order
        this.start = start
        this.length = length
        this.type1 = type1
    }

    transBy(op: ArrayOp): ArrayOp {
        return this;
    }
}

export class ArrayOpNone extends ArrayOp {
    constructor(
        id: string,
        path: string[],
        order: number,
    ) {
        super(
            id, path, order, -1, 0, ArrayOpType.None
        )
    }
}

export class ArrayOpInsert extends ArrayOp {

    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
    ) {
        super(
            id, path, order, start, length, ArrayOpType.Insert
        )
    }

    clone(): ArrayOpInsert {
        return new ArrayOpInsert(this.id, this.path, this.order, this.start, this.length)
    }

    _transByInsert(op: ArrayOpInsert): ArrayOp {
        const lhs_start = op.start;
        let rhs_start = this.start;
        if (lhs_start > rhs_start) { // op在右边
            return this
        } else if (lhs_start < rhs_start) { // op在左边，或与op位置相同但op的order更小
            rhs_start += op.length
        } else {
            const order = (op.order - this.order);
            if (order < 0) {
                rhs_start += op.length
            } else if (order === 0) {
                throw new Error();
            }
        }
        const t_op = this.clone()
        t_op.start = rhs_start
        return t_op
    }

    _transByRemove(op: ArrayOpRemove): ArrayOp {
        const lhs_start = op.start
        const lhs_len = op.length
        const rhs_start = this.start
        if (lhs_start >= rhs_start) { // op在右边
            return this;
        }
        if (lhs_start + lhs_len <= rhs_start) { // op在左边
            const t_op = this.clone()
            t_op.start -= lhs_len
            return t_op
        }
        return new ArrayOpNone(this.id, this.path, this.order) // 起点被op包含
    }

    _transByAttr(op: ArrayOpAttr): ArrayOp {
        return this;
    }

    _transBySelection(op: ArrayOpSelection): ArrayOp {
        // todo 改变本地selection
        return this
    }

    transBy(op: ArrayOp): ArrayOp {
        switch (op.type1) {
            case ArrayOpType.None:
                return this
            case ArrayOpType.Insert:
                return this._transByInsert(op as ArrayOpInsert)
            case ArrayOpType.Remove:
                return this._transByRemove(op as ArrayOpRemove)
            case ArrayOpType.Attr:
                return this._transByAttr(op as ArrayOpAttr)
            case ArrayOpType.Selection:
                return this._transBySelection(op as ArrayOpSelection)
        }
    }
}

export class ArrayOpRemove extends ArrayOp {

    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
    ) {
        super(
            id, path, order, start, length, ArrayOpType.Remove
        )
    }

    clone(): ArrayOpRemove {
        return new ArrayOpRemove(this.id, this.path, this.order, this.start, this.length)
    }

    _transByInsert(op: ArrayOpInsert): ArrayOp {
        const lhs_start = op.start
        const lhs_len = op.length
        const rhs_start = this.start
        const rhs_end = rhs_start + this.length
        if (lhs_start <= rhs_start) { // op在左边
            const t_op = this.clone()
            t_op.start += lhs_len
            return t_op
        }
        if (lhs_start < rhs_end) { // op在中间
            const t_op = this.clone()
            t_op.length += lhs_len
            return t_op
        }
        return this; // op在右边
    }

    _transByRemove(op: ArrayOpRemove): ArrayOp {
        const lhs_start = op.start
        const lhs_len = op.length
        const rhs_start = this.start
        const rhs_len = this.length
        if (lhs_start + lhs_len <= rhs_start) { // 不相交，op在左边
            const t_op = this.clone()
            t_op.start -= lhs_len
            return t_op
        }
        if (lhs_start >= rhs_start + rhs_len) { // 不相交，op在右边
            return this;
        }
        if (lhs_start <= rhs_start && lhs_start + lhs_len >= rhs_start + rhs_len) { // 被op包含
            return new ArrayOpNone(this.id, this.path, this.order)
        }
        if (lhs_start >= rhs_start && lhs_start + lhs_len <= rhs_start + rhs_len) { // 包含op
            const t_op = this.clone()
            t_op.length -= lhs_len
            return t_op
        }
        if (lhs_start < rhs_start) { // 相交，op在左边
            const t_op = this.clone()
            const inter_len = lhs_start + lhs_len - rhs_start // 相交部分的长度
            t_op.start -= op.length - inter_len
            t_op.length -= inter_len
            return t_op
        }
        if (lhs_start > rhs_start) { // 相交，op在右边
            const t_op = this.clone()
            const inter_len = rhs_start + rhs_len - lhs_start // 相交部分的长度
            t_op.length -= inter_len
            return t_op
        }
        throw new Error("Cant be here")
    }

    _transByAttr(op: ArrayOpAttr): ArrayOp {
        return this;
    }

    _transBySelection(op: ArrayOpSelection): ArrayOp {
        // todo 改变本地selection
        return this
    }

    transBy(op: ArrayOp): ArrayOp {
        switch (op.type1) {
            case ArrayOpType.None:
                return this
            case ArrayOpType.Insert:
                return this._transByInsert(op as ArrayOpInsert)
            case ArrayOpType.Remove:
                return this._transByRemove(op as ArrayOpRemove)
            case ArrayOpType.Attr:
                return this._transByAttr(op as ArrayOpAttr)
            case ArrayOpType.Selection:
                return this._transBySelection(op as ArrayOpSelection)
        }
    }
}

export class ArrayOpAttr extends ArrayOp {

    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
    ) {
        super(
            id, path, order, start, length, ArrayOpType.Attr
        )
    }

    clone(): ArrayOpAttr {
        return new ArrayOpAttr(this.id, this.path, this.order, this.start, this.length)
    }

    _transByInsert(op: ArrayOpInsert): ArrayOp {
        const lhs_start = op.start
        const lhs_len = op.length
        const rhs_start = this.start
        const rhs_len = this.length
        if (lhs_start > rhs_start && lhs_start < rhs_start + rhs_len) { // op在中间
            const t_op = this.clone()
            t_op.length += lhs_len
            return t_op
        }
        if (lhs_start <= rhs_start) { // op在左边
            const t_op = this.clone()
            t_op.start += lhs_len
            return t_op
        }
        return this;
    }

    _transByRemove(op: ArrayOpRemove): ArrayOp {
        const lhs_start = op.start
        const lhs_len = op.length
        const rhs_start = this.start
        const rhs_len = this.length
        if (lhs_start + lhs_len <= rhs_start) { // 不相交，op在左边
            const t_op = this.clone()
            t_op.start -= lhs_len
            return t_op
        }
        if (lhs_start >= rhs_start + rhs_len) { // 不相交，op在右边
            return this;
        }
        if (lhs_start <= rhs_start && lhs_start + lhs_len >= rhs_start + rhs_len) { // 被op包含
            return new ArrayOpNone(this.id, this.path, this.order)
        }
        if (lhs_start >= rhs_start && lhs_start + lhs_len <= rhs_start + rhs_len) { // 包含op
            const t_op = this.clone()
            t_op.length -= lhs_len
            return t_op
        }
        if (lhs_start < rhs_start) { // 相交，op在左边
            const t_op = this.clone()
            const inter_len = lhs_start + lhs_len - rhs_start // 相交部分的长度
            t_op.start -= op.length - inter_len
            t_op.length -= inter_len
            return t_op
        }
        if (lhs_start > rhs_start) { // 相交，op在右边
            const t_op = this.clone()
            const inter_len = lhs_start + lhs_len - rhs_start // 相交部分的长度
            t_op.length -= inter_len
            return t_op
        }
        throw new Error("Cant be here")
    }

    _transByAttr(op: ArrayOpAttr): ArrayOp {
        return this;
    }

    _transBySelection(op: ArrayOpSelection): ArrayOp {
        return this
    }

    transBy(op: ArrayOp): ArrayOp {
        switch (op.type1) {
            case ArrayOpType.None:
                return this
            case ArrayOpType.Insert:
                return this._transByInsert(op as ArrayOpInsert)
            case ArrayOpType.Remove:
                return this._transByRemove(op as ArrayOpRemove)
            case ArrayOpType.Attr:
                return this._transByAttr(op as ArrayOpAttr)
            case ArrayOpType.Selection:
                return this._transBySelection(op as ArrayOpSelection)
        }
    }
}

export class ArrayOpSelection extends ArrayOp {

    constructor(
        id: string,
        path: string[],
        order: number,
        start: number,
        length: number,
    ) {
        super(
            id, path, order, start, length, ArrayOpType.Selection
        )
    }

    clone(): ArrayOpSelection {
        return new ArrayOpSelection(this.id, this.path, this.order, this.start, this.length)
    }

    _transByInsert(op: ArrayOpInsert): ArrayOp {
        const lhs_start = op.start
        const lhs_len = op.length
        const rhs_start = this.start
        const rhs_len = this.length
        if (lhs_start > rhs_start && lhs_start < rhs_start + rhs_len) { // op在中间
            const t_op = this.clone()
            t_op.length += lhs_len
            return t_op
        }
        if (lhs_start <= rhs_start) { // op在左边
            const t_op = this.clone()
            t_op.start += lhs_len
            return t_op
        }
        return this;
    }

    _transByRemove(op: ArrayOpRemove): ArrayOp {
        const lhs_start = op.start
        const lhs_len = op.length
        const rhs_start = this.start
        const rhs_len = this.length
        if (lhs_start + lhs_len <= rhs_start) { // 不相交，op在左边
            const t_op = this.clone()
            t_op.start -= lhs_len
            return t_op
        }
        if (lhs_start >= rhs_start + rhs_len) { // 不相交，op在右边
            return this;
        }
        if (lhs_start <= rhs_start && lhs_start + lhs_len >= rhs_start + rhs_len) { // 被op包含
            return new ArrayOpSelection(this.id, this.path, this.order, lhs_start, 0)
        }
        if (lhs_start >= rhs_start && lhs_start + lhs_len <= rhs_start + rhs_len) { // 包含op
            const t_op = this.clone()
            t_op.length -= lhs_len
            return t_op
        }
        if (lhs_start < rhs_start) { // 相交，op在左边
            const t_op = this.clone()
            const inter_len = lhs_start + lhs_len - rhs_start // 相交部分的长度
            t_op.start -= op.length - inter_len
            t_op.length -= inter_len
            return t_op
        }
        if (lhs_start > rhs_start) { // 相交，op在右边
            const t_op = this.clone()
            const inter_len = lhs_start + lhs_len - rhs_start // 相交部分的长度
            t_op.length -= inter_len
            return t_op
        }
        throw new Error("Cant be here")
    }

    _transByAttr(op: ArrayOpAttr): ArrayOp {
        return this
    }

    _transBySelection(op: ArrayOpSelection): ArrayOp {
        return this
    }

    transBy(op: ArrayOp): ArrayOp {
        switch (op.type1) {
            case ArrayOpType.None:
                return this
            case ArrayOpType.Insert:
                return this._transByInsert(op as ArrayOpInsert)
            case ArrayOpType.Remove:
                return this._transByRemove(op as ArrayOpRemove)
            case ArrayOpType.Attr:
                return this._transByAttr(op as ArrayOpAttr)
            case ArrayOpType.Selection:
                return this._transBySelection(op as ArrayOpSelection)
        }
    }
}
