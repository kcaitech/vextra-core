/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseProp, ImportGenerationConfig, NamedProp, Node, allDepsIsGen } from "./basic";
import { Writer } from "./writer";
import { exportBaseProp as exportBasePropType, exportNode as exportNodeClass } from "./import_class";


/**
 * 生成基础属性的导入代码
 * 此函数生成将JSON数据转换为实现类实例的代码
 */
function generateBasePropImport(
    prop: BaseProp, 
    sourceExpression: string, 
    writer: Writer, 
    insideArray: boolean, 
    allNodes: Map<string, Node>,
    config: ImportGenerationConfig
): void {
    switch (prop.type) {
        case 'string':
        case 'number':
        case 'boolean':
            // 基础类型直接返回
            writer.append(sourceExpression);
            break;
            
        case 'node':
            // 生成代码: importNodeName(sourceExpression, ctx)
            writer.append(`import${prop.val}(${sourceExpression}, ctx)`);
            break;
            
        case 'map':
            generateMapImport(prop, sourceExpression, writer, insideArray, allNodes, config);
            break;
            
        case 'oneOf':
            generateOneOfImport(prop, sourceExpression, writer, insideArray, allNodes, config);
            break;
    }
}

/**
 * 生成Map类型的导入代码
 * 生成代码将JSON对象转换为Map实例
 */
function generateMapImport(
    prop: BaseProp & { type: 'map' }, 
    sourceExpression: string, 
    writer: Writer, 
    insideArray: boolean, 
    allNodes: Map<string, Node>,
    config: ImportGenerationConfig
): void {
    const keyType = prop.key;
    const mapType = config.baseTypes?.map || 'Map';
    
    writer.append('(() => ').sub(() => {
        // 创建新的Map实例
        writer.nl(`const ret = new ${mapType}<${keyType}, `);
        exportBasePropType(prop.val, writer, allNodes, config);
        writer.append('>()');
        
        // 处理源数据
        writer.nl(`const _val = ${sourceExpression} as any`);
        writer.nl('objkeys(_val).forEach((val, k) => ').sub(() => {
            writer.nl('ret.set(k, ');
            generateBasePropImport(prop.val, 'val', writer, insideArray, allNodes, config);
            writer.append(')');
        }).append(')');
        
        writer.nl('return ret');
    }).append(')()');
}

/**
 * 生成OneOf类型的导入代码
 * 生成代码根据typeId或类型判断选择正确的导入分支
 */
function generateOneOfImport(
    prop: BaseProp & { type: 'oneOf' }, 
    sourceExpression: string, 
    writer: Writer, 
    insideArray: boolean, 
    allNodes: Map<string, Node>,
    config: ImportGenerationConfig
): void {
    writer.append('(() => ').sub(() => {
        const propTypes = Array.from(prop.val);
        
        // 处理undefined类型分支
        handleUndefinedImport(propTypes, sourceExpression, writer);
        
        // 处理数组类型分支
        handleArrayImport(propTypes, sourceExpression, writer, insideArray, allNodes, config);
        
        // 处理其他节点类型分支
        handleNodeTypesImport(propTypes, sourceExpression, writer, insideArray, allNodes, config);
        
        // 如果没有匹配的类型，抛出错误
        writer.nl(`throw new Error("unknow typeId: " + ${sourceExpression}.typeId)`);
    }).append(')()');
}

/**
 * 处理undefined类型的导入分支
 */
function handleUndefinedImport(propTypes: BaseProp[], sourceExpression: string, writer: Writer): void {
    for (let i = 0; i < propTypes.length; i++) {
        const propType = propTypes[i];
        if (propType.type === 'undefined') {
            writer.nl(`if (typeof ${sourceExpression} !== "object" || ${sourceExpression} == null) `).sub(() => {
                writer.nl(`return ${sourceExpression} == null ? undefined : ${sourceExpression}`);
            });
            return;
        }
    }
    
    // 如果没有undefined类型，处理非对象类型
    writer.fmt(`if (typeof ${sourceExpression} !== "object") {
        return ${sourceExpression}
    }`);
}

/**
 * 处理数组类型的导入分支
 */
