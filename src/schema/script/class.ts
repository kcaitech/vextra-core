/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseProp, NamedProp, Node, allDepsIsGen } from "./basic";
import { Writer } from "./writer";

function exportBaseProp(p: BaseProp, $: Writer, baseClass: {
    array: string,
    map: string,
    extends?: string
}) {
    switch (p.type) {
        case 'string':
        case 'number':
        case 'boolean':
            $.append(p.type);
            break;
        case 'node':
            $.append(p.val);
            break;
        case 'map':
            $.append(`${baseClass.map}<${p.key}, `)
            exportBaseProp(p.val, $, baseClass);
            $.append('>');
            break;
        case 'oneOf':
            for (let i = 0, len = p.val.length; i < len; ++i) {
                const v = p.val[i];
                exportBaseProp(v, $, baseClass);
                if (i !== len - 1) {
                    $.append(' | ')
                }
            }
            break;
    }
}

function exportObject(n: Node, $: Writer, baseClass: {
    array: string,
    map: string,
    extends?: string
}) {
    if (n.value.type !== 'object') throw new Error();
    const exp = n.inner ? '' : 'export ';
    const extend = n.extend ? n.extend : baseClass.extends
    const props = n.value.props;

    const chain: Node[] = [];
    let p = n;
    while (p.extend) {
        const n = p.root.get(p.extend);
        if (!n) throw new Error('extend not find: ' + p.extend);
        chain.push(n);
        p = n;
    }
    const localrequired: NamedProp[] = [];
    for (let j = 0; j < props.length; ++j) {
        const pr = props[j];
        if (pr.required) localrequired.push(pr);
        else break;
    }
    const required: NamedProp[] = [];
    for (let i = chain.length - 1; i >= 0; --i) {
        const n = chain[i];
        if (n.value.type !== 'object') continue;
        const props = n.value.props;
        for (let j = 0; j < props.length; ++j) {
            const pr = props[j];
            if (pr.required) required.push(pr);
            else break;
        }
    }
    required.push(...localrequired);
    // const needTypeId = (() => {
    //     for (let i = 0; i < required.length; ++i) {
    //         if (required[i].required && required[i].name === 'typeId') return true;
    //     }
    //     return false;
    // })()
    // 这里有个很隐晦的情况：
    // 协作走的是JSON.stringnify，所以class里带的typeId也序列化出去了，回来的时候可以用typeId.
    // 而正常的export不会给没有声明typeId的class导出typeId的，所以正常文档数据里这些数据是没typeId.
    const needTypeId = true;

    if (props.length > 0) $.nl(`${exp}class ${n.name} ${extend ? 'extends ' + extend + ' ': ''}`).sub(() => {
        if (needTypeId && n.schemaId) $.nl('typeId = "', n.schemaId, '"')
        props.forEach(p => {
            if (p.name === 'typeId') return;
            $.newline();
            $.indent().append(p.name + (p.required ? ': ' : '?: '));
            exportBaseProp(p, $, baseClass);
        })

        const needConstructor = localrequired.length > 0 && (!(localrequired.length === 1 && localrequired[0].name === 'typeId'))
        // constructor
        if (needConstructor) {
            $.nl('constructor(')
            for (let i = 0, j = 0; i < required.length; ++i) {
                const prop = required[i];
                if (prop.name === 'typeId') continue;
                if (j > 0) $.append(', ');
                $.append(prop.name + ': ');
                exportBaseProp(prop, $, baseClass);
                if (prop.default !== undefined) {
                    if (prop.type === 'boolean' || prop.type === 'number') $.append(' = ' + prop.default);
                    else if (prop.type === 'string') $.append(' = "' + prop.default + '"');
                    else throw new Error("not supported default type " + prop.type)
                }
                ++j;
            }

            $.append(') ').sub(() => {
                // super
                if (required.length > localrequired.length) {
                    $.nl('super(')
                    for (let i = 0, j = 0, len = required.length - localrequired.length; i < len; ++i) {
                        const prop = required[i];
                        if (prop.name === 'typeId') continue;
                        if (j > 0) $.append(', ');
                        $.append(prop.name);
                        ++j;
                    }
                    $.append(')')
                } else if (extend) {
                    $.nl('super()')
                }

                for (let i = 0; i < localrequired.length; ++i) {
                    const prop = localrequired[i];
                    if (prop.name === 'typeId') continue;
                    $.nl('this.', prop.name, ' = ', prop.name)
                }
            })
        }
    })
    else if (n.extend) {
        if (needTypeId && n.schemaId) {
            const schemaId = n.schemaId;
            $.nl(exp + 'class ' + n.name + ' extends ' + extend + ' ').sub(() => {
                $.nl('typeId = "', schemaId, '"')
            });
        }
        else $.nl(exp + 'class ' + n.name + ' extends ' + extend + ' {}');
    }
    else throw new Error('wrong object: ' + n);
}

function exportNode(n: Node, $: Writer, baseClass: {
    array: string,
    map: string,
    extends?: string
}) {
    if (n.value.type === 'enum') {
        // 不需要输出
        return;
    }

    if (n.description) {
        $.nl('/* ' + n.description + ' */');
    }

    if (n.value.type === 'array') {
        const exp = n.inner ? '' : 'export ';
        if (n.extend) throw new Error('array can\'t extend class')
        const item = n.value.item;
        $.nl(`${exp}type ${n.name} = ${baseClass.array}<`)
        exportBaseProp(item, $, baseClass);
        $.append('>')
    }
    else if (n.value.type === 'object') {
        exportObject(n, $, baseClass);
    }
    else {
        throw new Error("wrong value type: " + n.value)
    }
}

export function gen(allNodes: Map<string, Node>, out: string, customs: {
    extraHeader?(w: Writer): void;
    typesPath: string;
    baseClass?: {
        array?: string,
        map?: string,
        extends?: string
    },
    extraOrder?: string[]
}) {
    const $ = new Writer(out);
    const nodes = Array.from(allNodes.values());

    // enums
    const enums = (() => {
        const enums = new Set()
        for (let i = 0, len = nodes.length; i < len; ++i) {
            const v = nodes[i]
            if (v.value.type === 'enum') {
                enums.add(v.name)
            }
        }
        let ret = ''
        let needDotAndLine = false
        enums.forEach((e) => {
            if (needDotAndLine) ret += ',\n'
            ret += '    ' + e
            needDotAndLine = true
        })
        return ret;
    })()

    $.nl(`export {\n${enums}\n} from "${customs.typesPath}"`);
    $.nl(`import {\n${enums}\n} from "${customs.typesPath}"`);
    if (customs.extraHeader) customs.extraHeader($)

    // 按顺序输出下列class
    const order = customs.extraOrder ?? []
    // const genType = 'cls'
    let checkExport = allDepsIsGen;
    const gented = new Set<string>()
    while (nodes.length > 0) {
        let count = 0;
        for (let i = 0; i < nodes.length;) {
            const n = nodes[i];
            if (checkExport(n, gented)) {
                exportNode(n, $, {
                    array: customs.baseClass?.array ?? 'Array',
                    map: customs.baseClass?.map ?? 'Map',
                    extends: customs.baseClass?.extends
                });
                ++count;
                nodes.splice(i, 1);
                gented.add(n.name)
            } else {
                ++i;
            }
        }
        if (count === 0 && checkExport === allDepsIsGen) checkExport = (n: Node) => {
            if (order.length > 0 && n.name === order[0]) {
                order.shift();
                return true;
            }
            return !(order.length > 0);
        }; // export on order
    }
}