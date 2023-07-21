// check json schema
import * as chai from 'chai'
import path from "path"
const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

import { Validator } from "../../script/schema/validate"

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

import flattenshape from "./flatten-shape.json"
test('flatten-shape', () => {
    isTrue(validate.validate(flattenshape, 'flatten-shape'))
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