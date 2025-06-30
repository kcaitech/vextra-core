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
import { exportBaseProp as exportBasePropType, exportNode as exportNodeClass } from "./import_class"
import { inject } from "./import-inject"

// 兼容非crdt数据
const needCompatibleSet = new Set([
    "stop",
    "shadow",
    "path-segment",
    "page-list-item",
    "fill",
    "export-format",
    "curve-point",
    "contact-role",
    "border",
    'group-shape',
    'image-shape',
    'path-shape',
    'rect-shape',
    'symbol-ref-shape',
    'symbol-shape',
    'symbol-union-shape',
    'text-shape',
    'artboard',
    'line-shape',
    'oval-shape',
    'table-shape',
    'contact-shape',
    'shape',
    'flatten-shape',
    'cutout-shape',
    'polygon-shape',
    'star-shape',
]);

function exportBaseProp(p: BaseProp, source: string, $: Writer, insideArr: boolean, allNodes: Map<string, Node>) {
    switch (p.type) {
        case 'string':
        case 'number':
        case 'boolean':
            $.append(source);
            break;
        case 'node':
            $.append('import' + p.val + '(' + source + ', ctx)');
            break;
        case 'map':
            const keyType = p.key;
            const valType = p.val;
            $.append('(() => ').sub(() => {
                $.nl('const ret = new BasicMap<', keyType, ', ')
                exportBasePropType(valType, $, allNodes)
                $.append('>()')
                $.nl('const _val = ', source, ' as any')
                $.nl('objkeys(_val).forEach((val, k) => ').sub(() => {
                    $.nl('ret.set(k, ')
                    exportBaseProp(p.val, 'val', $, insideArr, allNodes)
                    $.append(')')
                }).append(')')
                $.nl('return ret')
            }).append(')()')
            break;
        case 'oneOf':
            $.append('(() => ').sub(() => {
                const prop = Array.from(p.val);
                // 先处理undefined
                let hasUndefined = false;
                for (let i = 0; i < prop.length; ++i) {
                    const v = prop[i];
                    if (v.type === 'undefined') {
                        $.nl(`if (typeof ${source}!== "object" || ${source} == null) `).sub(() => {
                            $.nl(`return ${source} == null? undefined : ${source}`)
                        })
                        hasUndefined = true;
                        break;
                    }
                }
                if (!hasUndefined) $.fmt(`if (typeof ${source} !== "object") {
                    return ${source}
                }`)
                // 特定类型先处理
                for (let i = 0, usedArray = false; i < prop.length;) {
                    const v = prop[i];
                    if (v.type === 'string' || v.type === 'number' || v.type === 'boolean' || v.type === 'undefined') {
                        prop.splice(i, 1);
                        continue;
                    }
                    if (v.type === 'node') {
                        const n = allNodes.get(v.val);
                        if (!n) throw new Error('not find node ' + v.val);
                        if (n.value.type === 'array' && !usedArray) {
                            usedArray = true;
                            $.nl('if (Array.isArray(', source, ')) ').sub(() => {
                                $.nl('return ')
                                exportBaseProp(v, source, $, insideArr, allNodes)
                            })
                            prop.splice(i, 1);
                            continue;
                        }
                        ++i;
                    }
                    else {
                        throw Error('not supported')
                    }
                }
                for (let i = 0, len = prop.length; i < len; ++i) {
                    const v = prop[i];
                    if (v.type === 'node') {
                        const n = allNodes.get(v.val);
                        if (!n) throw new Error('not find node ' + v.val);
                        if (n.schemaId) {
                            $.fmt(`if (${source}.typeId === "${n.schemaId}") {
                                ${insideArr && n && n.schemaId && needCompatibleSet.has(n.schemaId) ? `
                                    if (${source}.crdtidx && !Array.isArray(${source}.crdtidx) && (${source}.crdtidx as { index: number[] }).index) {
                                        ${source}.crdtidx = (${source}.crdtidx as { index: number[] }).index;
                                    } else if (!${source}.crdtidx) {
                                        ${source}.crdtidx = [i];
                                    }` : ''}
                                return import${v.val}(${source} as types.${v.val}, ctx)
                            }`)
                        } else {
                            throw new Error('oneOf elements need typeId or unique type ' + JSON.stringify(n));
                        }
                    }
                }
                $.nl('throw new Error("unknow typeId: " + ', source, '.typeId)')
            }).append(')()')
            break;
    }
}

