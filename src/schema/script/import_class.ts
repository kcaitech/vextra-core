/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseProp, NamedProp, Node } from "./basic";
import { Writer } from "./writer";

export function exportBaseProp(p: BaseProp, $: Writer, allNodes: Map<string, Node>) {
    switch (p.type) {
        case 'string':
        case 'number':
        case 'boolean':
            $.append(p.type);
            break;
        case 'node':
            const n = allNodes.get(p.val);
            if (!n) throw new Error('node not find ' + p.val);
            $.append((n.inner ? '' : 'impl.') + p.val);
            break;
        case 'map':
            $.append('BasicMap<' + p.key + ', ');
            exportBaseProp(p.val, $, allNodes);
            $.append('>');
            break;
        case 'oneOf':
            for (let i = 0, len = p.val.length; i < len; ++i) {
                const v = p.val[i];
                exportBaseProp(v, $, allNodes);
                if (i !== len - 1) {
                    $.append(' | ')
                }
            }
            break;
    }
}

function exportObject(n: Node, $: Writer) {
    if (n.value.type !== 'object') throw new Error();
    const exp = n.inner ? '' : 'export ';
    const extend = n.extend ? n.extend : 'Basic'
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
    const needTypeId = (() => {
        for (let i = 0; i < required.length; ++i) {
            if (required[i].required && required[i].name === 'typeId') return true;
        }
        return false;
    })()

    if (props.length > 0) $.nl(exp + 'class ' + n.name + ' extends ' + extend + ' ').sub(() => {
        if (needTypeId && n.schemaId) $.nl('typeId = "', n.schemaId, '"')
        props.forEach(p => {
            if (p.name === 'typeId') return;
            $.newline();
            $.indent().append(p.name + (p.required ? ': ' : '?: '));
            exportBaseProp(p, $, n.root);
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
                exportBaseProp(prop, $, n.root);
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
                } else {
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

export function exportNode(n: Node, $: Writer) {
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
        $.nl(exp + 'type ' + n.name + ' = ' + 'BasicArray<');
        exportBaseProp(item, $, n.root);
        $.append('>')
    }
    else if (n.value.type === 'object') {
        exportObject(n, $);
    }
    else {
        throw new Error("wrong value type: " + n.value)
    }
}