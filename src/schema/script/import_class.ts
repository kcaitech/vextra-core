/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseProp, NamedProp, Node } from "./basic";
import { Writer } from "./writer";

/**
 * 生成基础属性的类型声明
 * 此函数为导入类生成器生成正确的TypeScript类型声明
 * 
 * @param prop 属性定义
 * @param writer 代码写入器
 * @param allNodes 所有节点的映射
 */
export function exportBaseProp(prop: BaseProp, writer: Writer, allNodes: Map<string, Node>): void {
    switch (prop.type) {
        case 'string':
        case 'number':
        case 'boolean':
            writer.append(prop.type);
            break;
            
        case 'node':
            generateNodeTypeReference(prop, writer, allNodes);
            break;
            
        case 'map':
            generateMapTypeDeclaration(prop, writer, allNodes);
            break;
            
        case 'oneOf':
            generateUnionTypeDeclaration(prop, writer, allNodes);
            break;
    }
}

/**
 * 生成节点类型引用
 * 根据节点是否为内部节点决定是否添加impl前缀
 */
function generateNodeTypeReference(prop: BaseProp & { type: 'node' }, writer: Writer, allNodes: Map<string, Node>): void {
    const node = allNodes.get(prop.val);
    if (!node) {
        throw new Error(`Node not found: ${prop.val}`);
    }
    
    const typePrefix = node.inner ? '' : 'impl.';
    writer.append(typePrefix + prop.val);
}

/**
 * 生成Map类型声明
 */
function generateMapTypeDeclaration(prop: BaseProp & { type: 'map' }, writer: Writer, allNodes: Map<string, Node>): void {
    writer.append(`BasicMap<${prop.key}, `);
    exportBaseProp(prop.val, writer, allNodes);
    writer.append('>');
}

/**
 * 生成联合类型声明
 */
function generateUnionTypeDeclaration(prop: BaseProp & { type: 'oneOf' }, writer: Writer, allNodes: Map<string, Node>): void {
    const unionTypes = prop.val;
    
    for (let i = 0; i < unionTypes.length; i++) {
        const unionType = unionTypes[i];
        exportBaseProp(unionType, writer, allNodes);
        
        if (i !== unionTypes.length - 1) {
            writer.append(' | ');
        }
    }
}

/**
 * 生成对象类的声明
 * 处理类继承、构造函数生成和属性声明
 */
function generateObjectClass(node: Node, writer: Writer): void {
    if (node.value.type !== 'object') {
        throw new Error(`Expected object type, got ${node.value.type}`);
    }
    
    const classModifier = node.inner ? '' : 'export ';
    const baseClass = node.extend ? node.extend : 'Basic';
    const properties = node.value.props;

    // 构建继承链和分析必需属性
    const inheritanceChain = buildInheritanceChain(node);
    const localRequiredProps = extractLocalRequiredProperties(properties);
    const allRequiredProps = collectAllRequiredProperties(inheritanceChain, localRequiredProps);
    
    const needsTypeId = checkIfNeedsTypeId(allRequiredProps);
    const needsConstructor = shouldGenerateConstructor(localRequiredProps);

    // 生成类声明
    if (properties.length > 0) {
        writer.nl(`${classModifier}class ${node.name} extends ${baseClass} `).sub(() => {
            // 添加typeId属性
            if (needsTypeId && node.schemaId) {
                writer.nl(`typeId = "${node.schemaId}"`);
            }
            
            // 生成属性声明
            generatePropertyDeclarations(properties, writer, node.root);
            
            // 生成构造函数
            if (needsConstructor) {
                generateConstructor(allRequiredProps, localRequiredProps, writer, node.root);
            }
        });
    } else if (node.extend) {
        // 处理只有继承没有属性的情况
        generateEmptyClassWithInheritance(node, writer, classModifier, baseClass, needsTypeId);
    } else {
        throw new Error(`Invalid object definition for node: ${node.name}`);
    }
}

/**
 * 构建节点的继承链
 */
function buildInheritanceChain(node: Node): Node[] {
    const chain: Node[] = [];
    let currentNode = node;
    
    while (currentNode.extend) {
        const parentNode = currentNode.root.get(currentNode.extend);
        if (!parentNode) {
            throw new Error(`Parent class not found: ${currentNode.extend}`);
        }
        chain.push(parentNode);
        currentNode = parentNode;
    }
    
    return chain;
}

/**
 * 提取本地必需属性
 */
function extractLocalRequiredProperties(properties: NamedProp[]): NamedProp[] {
    const requiredProps: NamedProp[] = [];
    
    for (const prop of properties) {
        if (prop.required) {
            requiredProps.push(prop);
        } else {
            break; // 必需属性必须连续，遇到可选属性就停止
        }
    }
    
    return requiredProps;
}

/**
 * 收集所有必需属性（包括继承的）
 */
function collectAllRequiredProperties(inheritanceChain: Node[], localRequiredProps: NamedProp[]): NamedProp[] {
    const allRequiredProps: NamedProp[] = [];
    
    // 从基类到派生类收集必需属性
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
        const node = inheritanceChain[i];
        if (node.value.type === 'object') {
            const nodeRequiredProps = extractLocalRequiredProperties(node.value.props);
            allRequiredProps.push(...nodeRequiredProps);
        }
    }
    
    // 添加本地必需属性
    allRequiredProps.push(...localRequiredProps);
    
    return allRequiredProps;
}

