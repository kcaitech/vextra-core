/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ArrayOp } from "../operator";

export function transform(lhs: ArrayOp[], rhs: ArrayOp[]): { lhs: ArrayOp[], rhs: ArrayOp[] } {

    if (lhs.length === 0 || rhs.length === 0) return { lhs, rhs };

    const tlhs: ArrayOp[][] = [lhs];
    const trhs: ArrayOp[][] = [];

    const rlen = rhs.length;
    const llen = lhs.length;
    for (let i = 0; i < rlen; ++i) {

        lhs = tlhs[i];
        let rop = rhs[i];

        const _lhs: ArrayOp[] = [];
        const _rhs: ArrayOp[] = [];
        tlhs.push(_lhs);
        trhs.push(_rhs);

        for (let j = 0; j < llen; ++j) {
            const lop = lhs[j];
            _lhs.push(lop.transBy(rop));
            _rhs.push(rop.transBy(lop));
            rop = _rhs[_rhs.length - 1];
        }
    }

    rhs = trhs.reduce((result, arr) => {
        result.push(arr[arr.length - 1]);
        return result;
    }, [] as ArrayOp[])

    return { lhs: tlhs[tlhs.length - 1], rhs };
}