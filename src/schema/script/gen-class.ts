import { loadSchemas, mergeAllOf, orderSchemas } from "../../script/schema/basic"

const fs = require("fs")
const path = require("path")
const { fileName2TypeName, extractRefFileName, indent, headTips } = require("../../script/schema/basic")

const schemaext = '.json'


const handler: {[key: string]: (schema: any, className: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) => string} & { schemadir?: string } = {}
handler['object'] = function (schema: any, className: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    let ret = ''
    // 继承
    let required = new Set<string>()
    let requiredArray: any[][] = []
    let props = new Map<string, {
        schema: any,
        className: string,
        filename: string
    }>()
    if (schema.allOf) {
        if (schema.allOf.length == 0) {
            console.error('enpty allOf')
        }
        if (schema.allOf.length > 1) {
            console.error('Too many allOf items')
        }
        if (schema.allOf.length > 0) {

            ret += 'extends '
            let o = schema.allOf[0]
            // if (i > 0) ret += ' & '
            ret += handler['type'](o, className, level, filename, allschemas)
            ret += ' '
            // ret += handler['allOf'](schema.allOf, className, level)
            // ret += ' & '

            mergeAllOf(schema.allOf, props, required, requiredArray, allschemas, handler.schemadir!)
        }
    }
    else {
        ret += 'extends Basic '
    }

    const properties = schema.properties
    ret += '{'
    if (filename) ret += '\n' + indent(level + 1) + 'typeId = \'' + filename + '\''
    if (properties) {
        const required = schema.required || []
        const keys = Object.keys(properties)
        ret += '\n'
        for (let i = 0; i < keys.length; i++) {
            let k = keys[i]
            let v = properties[k]

            if (props.has(k)) {
                if (JSON.stringify(v) != JSON.stringify(props.get(k)?.schema)) {
                    console.error('duplicate attribute: ' + k + ' at: ' + className, props.get(k), v)
                }
            }
            else {
                props.set(k, {
                    schema: v,
                    className,
                    filename
                })
            }
    
            if (k == 'typeId') {}
            else {
                ret += indent(level + 1) + k
                if (required.indexOf(k) < 0) ret += '?'
                ret += ': '
                ret += handler['type'](v, className, level + 1, filename, allschemas)
                ret += '\n'
            }
        }
    }

    // const superRequired = new Set(required)
    const superRequiredArray = [...requiredArray]

    // constructor
    if (schema.properties) {
        let keys = Object.keys(schema.properties)
        for (let i = 0; i < keys.length; i++) {
            let k = keys[i]
            let v = schema.properties[keys[i]]
            if (props.has(k)) {
                if (JSON.stringify(v) != JSON.stringify(props.get(k)?.schema)) {
                    console.error('duplicate attribute: ' + k + ' at: ' + className, props.get(k), v)
                }
            }
            else {
                props.set(k, {
                    schema: v,
                    className,
                    filename
                })
            }
        }
    }
    if (schema.required) {
        requiredArray.splice(0, 0, schema.required)
        for (let i = 0; i < schema.required.length; i++) {
            if (!required.has(schema.required[i])) {
                required.add(schema.required[i])
            }
        }
    }
    ret += `${indent(level + 1)}constructor(\n`
    let outputed = new Set()
    outputed.add('typeId') // 不需要构造
    let needDotAndLine = false
    for(let i = requiredArray.length - 1; i >= 0; i--) {
        let arr = requiredArray[i]

        for (let j = 0; j < arr.length; j++) {

            let a = arr[j]
            const p = props.get(a)
            if (!p) {
                console.error('wrang required', a)
                continue
            }

            if (outputed.has(a)) continue
            outputed.add(a)
            if (needDotAndLine) ret += ',\n'
            ret += indent(level + 2) + a + ': ' + handler['type'](p.schema, p.className, level + 1, p.filename, allschemas)
            needDotAndLine = true
        }
    }
    if (needDotAndLine) ret += '\n'
    ret += indent(level + 1) + ') {\n'

    // super
    if (schema.allOf) {
        ret += indent(level + 2) + 'super(\n'
        let outputed = new Set()
        outputed.add('typeId') // 不需要构造
        let needDotAndLine = false
        for(let i = superRequiredArray.length - 1; i >= 0; i--) {
            let arr = superRequiredArray[i]
    
            for (let j = 0; j < arr.length; j++) {
    
                let a = arr[j]
                if (!props.has(a)) {
                    console.error('wrang required', a)
                    continue
                }
    
                if (outputed.has(a)) continue
                outputed.add(a)
                if (needDotAndLine) ret += ',\n'
                ret += indent(level + 3) + a
                needDotAndLine = true
            }
        }
        if (needDotAndLine) ret += '\n'
        ret += indent(level + 2) + ')\n'
    }
    else {
        ret += indent(level + 2) + 'super()\n'
    }

    // this
    if (schema.required) {
        for (let i = 0; i < schema.required.length; i++) {
            let r = schema.required[i]
            if (r == 'typeId') continue
            ret += indent(level + 2) + 'this.' + r + ' = ' + r + '\n'
        }
    }

    ret += indent(level + 1) + '}\n'
    ret += indent(level) + '}'
    return ret
}

