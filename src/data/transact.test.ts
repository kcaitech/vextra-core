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
import { BasicArray } from './basic';
import { TransactDataGuard } from './transact';

const assert = chai.assert;

test("map", () => {
    const map = new Map();
    map.set(1, 1);
    map.set(0, 0);
    map.set(2, 2);

    const repo = new TransactDataGuard(false);
    const tmap = repo.guard(map);

    assert.Throw(() => { tmap.set(3, 3) });
    assert.equal(map.size, 3);
    for (let i = 0; i < 3; i++) {
        assert.equal(map.get(i), i)
    }

    repo.start("");
    tmap.set(3, 3);
    repo.commit(true);
    assert.equal(map.size, 4);
    for (let i = 0; i < 4; i++) {
        assert.equal(map.get(i), i)
    }

    repo.undo();
    assert.equal(map.size, 3);
    for (let i = 0; i < 3; i++) {
        assert.equal(map.get(i), i)
    }

    repo.redo();
    assert.equal(map.size, 4);
    for (let i = 0; i < 4; i++) {
        assert.equal(map.get(i), i)
    }

    repo.start("");
    tmap.set(4, 4);
    repo.rollback();
    assert.equal(map.size, 4);
    for (let i = 0; i < 4; i++) {
        assert.equal(map.get(i), i)
    }
})
test("BasicArray", () => { // push(x)、push(...xxx)、unshift(x)、splice(0, 1)、splice(0, multi)、length、pop(x)
    const array = new BasicArray();
    array.push(...['alpha', 'beta', 'gamma']); // len 3
    const repo = new TransactDataGuard(false);
    const tarray = repo.guard(array);
    assert.equal(tarray.length, 3);

    // push(x) push(...xxx)
    repo.start("");
    tarray.push('delta'); // push单个 len 4 
    repo.commit(true);
    assert.equal(array.length, 4);
    assert.equal(array.at(-1), 'delta');
    repo.undo();
    assert.equal(array.length, 3);
    assert.equal(array.at(-1), 'gamma');
    repo.redo();
    assert.equal(array.length, 4);
    assert.equal(array.at(-1), 'delta');
    repo.undo(); // ['alpha', 'beta', 'gamma']
    repo.start("");
    tarray.push('delta', 'epsilon', 'zeta', 'eta'); // push 多个 len 7 
    repo.commit(true);
    assert.equal(array.length, 7);
    assert.equal(array.at(-1), 'eta');
    repo.undo();
    repo.redo(); // len 7
    assert.equal(array.length, 7);
    assert.equal(array.at(-1), 'eta');
    repo.undo(); // ['alpha', 'beta', 'gamma']

    // unshift(x)
    repo.start("");
    tarray.unshift('delta'); // len 4
    repo.commit(true);
    assert.equal(array.length, 4);
    assert.equal(array[0], 'delta');
    repo.undo();
    assert.equal(array.length, 3);
    assert.equal(array[0], 'alpha');
    repo.redo();
    assert.equal(array.length, 4);
    assert.equal(array[0], 'delta');
    repo.undo(); // ['alpha', 'beta', 'gamma']

    // splice(0, 1) splice(0, multi)
    repo.start("");
    tarray.splice(0, 1);
    repo.commit(true);
    assert.equal(array.length, 2);
    assert.equal(array[0], 'beta');
    repo.undo();
    assert.equal(array.length, 3);
    assert.equal(array[0], 'alpha');
    repo.redo();
    assert.equal(array.length, 2);
    assert.equal(array[0], 'beta');
    repo.undo(); // ['alpha', 'beta', 'gamma']
    repo.start("");
    tarray.splice(0, 2);
    repo.commit(true);
    assert.equal(array.length, 1);
    assert.equal(array[0], 'gamma');
    repo.undo(); // ['alpha', 'beta', 'gamma']
    assert.equal(array.length, 3);
    assert.equal(array[0], 'alpha');
    repo.redo(); // ['gamma']
    assert.equal(array.length, 1);
    assert.equal(array[0], 'gamma');
    repo.undo();

    // length
    repo.start("");
    tarray.length = 0; // []
    repo.commit(true);
    assert.equal(array.length, 0);
    repo.undo(); // ['alpha', 'beta', 'gamma']
    assert.equal(array.length, 3);
    assert.equal(array[0], 'alpha');
    repo.redo(); // []
    assert.equal(array.length, 0);
    repo.undo(); // ['alpha', 'beta', 'gamma']

    // pop(x)
    repo.start("");
    const last = tarray.pop();
    repo.commit(true);
    assert.equal(last, 'gamma');
    assert.equal(array.at(-1), 'beta');
    repo.undo();
    assert.equal(array.at(-1), 'gamma');
    repo.redo(); // ['alpha', 'beta']
    assert.equal(array.at(-1), 'beta');
})