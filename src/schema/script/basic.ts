/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

export type BaseProp = {
    type: 'node',
    val: string
} | {
    type: 'string'
} | {
    type: 'boolean'
} | {
    type: 'number'
} | {
    type: 'map',
    key: 'string' | 'number',
    val: BaseProp
} | {
    type: 'oneOf',
    val: BaseProp[]
} | {
    type: 'undefined'
}

export type NamedProp = {
    name: string,
    required: boolean,
    default?: string | number | boolean
} & BaseProp

type ItemProp = BaseProp

type NodeValue = {
    type: 'object',
    props: NamedProp[]
} | {
    type: 'array',
    item: ItemProp
} | {
    type: 'enum',
    enum: string[]
}

/**
 * Schema 节点类，代表一个完整的数据结构定义
 */
export class Node {
    /** 所有节点的根映射 */
    readonly root: Map<string, Node>;
    /** 父节点 - 非用户定义的类型（程序内部生成）才有parent */
    readonly parent?: Node;
    
    /** 是否为内部生成的节点 */
    get inner(): boolean {
        return this.parent !== undefined;
    }
    
    /** 继承的基类名称 */
    extend?: string;
    /** 依赖的其他schema */
    readonly depends: Set<string> = new Set();
    /** 节点名称 - 一般对应文件名的帕斯卡命名法，唯一不重复 */
    readonly name: string;
    /** 节点描述 */
    description?: string;
    /** 文件名标识符 */
    schemaId?: string;
    /** 节点值定义 */
    readonly value: NodeValue;
    /** 无名子节点计数器 - 给没有属性名的子node命名 */
    noNameChildCount: number = 0;

    constructor(root: Map<string, Node>, name: string, value: NodeValue)
    constructor(parent: Node, name: string, value: NodeValue)
    constructor(rootOrParent: Map<string, Node> | Node, name: string, value: NodeValue) {
        this.root = rootOrParent instanceof Map ? rootOrParent : rootOrParent.root;
        this.name = name;
        this.value = value;
        this.parent = rootOrParent instanceof Map ? undefined : rootOrParent;
    }
}

/**
 * 检查节点的所有依赖是否已经生成
 */
export function allDepsIsGen(node: Node, gented: Set<string>): boolean {
    for (const dep of node.depends) {
        const depNode = node.root.get(dep);
        if (!depNode) {
            throw new Error(`Dependency '${dep}' not found for node '${node.name}'`);
        }
        if (!gented.has(depNode.name)) {
            return false;
        }
    }
    return true;
}

/**
 * 将文件名转换为帕斯卡命名法的类名
 */
export function toPascalCase(str: string): string {
    if (!str) return '';
    
    return str
        // 将下划线 _ 和短横线 - 统一替换为空格，方便后续处理
        .replace(/[_-]/g, ' ')
        // 将空格后的字母或数字转为大写
        .replace(/\s+([a-zA-Z0-9])/g, (_, char) => char.toUpperCase())
        // 将数字后的字母转为大写（例如 2d -> 2D）
        .replace(/([0-9])([a-z])/g, (_, num, letter) => num + letter.toUpperCase())
        // 将首字母转为大写
        .replace(/^[a-z]/, (firstChar) => firstChar.toUpperCase())
        // 移除所有空格
        .replace(/\s+/g, '');
}

/**
 * 递归收集schema中的依赖关系
 */
function collectDepends(val: unknown, dependsSet: Set<string>, schemaExt: string): void {
    if (typeof val !== 'object' || val === null) return;
    
    const obj = val as Record<string, unknown>;
    
    for (const [key, value] of Object.entries(obj)) {
        if (key === "$ref" && typeof value === 'string') {
            if (value.endsWith(schemaExt)) {
                const filename = getFileName(value);
                if (filename) {
                    const name = toPascalCase(filename);
                    dependsSet.add(name);
                }
            }
        } else if (typeof value === 'object' && value !== null) {
            collectDepends(value, dependsSet, schemaExt);
        }
    }
}

/**
 * 转换Schema类型为内部类型
 */
