/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseProp, Node, allDepsIsGen, toPascalCase } from "./basic";
import { Writer } from "./writer";

function exportBaseProp(p: BaseProp, $: Writer) {
    switch (p.type) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'undefined':
            $.append(p.type);
            break;
        case 'node':
            $.append(p.val);
            break;
        case 'map':
            $.append('Map<' + p.key + ', ');
            exportBaseProp(p.val, $);
            $.append('>');
            break;
        case 'oneOf':
            for (let i = 0, len = p.val.length; i < len; ++i) {
                const v = p.val[i];
                exportBaseProp(v, $);
                if (i !== len - 1) {
                    $.append(' | ')
                }
            }
            break;
    }
}

function exportNode(n: Node, $: Writer) {
    if (n.description) {
        $.nl('/* ' + n.description + ' */');
    }

    if (n.value.type === 'enum') {
        const _enum = n.value.enum;
        $.nl(('export ') + 'enum ' + n.name + ' ').sub(() => {
            for (let i = 0; i < _enum.length; ++i) {
                const e = _enum[i];
                $.nl(toPascalCase(e) + ' = "' + e + '",');
            }
        })
    }
    else if (n.value.type === 'array') {
        const exp = 'export ';
        const item = n.value.item;
        $.nl(exp + 'type ' + n.name + ' = ' + (n.extend ? n.extend + ' & ' : '') + 'Array<');
        exportBaseProp(item, $);
        $.append('>')
    }
    else if (n.value.type === 'object') {
        const exp = 'export ';
        const props = n.value.props;
        if (props.length > 0) $.nl(exp + 'type ' + n.name + ' = ' + (n.extend ? n.extend + ' & ' : '')).sub(() => {
            props.forEach(p => {
                $.newline();
                $.indent().append(p.name + (p.required ? ': ' : '?: '));
                exportBaseProp(p, $);
                $.append(',');
            })
        })
        else if (n.extend) $.nl(exp + 'type ' + n.name + ' = ' + n.extend);
        else throw new Error('wrong object: ' + n);
    }
    else {
        throw new Error("wrong value type: " + n.value)
    }
}

export function gen(allNodes: Map<string, Node>, out: string) {
    const $ = new Writer(out);
    const nodes = Array.from(allNodes.values());

    let checkExport = allDepsIsGen;
    const gented = new Set<string>()
    // const genType = 'tys'
    while (nodes.length > 0) {
        let count = 0;
        for (let i = 0; i < nodes.length;) {
            const n = nodes[i];
            if (checkExport(n, gented)) {
                exportNode(n, $);
                ++count;
                nodes.splice(i, 1);
                // n.gented[genType] = true;
                gented.add(n.name)
            } else {
                ++i;
            }
        }
        if (count === 0) checkExport = () => true; // export all
    }
}