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
        throw new Error("Not implemented");
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
}
