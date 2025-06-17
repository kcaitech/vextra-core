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
import { inject } from "./export-inject";

/**
 * 导出基础属性的值
 */
function exportBaseProp(prop: BaseProp, source: string, writer: Writer, allNodes: Map<string, Node>): void {
    switch (prop.type) {
        case 'string':
        case 'number':
        case 'boolean':
            writer.append(source);
            break;
        case 'node':
            writer.append(`export${prop.val}(${source}, ctx)`);
            break;
        case 'map':
            writer.append('(() => ').sub(() => {
                writer.nl('const ret: any = {}');
                writer.nl(`${source}.forEach((source, k) => `).sub(() => {
                    writer.nl('ret[k] = ');
                    exportBaseProp(prop.val, 'source', writer, allNodes);
                }).append(')');
                writer.nl('return ret');
            }).append(')()');
            break;
        case 'oneOf':
            exportOneOfProp(prop, source, writer, allNodes);
            break;
    }
}

/**
 * 导出 oneOf 类型的属性
 */
function exportOneOfProp(prop: BaseProp & { type: 'oneOf' }, source: string, writer: Writer, allNodes: Map<string, Node>): void {
    writer.append('(() => ').sub(() => {
        const propTypes = Array.from(prop.val);
        
        // 处理 undefined 类型
        const hasUndefined = handleUndefinedType(propTypes, source, writer);
        
        if (!hasUndefined) {
            writer.nl(`if (typeof ${source} !== "object") `).sub(() => {
                writer.nl(`return ${source}`);
            });
        }
        
        // 处理数组类型
        handleArrayType(propTypes, source, writer, allNodes);
        
        // 处理其他节点类型
        handleNodeTypes(propTypes, source, writer, allNodes);
        
        writer.nl(`throw new Error("unknow typeId: " + ${source}.typeId)`);
    }).append(')()');
}

/**
 * 处理 undefined 类型
 */
function handleUndefinedType(propTypes: BaseProp[], source: string, writer: Writer): boolean {
    for (let i = 0; i < propTypes.length; i++) {
        const propType = propTypes[i];
        if (propType.type === 'undefined') {
            writer.nl(`if (typeof ${source} !== "object" || ${source} == null) `).sub(() => {
                writer.nl(`return ${source} == null ? undefined : ${source}`);
            });
            return true;
        }
    }
    return false;
}

/**
 * 处理数组类型
 */
function handleArrayType(propTypes: BaseProp[], source: string, writer: Writer, allNodes: Map<string, Node>): void {
    let usedArray = false;
    
    for (let i = propTypes.length - 1; i >= 0; i--) {
        const propType = propTypes[i];
        
        if (propType.type === 'string' || propType.type === 'number' || 
            propType.type === 'boolean' || propType.type === 'undefined') {
            propTypes.splice(i, 1);
            continue;
        }
        
        if (propType.type === 'node' && !usedArray) {
            const node = allNodes.get(propType.val);
            if (!node) {
                throw new Error(`Node not found: ${propType.val}`);
            }
            
            if (node.value.type === 'array') {
                usedArray = true;
                writer.nl(`if (Array.isArray(${source})) `).sub(() => {
                    writer.nl('return ');
                    exportBaseProp(propType, source, writer, allNodes);
                });
                propTypes.splice(i, 1);
            }
        }
    }
}

/**
 * 处理节点类型
 */
function handleNodeTypes(propTypes: BaseProp[], source: string, writer: Writer, allNodes: Map<string, Node>): void {
    for (const propType of propTypes) {
        if (propType.type === 'node') {
            const node = allNodes.get(propType.val);
            if (!node) {
                throw new Error(`Node not found: ${propType.val}`);
            }
            
            if (node.schemaId) {
                writer.nl(`if (${source}.typeId === "${node.schemaId}") `).sub(() => {
                    writer.nl(`return export${propType.val}(${source} as types.${propType.val}, ctx)`);
                });
            } else {
                throw new Error(`OneOf elements need typeId or unique type: ${JSON.stringify(node)}`);
            }
        }
    }
}

/**
 * 导出对象类型
 */
