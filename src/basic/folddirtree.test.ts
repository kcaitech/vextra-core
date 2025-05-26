/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import * as chai from 'chai'
import { assert } from 'chai'
import { FoldDirTree } from './folddirtree'

const {
  equal, strictEqual, deepEqual, throws,
  isFalse, isTrue, isUndefined, isNaN, isOk,
  fail,
} = chai.assert

const dir = {
    id: "1",
    naviChilds: [
        {
            id: "2",
            naviChilds: [
                {
                    id: "3"
                }
            ]
        },
        {
            id: "4",
            naviChilds: [
                {
                    id: "5"
                },
                {
                    id: "6"
                }
            ]
        }
    ]
}

test("", () => {
    const tree = new FoldDirTree<{id: string, naviChilds?: any[]}>({
        data: dir,
    });
    isTrue(tree.length === 1)
    isTrue(tree.at(0)?.data.id === "1")
    isTrue(tree.at(0)?.fold === true)

    isTrue(tree.unfold(dir))
    isTrue(tree.length === 3)
    isTrue(tree.at(0)?.data.id === "1")
    isTrue(tree.at(0)?.fold === false)

    isTrue(tree.fold(dir))
    isTrue(tree.length === 1)
    isTrue(tree.at(0)?.data.id === "1")
    isTrue(tree.at(0)?.fold === true)

    isTrue(tree.unfold(dir))
    isTrue(tree.length === 3)
    isTrue(tree.at(0)?.data.id === "1")
    isTrue(tree.at(0)?.fold === false)

    let it = tree.iterAt(0)
    let expectid = ["1", "4", "2"]
    for (let i = 0; i < expectid.length; i++) {
        isTrue(it.hasNext())
        const v = it.next()
        if (i > 0) isTrue(v.fold, JSON.stringify(v))
        isTrue(v.data.id == expectid[i])
    }

    isTrue(tree.unfold(dir.naviChilds[0]))
    equal(tree.length, 4)
    equal(tree.at(0)?.data.id, "1")
    equal(tree.at(0)?.fold, false)

    it = tree.iterAt(0)
    expectid = ["1", "4", "2", "3"]
    let expectfold = [false, true, false, true]
    for (let i = 0; i < expectid.length; i++) {
        isTrue(it.hasNext())
        const v = it.next()
        equal(v.fold, expectfold[i])
        equal(v.data.id, expectid[i])
    }

    isTrue(tree.fold(dir.naviChilds[0]))
    isTrue(tree.length === 3)
    isTrue(tree.at(0)?.data.id === "1")
    isTrue(tree.at(0)?.fold === false)

    it = tree.iterAt(0)
    expectid = ["1", "4", "2"]
    for (let i = 0; i < expectid.length; i++) {
        isTrue(it.hasNext())
        const v = it.next()
        if (i > 0) isTrue(v.fold, JSON.stringify(v))
        isTrue(v.data.id == expectid[i])
    }
})