import { loadSchemas, mergeAllOf, orderSchemas } from "../../script/schema/basic"
import { inject } from "./import-inject"

const fs = require("fs")
const path = require("path")
const { fileName2TypeName, extractRefFileName, indent, headTips, extractType } = require("../../script/schema/basic")

const schemaext = '.json'
// const typesext = '.ts'
// const schemadir = path.resolve('./')
// const outdir = path.resolve('../io/')
// const outfile = path.join(outdir, 'baseimport' + typesext)


const handler: {
    [key: string]: (schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
        schema: any,
        dependsOn: Set<string>,
        className: string,
        filename: string,
        filepath: string
    }>) => string
} & { schemadir?: string } = {}
handler['object'] = function (schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    filename = schema.filename ?? filename
    let required = new Set<string>()
    let requiredArray: any[][] = []
    let props = new Map<string, {
        schema: any,
        className: string,
        filename: string
    }>()
    if (schema.allOf) {
        // ret += handler['allOf'](schema.allOf, className, attrname, level + 1)
        // ret += ' & '
        mergeAllOf(schema.allOf, props, required, requiredArray, allschemas, handler.schemadir!)
    }
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
    let ret = `${indent(level)}const ret: impl.${className} = new impl.${className} (\n`
    let outputed = new Set()
    outputed.add('typeId')
    let needDotAndLine = false
    for (let i = requiredArray.length - 1; i >= 0; i--) {
        let arr = requiredArray[i]

        for (let j = 0; j < arr.length; j++) {
            let a = arr[j]
            if (outputed.has(a)) continue
            outputed.add(a)
            if (needDotAndLine) ret += ',\n'
            const p = props.get(a)
            if (!p) {
                console.error('wrang required', a)
                continue
            }
            ret += indent(level + 1) + handler['type'](p.schema, p.className, attrname + '.' + a, level + 1, p.filename, allschemas)
            needDotAndLine = true
        }
    }
    if (needDotAndLine) ret += '\n'
    ret += indent(level) + ')\n'

    props.forEach((v, k) => {
        if (required.has(k)) return
        ret += indent(level) + `if (${attrname}.${k} !== undefined) ` + 'ret.' + k + ' = '
        // if (v.schema['$ref'] || v.schema.type == 'array' || v.schema.type == 'object' || v.schema.oneOf) ret += attrname + '.' + k + ' && '
        ret += handler['type'](v.schema, v.className, attrname + '.' + k, level, v.filename, allschemas)
        ret += '\n'
    })

    // inject
    if (inject[className] && inject[className]['after']) {
        ret += inject[className]['after']
    }

    ret += indent(level) + 'return ret\n'
    return ret
}

handler['$ref'] = function (schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    filename = schema.filename ?? filename
    if (schema == '#') {
        return 'import' + className + '(' + attrname + ', ctx)'
    }
    else if (schema.endsWith(schemaext)) {
        className = fileName2TypeName(extractRefFileName(schema))
        return 'import' + className + '(' + attrname + ', ctx)'
    }
    else {
        throw new Error("unknow schema : " + schema)
    }
}
handler['type'] = function (schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    filename = schema.filename ?? filename
    if (schema['$ref']) {
        return handler['$ref'](schema['$ref'], className, attrname, level, filename, allschemas)
    }
    else if (schema.type == 'number' ||
        schema.type == 'integer' ||
        schema.type == 'string' ||
        schema.type == 'boolean') {
        return attrname
    }
    else if (schema.type == 'object') {
        let ret = '{\n'
        ret += handler['object'](schema, className, attrname, level, filename, allschemas)
        ret += indent(level) + '}'
        return ret;
    }
    else if (schema.type == 'array') {
        return handler['array'](schema, className, attrname, level, filename, allschemas)
    }
    else if (schema.type == 'map') {
        return handler['map'](schema, className, attrname, level, filename, allschemas)
    }
    else if (schema.oneOf) {
        return handler['oneOf'](schema.oneOf, className, attrname, level, filename, allschemas)

    }
    else if (schema.allOf) {
        let ret = '{\n'
        ret += handler['allOf'](schema.oneOf, className, attrname, level, filename, allschemas)
        ret += indent(level) + '}'
        return ret;
    }
    else {
        console.error("Unknow Type", schema)
        throw new Error("Unknow Type : " + schema)
    }
}

handler['map'] = function (schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    filename = schema.filename ?? filename
    const keyschema = schema.key;
    const valueschema = schema.value;
    let retobj = `new BasicMap<${extractType(keyschema, className, 'impl.')}, ${extractType(valueschema, className, 'impl.')}>()`

    let ret = `(() => {
${indent(level + 1)}const ret = ${retobj}
${indent(level + 1)}const val = ${attrname} as any; // json没有map对象,导入导出的是{[key: string]: value}对象
${indent(level + 1)}Object.keys(val).forEach((k) => {
${indent(level + 1)}    const v = val[k];
${indent(level + 1)}    ret.set(k, ${handler['type'](valueschema, className, 'v', level + 2, filename, allschemas)})
${indent(level + 1)}});
${indent(level + 1)}return ret
${indent(level)}})()`
    return ret
}

