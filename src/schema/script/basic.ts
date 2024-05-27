
// const path = require("path")
// const fs = require("fs")
import path from 'path';
import fs from 'fs';

// type PropType = 'node' | 'string' | 'boolean' | 'number' | 'oneOf' | 'map'

export type BaseProp = {
    type: 'node',
    val: string
} | {
    type: 'string'
} | {
    type: 'boolean'
} | {
    type: 'number'
} | {
    type: 'map',
    key: 'string' | 'number',
    val: BaseProp
} | {
    type: 'oneOf',
    val: BaseProp[]
}

export type NamedProp = {
    name: string,
    required: boolean,
    default?: string
} & BaseProp

type ItemProp = BaseProp

type NodeValue = {
    type: 'object',
    props: NamedProp[]
} | {
    type: 'array',
    item: ItemProp
} | {
    type: 'enum',
    enum: string[]
}

export class Node {
    inner: boolean = false;
    parent?: Node;
    extend?: string;
    depends: Set<string> = new Set();
    name: string;
    description?: string;
    schemaId?: string;

    value: NodeValue;
    noNameChildCount: number = 0; // 给没有属性名的子node命名

    gented: {
        tys: boolean,
        cls: boolean,
        exp: boolean,
        imp: boolean,
    } = {
            tys: false,
            cls: false,
            exp: false,
            imp: false
        };

    constructor(name: string, value: NodeValue, parent?: Node) {
        this.name = name;
        this.value = value;
        this.parent = parent;
        this.inner = parent !== undefined;
    }
}

export const allNodes = new Map<string, Node>();
const schemaext = '.json'
export function allDepsIsGen(n: Node, gentype: 'tys' | 'cls' | 'exp' | 'imp') {
    for (let d of n.depends) {
        const n = allNodes.get(d);
        if (!n) throw new Error('depends not exist: ' + d);
        if (!n.gented[gentype]) return false;
    }
    return true;
}

export function fmtTypeName(name: string) {
    let ret = ''
    for (let i = 0, len = name.length; i < len; i++) {
        if (i === 0) {
            ret += name[0].toUpperCase()
        } else if (name[i] == '-' || name[i] == '_') {
            i++
            let c = name[i]
            while (i < len && (c == '-' || c == '_' || (c >= '0' && c <= '9'))) {
                if ((c >= '0' && c <= '9')) ret += c
                i++
                c = name[i]
            }
            if (i < len) ret += name[i].toUpperCase()
        } else {
            ret += name[i]
        }
    }
    return ret
}

function collectDepends(val: any, set: Set<string>) {
    if (typeof val != 'object') return;
    const valkeys = Object.keys(val)
    for (let i = 0, len = valkeys.length; i < len; i++) {
        const k = valkeys[i]
        let v = val[k]
        if (k == "$ref") {
            if (v.endsWith(schemaext)) {
                const filename = v.substring(0, v.length - schemaext.length)
                const name = fmtTypeName(extractFileName(filename));
                set.add(name);
            }
        }
        else if (typeof v == 'object') {
            collectDepends(v, set);
        }
    }
}

function transSchemaType(type: string): 'node' | 'string' | 'boolean' | 'number' {
    switch (type) {
        case 'number':
        case 'integer':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'object':
            return 'node';
        case 'string':
            return 'string';
    }
    throw new Error('trans schema type fail: ' + type);
}

function initValue(schema: any): NodeValue {
    if (schema.enum) {
        if (!Array.isArray(schema.enum)) throw new Error('wrong enum: ' + schema.enum)
        return {
            type: 'enum',
            enum: Array.from(schema.enum)
        }
    };
    if (schema.type === 'object') {
        // const required = schema.required;
        // const properties = schema.properties;
        const props: NamedProp[] = [];
        // const keys = Object.keys(properties)
        // for (let i = 0; i < keys.length; ++i) {
        //     const k = keys[i]
        //     const v = properties[k]
        // }
        return {
            type: 'object',
            props
        }
    };
    if (schema.type === 'array') {
        // const required = schema.required;
        const items = schema.items;

        let itemType: 'node' | 'string' | 'boolean' | 'number' | 'oneOf'
        if (items.oneOf) {
            itemType = 'oneOf'
        }
        else if (items.type) {
            itemType = transSchemaType(items.type);
        }
        else if (items['$ref']) {
            itemType = 'node'
        }
        else {
            throw new Error("unknow array item type: " + items.type);
        }

        return {
            type: 'array',
            item: {
                type: itemType
            } as any/* hack, todo */
        }
    };

    throw new Error('unknow schema type: ' + schema.type);
}