function transSchemaType(type: string): 'node' | 'string' | 'boolean' | 'number' {
    switch (type) {
        case 'number':
        case 'integer':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'object':
            return 'node';
        case 'string':
            return 'string';
        default:
            throw new Error(`Unsupported schema type: ${type}`);
    }
}

/**
 * 解析Schema节点值
 */
function parseNodeValue(schema: Record<string, unknown>): NodeValue {
    // 处理枚举类型
    if (schema.enum && Array.isArray(schema.enum)) {
        return {
            type: 'enum',
            enum: schema.enum.map(String)
        };
    }
    
    // 处理对象类型
    if (schema.type === 'object') {
        return {
            type: 'object',
            props: []
        };
    }
    
    // 处理数组类型
    if (schema.type === 'array') {
        const items = schema.items as Record<string, unknown>;
        if (!items) {
            throw new Error('Array schema must have items property');
        }

        let itemType: 'node' | 'string' | 'boolean' | 'number' | 'oneOf';
        if (items.oneOf) {
            itemType = 'oneOf';
        } else if (typeof items.type === 'string') {
            itemType = transSchemaType(items.type);
        } else if (items['$ref']) {
            itemType = 'node';
        } else {
            throw new Error(`Unknown array item type: ${JSON.stringify(items)}`);
        }

        return {
            type: 'array',
            item: {
                type: itemType
            } as ItemProp
        };
    }

    throw new Error(`Unknown schema type: ${schema.type}`);
}

/**
 * 转换schema的基础类型为ts类型
 */
function extractBaseProp(schema: Record<string, unknown>, name: string | undefined, parent: Node): BaseProp {
    if (schema.type) {
        switch (schema.type) {
            case 'undefined': 
                return { type: 'undefined' };
            case 'boolean':
                return { type: 'boolean' };
            case 'number':
            case 'integer':
                return { type: 'number' };
            case 'string':
                return { type: 'string' };
            case 'array': {
                const nodeName = name || String(parent.noNameChildCount++);
                const subnode = new Node(parent, `${parent.name}_${nodeName}`, parseNodeValue(schema));
                
                if (parent.root.has(subnode.name)) {
                    throw new Error(`Node name duplicate: ${subnode.name}`);
                }
                if (subnode.value.type !== 'array') {
                    throw new Error(`Subnode type error: expected array, got ${subnode.value.type}`);
                }
                
                extractArrayValue(schema.items as Record<string, unknown>, subnode.value.item, subnode);
                parent.root.set(subnode.name, subnode);
                parent.depends.add(subnode.name);
                
                return {
                    type: 'node',
                    val: subnode.name
                };
            }
            case 'map': {
                if (!schema.key || !schema.value) {
                    throw new Error('Map schema must have key and value properties');
                }
                
                const keySchema = schema.key as Record<string, unknown>;
                const keyType = keySchema.type as string;
                
                let key: 'string' | 'number';
                if (keyType === 'string') {
                    key = 'string';
                } else if (keyType === 'number' || keyType === 'integer') {
                    key = 'number';
                } else {
                    throw new Error(`Unsupported map key type: ${keyType}`);
                }
                
                return {
                    type: 'map',
                    key,
                    val: extractBaseProp(schema.value as Record<string, unknown>, name, parent)
                };
            }
            case 'object': {
                const nodeName = name || String(parent.noNameChildCount++);
                const subnode = new Node(parent, `${parent.name}_${nodeName}`, parseNodeValue(schema));
                
                if (parent.root.has(subnode.name)) {
                    throw new Error(`Node name duplicate: ${subnode.name}`);
                }
                if (subnode.value.type !== 'object') {
                    throw new Error(`Subnode type error: expected object, got ${subnode.value.type}`);
                }
                
                const properties = schema.properties as Record<string, unknown> || {};
                const required = (schema.required as string[]) || [];
                extractObjectValue(properties, required, subnode.value.props, subnode);
                parent.root.set(subnode.name, subnode);
                parent.depends.add(subnode.name);
                
                return {
                    type: 'node',
                    val: subnode.name
                };
            }
            default:
                throw new Error(`Unknown schema type: ${schema.type}`);
        }
    }
    
    if (schema.oneOf && Array.isArray(schema.oneOf)) {
        const val: BaseProp[] = [];
        for (const oneOfSchema of schema.oneOf) {
            val.push(extractBaseProp(oneOfSchema as Record<string, unknown>, undefined, parent));
        }
        return {
            type: 'oneOf',
            val
        };
    }
    
    if (schema.allOf) {
        throw new Error('Base prop does not support allOf');
    }
    
    if (schema['$ref'] && typeof schema['$ref'] === 'string') {
        const ref = schema['$ref'];
        
        // 自引用
        if (ref === '#') {
            let p = parent;
            while (p.inner && p.parent) {
                p = p.parent;
            }
            return {
                type: 'node',
                val: p.name
            };
        }
        
        const filename = getFileName(ref);
        if (!filename) {
            throw new Error(`Invalid reference: ${ref}`);
        }
        
        const name = toPascalCase(filename);
        return {
            type: 'node',
            val: name
        };
    }
    
    throw new Error(`Unknown property schema: ${JSON.stringify(schema)}`);
}

