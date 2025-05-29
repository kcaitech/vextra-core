/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

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
} | {
    type: 'undefined'
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
    root: Map<string, Node>; // 所有的node所在的map

    parent?: Node; // 非用户定义的类型（程序内部生成）才有parent?
    get inner() {
        return this.parent !== undefined
    }
    // 继承，allOf
    extend?: string;
    // 引用了其它的schema
    depends: Set<string> = new Set();
    // 一般对应文件名的帕斯卡命名法，唯一不重复
    name: string;
    description?: string;
    // 文件名 rename to typeId?
    schemaId?: string;
    value: NodeValue;

    noNameChildCount: number = 0; // 给没有属性名的子node命名

    constructor(root: Map<string, Node>, name: string, value: NodeValue)
    constructor(parent: Node, name: string, value: NodeValue)
    constructor(a1: Map<string, Node> | Node, name: string, value: NodeValue) {
        this.root = a1 instanceof Map ? a1 : a1.root
        this.name = name;
        this.value = value;
        this.parent = a1 instanceof Map ? undefined : a1
    }
}

export function allDepsIsGen(node: Node, gented: Set<string>) {
    for (let d of node.depends) {
        const n = node.root.get(d);
        if (!n) throw new Error('depends not exist: ' + d);
        if (!gented.has(n.name)) return false
    }
    return true;
}

// 将文件名转换为帕斯卡命名法的类名
export function toPascalCase(str: string): string {
    return str
        // 将下划线 _ 和短横线 - 统一替换为空格，方便后续处理
        .replace(/[_-]/g, ' ')
        // 将空格后的字母或数字转为大写
        .replace(/\s+([a-zA-Z0-9])/g, (_, char) => char.toUpperCase())
        // 将数字后的字母转为大写（例如 2d -> 2D）
        .replace(/([0-9])([a-z])/g, (_, num, letter) => num + letter.toUpperCase())
        // 将首字母转为大写
        .replace(/^[a-z]/, (firstChar) => firstChar.toUpperCase())
        // 移除所有空格
        .replace(/\s+/g, '');
}

function collectDepends(val: any, set: Set<string>, schemaext: string) {
    if (typeof val != 'object') return;
    const valkeys = Object.keys(val)
    for (let i = 0, len = valkeys.length; i < len; i++) {
        const k = valkeys[i]
        let v = val[k]
        if (k == "$ref") {
            if (v.endsWith(schemaext)) {
                const filename = getFileName(v)
                const name = toPascalCase(filename);
                set.add(name);
            }
        }
        else if (typeof v == 'object') {
            collectDepends(v, set, schemaext);
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

function parseNodeValue(schema: any): NodeValue {
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

// 转换schema的基础类型为ts类型
function extractBaseProp(schema: any, name: string | undefined, parent: Node): BaseProp {
    if (schema.type) switch (schema.type) {
        case 'undefined': return {
            type: 'undefined'
        }
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
                name = name ? name : ('' + parent.noNameChildCount++);
                const subnode = new Node(parent, parent.name + '_' + name, parseNodeValue(schema));
                if (parent.root.has(subnode.name)) throw new Error('node name duplicate: ' + subnode.name);
                if (subnode.value.type !== 'array') throw new Error("subnode type error");
                extractArrayValue(schema.items, subnode.value.item, subnode);
                parent.root.set(subnode.name, subnode);
                parent.depends.add(subnode.name);
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
                    val: extractBaseProp(v, name, parent)
                }
            }
        case 'object':
            {
                name = name ? name : ('' + parent.noNameChildCount++);
                const subnode = new Node(parent, parent.name + '_' + name, parseNodeValue(schema));
                if (parent.root.has(subnode.name)) throw new Error('node name duplicate: ' + subnode.name);
                if (subnode.value.type !== 'object') throw new Error("subnode type error");
                extractObjectValue(schema.properties, schema.required || [], subnode.value.props, subnode);
                parent.root.set(subnode.name, subnode);
                parent.depends.add(subnode.name);
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
            val.push(extractBaseProp(oneOf[i], undefined, parent))
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
            let p = parent;
            while (p.inner) p = p.parent!;
            return {
                type: 'node',
                val: p.name
            }
        }
        const filename = getFileName(ref) //ref.substring(0, ref.length - schemaext.length)
        const name = toPascalCase(filename);
        return {
            type: 'node',
            val: name
        }
    }
    throw new Error('unknow prop ' + schema);
}

function extractObjectValue(schema: any, required: string[], props: NamedProp[], parent: Node) {
    // schema <- properties
    // {key: {}}

    // required first
    for (let k of required) {
        const v = schema[k];
        if (!v) throw new Error('required not in properties: ' + k);
        const p = extractBaseProp(v, k, parent) as NamedProp;
        p.name = k;
        p.required = true;
        if (v.default !== undefined) p.default = v.default;
        props.push(p);
    }

    const keys = Object.keys(schema);
    for (let k of keys) {
        if (required.indexOf(k) >= 0) continue;
        const v = schema[k];
        const p = extractBaseProp(v, k, parent) as NamedProp;
        p.name = k;
        if (v.default !== undefined) p.default = v.default;
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
            while (p.inner) p = p.parent!;
            item.val = p.name;
        } else {
            const filename = getFileName(ref) //ref.substring(0, ref.length - schemaext.length)
            const name = toPascalCase(filename);
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

function getFileName(path: string) {
    // 使用正则表达式匹配文件名部分
    const match = path.match(/([^\/]+)\./);
    return match && match[1] || ''
}

import path from 'path';
import fs from 'fs';
export function loadSchemas(schemadir: string, schemaext = '.json'): Map<string, Node> {
    const files = fs.readdirSync(schemadir)
    const allNodes = new Map<string, Node>()
    for (let index = 0; index < files.length; index++) {
        const file = files[index]
        if (!file.endsWith(schemaext)) continue;

        const filepath = path.join(schemadir, file)
        const raw = fs.readFileSync(filepath, "utf8") as string;

        const schema = JSON.parse(raw)
        const filename = getFileName(file)

        // console.log('filename:', filename, file)
        const name = toPascalCase((filename));
        const node = new Node(allNodes, name, parseNodeValue(schema));
        node.schemaId = filename;

        if (schema.description) node.description = schema.description;

        // extract object
        if (node.value.type === 'object') {
            // console.log('__node.value__', node.value, filepath);
            const properties = schema.properties;
            extractObjectValue(properties, schema.required || [], node.value.props, node);
        }
        // extract array
        else if (node.value.type === 'array') {
            const items = schema.items;
            extractArrayValue(items, node.value.item, node);
        }

        collectDepends(schema, node.depends, schemaext);

        // extends
        if (schema && schema.allOf) {
            if (schema.allOf.length > 1) throw new Error('not support multi allOf')
            if (schema.allOf.length > 0) {
                const ref = schema.allOf[0]['$ref']
                if (ref.endsWith(schemaext)) {
                    const filename = getFileName(ref) // ref.substring(0, ref.length - schemaext.length)
                    node.extend = toPascalCase(filename);
                }
            }
        }

        allNodes.set(name, node);
    }
    return allNodes
}
