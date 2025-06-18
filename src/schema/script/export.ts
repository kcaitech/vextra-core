/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseProp, InjectDefinitions, NamedProp, Node, allDepsIsGen } from "./basic";
import { Writer } from "./writer";
// import { inject } from "./export-inject";

/**
 * 生成基础属性的导出代码
 * 此函数生成将实现类实例转换为JSON数据的代码
 */
function generateBasePropExport(
    prop: BaseProp, 
    sourceExpression: string, 
    writer: Writer, 
    allNodes: Map<string, Node>
): void {
    switch (prop.type) {
        case 'string':
        case 'number':
        case 'boolean':
            // 基础类型直接返回
            writer.append(sourceExpression);
            break;
            
        case 'node':
            // 生成代码: exportNodeName(sourceExpression, ctx)
            writer.append(`export${prop.val}(${sourceExpression}, ctx)`);
            break;
            
        case 'map':
            generateMapExport(prop, sourceExpression, writer, allNodes);
            break;
            
        case 'oneOf':
            generateOneOfExport(prop, sourceExpression, writer, allNodes);
            break;
    }
}

/**
 * 生成Map类型的导出代码
 * 生成代码将BasicMap实例转换为JSON对象
 */
function generateMapExport(
    prop: BaseProp & { type: 'map' }, 
    sourceExpression: string, 
    writer: Writer, 
    allNodes: Map<string, Node>
): void {
    writer.append('(() => ').sub(() => {
        writer.nl('const ret: any = {}');
        writer.nl(`${sourceExpression}.forEach((source, k) => `).sub(() => {
            writer.nl('ret[k] = ');
            generateBasePropExport(prop.val, 'source', writer, allNodes);
        }).append(')');
        writer.nl('return ret');
    }).append(')()');
}

/**
 * 生成OneOf类型的导出代码
 * 生成代码根据typeId或类型判断选择正确的导出分支
 */
function generateOneOfExport(
    prop: BaseProp & { type: 'oneOf' }, 
    sourceExpression: string, 
    writer: Writer, 
    allNodes: Map<string, Node>
): void {
    writer.append('(() => ').sub(() => {
        const propTypes = Array.from(prop.val);
        
        // 处理undefined类型分支
        handleUndefinedExport(propTypes, sourceExpression, writer);
        
        // 处理基础类型分支
        handleBasicTypesExport(propTypes, sourceExpression, writer);
        
        // 处理数组类型分支
        handleArrayExport(propTypes, sourceExpression, writer, allNodes);
        
        // 处理其他节点类型分支
        handleNodeTypesExport(propTypes, sourceExpression, writer, allNodes);
        
        // 如果没有匹配的类型，抛出错误
        writer.nl(`throw new Error("unknow typeId: " + ${sourceExpression}.typeId)`);
    }).append(')()');
}

/**
 * 处理undefined类型的导出分支
 */
function handleUndefinedExport(propTypes: BaseProp[], sourceExpression: string, writer: Writer): void {
    for (let i = 0; i < propTypes.length; i++) {
        const propType = propTypes[i];
        if (propType.type === 'undefined') {
            writer.nl(`if (typeof ${sourceExpression} !== "object" || ${sourceExpression} == null) `).sub(() => {
                writer.nl(`return ${sourceExpression} == null ? undefined : ${sourceExpression}`);
            });
            return;
        }
    }
}

/**
 * 处理基础类型的导出分支
 */
function handleBasicTypesExport(propTypes: BaseProp[], sourceExpression: string, writer: Writer): void {
    const hasUndefined = propTypes.some(prop => prop.type === 'undefined');
    
    if (!hasUndefined) {
        writer.nl(`if (typeof ${sourceExpression} !== "object") `).sub(() => {
            writer.nl(`return ${sourceExpression}`);
        });
    }
}

/**
 * 处理数组类型的导出分支
 */
function handleArrayExport(
    propTypes: BaseProp[], 
    sourceExpression: string, 
    writer: Writer, 
    allNodes: Map<string, Node>
): void {
    let usedArray = false;
    
    // 从后往前遍历，移除已处理的基础类型
    for (let i = propTypes.length - 1; i >= 0; i--) {
        const propType = propTypes[i];
        
        // 移除基础类型
        if (['string', 'number', 'boolean', 'undefined'].includes(propType.type)) {
            propTypes.splice(i, 1);
            continue;
        }
        
        // 处理数组类型节点
        if (propType.type === 'node' && !usedArray) {
            const node = allNodes.get(propType.val);
            if (!node) {
                throw new Error(`Node not found: ${propType.val}`);
            }
            
            if (node.value.type === 'array') {
                usedArray = true;
                writer.nl(`if (Array.isArray(${sourceExpression})) `).sub(() => {
                    writer.nl('return ');
                    generateBasePropExport(propType, sourceExpression, writer, allNodes);
                });
                propTypes.splice(i, 1);
            }
        }
    }
}

/**
 * 处理节点类型的导出分支
 */
function handleNodeTypesExport(
    propTypes: BaseProp[], 
    sourceExpression: string, 
    writer: Writer, 
    allNodes: Map<string, Node>
): void {
    for (const propType of propTypes) {
        if (propType.type === 'node') {
            const node = allNodes.get(propType.val);
            if (!node) {
                throw new Error(`Node not found: ${propType.val}`);
            }
            
            if (node.schemaId) {
                writer.nl(`if (${sourceExpression}.typeId === "${node.schemaId}") `).sub(() => {
                    writer.nl(`return export${propType.val}(${sourceExpression} as types.${propType.val}, ctx)`);
                });
            } else {
                throw new Error(`OneOf elements need typeId or unique type: ${JSON.stringify(node)}`);
            }
        }
    }
}

