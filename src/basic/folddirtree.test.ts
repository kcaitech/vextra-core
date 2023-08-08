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
    childs: [
        {
            id: "2",
            childs: [
                {
                    id: "3"
                }
            ],
            childsVisible: true
        },
        {
            id: "4",
            childs: [
                {
                    id: "5"
                },
                {
                    id: "6"
                }
            ],
            childsVisible: true
        }
    ],
    childsVisible: true
}

test("", () => {
    const tree = new FoldDirTree<{id: string, childs?: any[], childsVisible: boolean}>({
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

    isTrue(tree.unfold(dir.childs[0]))
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

    isTrue(tree.fold(dir.childs[0]))
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