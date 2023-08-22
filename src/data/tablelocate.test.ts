import * as chai from 'chai'
import { BitGrid } from "../basic/grid";
const assert = chai.assert;

test("bit grid", () => {
    const grid = new BitGrid(3, 3);
    grid.set(2, 2, true);
    assert.isTrue(grid.get(2, 2));
    assert.isFalse(grid.get(2, 1));
    assert.isFalse(grid.get(2, 0));
    assert.isFalse(grid.get(1, 2));
    assert.isFalse(grid.get(1, 1));
    assert.isFalse(grid.get(1, 0));
    assert.isFalse(grid.get(0, 2));
    assert.isFalse(grid.get(0, 1));
    assert.isFalse(grid.get(0, 0));
})