function exportObject(node: Node, writer: Writer): void {
    if (node.value.type !== 'object') {
        throw new Error(`Expected object type, got ${node.value.type}`);
    }

    const properties = node.value.props;
    const inheritanceChain = buildInheritanceChain(node);
    const requiredProps = collectRequiredProps(inheritanceChain);
    const needTypeId = requiredProps.some(prop => prop.required && prop.name === 'typeId');

    // 注入前置代码
    if (inject[node.name]?.before) {
        writer.nl(inject[node.name].before);
    }

    // 创建返回对象
    if (node.extend) {
        writer.nl(`const ret: types.${node.name} = export${node.extend}(source, ctx) as types.${node.name}`);
    } else {
        writer.nl(`const ret: types.${node.name} = {} as types.${node.name}`);
    }

    // 设置 typeId
    if (needTypeId && node.schemaId) {
        writer.nl(`ret.typeId = "${node.schemaId}"`);
    }

    // 处理属性
    for (const prop of properties) {
        if (prop.required) {
            writer.nl(`ret.${prop.name} = `);
            exportBaseProp(prop, `source.${prop.name}`, writer, node.root);
        } else {
            writer.nl(`if (source.${prop.name} !== undefined) ret.${prop.name} = `);
            exportBaseProp(prop, `source.${prop.name}`, writer, node.root);
        }
    }

    // 注入后置代码
    if (inject[node.name]?.after) {
        writer.nl(inject[node.name].after);
    }

    writer.nl('return ret');
}

/**
 * 构建继承链
 */
function buildInheritanceChain(node: Node): Node[] {
    const chain: Node[] = [node];
    let current = node;
    
    while (current.extend) {
        const parent = current.root.get(current.extend);
        if (!parent) {
            throw new Error(`Parent class not found: ${current.extend}`);
        }
        chain.push(parent);
        current = parent;
    }
    
    return chain;
}

/**
 * 收集所有必需属性
 */
function collectRequiredProps(inheritanceChain: Node[]): NamedProp[] {
    const requiredProps: NamedProp[] = [];
    
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
        const node = inheritanceChain[i];
        if (node.value.type === 'object') {
            const props = node.value.props.filter(prop => prop.required);
            requiredProps.push(...props);
        }
    }
    
    return requiredProps;
}

/**
 * 导出单个节点
 */
function exportNode(node: Node, writer: Writer): void {
    if (node.description) {
        writer.nl(`/* ${node.description} */`);
    }
    
    writer.nl(`export function export${node.name}(source: types.${node.name}, ctx?: IExportContext): types.${node.name} `).sub(() => {
        switch (node.value.type) {
            case 'enum':
                writer.nl('return source');
                break;
            case 'array':
                exportArrayNode(node, writer);
                break;
            case 'object':
                exportObject(node, writer);
                break;
            default:
                const exhaustiveCheck: never = node.value;
                throw new Error(`Unsupported node value type: ${JSON.stringify(exhaustiveCheck)}`);
        }
    });
}

/**
 * 导出数组节点
 */
function exportArrayNode(node: Node, writer: Writer): void {
    if (node.value.type !== 'array') {
        throw new Error(`Expected array type, got ${node.value.type}`);
    }
    
    const item = node.value.item;
    writer.nl(`const ret: types.${node.name} = []`);
    writer.nl('source.forEach((source) => ').sub(() => {
        writer.nl('ret.push(');
        exportBaseProp(item, 'source', writer, node.root);
        writer.append(')');
    }).append(')');
    writer.nl('return ret');
}

/**
 * 生成导出代码
 */
export function gen(allNodes: Map<string, Node>, outputPath: string): void {
    const writer = new Writer(outputPath);
    const nodes = Array.from(allNodes.values());

    // 导入必要的类型和接口
    writer.nl('import * as types from "./typesdefine"');
    writer.nl('export interface IExportContext ').sub(() => {
        writer.nl('symbols?: Set<string>');
        writer.nl('medias?: Set<string>');
        writer.nl('refsymbols?: Set<string>');
        writer.nl('styles?: Set<string>');
    });

    // 按依赖顺序生成导出函数
    generateInDependencyOrder(nodes, writer);
}

/**
 * 按依赖顺序生成代码
 */
function generateInDependencyOrder(nodes: Node[], writer: Writer): void {
    let checkExport = allDepsIsGen;
    const generated = new Set<string>();

    while (nodes.length > 0) {
        let progress = 0;
        
        for (let i = 0; i < nodes.length;) {
            const node = nodes[i];
            
            if (checkExport(node, generated)) {
                exportNode(node, writer);
                progress++;
                nodes.splice(i, 1);
                generated.add(node.name);
            } else {
                i++;
            }
        }
        
        // 如果没有进展，导出所有剩余节点
        if (progress === 0) {
            checkExport = () => true;
        }
    }
}