import * as chai from 'chai'
import { BitGrid } from './tablelocate';
const assert = chai.assert;

test("bit grid", () => {
    const grid = new BitGrid(3, 3);
    grid.setBit(2, 2);
    assert.isTrue(grid.isSet(2, 2));
    assert.isFalse(grid.isSet(2, 1));
    assert.isFalse(grid.isSet(2, 0));
    assert.isFalse(grid.isSet(1, 2));
    assert.isFalse(grid.isSet(1, 1));
    assert.isFalse(grid.isSet(1, 0));
    assert.isFalse(grid.isSet(0, 2));
    assert.isFalse(grid.isSet(0, 1));
    assert.isFalse(grid.isSet(0, 0));
})