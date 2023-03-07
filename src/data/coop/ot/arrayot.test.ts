import * as chai from 'chai'
import { ArrayOt } from './arrayot'

const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

test('unit order', () => {
    const i0 = new ArrayOt.OpArrayInsert(0, 0, 1);
    const i1 = new ArrayOt.OpArrayInsert(1, 0, 1);
    const t0b1 = i0.transBy(i1);
    strictEqual(t0b1.range.start, 0);
    const t1b0 = i1.transBy(i0);
    strictEqual(t1b0.range.start, 1);
})