// check json schema
import * as chai from 'chai'
import path from "path"
const {
    equal, strictEqual, deepEqual, throws,
    isFalse, isTrue, isUndefined, isNaN, isOk,
    fail,
} = chai.assert

import { Validator } from "../../script/schema/validate"

const schemadir = path.resolve(".", "schema")
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