function exportObject(n: Node, $: Writer) {
    if (n.value.type !== 'object') throw new Error();

    // import optional
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
    const localoptional: NamedProp[] = [];
    for (let j = 0; j < props.length; ++j) {
        const pr = props[j];
        if (pr.required) localrequired.push(pr);
        else localoptional.push(pr);
    }
    const superrequired: NamedProp[] = [];
    const superoptional: NamedProp[] = [];
    for (let i = chain.length - 1; i >= 0; --i) {
        const n = chain[i];
        if (n.value.type !== 'object') continue;
        const props = n.value.props;
        for (let j = 0; j < props.length; ++j) {
            const pr = props[j];
            if (pr.required) superrequired.push(pr);
            else superoptional.push(pr);
        }
    }
    const required = superrequired.concat(...localrequired);
    const extend = n.extend;
    
    // 获取实际的返回类型名称
    const returnTypeName = n.name === 'ImageShape' ? 'RectShape' : n.name;
    
    if (localoptional.length > 0) {
        $.nl('function import', n.name, 'Optional(tar: ', (n.inner ? '' : 'impl.'), returnTypeName, ', source: types.', n.name, ', ctx?: IImportContext) ').sub(() => {
            if (extend && superoptional.length > 0) $.nl('import', extend, 'Optional(tar, source)')
            localoptional.forEach((v) => {
                $.nl('if (source.', v.name, ' !== undefined) ', 'tar.', v.name, ' = ');
                exportBaseProp(v, 'source.' + v.name, $, false, n.root);
            })
        })
    } else if (extend && superoptional.length > 0) {
        $.nl('const import', n.name, 'Optional = import', extend, 'Optional');
    }

    $.nl('export function import', n.name, '(source: types.', n.name, ', ctx?: IImportContext): ', (n.inner ? '' : 'impl.'), returnTypeName, ' ').sub(() => {
        if (inject[n.name] && inject[n.name]['before']) {
            $.nl(inject[n.name]['before'])
        }

        if (compatibleList.has(n.name)) {
            $.nl('compatibleOldData(source, ctx)')
        }
        if (inject[n.name] && inject[n.name]['content']) {
            $.nl(inject[n.name]['content']);
        } else {
            $.nl('const ret: ', (n.inner ? '' : 'impl.'), returnTypeName, ' = new ', (n.inner ? '' : 'impl.'), returnTypeName, ' (')
            const hasArgs = required.length > 0 && (!(required.length === 1 && required[0].name === 'typeId'));
            if (hasArgs) $.indent(1, () => {
                let j = 0;
                $.newline();
                required.forEach((v, i) => {
                    if (v.name === 'typeId') return;
                    // 如果是ImageShape转换为RectShape，过滤掉imageRef字段
                    if (n.name === 'ImageShape' && v.name === 'imageRef') return;
                    if (j > 0) $.append(',').newline();
                    $.indent();
                    exportBaseProp(v, 'source.' + v.name, $, false, n.root);
                    ++j;
                })
            });
            $.append(')');

            if (localoptional.length > 0 || extend && superoptional.length > 0) {
                $.nl('import', n.name, 'Optional(ret, source, ctx)')
            }
        }

        if (inject[n.name] && inject[n.name]['after']) {
            $.nl(inject[n.name]['after'])
        }
        if (inject[n.name] && inject[n.name]['force-type']) {
            $.nl('return ret ' + inject[n.name]['force-type']);
        } else {
            $.nl('return ret');
        }
    })
}

function exportNode(n: Node, $: Writer) {
    if (n.description) {
        $.nl('/* ' + n.description + ' */');
    }

    // 获取实际的返回类型名称
    const returnTypeName = n.name === 'ImageShape' ? 'RectShape' : n.name;

    if (n.value.type === 'enum') {
        $.nl('export function import', n.name, '(source: types.', n.name, ', ctx?: IImportContext): ', (n.inner ? '' : 'impl.'), returnTypeName, ' ').sub(() => {
            $.nl('return source')
        })
    }
    else if (n.value.type === 'array') {
        const item = n.value.item;
        $.nl('export function import', n.name, '(source: types.', n.name, ', ctx?: IImportContext): ', (n.inner ? '' : 'impl.'), returnTypeName, ' ').sub(() => {
            $.nl('const ret: ', (n.inner ? '' : 'impl.'), returnTypeName, ' = new BasicArray()')
            $.nl('source.forEach((source, i) => ').sub(() => {
                if (item.type === 'node') {
                    const _n = n.root.get(item.val);
                    if (_n && _n.schemaId && needCompatibleSet.has(_n.schemaId)) {
                        $.nl(`if (source.crdtidx && !Array.isArray(source.crdtidx) && (source.crdtidx as { index: number[] }).index) {
            source.crdtidx = (source.crdtidx as { index: number[] }).index;
        } else if (!source.crdtidx) {
            source.crdtidx = [i];
        }`)
                    }
                }
                $.nl('ret.push(')
                exportBaseProp(item, 'source', $, true, n.root)
                $.append(')')
            }).append(')')
            $.nl('return ret')
        })
    }
    else if (n.value.type === 'object') {
        exportObject(n, $);
    }
    else {
        throw new Error("wrong value type: " + n.value)
    }
}

const compatibleList = new Set([
    "PathShape",
    "PathShape2",
    "GroupShape",
    "Artboard",
    "ImageShape",
    "Page",
    "TextShape",
    "SymbolRefShape",
    "SymbolShape",
    "SymbolUnionShape",
    "RectShape",
    "StarShape",
    "PolygonShape",
    "OvalShape",
    "LineShape",
    "TableShape",
    "TableCell",
    "ContactShape",
    "CutoutShape",
    "BoolShape"
])

export function gen(allNodes: Map<string, Node>, out: string) {
    const $ = new Writer(out);
    const nodes = Array.from(allNodes.values());

    $.nl('import * as impl from "./classes"');
    $.nl('import * as types from "./typesdefine"')
    $.nl('import { BasicArray, BasicMap } from "./basic"')
    $.nl('import { uuid } from "../basic/uuid"')
    $.nl('import { compatibleOldData } from "./basecompatible"')
    $.nl('import { is_mac } from "./utils"')

    $.nl('export interface IImportContext ').sub(() => {
        $.nl('document: impl.Document')
        $.nl('fmtVer: string')
    })

    $.fmt(`function objkeys(obj: any) {
        return obj instanceof Map ? obj : { forEach: (f: (v: any, k: string) => void) => Object.keys(obj).forEach((k) => f(obj[k], k)) };
    }`)

    // 先将inner类型声明一下
    for (let i = 0, len = nodes.length; i < len; ++i) {
        const n = nodes[i];
        if (!n.inner) continue;
        exportNodeClass(n, $);
    }

    let checkExport = allDepsIsGen;
    // const genType = 'imp'
    const gented = new Set<string>()
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