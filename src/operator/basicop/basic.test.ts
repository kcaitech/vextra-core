/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { compArrIndex } from "../basic/crdt"
import { _crdtFixArrIndex, _getMinMaxIndex } from "./basic"
import * as chai from 'chai'
const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

test("_crdtFixArrIndex", () => {

    const testcase = [
        {
            crdtidx: [4]
        },
        {
            crdtidx: [3]
        },
        {
            crdtidx: [2]
        },
        {
            crdtidx: [1]
        },
    ]

    for (let i = 0, len = testcase.length; i < len; ++i) {
        if (i > 0) isFalse(compArrIndex(testcase[i - 1].crdtidx, testcase[i].crdtidx) < 0)
        if (i < len - 1) isFalse(compArrIndex(testcase[i].crdtidx, testcase[i + 1].crdtidx) < 0)
    }

    _crdtFixArrIndex(testcase)


    for (let i = 0, len = testcase.length; i < len; ++i) {
        if (i > 0) isTrue(compArrIndex(testcase[i - 1].crdtidx, testcase[i].crdtidx) < 0)
        if (i < len - 1) isTrue(compArrIndex(testcase[i].crdtidx, testcase[i + 1].crdtidx) < 0)
    }
})


test("_crdtFixArrIndex 2", () => {

    const testcase = [
        {
            crdtidx: []
        },
        {
            crdtidx: []
        },
        {
            crdtidx: []
        },
        {
            crdtidx: []
        },
    ]

    // for (let i = 0, len = testcase.length; i < len; ++i) {
    //     if (i > 0) isFalse(compArrIndex(testcase[i - 1].crdtidx, testcase[i].crdtidx) < 0)
    //     if (i < len - 1) isFalse(compArrIndex(testcase[i].crdtidx, testcase[i + 1].crdtidx) < 0)
    // }

    const minMax = _getMinMaxIndex(testcase)
    isTrue(minMax.max.length === 0 && minMax.min.length === 0, JSON.stringify(minMax))

    _crdtFixArrIndex(testcase)

    // console.log(JSON.stringify(testcase))

    for (let i = 0, len = testcase.length; i < len; ++i) {
        if (i > 0) isTrue(compArrIndex(testcase[i - 1].crdtidx, testcase[i].crdtidx) < 0)
        if (i < len - 1) isTrue(compArrIndex(testcase[i].crdtidx, testcase[i + 1].crdtidx) < 0)
    }
})


test("_crdtFixArrIndex 3", () => {

    const testcase = [
        {
            crdtidx: [0]
        },
        {
            crdtidx: [Number.MAX_VALUE]
        },
        {
            crdtidx: [0]
        },
        {
            crdtidx: [Number.MAX_VALUE]
        },
    ]

    // for (let i = 0, len = testcase.length; i < len; ++i) {
    //     if (i > 0) isFalse(compArrIndex(testcase[i - 1].crdtidx, testcase[i].crdtidx) < 0)
    //     if (i < len - 1) isFalse(compArrIndex(testcase[i].crdtidx, testcase[i + 1].crdtidx) < 0)
    // }

    const minMax = _getMinMaxIndex(testcase)
    isTrue(minMax.max[0] === Number.MAX_VALUE && minMax.min[0] === 0, JSON.stringify(minMax))

    _crdtFixArrIndex(testcase)

    // console.log(JSON.stringify(testcase))

    for (let i = 0, len = testcase.length; i < len; ++i) {
        if (i > 0) isTrue(compArrIndex(testcase[i - 1].crdtidx, testcase[i].crdtidx) < 0)
        if (i < len - 1) isTrue(compArrIndex(testcase[i].crdtidx, testcase[i + 1].crdtidx) < 0)
    }
})