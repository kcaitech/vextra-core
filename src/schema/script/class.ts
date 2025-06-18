/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { NamedProp, Node, allDepsIsGen, exportBaseProp } from "./basic";
import { Writer } from "./writer";

interface BaseClassConfig {
    array: string;
    map: string;
    extends?: string;
}

interface GenerationConfig {
    extraHeader?(w: Writer): void;
    typesPath: string;
    baseClass?: BaseClassConfig;
    extraOrder?: string[];
}

/**
 * 导出对象类型为TypeScript类
 */
function exportObject(node: Node, writer: Writer, baseClass: BaseClassConfig): void {
    if (node.value.type !== 'object') {
        throw new Error(`Expected object type, got ${node.value.type}`);
    }

    const exportKeyword = node.inner ? '' : 'export ';
    const extendsClause = node.extend ? node.extend : baseClass.extends;
    const properties = node.value.props;

    // 构建继承链，收集所有必需属性
    const requiredProps = collectRequiredProperties(node);
    const localRequiredProps = properties.filter(p => p.required);
    
    const needTypeId = true; // 总是需要typeId（用于JSON序列化识别）
    const needConstructor = shouldGenerateConstructor(localRequiredProps);

    if (properties.length > 0) {
        writer.nl(`${exportKeyword}class ${node.name} ${extendsClause ? 'extends ' + extendsClause + ' ' : ''}`).sub(() => {
            // 添加typeId
            if (needTypeId && node.schemaId) {
                writer.nl('typeId = "', node.schemaId, '"');
            }

            // 添加属性定义
            properties.forEach(prop => {
                if (prop.name === 'typeId') return;
                writer.newline();
                writer.indent().append(prop.name + (prop.required ? ': ' : '?: '));
                exportBaseProp(prop, writer, {
                    arrayType: baseClass.array,
                    mapType: baseClass.map
                });
            });

            // 生成构造函数
            if (needConstructor) {
                generateConstructor(writer, requiredProps, localRequiredProps, extendsClause, baseClass);
            }
        });
    } else if (node.extend) {
        // 只有继承没有属性的情况
        if (needTypeId && node.schemaId) {
            writer.nl(`${exportKeyword}class ${node.name} extends ${extendsClause || ''} `).sub(() => {
                writer.nl('typeId = "', node.schemaId || '', '"');
            });
        } else {
            writer.nl(`${exportKeyword}class ${node.name} extends ${extendsClause || ''} {}`);
        }
    } else {
        throw new Error(`Invalid object definition for node: ${node.name}`);
    }
}

/**
 * 收集节点继承链中的所有必需属性
 */
function collectRequiredProperties(node: Node): NamedProp[] {
    const requiredProps: NamedProp[] = [];
    const inheritanceChain: Node[] = [];
    
    // 构建继承链
    let currentNode = node;
    while (currentNode.extend) {
        const parentNode = currentNode.root.get(currentNode.extend);
        if (!parentNode) {
            throw new Error(`Parent class not found: ${currentNode.extend}`);
        }
        inheritanceChain.push(parentNode);
        currentNode = parentNode;
    }

    // 从基类到子类收集必需属性
    for (let i = inheritanceChain.length - 1; i >= 0; i--) {
        const n = inheritanceChain[i];
        if (n.value.type === 'object') {
            const props = n.value.props.filter(p => p.required);
            requiredProps.push(...props);
        }
    }

    // 添加当前节点的必需属性
    if (node.value.type === 'object') {
        const localRequired = node.value.props.filter(p => p.required);
        requiredProps.push(...localRequired);
    }

    return requiredProps;
}

/**
 * 判断是否需要生成构造函数
 */
function shouldGenerateConstructor(localRequiredProps: NamedProp[]): boolean {
    return localRequiredProps.length > 0 && 
           !(localRequiredProps.length === 1 && localRequiredProps[0].name === 'typeId');
}

/**
 * 生成构造函数
 */
function generateConstructor(
    writer: Writer, 
    allRequiredProps: NamedProp[], 
    localRequiredProps: NamedProp[], 
    extendsClause: string | undefined,
    baseClass: BaseClassConfig
): void {
    writer.nl('constructor(');
    
    // 构造函数参数
    let paramCount = 0;
    for (const prop of allRequiredProps) {
        if (prop.name === 'typeId') continue;
        
        if (paramCount > 0) writer.append(', ');
        writer.append(prop.name + ': ');
        exportBaseProp(prop, writer, {
            arrayType: baseClass.array,
            mapType: baseClass.map
        });
        
        // 默认值
        if (prop.default !== undefined) {
            const defaultValue = formatDefaultValue(prop.default);
            writer.append(' = ' + defaultValue);
        }
        
        paramCount++;
    }

    writer.append(') ').sub(() => {
        // 调用父类构造函数
        const inheritedPropsCount = allRequiredProps.length - localRequiredProps.length;
        if (inheritedPropsCount > 0) {
            writer.nl('super(');
            let superParamCount = 0;
            for (let i = 0; i < inheritedPropsCount; i++) {
                const prop = allRequiredProps[i];
                if (prop.name === 'typeId') continue;
                
                if (superParamCount > 0) writer.append(', ');
                writer.append(prop.name);
                superParamCount++;
            }
            writer.append(')');
        } else if (extendsClause) {
            writer.nl('super()');
        }

        // 初始化本地属性
        for (const prop of localRequiredProps) {
            if (prop.name === 'typeId') continue;
            writer.nl('this.', prop.name, ' = ', prop.name);
        }
    });
}

