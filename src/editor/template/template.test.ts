/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// check json schema
import * as chai from 'chai'
import path from "path"
const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

import { Validator } from "../../schema/script/validate"

const schemadir = path.resolve("./src/", "schema")
const validate = new Validator(schemadir);

import group_shape from "./group-shape.json"
test('group-shape', () => {
    const res = validate.validate(group_shape, 'group-shape')
    isTrue(res)
})

import page from "./page.json"
test('page', () => {
    const res = validate.validate(page, 'page')
    isTrue(res)
})

import artboard from "./artboard.json"
test('artboard', () => {
    const res = validate.validate(artboard, 'artboard')
    isTrue(res)
})

import textshape from "./text-shape.json"
test('text-shape', () => {
    const res = validate.validate(textshape, 'text-shape')
    isTrue(res)
})

import rectangle from "./rectangle-shape.json"
test('rectangle-shape', () => {
    isTrue(validate.validate(rectangle, 'rect-shape'))
})

import table from "./table-shape.json"
test('table-shape', () => {
    isTrue(validate.validate(table, 'table-shape'))
})

import tablecell from "./table-cell.json"
test('table-cell', () => {
    isTrue(validate.validate(tablecell, 'table-cell'))
})