handler['$ref'] = function (schema: any, className: string, level: number, filename: string) {
    className = schema.className ?? className
    if (schema == '#') {
        return className
    }
    else if (schema.endsWith(schemaext)) {
        return fileName2TypeName(extractRefFileName(schema))
    }
}
handler['type'] = function (schema: any, className: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    if (schema['$ref']) {
        return handler['$ref'](schema['$ref'], className, level, filename, allschemas)
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
    else if (schema.type == 'undefined') {
        return 'undefined'
    }
    else if (schema.type == 'object') {
        return handler['object'](schema, className, level, filename, allschemas)
    }
    else if (schema.type == 'array') {
        return handler['array'](schema, className, level, filename, allschemas)
    }
    else if (schema.oneOf) {
        return handler['oneOf'](schema.oneOf, className, level, filename, allschemas)
    }
    else if (schema.allOf) {
        return handler['allOf'](schema.allOf, className, level, filename, allschemas)
    }
    else {
        throw new Error("Unknow Type : " + schema)
    }
}

handler['oneOf'] = function (schema: any, className: string, level: number, filename: string,allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    let ret = ''
    for (let i = 0; i < schema.length; i++) {
        let o = schema[i]
        if (i > 0) ret += ' | '
        ret += handler['type'](o, className, level, filename, allschemas)
    }
    if (schema.length > 1) return '(' + ret + ')'
    return ret
}

handler['allOf'] = function (schema: any, className: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    if (schema.length > 1) {
        console.error('Too many allOf items')
    }

    let ret = 'extends '
    for (let i = 0; i < schema.length; i++) {
        let o = schema[i]
        // if (i > 0) ret += ' & '
        ret += handler['type'](o, className, level, filename, allschemas)
        ret += ' '
    }
    // if (schema.length > 1) return '(' + ret + ')'
    return ret
}

handler['array'] = function (schema: any, className: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    let items = schema.items
    return "BasicArray<" + handler['type'](items, className, level, filename, allschemas) + ' >'
}

function exportTypes(schema: any, className: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    let ret = ''
    // description
    if (schema.description) {
        ret += indent(level) + '/**\n * ' + schema.description + ' \n */\n'
    }
    if (schema.enum) {
        // ret += indent(level) + 'export enum ' + className + ' {\n'
        // for (let i = 0; i < schema.enum.length; i++) {
        //     const e = schema.enum[i]
        //     ret += indent(level + 1) + fileName2TypeName(e) + " = " + "'" + e + "',\n"
        // }
        // ret += indent(level) + '}'
    }
    else {
        ret += indent(level) + 'export class ' + className + ' '
        ret += handler['object'](schema, className, level, filename, allschemas)
    }
    ret += '\n'
    return ret;
}

// let allschemas: Map<string, {
//     schema: any,
//     dependsOn: Set<string>,
//     className: string,
//     filename: string,
//     filepath: string
// }> = new Map();

// const typesext = '.ts'
// const schemadir = path.resolve('./')
// const outdir = path.resolve('../data/')
// const outfile = path.join(outdir, 'baseclasses' + typesext)

export function genclass(schemadir: string, outfile: string, basicpath?: string) {
    handler.schemadir = schemadir;
    const all = loadSchemas(schemadir);
    // allschemas = new Map(all)
    const order = orderSchemas(all);

    if (fs.existsSync(outfile)) fs.rmSync(outfile)
    fs.appendFileSync(outfile, headTips);

    // enums
    let enums = new Set()
    for (let i = 0, len = order.length; i < len; i++) {
        const v = order[i]
        if (v.schema.enum) {
            enums.add(v.className)
        }
    }
    let ret = ''
    let needDotAndLine = false
    enums.forEach((e) => {
        if (needDotAndLine) ret += ',\n'
        ret += '    ' + e
        needDotAndLine = true
    })
    // ret += '} from "../types"\n\n'
    fs.appendFileSync(outfile, `export {
${ret}
} from "./typesdefine"\n`);
    fs.appendFileSync(outfile, `import {
${ret}
} from "./typesdefine"\n`);
if (basicpath) fs.appendFileSync(outfile, `import {
    Basic, BasicArray
    } from "./basic"\n`);

// 
    for (let i = 0, len = order.length; i < len; i++) {
        const v = order[i]
        if (v.schema.enum) continue
        const t = exportTypes(v.schema, v.className, 0, v.filename, all)
        fs.appendFileSync(outfile, t);
    }
}
