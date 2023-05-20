
export function fileName2TypeName(name: string) {
    let ret = ''
    for (let i = 0, len = name.length; i < len; i++) {
        if (i === 0) {
            ret += name[0].toUpperCase()
            continue
        }
        if (name[i] == '-' || name[i] == '_') {
            i++
            let c = name[i]
            while (i < len && (c == '-' || c == '_' || (c >= '0' && c <= '9'))) {
                if ((c >= '0' && c <= '9')) ret += c
                i++
                c = name[i]
            }
            if (i < len) ret += name[i].toUpperCase()
        }
        else {
            ret += name[i]
        }
    }
    return ret
}

export function extractRefFileName(ref: string): string {
    const m = ref.match(/^.+[\/\\]([^.]+)\..*$/)
    if (!m || m.length !== 2) {
        throw new Error("wrong file path? " + ref)
    }
    return m[1]
}

export function indent(level: number) {
    let ret = ''
    while ((level--) > 0) ret += '    '
    return ret
}
export const headTips =
    `/**
 * 代码生成，勿手动修改
 * 可修改schema后在schema目录运行node script生成
 */

`

export function extractType(schema: any, className: string, prefix: string) {
    const schemaext = '.json'
    const handler: { [key: string]: Function } = {}
    handler['object'] = function (schema: any, className: string) {
        let ret = ''
        if (schema.allOf) {
            ret += handler['allOf'](schema.allOf, className)
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

            ret += k

            if (required.indexOf(k) < 0) ret += '?'

            ret += ': '
            ret += handler['type'](v, className)
            ret += '\n'
        }
        ret += '}'
        return ret
    }

    handler['$ref'] = function (schema: any, className: string) {
        if (schema == '#') {
            return prefix + className
        }
        else if (schema.endsWith(schemaext)) {
            return prefix + fileName2TypeName(extractRefFileName(schema))
        }
    }
    handler['type'] = function (schema: any, className: string) {
        if (schema['$ref']) {
            return handler['$ref'](schema['$ref'], className)
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
            return handler['object'](schema, className)
        }
        else if (schema.type == 'array') {
            return handler['array'](schema, className)
        }
        else if (schema.oneOf) {
            return handler['oneOf'](schema.oneOf, className)
        }
        else if (schema.allOf) {
            return handler['allOf'](schema.allOf, className)
        }
        else {
            console.error("Unknow Type", schema)
        }
    }

    handler['oneOf'] = function (schema: any, className: string) {
        let ret = ''
        for (let i = 0; i < schema.length; i++) {
            let o = schema[i]
            if (i > 0) ret += ' | '
            ret += handler['type'](o, className)
        }
        if (schema.length > 1) return '(' + ret + ')'
        return ret
    }

    handler['allOf'] = function (schema: any, className: string) {
        let ret = ''
        for (let i = 0; i < schema.length; i++) {
            let o = schema[i]
            if (i > 0) ret += ' & '
            ret += handler['type'](o, className)
        }
        if (schema.length > 1) return '(' + ret + ')'
        return ret
    }

    handler['array'] = function (schema: any, className: string) {
        let items = schema.items
        return handler['type'](items, className) + '[]'
    }

    return handler['type'](schema, className)
}

const path = require("path")
const schemaext = '.json'
// const schemadir = path.resolve('./')
export function extractDepends(val: any, set: Set<string>, schemadir: string) {
    if (typeof val != 'object') {
        return set
    }
    const valkeys = Object.keys(val)
    for (let i = 0, len = valkeys.length; i < len; i++) {
        const k = valkeys[i]
        let v = val[k]
        if (k == "$ref") {
            if (v.endsWith(schemaext)) {
                let p = path.join(schemadir, v);
                set.add(p);
            }
        }
        else if (typeof v == 'object') {
            extractDepends(v, set, schemadir);
        }
    }
    return set
}

export function markRefSelf(val: any, filename: string) {
    if (typeof val != 'object') {
        return
    }
    const valkeys = Object.keys(val)
    for (let i = 0, len = valkeys.length; i < len; i++) {
        const k = valkeys[i]
        let v = val[k]
        if (k == "$ref") {
            if (v === '#') {
                val.filename = filename
            }
        }
        else if (typeof v == 'object') {
            markRefSelf(v, filename);
        }
    }
}

export function extractExtends(val: any, set: Set<string>, schemadir: string) {
    if (val && val.allOf) {
        for (let i = 0, len = val.allOf.length; i < len; i++) {
            let ref = val.allOf[i]['$ref']
            if (ref) {
                let p = path.join(schemadir, ref);
                set.add(p);
            }
        }
    }
    return set
}

const fs = require("fs")
export function loadSchemas(schemadir: string) {
    const files = fs.readdirSync(schemadir)

    const all: Map<string, {
        schema: any,
        dependsOn: Set<string>,
        className: string,
        filename: string,
        filepath: string
    }> = new Map()

    for (let index = 0; index < files.length; index++) {
        while (index < files.length && (!files[index].endsWith(schemaext))) index++;

        if (index >= files.length) {
            break
        }

        const file = files[index]
        const filepath = path.join(schemadir, file)
        const val = fs.readFileSync(filepath, "utf8")

        const schema = JSON.parse(val)
        const filename = file.substring(0, file.length - schemaext.length)

        all.set(filepath, {
            schema,
            dependsOn: extractExtends(schema, new Set(), schemadir),
            className: fileName2TypeName(filename),
            filename,
            filepath
        })
    }
    return all;
}