handler['oneOf'] = function (schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) { // todo 可以更细化些
    // return handler['allOf'](schema, className, attrname, level)
    className = schema.className ?? className
    filename = schema.filename ?? filename
    let ret = `(() => {
${indent(level)}    const val = ${attrname}`

    // ${indent(level)}    if (typeof ${attrname} != 'object') {
    // ${indent(level)}        return ${attrname}
    // ${indent(level)}    }

    // undefined
    for (let i = 0; i < schema.length; i++) {
        let s = schema[i]

        if (s.type === 'undefined') {
            ret += `
${indent(level)}    if (!val) {
${indent(level)}        return val ?? undefined
${indent(level)}    }`

            break;
        }
    }

    // normal type
    for (let i = 0; i < schema.length; i++) {
        let s = schema[i]

        if (!s['$ref'] && s.type !== 'undefined') {
            ret += `
${indent(level)}    if (typeof val !== 'object') {
${indent(level)}        return val
${indent(level)}    }`

            break;
        }
    }
    // array
    for (let i = 0; i < schema.length; i++) {
        let s = schema[i]

        if (s.type === 'array') {

            ret += `
${indent(level)}    if (val instanceof Array) {
${indent(level)}        const _val = val;
${indent(level)}        return ${handler['array'](s, className, '_val', level + 2, filename, allschemas)}
${indent(level)}    }`

            break;
        }
    }
    // ref
    for (let i = 0; i < schema.length; i++) {
        let s = schema[i]
        let typename
        // let filename
        if (s['$ref']) {
            if (s['$ref'] == '#') {
                typename = className
                // filename = curfilename
            }
            else if (s['$ref'].endsWith(schemaext)) {
                filename = extractRefFileName(s['$ref'])
                typename = fileName2TypeName(filename)
            }
        }
        if (typename) {
            ret += `
${indent(level)}    if (val.typeId == '${filename}') {
${indent(level)}        return import${typename}(val as types.${typename}, ctx)
${indent(level)}    }`
        }
    }
    // unknow
    ret += `
${indent(level)}    {
${indent(level)}        throw new Error('unknow val: ' + val)
${indent(level)}    }`
    // close
    ret += `
${indent(level)}})()`

    return ret

}

handler['allOf'] = function (schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    filename = schema.filename ?? filename
    let props = new Map<string, {
        schema: any,
        className: string,
        filename: string
    }>()
    const required = new Set<string>()
    mergeAllOf(schema, props, required, [], allschemas, handler.schemadir!)
    let ret = ''
    props.forEach((v, k) => {
        ret += indent(level) + k + ': '
        if (v.schema['$ref'] && !required.has(k)) ret += attrname + '.' + k + ' && '
        ret += handler['type'](v.schema, v.className, attrname + '.' + k, level + 1, v.filename, allschemas) + ',\n'
    })
    return ret
}


handler['array'] = function (schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    className = schema.className ?? className
    filename = schema.filename ?? filename
    const items = schema.items
    let retobj = `new BasicArray<${extractType(items, className, 'impl.')}>()`

    let ret = `(() => {
${indent(level + 1)}const ret = ${retobj}
${indent(level + 1)}for (let i = 0, len = ${attrname} && ${attrname}.length; i < len; i++) {
${indent(level + 1)}    const r = ${handler['type'](items, className, attrname + '[i]', level + 2, filename, allschemas)}
${indent(level + 1)}    ${items.containUndefined ? '' : 'if (r) '}ret.push(r)
${indent(level + 1)}}
${indent(level + 1)}return ret
${indent(level)}})()`
    return ret
}

function importTypes(schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {
    let ret = ''
    // description
    if (schema.description) {
        ret += indent(level) + '/* ' + schema.description + ' */\n'
    }
    ret += indent(level) + 'export function '
    ret += 'import' + className + '(source: types.' + className + ', ctx?: IImportContext)'
    ret += ': impl.' + className + ' {\n'

    // inject
    if (inject[className] && inject[className]['before']) {
        ret += inject[className]['before']
    }

    if (schema.enum) {
        ret += indent(level + 1) + 'return source\n'
    }
    else {
        if (inject[className] && inject[className]['content']) {
            ret += inject[className]['content']
        }
        else {
            ret += handler['object'](schema, className, 'source', level + 1, filename, allschemas)
        }
    }
    ret += indent(level) + '}'
    ret += '\n'
    return ret;
}

export function genimport(schemadir: string, outfile: string, implpath: string, typedefs: string, arrayimpl?: string) {
    handler.schemadir = schemadir;
    const all = loadSchemas(schemadir);
    const order = orderSchemas(all);

    // all.clear()

    if (fs.existsSync(outfile)) fs.rmSync(outfile)
    fs.appendFileSync(outfile, headTips);
    fs.appendFileSync(outfile, `import * as impl from "${implpath}"\n`);
    fs.appendFileSync(outfile, `import * as types from "${typedefs}"\n`);
    if (arrayimpl) fs.appendFileSync(outfile, `import { BasicArray, BasicMap } from "${arrayimpl}"\n\n`);
    fs.appendFileSync(outfile,
        `
export interface IImportContext {
    document: impl.Document
    curPage: string
}
`)
    order.sort((a, b) => a.order - b.order)
    for (let i = 0, len = order.length; i < len; i++) {
        const v = order[i]
        const t = importTypes(v.schema, v.className, '', 0, v.filename, all)
        fs.appendFileSync(outfile, t);
    }

}

// todo 枚举需要检查
// todo required的需要考虑不存在，赋值default