function extractBaseProp(schema: any, name: string | undefined, n: Node): BaseProp {
    if (schema.type) switch (schema.type) {
        case 'boolean':
            return {
                type: 'boolean'
            }
        case 'number':
        case 'integer':
            return {
                type: 'number'
            }
        case 'string':
            return {
                type: 'string'
            }
        case 'array':
            {
                name = name ? name : ('' + n.noNameChildCount++);
                const subnode = new Node(n.name + '_' + name, initValue(schema), n);
                if (allNodes.has(subnode.name)) throw new Error('node name duplicate: ' + subnode.name);
                if (subnode.value.type !== 'array') throw new Error("subnode type error");
                extractArrayValue(schema.items, subnode.value.item, subnode);
                allNodes.set(subnode.name, subnode);
                n.depends.add(subnode.name);
                return {
                    type: 'node',
                    val: subnode.name
                }
            }
        case 'map':
            {
                const k = schema.key.type;
                const v = schema.value;
                let key: 'string' | 'number';
                if (k === 'string') {
                    key = 'string'
                } else if (k === 'number' || k === 'integer') {
                    key = 'number'
                } else {
                    throw new Error('not supported map key type: ' + k)
                }
                return {
                    type: 'map',
                    key,
                    val: extractBaseProp(v, name, n)
                }
            }
        case 'object':
            {
                name = name ? name : ('' + n.noNameChildCount++);
                const subnode = new Node(n.name + '_' + name, initValue(schema), n);
                if (allNodes.has(subnode.name)) throw new Error('node name duplicate: ' + subnode.name);
                if (subnode.value.type !== 'object') throw new Error("subnode type error");
                extractObjectValue(schema.properties, schema.required || [], subnode.value.props, subnode);
                allNodes.set(subnode.name, subnode);
                n.depends.add(subnode.name);
                return {
                    type: 'node',
                    val: subnode.name
                }
            }
        default:
            throw new Error('unknow schema type: ' + schema.type);
    }
    if (schema.oneOf) {
        const oneOf = schema.oneOf;
        if (!Array.isArray(oneOf)) throw new Error('oneOf must be array');
        const val: BaseProp[] = [];
        for (let i = 0; i < oneOf.length; ++i) {
            val.push(extractBaseProp(oneOf[i], undefined, n))
        }
        return {
            type: 'oneOf',
            val
        }
    }
    if (schema.allOf) {
        throw new Error('base prop not support allOf')
    }
    if (schema['$ref']) {
        // '#'
        // 'path to file'
        const ref = schema['$ref'];
        if (ref === '#') {
            let p = n;
            while(p.inner) p = p.parent!;
            return {
                type: 'node',
                val: p.name
            }
        }
        const filename = ref.substring(0, ref.length - schemaext.length)
        const name = fmtTypeName(extractFileName(filename));
        return {
            type: 'node',
            val: name
        }
    }
    throw new Error('unknow prop ' + schema);
}

function extractObjectValue(schema: any, required: string[], props: NamedProp[], n: Node) {
    // schema <- properties
    // {key: {}}

    // required first
    for (let k of required) {
        const v = schema[k];
        if (!v) throw new Error('required not in properties: ' + k);
        const p = extractBaseProp(v, k, n) as NamedProp;
        p.name = k;
        p.required = true;
        if (v.default) p.default = v.default;
        props.push(p);
    }

    const keys = Object.keys(schema);
    for (let k of keys) {
        if (required.indexOf(k) >= 0) continue;
        const v = schema[k];
        const p = extractBaseProp(v, k, n) as NamedProp;
        p.name = k;
        if (v.default) p.default = v.default;
        props.push(p);
    }
}

function extractArrayValue(schema: any, item: ItemProp, n: Node) {
    // schema <- items
    if (item.type === 'node') {
        const ref = schema['$ref'];
        if (!ref) throw new Error('wrong ref? ' + schema);

        if (ref === '#') {
            let p = n;
            while(p.inner) p = p.parent!;
            item.val = p.name;
        } else {
            const filename = ref.substring(0, ref.length - schemaext.length)
            const name = fmtTypeName(extractFileName(filename));
            item.val = name;
        }
    }
    else if (item.type === 'oneOf') {
        const val: BaseProp[] = [];
        // oneOf : array

        const oneOf = schema.oneOf;
        if (!Array.isArray(oneOf)) throw new Error('oneOf must be array!');

        for (let i = 0; i < oneOf.length; ++i) {
            const p = extractBaseProp(oneOf[i], undefined, n);
            val.push(p);
        }

        item.val = val;
    }
}

function extractFileName(ref: string): string {
    // const m = ref.match(/^.+[\/\\]([^.]+)\..*$/)
    // if (!m || m.length !== 2) {
    //     throw new Error("wrong file path? " + ref)
    // }
    // return m[1]
    const idx = ref.lastIndexOf('/');
    if (idx < 0) return ref;
    return ref.substring(idx + 1);
}

export function loadSchemas(schemadir: string) {
    const files = fs.readdirSync(schemadir)


    for (let index = 0; index < files.length; index++) {
        const file = files[index]
        if (!file.endsWith(schemaext)) continue;

        const filepath = path.join(schemadir, file)
        const raw = fs.readFileSync(filepath, "utf8") as string;

        const schema = JSON.parse(raw)
        const filename = extractFileName(file.substring(0, file.length - schemaext.length))

        const name = fmtTypeName((filename));
        const node = new Node(name, initValue(schema));
        node.schemaId = filename;

        if (schema.description) node.description = schema.description;

        // extract object
        if (node.value.type === 'object') {
            const properties = schema.properties;
            extractObjectValue(properties, schema.required || [], node.value.props, node);
        }
        // extract array
        else if (node.value.type === 'array') {
            const items = schema.items;
            extractArrayValue(items, node.value.item, node);
        }

        collectDepends(schema, node.depends);

        // extends
        if (schema && schema.allOf) {
            if (schema.allOf.length > 1) throw new Error('not support many allOf')
            if (schema.allOf.length > 0) {
                const ref = schema.allOf[0]['$ref']
                if (ref.endsWith(schemaext)) {
                    const filename = ref.substring(0, ref.length - schemaext.length)
                    const name = fmtTypeName(extractFileName(filename));
                    node.extend = name;
                }
            }
        }

        allNodes.set(name, node);
    }
}