export function mergePropers(schema: any, className: string, filename: string,
    props: Map<string, {
        schema: any,
        className: string,
        filename: string
    }>,
    required: Set<string>, requiredArray: string[][],
    all: Map<string, {
        schema: any,
        dependsOn: Set<string>,
        className: string,
        filename: string,
        filepath: string
    }>,
    schemadir: string) {

        if (schema.allOf) {
            if (schema.allOf.length == 0) {
                console.error('enpty allOf')
            }
            if (schema.allOf.length > 1) {
                console.error('Too many allOf items')
            }
            if (schema.allOf.length > 0) {
                mergeAllOf(schema.allOf, props, required, requiredArray, all, schemadir)
            }
        }
    
        const properties = schema.properties
        if (properties) {
            const keys = Object.keys(properties)
            for (let i = 0; i < keys.length; i++) {
                let k = keys[i]
                let v = properties[k]
    
                if (props.has(k)) {
                    if (JSON.stringify(v) != JSON.stringify(props.get(k)?.schema)) {
                        console.error('duplicate attribute', props.get(k), v)
                    }
                }
                else {
                    props.set(k, {
                        schema: v,
                        className: className,
                        filename: filename
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
}


export function mergeAllOf(schemaArray: any[],
    props: Map<string, {
        schema: any,
        className: string,
        filename: string
    }>,
    required: Set<string>, requiredArray: string[][],
    all: Map<string, {
        schema: any,
        dependsOn: Set<string>,
        className: string,
        filename: string,
        filepath: string
    }>,
    schemadir: string) {

    const mergedSet = new Set()
    const stack: any[][] = [schemaArray]

    while (stack.length > 0) {

        if (stack.length > 100) console.log(stack)

        schemaArray = stack.pop() as any[]
        schemaArray = schemaArray.map((v) => {
            if (v['$ref'] && v['$ref'].endsWith(schemaext)) {
                let p = path.join(schemadir, v['$ref']);
                if (mergedSet.has(p)) return {}
                mergedSet.add(p)
                let s = all.get(p)
                if (!s) {
                    throw new Error("schema not exist :" + v['$ref'])
                }
                s.schema.className = s.className
                s.schema.filename = s.filename
                return s.schema
            }
            else if (v['$ref'] && v['$ref'] == '#') {
                return {}
            }
            else {
                throw new Error("Unknow schema :" + v)
                // console.error('Unknow schema', v)
            }
            return {}
        })

        for (let i = 0; i < schemaArray.length; i++) {
            let schema = schemaArray[i]

            if (schema.properties) {
                let keys = Object.keys(schema.properties)
                for (let i = 0; i < keys.length; i++) {
                    let k = keys[i]
                    let v = schema.properties[keys[i]]
                    if (props.has(k)) {
                        if (JSON.stringify(v) != JSON.stringify(props.get(k)?.schema)) {
                            console.error('duplicate attribute', props.get(k), v)
                            throw new Error("duplicate attribute")
                        }
                    }
                    else {
                        v.filename = schema.filename
                        v.className = schema.className
                        props.set(k, {
                            schema: v,
                            filename: schema.filename,
                            className: schema.className
                        })
                    }
                }
            }
            if (schema.allOf) {
                stack.push(schema.allOf)
            }
            if (schema.required) {
                requiredArray.push(schema.required)
                for (let i = 0; i < schema.required.length; i++) {
                    if (!required.has(schema.required[i])) {
                        required.add(schema.required[i])
                    }
                }
            }
        }
    }
}

export function orderSchemas(all: Map<string, {
    schema: any,
    dependsOn: Set<string>,
    className: string,
    filename: string,
    filepath: string
}>) {


    const order1: {
        order: number,
        schema: any,
        className: string,
        dependsOn: Set<string>,
        filename: string,
        filepath: string
    }[] = []
    const remap = new Map<string, Set<string>[]>()
    all.forEach((v, k) => {
        const n = {
            order: v.dependsOn.size,
            schema: v.schema,
            className: v.className,
            dependsOn: new Set<string>(v.dependsOn),
            filepath: k,
            filename: v.filename
        }
        order1.push(n)
        v.dependsOn.forEach((d) => {
            if (!remap.has(d)) remap.set(d, [])
            remap.get(d)?.push(n.dependsOn)
        })
    })

    order1.sort((a, b) => b.order - a.order)

    const order: {
        order: number,
        schema: any,
        className: string,
        dependsOn: Set<string>,
        filename: string,
        filepath: string
    }[] = []
    let count = 10000
    for (; order1.length > 0 && count >= 0; count--) {
        for (let i = order1.length - 1; i >= 0; i--) {
            let o = order1[i]
            if (o.dependsOn.size == 0) {
                order1.splice(i, 1)
                order.push(o)

                let s = remap.get(o.filepath)
                if (s) {
                    for (let j = 0; j < s.length; j++) {
                        let dependsOn = s[j]
                        dependsOn.delete(o.filepath)
                    }
                }
                break
            }
        }
    }

    if (count <= 0) {
        console.error("dead loop?", count, order1)
        throw new Error("dead loop?");
    }

    return order;
}