function handleArrayImport(
    propTypes: BaseProp[], 
    sourceExpression: string, 
    writer: Writer, 
    insideArray: boolean, 
    allNodes: Map<string, Node>,
    config: ImportGenerationConfig
): void {
    let usedArray = false;
    
    // 从后往前遍历，移除基础类型
    for (let i = propTypes.length - 1; i >= 0; i--) {
        const propType = propTypes[i];
        
        // 移除已处理的基础类型
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
                    generateBasePropImport(propType, sourceExpression, writer, insideArray, allNodes, config);
                });
                propTypes.splice(i, 1);
            }
        }
    }
}

/**
 * 处理节点类型的导入分支
 */
function handleNodeTypesImport(
    propTypes: BaseProp[], 
    sourceExpression: string, 
    writer: Writer, 
    insideArray: boolean, 
    allNodes: Map<string, Node>,
    config: ImportGenerationConfig
): void {
    const typesPrefix = config.namespaces?.types || '';
    
    for (const propType of propTypes) {
        if (propType.type === 'node') {
            const node = allNodes.get(propType.val);
            if (!node) {
                throw new Error(`Node not found: ${propType.val}`);
            }
            
            if (node.schemaId) {
                writer.fmt(`if (${sourceExpression}.typeId === "${node.schemaId}") {
                    return import${propType.val}(${sourceExpression} as ${typesPrefix}${propType.val}, ctx)
                }`);
            } else {
                throw new Error(`OneOf elements need typeId or unique type: ${JSON.stringify(node)}`);
            }
        }
    }
}

/**
 * 生成对象类型的导入函数
 */
function generateObjectImport(node: Node, writer: Writer, config: ImportGenerationConfig): void {
    if (node.value.type !== 'object') {
        throw new Error(`Expected object type, got ${node.value.type}`);
    }

    const properties = node.value.props;
    const inheritanceChain = buildNodeInheritanceChain(node);
    const { localRequired, localOptional, superRequired, superOptional } = 
        categorizeNodeProperties(inheritanceChain, properties);
    
    const allRequired = superRequired.concat(localRequired);
    const hasOptionalProperties = localOptional.length > 0 || 
        (node.extend && superOptional.length > 0);

    // 生成可选属性处理函数
    generateOptionalPropertiesFunction(node, writer, localOptional, superOptional, config);

    // 生成主导入函数
    const implPrefix = node.inner ? ('') : (config.namespaces?.impl || '');
    const typesPrefix = config.namespaces?.types || '';
    writer.nl(`export function import${node.name}(source: ${typesPrefix}${node.name}, ctx?: IImportContext): ${implPrefix}${node.name} `).sub(() => {
        // 注入前置代码
        injectCustomCode(node, writer, 'before', config);

        // 处理自定义内容或默认构造
        const customContent = config.inject?.[node.name]?.content;
        if (customContent) {
            writer.nl(customContent);
        } else {
            generateNodeConstructorCall(node, writer, allRequired, implPrefix, config);
            
            // 处理可选属性
            if (hasOptionalProperties) {
                writer.nl(`import${node.name}Optional(ret, source, ctx)`);
            }
        }

        // 注入后置代码
        injectCustomCode(node, writer, 'after', config);

        // 生成返回语句
        generateReturnStatement(node, writer, config);
    });
}

/**
 * 构建节点继承链
 */
function buildNodeInheritanceChain(node: Node): Node[] {
    const chain: Node[] = [];
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
 * 分类节点属性（必需/可选，本地/继承）
 */
function categorizeNodeProperties(inheritanceChain: Node[], localProperties: NamedProp[]) {
    const localRequired: NamedProp[] = [];
    const localOptional: NamedProp[] = [];
    const superRequired: NamedProp[] = [];
    const superOptional: NamedProp[] = [];

    // 分类本地属性
    for (const prop of localProperties) {
        if (prop.required) {
            localRequired.push(prop);
        } else {
            localOptional.push(prop);
        }
    }

    // 分类继承的属性
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
        const node = inheritanceChain[i];
        if (node.value.type === 'object') {
            for (const prop of node.value.props) {
                if (prop.required) {
                    superRequired.push(prop);
                } else {
                    superOptional.push(prop);
                }
            }
        }
    }

    return { localRequired, localOptional, superRequired, superOptional };
}