/**
 * 检查是否需要typeId属性
 */
function checkIfNeedsTypeId(requiredProps: NamedProp[]): boolean {
    return requiredProps.some(prop => prop.required && prop.name === 'typeId');
}

/**
 * 判断是否需要生成构造函数
 */
function shouldGenerateConstructor(localRequiredProps: NamedProp[]): boolean {
    return localRequiredProps.length > 0 && 
           !(localRequiredProps.length === 1 && localRequiredProps[0].name === 'typeId');
}

/**
 * 生成属性声明
 */
function generatePropertyDeclarations(properties: NamedProp[], writer: Writer, allNodes: Map<string, Node>): void {
    properties.forEach(prop => {
        if (prop.name === 'typeId') return;
        
        writer.newline();
        writer.indent().append(prop.name + (prop.required ? ': ' : '?: '));
        exportBaseProp(prop, writer, allNodes);
    });
}

/**
 * 生成构造函数
 */
function generateConstructor(
    allRequiredProps: NamedProp[], 
    localRequiredProps: NamedProp[], 
    writer: Writer, 
    allNodes: Map<string, Node>
): void {
    // 生成构造函数签名
    writer.nl('constructor(');
    generateConstructorParameters(allRequiredProps, writer, allNodes);
    writer.append(') ').sub(() => {
        // 生成super调用
        generateSuperCall(allRequiredProps, localRequiredProps, writer);
        
        // 生成属性赋值
        generatePropertyAssignments(localRequiredProps, writer);
    });
}

/**
 * 生成构造函数参数
 */
function generateConstructorParameters(allRequiredProps: NamedProp[], writer: Writer, allNodes: Map<string, Node>): void {
    let parameterCount = 0;
    
    for (const prop of allRequiredProps) {
        if (prop.name === 'typeId') continue;
        
        if (parameterCount > 0) {
            writer.append(', ');
        }
        
        writer.append(prop.name + ': ');
        exportBaseProp(prop, writer, allNodes);
        parameterCount++;
    }
}

/**
 * 生成super调用
 */
function generateSuperCall(allRequiredProps: NamedProp[], localRequiredProps: NamedProp[], writer: Writer): void {
    const inheritedPropsCount = allRequiredProps.length - localRequiredProps.length;
    
    if (inheritedPropsCount > 0) {
        writer.nl('super(');
        
        let parameterCount = 0;
        for (let i = 0; i < inheritedPropsCount; i++) {
            const prop = allRequiredProps[i];
            if (prop.name === 'typeId') continue;
            
            if (parameterCount > 0) {
                writer.append(', ');
            }
            writer.append(prop.name);
            parameterCount++;
        }
        
        writer.append(')');
    } else {
        writer.nl('super()');
    }
}

/**
 * 生成属性赋值
 */
function generatePropertyAssignments(localRequiredProps: NamedProp[], writer: Writer): void {
    for (const prop of localRequiredProps) {
        if (prop.name === 'typeId') continue;
        writer.nl(`this.${prop.name} = ${prop.name}`);
    }
}

/**
 * 生成只有继承没有属性的空类
 */
function generateEmptyClassWithInheritance(
    node: Node, 
    writer: Writer, 
    classModifier: string, 
    baseClass: string, 
    needsTypeId: boolean
): void {
    if (needsTypeId && node.schemaId) {
        writer.nl(`${classModifier}class ${node.name} extends ${baseClass} `).sub(() => {
            writer.nl(`typeId = "${node.schemaId}"`);
        });
    } else {
        writer.nl(`${classModifier}class ${node.name} extends ${baseClass} {}`);
    }
}

/**
 * 生成单个节点的类声明
 * 主入口函数，根据节点类型生成相应的代码
 */
export function exportNode(node: Node, writer: Writer): void {
    if (node.value.type === 'enum') {
        // 枚举类型在类文件中不需要输出
        return;
    }

    if (node.description) {
        writer.nl(`/* ${node.description} */`);
    }

    if (node.value.type === 'array') {
        generateArrayTypeAlias(node, writer);
    } else if (node.value.type === 'object') {
        generateObjectClass(node, writer);
    } else {
        const exhaustiveCheck: never = node.value;
        throw new Error(`Unsupported node value type: ${JSON.stringify(exhaustiveCheck)}`);
    }
}

/**
 * 生成数组类型别名
 */
function generateArrayTypeAlias(node: Node, writer: Writer): void {
    if (node.value.type !== 'array') {
        throw new Error(`Expected array type, got ${node.value.type}`);
    }
    
    if (node.extend) {
        throw new Error('Array types cannot extend classes');
    }
    
    const typeModifier = node.inner ? '' : 'export ';
    const item = node.value.item;
    
    writer.nl(`${typeModifier}type ${node.name} = BasicArray<`);
    exportBaseProp(item, writer, node.root);
    writer.append('>');
}