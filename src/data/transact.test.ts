import * as chai from 'chai'
import { Repository } from './transact';

const assert = chai.assert;

test("map", () => {
    const map = new Map();
    map.set(1, 1);
    map.set(0, 0);
    map.set(2, 2);

    const repo = new Repository({ settrap: false, needundo: true });
    const tmap = repo.guard(map);

    assert.Throw(() => { tmap.set(3, 3) });
    assert.equal(map.size, 3);
    for (let i = 0; i < 3; i++) {
        assert.equal(map.get(i), i)
    }

    repo.start("", {});
    tmap.set(3, 3);
    repo.commit();
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

    repo.start("", {});
    tmap.set(4, 4);
    repo.rollback();
    assert.equal(map.size, 4);
    for (let i = 0; i < 4; i++) {
        assert.equal(map.get(i), i)
    }
})