/**
 * 生成对象类型的导出函数
 */
function generateObjectExport(node: Node, writer: Writer, inject?: InjectDefinitions): void {
    if (node.value.type !== 'object') {
        throw new Error(`Expected object type, got ${node.value.type}`);
    }

    const properties = node.value.props;
    const inheritanceChain = buildObjectInheritanceChain(node);
    const requiredProps = collectRequiredProperties(inheritanceChain);
    const needTypeId = requiredProps.some(prop => prop.required && prop.name === 'typeId');

    // 注入前置代码
    injectCustomCode(node, writer, 'before', inject);

    // 创建返回对象
    createReturnObject(node, writer);

    // 设置typeId
    if (needTypeId && node.schemaId) {
        writer.nl(`ret.typeId = "${node.schemaId}"`);
    }

    // 处理属性导出
    exportObjectProperties(properties, writer, node.root);

    // 注入后置代码
    injectCustomCode(node, writer, 'after', inject);

    writer.nl('return ret');
}

/**
 * 构建对象继承链
 */
function buildObjectInheritanceChain(node: Node): Node[] {
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
function collectRequiredProperties(inheritanceChain: Node[]): NamedProp[] {
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
 * 创建返回对象
 */
function createReturnObject(node: Node, writer: Writer): void {
    if (node.extend) {
        writer.nl(`const ret: types.${node.name} = export${node.extend}(source, ctx) as types.${node.name}`);
    } else {
        writer.nl(`const ret: types.${node.name} = {} as types.${node.name}`);
    }
}

/**
 * 导出对象属性
 */
function exportObjectProperties(properties: NamedProp[], writer: Writer, allNodes: Map<string, Node>): void {
    for (const prop of properties) {
        if (prop.required) {
            // 必需属性直接赋值
            writer.nl(`ret.${prop.name} = `);
            generateBasePropExport(prop, `source.${prop.name}`, writer, allNodes);
        } else {
            // 可选属性需要检查是否存在
            writer.nl(`if (source.${prop.name} !== undefined) ret.${prop.name} = `);
            generateBasePropExport(prop, `source.${prop.name}`, writer, allNodes);
        }
    }
}

/**
 * 注入自定义代码
 */
function injectCustomCode(node: Node, writer: Writer, phase: 'before' | 'after', inject?: InjectDefinitions): void {
    const customCode = inject?.[node.name]?.[phase];
    if (customCode) {
        writer.nl(customCode);
    }
}

/**
 * 生成单个节点的导出函数
 */
function generateNodeExport(node: Node, writer: Writer, inject?: InjectDefinitions): void {
    if (node.description) {
        writer.nl(`/* ${node.description} */`);
    }
    
    writer.nl(`export function export${node.name}(source: types.${node.name}, ctx?: IExportContext): types.${node.name} `).sub(() => {
        switch (node.value.type) {
            case 'enum':
                // 枚举类型直接返回原值
                writer.nl('return source');
                break;
                
            case 'array':
                generateArrayExport(node, writer);
                break;
                
            case 'object':
                generateObjectExport(node, writer, inject);
                break;
                
            default:
                const exhaustiveCheck: never = node.value;
                throw new Error(`Unsupported node value type: ${JSON.stringify(exhaustiveCheck)}`);
        }
    });
}

/**
 * 生成数组类型的导出函数
 */
function generateArrayExport(node: Node, writer: Writer): void {
    if (node.value.type !== 'array') {
        throw new Error(`Expected array type, got ${node.value.type}`);
    }
    
    const item = node.value.item;
    writer.nl(`const ret: types.${node.name} = []`);
    writer.nl('source.forEach((source) => ').sub(() => {
        writer.nl('ret.push(');
        generateBasePropExport(item, 'source', writer, node.root);
        writer.append(')');
    }).append(')');
    writer.nl('return ret');
}

interface ExportGenerationConfig {
    inject?: InjectDefinitions;
    extraHeader?: (writer: Writer) => void;
    outputPath: string;
}

/**
 * 生成所有导出代码
 */
export function gen(allNodes: Map<string, Node>, config: ExportGenerationConfig): void {
    const writer = new Writer(config.outputPath);
    
    try {
        const nodes = Array.from(allNodes.values());

        if (config.extraHeader) {
            config.extraHeader(writer);
        }

        // 导入必要的类型和接口
        generateImportStatements(writer);

        // 导出接口定义
        generateExportContext(writer);

        // 按依赖顺序生成导出函数
        generateExportFunctionsInOrder(nodes, writer, config.inject);
    } finally {
        // 确保所有内容都被写入文件
        writer.flush();
    }
}

/**
 * 生成导入语句
 */
function generateImportStatements(writer: Writer): void {
    writer.nl('import * as types from "./typesdefine"');
}

/**
 * 生成导出上下文接口
 */
function generateExportContext(writer: Writer): void {
    writer.nl('export interface IExportContext ').sub(() => {
        writer.nl('symbols?: Set<string>');
        writer.nl('medias?: Set<string>');
        writer.nl('refsymbols?: Set<string>');
        writer.nl('styles?: Set<string>');
    });
}

/**
 * 按依赖顺序生成导出函数
 */
function generateExportFunctionsInOrder(nodes: Node[], writer: Writer, inject?: InjectDefinitions): void {
    let checkExport = allDepsIsGen;
    const generated = new Set<string>();

    while (nodes.length > 0) {
        let progress = 0;
        
        for (let i = 0; i < nodes.length;) {
            const node = nodes[i];
            
            if (checkExport(node, generated)) {
                generateNodeExport(node, writer, inject);
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