/**
 * 提取对象类型的属性
 */
function extractObjectValue(
    properties: Record<string, unknown>, 
    required: string[], 
    props: NamedProp[], 
    parent: Node
): void {
    // 先处理必需属性
    for (const propName of required) {
        const propSchema = properties[propName];
        if (!propSchema) {
            throw new Error(`Required property '${propName}' not found in properties`);
        }
        
        const baseProp = extractBaseProp(propSchema as Record<string, unknown>, propName, parent);
        const namedProp: NamedProp = {
            ...baseProp,
            name: propName,
            required: true
        };
        
        const schemaObj = propSchema as Record<string, unknown>;
        if (schemaObj.default !== undefined) {
            namedProp.default = schemaObj.default as string | number | boolean;
        }
        
        props.push(namedProp);
    }

    // 再处理可选属性
    for (const [propName, propSchema] of Object.entries(properties)) {
        if (required.includes(propName)) continue;
        
        const baseProp = extractBaseProp(propSchema as Record<string, unknown>, propName, parent);
        const namedProp: NamedProp = {
            ...baseProp,
            name: propName,
            required: false
        };
        
        const schemaObj = propSchema as Record<string, unknown>;
        if (schemaObj.default !== undefined) {
            namedProp.default = schemaObj.default as string | number | boolean;
        }
        
        props.push(namedProp);
    }
}

/**
 * 提取数组类型的元素定义
 */
function extractArrayValue(itemsSchema: Record<string, unknown>, item: ItemProp, node: Node): void {
    if (item.type === 'node') {
        const ref = itemsSchema['$ref'];
        if (!ref || typeof ref !== 'string') {
            throw new Error(`Invalid reference in array items: ${JSON.stringify(itemsSchema)}`);
        }

        if (ref === '#') {
            let p = node;
            while (p.inner && p.parent) {
                p = p.parent;
            }
            (item as any).val = p.name;
        } else {
            const filename = getFileName(ref);
            if (!filename) {
                throw new Error(`Invalid reference: ${ref}`);
            }
            const name = toPascalCase(filename);
            (item as any).val = name;
        }
    } else if (item.type === 'oneOf') {
        const oneOf = itemsSchema.oneOf;
        if (!Array.isArray(oneOf)) {
            throw new Error('oneOf must be an array');
        }

        const val: BaseProp[] = [];
        for (const oneOfSchema of oneOf) {
            const prop = extractBaseProp(oneOfSchema as Record<string, unknown>, undefined, node);
            val.push(prop);
        }

        (item as any).val = val;
    }
}

/**
 * 从路径中提取文件名（不含扩展名）
 */
function getFileName(path: string): string {
    const match = path.match(/([^\/]+)\./);
    return match?.[1] || '';
}

import path from 'path';
import fs from 'fs';

/**
 * 加载指定目录下的所有schema文件
 */
