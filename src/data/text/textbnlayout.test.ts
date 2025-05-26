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
import { toLetterNumber, toRomanNumber } from './textbnlayout';

const assert = chai.assert;

test("toLetterNumber", () => {
    assert.equal(toLetterNumber(0), 'a');
    assert.equal(toLetterNumber(25), 'z');
    assert.equal(toLetterNumber(26), 'aa');
    assert.equal(toLetterNumber(27), 'ab');
    assert.equal(toLetterNumber(52), 'ba');
    assert.equal(toLetterNumber(Math.pow(26, 1)), 'aa');
    assert.equal(toLetterNumber(Math.pow(26, 2)), 'aaa');
    assert.equal(toLetterNumber(Math.pow(26, 3)), 'aaaa');
    assert.equal(toLetterNumber(Math.pow(26, 3) + 1), 'aaab');
    assert.equal(toLetterNumber(Math.pow(26, 3) + Math.pow(26, 2) + Math.pow(26, 1) + 1), 'abbb');
})

test("toRomanNumber", () => {
    assert.equal(toRomanNumber(1), 'I');
    assert.equal(toRomanNumber(2), 'II');
    assert.equal(toRomanNumber(3), 'III');
    assert.equal(toRomanNumber(4), 'IV');
    assert.equal(toRomanNumber(50), 'L');
    assert.equal(toRomanNumber(51), 'LI');
    assert.equal(toRomanNumber(3000), 'MMM');
    assert.equal(toRomanNumber(3999), 'MMMCMXCIX');
    assert.equal(toRomanNumber(4000), 'I');
})