/**
 * 格式化默认值
 */
function formatDefaultValue(defaultValue: string | number | boolean): string {
    switch (typeof defaultValue) {
        case 'boolean':
        case 'number':
            return String(defaultValue);
        case 'string':
            return `"${defaultValue}"`;
        default:
            throw new Error(`Unsupported default value type: ${typeof defaultValue}`);
    }
}

/**
 * 导出单个节点
 */
function exportNode(node: Node, writer: Writer, baseClass: BaseClassConfig): void {
    if (node.value.type === 'enum') {
        // 枚举类型不需要输出（在types文件中处理）
        return;
    }

    if (node.description) {
        writer.nl('/* ' + node.description + ' */');
    }

    if (node.value.type === 'array') {
        const exportKeyword = node.inner ? '' : 'export ';
        if (node.extend) {
            throw new Error('Array types cannot extend classes');
        }
        
        const item = node.value.item;
        writer.nl(`${exportKeyword}type ${node.name} = ${baseClass.array}<`);
        exportBaseProp(item, writer, {
            arrayType: baseClass.array,
            mapType: baseClass.map
        });
        writer.append('>');
    } else if (node.value.type === 'object') {
        exportObject(node, writer, baseClass);
    } else {
        // 这里使用never类型检查来确保所有情况都被处理
        const exhaustiveCheck: never = node.value;
        throw new Error(`Unsupported node value type: ${JSON.stringify(exhaustiveCheck)}`);
    }
}

/**
 * 生成所有类定义
 */
export function gen(allNodes: Map<string, Node>, outputPath: string, config: GenerationConfig): void {
    const writer = new Writer(outputPath);
    
    try {
        const nodes = Array.from(allNodes.values());

        // 收集所有枚举类型
        const enums = collectEnums(nodes);
        
        // 导出枚举类型
        if (enums.length > 0) {
            writer.nl(`export {\n${enums.join(',\n')}\n} from "${config.typesPath}"`);
            writer.nl(`import {\n${enums.join(',\n')}\n} from "${config.typesPath}"`);
        }

        // 导入基础类和工具类
        if (config.extraHeader) {
            config.extraHeader(writer);
        }

        // 按依赖顺序生成类定义
        const baseClassConfig: BaseClassConfig = {
            array: config.baseClass?.array ?? 'Array',
            map: config.baseClass?.map ?? 'Map',
            extends: config.baseClass?.extends
        };
        
        generateInDependencyOrder(
            nodes,
            writer,
            baseClassConfig,
            config.extraOrder || []
        );
    } finally {
        // 确保所有内容都被写入文件
        writer.flush();
    }
}

/**
 * 收集所有枚举类型
 */
function collectEnums(nodes: Node[]): string[] {
    const enums: string[] = [];
    for (const node of nodes) {
        if (node.value.type === 'enum') {
            enums.push('    ' + node.name);
        }
    }
    return enums;
}

/**
 * 按依赖顺序生成代码
 */
function generateInDependencyOrder(
    nodes: Node[], 
    writer: Writer, 
    baseClass: BaseClassConfig,
    extraOrder: string[]
): void {
    let checkExport = allDepsIsGen;
    const generated = new Set<string>();
    
    while (nodes.length > 0) {
        let progress = 0;
        
        for (let i = 0; i < nodes.length;) {
            const node = nodes[i];
            
            if (checkExport(node, generated)) {
                exportNode(node, writer, baseClass);
                progress++;
                nodes.splice(i, 1);
                generated.add(node.name);
            } else {
                i++;
            }
        }
        
        // 如果没有进展，切换到按顺序导出模式
        if (progress === 0 && checkExport === allDepsIsGen) {
            checkExport = createOrderBasedChecker(extraOrder);
        }
    }
}

/**
 * 创建基于顺序的检查器
 */
function createOrderBasedChecker(order: string[]): (node: Node) => boolean {
    return (node: Node) => {
        if (order.length > 0 && node.name === order[0]) {
            order.shift();
            return true;
        }
        return order.length === 0;
    };
}