/**
 * 生成可选属性处理函数
 */
function generateOptionalPropertiesFunction(
    node: Node, 
    writer: Writer, 
    localOptional: NamedProp[], 
    superOptional: NamedProp[],
    config: ImportGenerationConfig
): void {
    const implPrefix = node.inner ? ('') : (config.namespaces?.impl || '');
    const typesPrefix = config.namespaces?.types || '';
    
    if (localOptional.length > 0) {
        writer.nl(`function import${node.name}Optional(tar: ${implPrefix}${node.name}, source: ${typesPrefix}${node.name}, ctx?: IImportContext) `).sub(() => {
            // 调用父类的可选属性处理函数
            if (node.extend && superOptional.length > 0) {
                writer.nl(`import${node.extend}Optional(tar, source)`);
            }
            
            // 处理本地可选属性
            for (const prop of localOptional) {
                writer.nl(`if (source.${prop.name} !== undefined) tar.${prop.name} = `);
                generateBasePropImport(prop, `source.${prop.name}`, writer, false, node.root, config);
            }
        });
    } else if (node.extend && superOptional.length > 0) {
        // 如果没有本地可选属性但有继承的可选属性，直接引用父类函数
        writer.nl(`const import${node.name}Optional = import${node.extend}Optional`);
    }
}

/**
 * 生成节点构造函数调用代码
 */
function generateNodeConstructorCall(
    node: Node, 
    writer: Writer, 
    allRequired: NamedProp[], 
    implPrefix: string,
    config: ImportGenerationConfig
): void {
    writer.nl(`const ret: ${implPrefix}${node.name} = new ${implPrefix}${node.name} (`);
    
    const constructorArgs = allRequired.filter(prop => prop.name !== 'typeId');
    const hasArgs = constructorArgs.length > 0;
    
    if (hasArgs) {
        writer.indent(1, () => {
            writer.newline();
            
            for (let i = 0; i < constructorArgs.length; i++) {
                const prop = constructorArgs[i];
                
                if (i > 0) {
                    writer.append(',').newline();
                }
                
                writer.indent();
                generateBasePropImport(prop, `source.${prop.name}`, writer, false, node.root, config);
            }
        });
    }
    
    writer.append(')');
}

/**
 * 注入自定义代码
 */
function injectCustomCode(node: Node, writer: Writer, phase: 'before' | 'after', config: ImportGenerationConfig): void {
    const customCode = config.inject?.[node.name]?.[phase];
    if (customCode) {
        writer.nl(customCode);
    }
}

/**
 * 生成返回语句
 */
function generateReturnStatement(node: Node, writer: Writer, config: ImportGenerationConfig): void {
    const forceType = config.inject?.[node.name]?.['force-type'];
    if (forceType) {
        writer.nl(`return ret ${forceType}`);
    } else {
        writer.nl('return ret');
    }
}

/**
 * 生成单个节点的导入函数
 */
function generateNodeImport(node: Node, writer: Writer, config: ImportGenerationConfig): void {
    if (node.description) {
        writer.nl(`/* ${node.description} */`);
    }

    const implPrefix = node.inner ? ('') : (config.namespaces?.impl || '');
    const typesPrefix = config.namespaces?.types || '';

    switch (node.value.type) {
        case 'enum':
            // 枚举类型直接返回原值
            writer.nl(`export function import${node.name}(source: ${typesPrefix}${node.name}, ctx?: IImportContext): ${implPrefix}${node.name} `).sub(() => {
                writer.nl('return source');
            });
            break;
            
        case 'array':
            generateArrayImport(node, writer, implPrefix, config);
            break;
        case 'native_array':
            generateArrayImport(node, writer, implPrefix, config);
            break;
        case 'object':
            generateObjectImport(node, writer, config);
            break;
            
        default:
            const exhaustiveCheck: never = node.value;
            throw new Error(`Unsupported node value type: ${JSON.stringify(exhaustiveCheck)}`);
    }
}

/**
 * 生成数组类型的导入函数
 */
