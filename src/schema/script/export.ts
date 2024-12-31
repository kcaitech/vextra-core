import { BaseProp, NamedProp, Node, allDepsIsGen, allNodes, fmtTypeName } from "./basic";
import { Writer } from "./writer";
import { inject } from "./export-inject"

function exportBaseProp(p: BaseProp, source: string, $: Writer) {
    switch (p.type) {
        case 'string':
        case 'number':
        case 'boolean':
            $.append(source);
            break;
        case 'node':
            $.append('export' + p.val + '(' + source + ', ctx)');
            break;
        case 'map':
            $.append('(() => ').sub(() => {
                $.nl('const ret: any = {}')
                $.nl(source, '.forEach((source, k) => ').sub(() => {
                    $.nl('ret[k] = ')
                    exportBaseProp(p.val, 'source', $)
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
                                $.nl('return export', v.val, '(', source, ' as types.', v.val, ', ctx)');
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

    const props = n.value.props;

    const chain: Node[] = [n];
    let p = n;
    while (p.extend) {
        const n = allNodes.get(p.extend);
        if (!n) throw new Error('extend not find: ' + p.extend);
        chain.push(n);
        p = n;
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

    const needTypeId = (() => {
        for (let i = 0; i < required.length; ++i) {
            if (required[i].required && required[i].name === 'typeId') return true;
        }
        return false;
    })()

    if (inject[n.name] && inject[n.name]['before']) {
        $.nl(inject[n.name]['before'])
    }

    if (n.extend) {
        $.nl('const ret: types.', n.name, ' = export', n.extend, '(source, ctx) as types.', n.name)
    } else {
        $.nl('const ret: types.', n.name, ' = {} ', 'as types.', n.name)
    }

    if (needTypeId && n.schemaId) $.nl('ret.typeId = "', n.schemaId, '"');

    for (let i = 0, len = props.length; i < len; ++i) {
        const p = props[i];
        if (p.required) {
            $.nl('ret.', p.name, ' = ')
            exportBaseProp(p, 'source.' + p.name, $);
        } else {
            $.nl('if (source.', p.name, ' !== undefined) ret.', p.name, ' = ');
            exportBaseProp(p, 'source.' + p.name, $);
        }
    }

    if (inject[n.name] && inject[n.name]['after']) {
        $.nl(inject[n.name]['after'])
    }

    $.nl('return ret')
}

function exportNode(n: Node, $: Writer) {
    if (n.description) {
        $.nl('/* ' + n.description + ' */');
    }
    $.nl('export function export', n.name, '(source: types.', n.name, ', ctx?: IExportContext): types.', n.name, ' ').sub(() => {
        if (n.value.type === 'enum') {
            $.nl('return source')
        }
        else if (n.value.type === 'array') {
            const item = n.value.item;
            $.nl('const ret: types.', n.name, ' = []')
            $.nl('source.forEach((source) => ').sub(() => {
                $.nl('ret.push(')
                exportBaseProp(item, 'source', $)
                $.append(')')
            }).append(')')
            $.nl('return ret')
        }
        else if (n.value.type === 'object') {
            exportObject(n, $);
        }
        else {
            throw new Error("wrong value type: " + n.value)
        }
    })
}

export function gen(out: string) {
    const $ = new Writer(out);
    const nodes = Array.from(allNodes.values());

    $.nl('import * as types from "./typesdefine"')
    $.nl('export interface IExportContext ').sub(() => {
        $.nl('symbols?: Set<string>')
        $.nl('medias?: Set<string>')
        $.nl('refsymbols?: Set<string>')
    })

    let checkExport = allDepsIsGen;
    const genType = 'exp'
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