import { BaseProp, NamedProp, Node, allDepsIsGen, allNodes, fmtTypeName } from "./basic";
import { Writer } from "./writer";
import { exportBaseProp as exportBasePropType, exportNode as exportNodeClass } from "./import_class"
import { inject } from "./import-inject"

function exportBaseProp(p: BaseProp, source: string, $: Writer) {
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
                exportBasePropType(valType, $)
                $.append('>()')
                $.nl('const _val = ', source, ' as any')
                $.nl('Object.keys(', source, ').forEach((k) => ').sub(() => {
                    $.nl('const val = _val[k]')
                    $.nl('ret.set(k, ')
                    exportBaseProp(p.val, 'val', $)
                    $.append(')')
                }).append(')')
                $.nl('return ret')
            }).append(')()')
            break;
        case 'oneOf':
            $.append('(() => ').sub(() => {
                $.nl('if (typeof ', source, ' !== "object") ').sub(() => {
                    $.nl('return ', source)
                })
                const prop = Array.from(p.val);
                // 特定类型先处理
                for (let i = 0, usedArray = false; i < prop.length;) {
                    const v = prop[i];
                    if (v.type === 'string' || v.type === 'number' || v.type === 'boolean') {
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
                                exportBaseProp(v, source, $)
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
                            $.nl('if (', source, '.typeId === "', n.schemaId, '") ').sub(() => {
                                $.nl('return import', v.val, '(', source, ' as types.', v.val, ', ctx)');
                            })
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
        const n = allNodes.get(p.extend);
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
    const optional = superoptional.concat(...localoptional);
    const extend = n.extend;
    if (localoptional.length > 0) {
        $.nl('function import', n.name, 'Optional(tar: ', (n.inner ? '' : 'impl.'), n.name, ', source: types.', n.name, ', ctx?: IImportContext) ').sub(() => {
            if (extend && superoptional.length > 0) $.nl('import', extend, 'Optional(tar, source)')
            localoptional.forEach((v) => {
                $.nl('if (source.', v.name, ') ', 'tar.', v.name, ' = ');
                exportBaseProp(v, 'source.' + v.name, $);
            })
        })
    } else if (extend && superoptional.length > 0) {
        $.nl('const import', n.name, 'Optional = import', extend, 'Optional');
    }

    $.nl('export function import', n.name, '(source: types.', n.name, ', ctx?: IImportContext): ', (n.inner ? '' : 'impl.'), n.name, ' ').sub(() => {
        if (inject[n.name] && inject[n.name]['before']) {
            $.nl(inject[n.name]['before'])
        }

        $.nl('const ret: ', (n.inner ? '' : 'impl.'), n.name, ' = new ', (n.inner ? '' : 'impl.'), n.name, ' (')
        const hasArgs = required.length > 0 && (!(required.length === 1 && required[0].name === 'typeId'));
        if (hasArgs) $.indent(1, () => {
            let j = 0;
            $.newline();
            required.forEach((v, i) => {
                if (v.name === 'typeId') return;
                if (j > 0) $.append(',').newline();
                $.indent();
                exportBaseProp(v, 'source.' + v.name, $);
                ++j;
            })
        });
        $.append(')');

        if (localoptional.length > 0 || extend && superoptional.length > 0) {
            $.nl('import', n.name, 'Optional(ret, source, ctx)')
        }

        if (inject[n.name] && inject[n.name]['after']) {
            $.nl(inject[n.name]['after'])
        }

        $.nl('return ret')
    })
}

function exportNode(n: Node, $: Writer) {
    if (n.description) {
        $.nl('/* ' + n.description + ' */');
    }

    if (n.value.type === 'enum') {
        $.nl('export function import', n.name, '(source: types.', n.name, ', ctx?: IImportContext): ', (n.inner ? '' : 'impl.'), n.name, ' ').sub(() => {
            $.nl('return source')
        })
    }
    else if (n.value.type === 'array') {
        const item = n.value.item;
        $.nl('export function import', n.name, '(source: types.', n.name, ', ctx?: IImportContext): ', (n.inner ? '' : 'impl.'), n.name, ' ').sub(() => {
            $.nl('const ret: ', (n.inner ? '' : 'impl.'), n.name, ' = new BasicArray()')
            $.nl('source.forEach((source) => ').sub(() => {
                $.nl('ret.push(')
                exportBaseProp(item, 'source', $)
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

export function gen(out: string) {
    const $ = new Writer(out);
    const nodes = Array.from(allNodes.values());

    $.nl('import * as impl from "./classes"');
    $.nl('import * as types from "./typesdefine"')
    $.nl('import { BasicArray, BasicMap } from "./basic"')
    $.nl('import { uuid } from "../basic/uuid"')

    $.nl('export interface IImportContext ').sub(() => {
        $.nl('document: impl.Document')
        $.nl('curPage: string')
    })

    // 先将inner类型声明一下
    for (let i = 0, len = nodes.length; i < len; ++i) {
        const n = nodes[i];
        if (!n.inner) continue;
        exportNodeClass(n, $);
    }

    let checkExport = allDepsIsGen;
    const genType = 'imp'
    while (nodes.length > 0) {
        let count = 0;
        for (let i = 0; i < nodes.length;) {
            const n = nodes[i];
            if (checkExport(n, genType)) {
                exportNode(n, $);
                ++count;
                nodes.splice(i, 1);
                n.gented[genType] = true;
            } else {
                ++i;
            }
        }
        if (count === 0) checkExport = () => true; // export all
    }
}