function generateArrayImport(node: Node, writer: Writer, implPrefix: string, config: ImportGenerationConfig): void {
    if (node.value.type !== 'array' && node.value.type !== 'native_array') {
        throw new Error(`Expected array type, got ${node.value.type}`);
    }
    
    const item = node.value.item;
    const arrayType = node.value.type === 'native_array' ? 'Array' : (config.baseTypes?.array || 'Array');
    
    // 检查数组元素是否有 crdtidx 属性
    let elementHasCrdtidx = false;
    if (item.type === 'node') {
        const itemNode = node.root.get(item.val);
        if (itemNode && itemNode.value.type === 'object') {
            elementHasCrdtidx = itemNode.value.props.some(prop => prop.name === 'crdtidx');
        }
    }
    
    const typesPrefix = config.namespaces?.types || '';
    writer.nl(`export function import${node.name}(source: ${typesPrefix}${node.name}, ctx?: IImportContext): ${implPrefix}${node.name} `).sub(() => {
        // 创建新的Array实例
        writer.nl(`const ret: ${implPrefix}${node.name} = new ${arrayType}()`);
        
        // 遍历源数组
        writer.nl('source.forEach((source, i) => ').sub(() => {
            if (elementHasCrdtidx) {
                // 导入数组元素
                writer.nl('const element = ');
                generateBasePropImport(item, 'source', writer, true, node.root, config);
                
                // 只有当元素有 crdtidx 属性且是外部文档导入时才重新生成索引
                if (elementHasCrdtidx) {
                    writer.nl('// 重新设置 crdtidx 为当前数组索引，确保外部文档导入时索引正确');
                    writer.nl('if (ctx?.isLocalFile) element.crdtidx = [i]');
                }
                
                writer.nl('ret.push(element)');
            } else {
                // 导入数组元素
                writer.nl('ret.push(');
                generateBasePropImport(item, 'source', writer, true, node.root, config);
                writer.append(')');
            }
        }).append(')');
        
        writer.nl('return ret');
    });
}

/**
 * 生成所有导入代码
 */
export function gen(allNodes: Map<string, Node>, outputPath: string, config: ImportGenerationConfig): void {
    const writer = new Writer(outputPath);
    
    try {
        const nodes = Array.from(allNodes.values());

        // 导入必要的模块
        // generateImportStatements(writer, config);
        if (config.extraHeader) {
            config.extraHeader(writer);
        }

        // 导出接口定义
        generateInterfaceDefinitions(writer, config);

        // 生成工具函数
        generateUtilityFunctions(writer);

        // 先处理内部类型声明
        generateInnerTypeDeclarations(nodes, writer, config);

        // 按依赖顺序生成导入函数
        generateImportFunctionsInOrder(nodes, writer, config);
    } finally {
        // 确保所有内容都被写入文件
        writer.flush();
    }
}

/**
 * 生成接口定义
 */
function generateInterfaceDefinitions(writer: Writer, config: ImportGenerationConfig): void {
    const implPrefix = config.namespaces?.impl || '';
    writer.nl('export interface IImportContext ').sub(() => {
        writer.nl('isLocalFile?: boolean');
        if (config.contextContent) {
            config.contextContent(writer);
        }
    });
}

/**
 * 生成工具函数
 */
function generateUtilityFunctions(writer: Writer): void {
    writer.fmt(`function objkeys(obj: any) {
        return obj instanceof Map ? obj : { forEach: (f: (v: any, k: string) => void) => Object.keys(obj).forEach((k) => f(obj[k], k)) };
    }`);
}

/**
 * 生成内部类型声明
 */
function generateInnerTypeDeclarations(nodes: Node[], writer: Writer, config: ImportGenerationConfig): void {
    for (const node of nodes) {
        if (node.inner) {
            exportNodeClass(node, writer, config);
        }
    }
}

/**
 * 按依赖顺序生成导入函数
 */
function generateImportFunctionsInOrder(nodes: Node[], writer: Writer, config: ImportGenerationConfig): void {
    let checkExport = allDepsIsGen;
    const generated = new Set<string>();

    while (nodes.length > 0) {
        let progress = 0;
        
        for (let i = 0; i < nodes.length;) {
            const node = nodes[i];
            
            if (checkExport(node, generated)) {
                generateNodeImport(node, writer, config);
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