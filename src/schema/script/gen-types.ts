const fs = require("fs")
const path = require("path")
import { fileName2TypeName, extractRefFileName, indent, headTips, loadSchemas, orderSchemas } from './basic'

const schemaext = '.json'
const typesext = '.ts'
const schemadir = path.resolve('./')
const outdir = path.resolve('../data/')
const outfile = path.join(outdir, 'typesdefine' + typesext)


const handler:{[key: string]: (schema: any, className: string, level: number) => string} = {}
handler['object'] = function (schema: any, className: string, level: number) {
    let ret = ''
    if (schema.allOf) {
        ret += handler['allOf'](schema.allOf, className, level)
        ret += ' & '
    }

    const properties = schema.properties
    if (!properties) {
        return '{}'
    }
    const required = schema.required || []
    const keys = Object.keys(properties)
    ret += '{\n'

    for (let i = 0; i < keys.length; i++) {
        let k = keys[i]
        let v = properties[k]

        ret += indent(level + 1) + k
        
        if (required.indexOf(k) < 0) ret += '?'

        ret += ': '
        ret += handler['type'](v, className, level + 1)
        ret += '\n'
    }
    ret += indent(level) + '}'
    return ret
}

handler['$ref'] = function (schema: any, className: string, level: number) {
    if (schema == '#') {
        return className
    }
    else if (schema.endsWith(schemaext)) {
        return fileName2TypeName(extractRefFileName(schema))
    }
    else {
        throw new Error("unknow schema : " + schema.toString())
    }
}
handler['type'] = function (schema: any, className: string, level: number) {
    if (schema['$ref']) {
        return handler['$ref'](schema['$ref'], className, level)
    }
    else if (schema.type == 'number' || schema.type == 'integer') {
        return 'number'
    }
    else if (schema.type == 'string') {
        return 'string'
    }
    else if (schema.type == 'boolean') {
        return 'boolean'
    }
    else if (schema.type == 'object') {
        return handler['object'](schema, className, level)
    }
    else if (schema.type == 'array') {
        return handler['array'](schema, className, level)
    }
    else if (schema.oneOf) {
        return handler['oneOf'](schema.oneOf, className, level)
    }
    else if (schema.allOf) {
        return handler['allOf'](schema.allOf, className, level)
    }
    else {
        throw new Error("Unknow Type : " + schema.toString())
    }
}

handler['oneOf'] = function (schema: any, className: string, level: number) {
    let ret = ''
    for (let i = 0; i < schema.length; i++) {
        let o = schema[i]
        if (i > 0) ret += ' | '
        ret += handler['type'](o, className, level)
    }
    if (schema.length > 1) return '(' + ret + ')'
    return ret
}

handler['allOf'] = function (schema: any, className: string, level: number) {
    let ret = ''
    for (let i = 0; i < schema.length; i++) {
        let o = schema[i]
        if (i > 0) ret += ' & '
        ret += handler['type'](o, className, level)
    }
    if (schema.length > 1) return '(' + ret + ')'
    return ret
}

handler['array'] = function (schema: any, className: string, level: number) {
    let items = schema.items
    return handler['type'](items, className, level) + '[]'
}

function exportTypes(schema: any, className: string, level: number) {
    let ret = ''
    // description
    if (schema.description) {
        ret += indent(level) + '/* ' + schema.description + ' */\n'
    }
    if (schema.enum) {
        ret += indent(level) + 'export enum ' + className + ' {\n'
        for (let i = 0; i < schema.enum.length; i++) {
            const e = schema.enum[i]
            ret += indent(level + 1) + fileName2TypeName(e) + " = " + "'" + e + "',\n"
        }
        ret += indent(level) + '}'
    }
    else {
        ret += indent(level) + 'export type ' + className + ' = '
        ret += handler['object'](schema, className, level)
    }
    ret += '\n'
    return ret;
}

export function gentypes() {
    const all = loadSchemas(schemadir);

    const order = orderSchemas(all);

    if (fs.existsSync(outfile)) fs.rmSync(outfile)
    fs.appendFileSync(outfile, headTips);

    order.sort((a, b) => a.order - b.order)
    for (let i = 0, len = order.length; i < len; i++) {
        const v = order[i]
        const t = exportTypes(v.schema, v.className, 0)
        fs.appendFileSync(outfile, t);
    }
}
