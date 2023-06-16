import { loadSchemas, mergeAllOf, orderSchemas } from "../../script/schema/basic"

const fs = require("fs")
const path = require("path")
const { fileName2TypeName, extractRefFileName, indent, headTips } = require("../../script/schema/basic")

const schemaext = '.json'
// const typesext = '.ts'
// const schemadir = path.resolve('./')
// const outdir = path.resolve('../io/')
// const outfile = path.join(outdir, 'baseexport' + typesext)


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
    let ret = ''
    if (schema.allOf) {
        ret += handler['allOf'](schema.allOf, className, attrname, level + 1, filename, allschemas)
        // ret += ' & '
    }

    const properties = schema.properties
    if (!properties) {
        // ret += '{}'
        return ret
    }
    const required = schema.required || []

    const keys = Object.keys(properties)
    for (let i = 0; i < keys.length; i++) {
        let k = keys[i]
        let v = properties[k]

        ret += indent(level + 1) + k + ': '

        if (required.indexOf(k) < 0) {
            if (v['$ref'] || v.type == 'array') ret += attrname + '.' + k + ' && '
        }

        ret += handler['type'](v, className, attrname + '.' + k, level + 1, filename, allschemas)
        ret += ',\n'
    }

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
        return 'export' + className + '(' + attrname + ', ctx)'
    }
    else if (schema.endsWith(schemaext)) {
        className = fileName2TypeName(extractRefFileName(schema))
        return 'export' + className + '(' + attrname + ', ctx)'
    }
    else {
        throw new Error('unknow schema : ' + schema)
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

handler['oneOf'] = function (schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) { // todo 可以更细化些
    className = schema.className ?? className
    filename = schema.filename ?? filename
    // return handler['allOf'](schema, className, attrname, level)
    let ret = `(() => {
${indent(level)}    if (typeof ${attrname} != 'object') {
${indent(level)}        return ${attrname}
${indent(level)}    }`

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
${indent(level)}    if (${attrname}.typeId == '${filename}') {
${indent(level)}        return export${typename}(${attrname} as types.${typename}, ctx)
${indent(level)}    }`
        }
    }
    ret += `
${indent(level)}    {
${indent(level)}        console.error(${attrname})
${indent(level)}    }`
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
    const requiredArray: any[][] = []
    mergeAllOf(schema, props, required, requiredArray, allschemas, handler.schemadir!)
    let ret = ''
    const outputed = new Set<string>()
    for (let i = requiredArray.length - 1; i >= 0; i--) {

        const arr = requiredArray[i]

        arr.forEach((k) => {
            if (outputed.has(k)) return;
            outputed.add(k);
            const v = props.get(k)
            if (!v) {
                throw new Error("" + k + " has no property ")
            }
            ret += indent(level) + k + ': '
            ret += handler['type'](v.schema, v.className, attrname + '.' + k, level + 1, v.filename, allschemas) + ',\n'
        })
    }
    props.forEach((v, k) => {
        if (outputed.has(k)) return;
        outputed.add(k);
        ret += indent(level) + k + ': '
        if (v.schema['$ref']) ret += attrname + '.' + k + ' && '
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
    let ret = `(() => {
${indent(level + 1)}const ret = []
${indent(level + 1)}for (let i = 0, len = ${attrname}.length; i < len; i++) {
${indent(level + 1)}    const r = ${handler['type'](items, className, attrname + '[i]', level + 2, filename, allschemas)}
${indent(level + 1)}    if (r) ret.push(r)
${indent(level + 1)}}
${indent(level + 1)}return ret
${indent(level)}})()`
    return ret
}

function exportTypes(schema: any, className: string, attrname: string, level: number, filename: string, allschemas: Map<string, {
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
    ret += 'export' + className + '(source: types.' + className + ', ctx?: IExportContext)'
    ret += ': types.' + className + ' {\n'
    if (schema.enum) {
        ret += indent(level + 1) + 'return source\n'
    }
    else {
        ret += indent(level + 1) + 'const ret = {\n'
        ret += handler['object'](schema, className, 'source', level + 1, filename, allschemas)
        ret += indent(level + 1) + '}\n'
        ret += indent(level + 1) + 'if (ctx) ctx.afterExport(source)\n'
        ret += indent(level + 1) + 'return ret\n'
    }
    ret += indent(level) + '}'
    ret += '\n'
    return ret;
}

export function genexport(schemadir: string, outfile: string, typedefs: string) {
    handler.schemadir = schemadir;
    const all = loadSchemas(schemadir);
    const order = orderSchemas(all);


    if (fs.existsSync(outfile)) fs.rmSync(outfile)
    fs.appendFileSync(outfile, headTips);
    fs.appendFileSync(outfile, `import * as types from "${typedefs}"\n\n`);

    fs.appendFileSync(outfile,
        `
export interface IExportContext {
    afterExport(obj: any): void
}
`
    )

    for (let i = 0, len = order.length; i < len; i++) {
        const v = order[i]
        const t = exportTypes(v.schema, v.className, '', 0, v.filename, all)
        fs.appendFileSync(outfile, t);
    }
}
