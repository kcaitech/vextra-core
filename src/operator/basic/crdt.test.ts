/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import * as chai from 'chai'
import { compArrIndex, genArrIndex, isGoodCrdtArr, MAX_INT } from './crdt'

const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

const testcase = [
    [[0], [0], 0, [0]],
    [[0, 1], [0], 1, [0, 0]],
    [[0, -1], [0], 1, [0, -2]],
    [[1], [0], 1, [0, 0]],
    [[1, 0], [0], 1, [0, 0]],
    [[1], [3], -1, [2]],
    [[1], [2], -1, [1, 0]],
    [[1, 1, -1], [1, 1], 1, [1, 1, -2]],
    [[1, 1, -1], [1, 1, 0], -1, [1, 1, -1, 0]],
]
test("compArrIndex", () => {

    testcase.forEach(t => {
        const r = compArrIndex(t[0] as number[], t[1] as number[])
        if (r === 0) isTrue(t[2] === 0, JSON.stringify(t))
        else if (r < 0) isTrue(t[2] === -1, JSON.stringify(t))
        else isTrue(t[2] === 1, JSON.stringify(t))
    })
})

test("genArrIndex", () => {

    testcase.forEach(t => {
        const r = compArrIndex(t[0] as number[], t[1] as number[])
        if (r === 0) {
            const i = genArrIndex(t[0] as number[], t[1] as number[], 1)
            isTrue(i === undefined, "valid fail: " + JSON.stringify(t))
        }
        else if (r < 0) {
            const i = genArrIndex(t[0] as number[], t[1] as number[], 1)
            isTrue(JSON.stringify(i) === JSON.stringify(t[3]), JSON.stringify(t))
        }
        else {
            const i = genArrIndex(t[1] as number[], t[0] as number[], 1)
            isTrue(JSON.stringify(i) === JSON.stringify(t[3]), JSON.stringify(t) + JSON.stringify(i))
        }
    })
})


test("compArrIndex 2", () => {

    testcase.forEach(t => {
        const r = compArrIndex(t[0] as number[], t[1] as number[])
        if (r < 0) {
            isTrue(compArrIndex(t[0] as number[], t[3] as number[]) < 0)
            isTrue(compArrIndex(t[1] as number[], t[3] as number[]) > 0)
        }
        else if (r > 0) {
            isTrue(compArrIndex(t[1] as number[], t[3] as number[]) < 0)
            isTrue(compArrIndex(t[0] as number[], t[3] as number[]) > 0)
        }
    })
})

const testcase2 = [
    [[MAX_INT - 1], undefined, [MAX_INT]],
    [[MAX_INT], undefined, [MAX_INT, 0]],
    [[MAX_INT, 0], undefined, [MAX_INT, 1]],
    [[MAX_INT, MAX_INT], undefined, [MAX_INT, MAX_INT, 0]],
    [[MAX_INT], undefined, [MAX_INT, 0]],
    [[MAX_INT, 1], undefined, [MAX_INT, 2]],
    [[MAX_INT, 1, 1], [MAX_INT, 2], [MAX_INT, 1, 2]],
    [[1, MAX_INT], undefined, [2]],
    [[MAX_INT + 100], undefined, [MAX_INT + 100, 0]], // 这个应该也会溢出

    [undefined, [-MAX_INT + 1], [-MAX_INT, 0]],
    [undefined, [-MAX_INT, 0], [-MAX_INT, -1]],
    [undefined, [-MAX_INT, -1], [-MAX_INT, -2]],
    [undefined, [-MAX_INT, -MAX_INT + 1], [-MAX_INT, -MAX_INT, 0]],
    // [undefined, [-MAX_INT - 1], [-MAX_INT - 2, 0]], // 这个会溢出

    [[-MAX_INT, 1, 1], [-MAX_INT, 2], [-MAX_INT, 1, 2]],

]
test("genArrIndex 2", () => {
    // 边界值测试
    testcase2.forEach(t => {
        const i = genArrIndex(t[0], t[1], 1)
        isTrue(JSON.stringify(i) === JSON.stringify(t[2]), JSON.stringify(i) + JSON.stringify(t[2]))
    })
})
// -9007199254740990
test("genArrIndex 3", () => {
    // 边界值测试
    testcase2.forEach(t => {
        const i = genArrIndex(t[0], t[1], 1)
        if (t[0]) isTrue(compArrIndex(t[0] as number[], i as number[]) < 0, '1:' + JSON.stringify(t) + JSON.stringify(i))
        if (t[1]) isTrue(compArrIndex(t[1] as number[], i as number[]) > 0, '2:' + JSON.stringify(t) + JSON.stringify(i))
    })
})

test("genArrIndex 4", () => {
    // 边界值测试
    const i = genArrIndex([3230], [3231])!
    isTrue(compArrIndex([3230], i) < 0)
    isTrue(compArrIndex(i, [3231]) < 0)
    isTrue(i.length === 2)

    const i2 = genArrIndex([3231], [3230])
    isTrue(i2 === undefined)
})

test("genArrIndex 5", () => {
    // 边界值测试
    const i = genArrIndex([337, 0], [337, 289])!
    isTrue(compArrIndex([337, 0], i) < 0, JSON.stringify(i))
    isTrue(compArrIndex(i, [337, 289]) < 0)
    isTrue(i.length === 2)
})

test("genArrIndex 6", () => {
    // 边界值测试
    const i = genArrIndex([337, 0], [337, 0, 0])!
    isTrue(compArrIndex([337, 0], i) < 0, JSON.stringify(i))
    isTrue(compArrIndex(i, [337, 0, 0]) < 0)
    isTrue(i.length === 3)
})

test("genArrIndex 7", () => {
    // 边界值测试
    const i = genArrIndex([337, 0], undefined)!
    isTrue(compArrIndex([337, 0], i) < 0, JSON.stringify(i))
    // isTrue(compArrIndex(i, [337, 0, 0]) < 0)
    // isTrue(i.length === 2)
})

test("isGoodCrdtArr", () => {
    const testcase1 = [
        {
            crdtidx: [0]
        },
        {
            crdtidx: [1]
        },
        {
            crdtidx: [2]
        },
        {
            crdtidx: [3]
        },
        {
            crdtidx: [4]
        },
    ]

    isTrue(isGoodCrdtArr(testcase1))

    const testcase2 = [
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
            crdtidx: [3]
        },
        {
            crdtidx: [4]
        },
    ]

    isFalse(isGoodCrdtArr(testcase2))

    const testcase3 = [
        {
            crdtidx: [0]
        },
        {
            crdtidx: [1]
        },
        {
            crdtidx: []
        },
        {
            crdtidx: [3]
        },
        {
            crdtidx: [4]
        },
    ]

    isFalse(isGoodCrdtArr(testcase3))
})