export function loadSchemas(schemaDir: string, schemaExt = '.json'): Map<string, Node> {
    if (!fs.existsSync(schemaDir)) {
        throw new Error(`Schema directory does not exist: ${schemaDir}`);
    }
    
    const files = fs.readdirSync(schemaDir);
    const schemaFiles = files.filter(file => file.endsWith(schemaExt));
    const allNodes = new Map<string, Node>();
    
    // console.log(`🔍 扫描到 ${schemaFiles.length} 个Schema文件`);
    
    for (const file of schemaFiles) {
        const filePath = path.join(schemaDir, file);
        
        try {
            const rawContent = fs.readFileSync(filePath, "utf8");
            const schema = JSON.parse(rawContent) as Record<string, unknown>;
            const filename = getFileName(file);

            if (!filename) {
                console.warn(`⚠️  跳过无效文件名: ${file}`);
                continue;
            }

            const name = toPascalCase(filename);
            if (allNodes.has(name)) {
                throw new Error(`Duplicate node name: ${name} (from ${file})`);
            }

            const node = new Node(allNodes, name, parseNodeValue(schema));
            node.schemaId = filename;

            if (schema.description && typeof schema.description === 'string') {
                node.description = schema.description;
            }

            // 提取对象属性
            if (node.value.type === 'object') {
                const properties = (schema.properties as Record<string, unknown>) || {};
                const required = (schema.required as string[]) || [];
                extractObjectValue(properties, required, node.value.props, node);
            }
            // 提取数组元素
            else if (node.value.type === 'array') {
                const items = schema.items as Record<string, unknown>;
                if (items) {
                    extractArrayValue(items, node.value.item, node);
                }
            }

            // 收集依赖
            collectDepends(schema, node.depends, schemaExt);

            // 处理继承关系
            if (schema.allOf && Array.isArray(schema.allOf)) {
                if (schema.allOf.length > 1) {
                    throw new Error(`Multiple allOf not supported in ${filename}`);
                }
                if (schema.allOf.length > 0) {
                    const allOfItem = schema.allOf[0] as Record<string, unknown>;
                    const ref = allOfItem['$ref'];
                    if (ref && typeof ref === 'string' && ref.endsWith(schemaExt)) {
                        const baseFilename = getFileName(ref);
                        if (baseFilename) {
                            node.extend = toPascalCase(baseFilename);
                        }
                    }
                }
            }

            allNodes.set(name, node);
            
        } catch (error) {
            throw new Error(`💥 处理文件 ${file} 时出错: ${(error as Error).message}`);
        }
    }
    
    // 验证依赖关系
    validateDependencies(allNodes);
    
    return allNodes;
}

/**
 * 验证所有节点的依赖关系是否完整
 */
function validateDependencies(allNodes: Map<string, Node>): void {
    for (const [nodeName, node] of allNodes) {
        for (const dep of node.depends) {
            if (!allNodes.has(dep)) {
                throw new Error(`❌ 节点 '${nodeName}' 依赖的 '${dep}' 未找到`);
            }
        }
        
        if (node.extend && !allNodes.has(node.extend)) {
            throw new Error(`❌ 节点 '${nodeName}' 继承的 '${node.extend}' 未找到`);
        }
    }
}

/**
 * 通用的基础类型导出函数，用于生成TypeScript类型定义
 * 可以被类型生成器和类生成器共同使用
 */
export function exportBaseProp(
    prop: BaseProp, 
    writer: { append: (str: string) => void }, 
    config: {
        arrayType?: string;
        mapType?: string;
    } = {}
): void {
    const { arrayType = 'Array', mapType = 'Map' } = config;
    
    switch (prop.type) {
        case 'string':
        case 'number':
        case 'boolean':
        case 'undefined':
            writer.append(prop.type);
            break;
        case 'node':
            writer.append(prop.val);
            break;
        case 'map':
            writer.append(`${mapType}<${prop.key}, `);
            exportBaseProp(prop.val, writer, config);
            writer.append('>');
            break;
        case 'oneOf':
            for (let i = 0; i < prop.val.length; i++) {
                exportBaseProp(prop.val[i], writer, config);
                if (i !== prop.val.length - 1) {
                    writer.append(' | ');
                }
            }
            break;
    }
}


type InjectPhase = 'before' | 'after' | 'content' | 'force-type';

type InjectConfig = Record<InjectPhase, string | undefined>;

export interface InjectDefinitions {
    [nodeType: string]: Partial<InjectConfig>;
}
