/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseProp, loadSchemas, NamedProp, Node, toPascalCase } from "./basic";

/**
 * Schema验证器类
 * 
 * 负责根据JSON Schema定义验证数据的合法性，支持：
 * 1. 基础类型验证（string、number、boolean等）
 * 2. 复杂类型验证（object、array、enum等）
 * 3. 引用类型验证（$ref引用）
 * 4. 联合类型验证（oneOf）
 * 5. 继承关系验证
 */
export class Validator {
    /** 加载的所有Schema定义 */
    private readonly schemas: Map<string, Node>;
    /** Schema文件目录路径 */
    private readonly schemaDirectory: string;

    constructor(schemaDirectory: string) {
        this.schemas = loadSchemas(schemaDirectory);
        this.schemaDirectory = schemaDirectory;
    }

    /**
     * 验证枚举值
     * @param value 待验证的值
     * @param schema 枚举类型的Schema节点
     * @returns 验证结果
     */
    private validateEnumValue(value: any, schema: Node): boolean {
        if (schema.value.type !== 'enum') {
            throw new Error(`Expected enum schema, got ${schema.value.type}`);
        }
        
        const enumValues = schema.value.enum;
        const isValid = enumValues.includes(value);
        
        if (!isValid) {
            console.log(`Enum validation failed. Expected one of [${enumValues.join(', ')}], got:`, value);
        }
        
        return isValid;
    }

    /**
     * 验证Map类型数据
     * @param value 待验证的值
     * @param schema Map类型的Schema定义
     * @returns 验证结果
     */
    private validateMapValue(value: any, schema: BaseProp): boolean {
        if (schema.type !== 'map') {
            throw new Error(`Expected map schema, got ${schema.type}`);
        }

        // 检查是否为对象类型
        if (typeof value !== 'object' || value === null) {
            console.log('Map validation failed: expected object, got:', typeof value);
            return false;
        }

        // 转换为键值对数组进行验证
        const entries = value instanceof Map ? Array.from(value.entries()) : Object.entries(value);

        // 验证每个键值对
        for (const [key, val] of entries) {
            // 验证值的类型
            if (!this.validatePropertyValue(val, schema.val)) {
                console.log(`Map validation failed for key '${key}': value type mismatch`);
                return false;
            }
            
            // 验证键的类型
            if (!this.isValidKeyType(key, schema.key)) {
                console.log(`Map validation failed: invalid key type '${typeof key}', expected '${schema.key}'`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * 检查键类型是否有效
     */
    private isValidKeyType(key: any, expectedType: 'string' | 'number'): boolean {
        return expectedType === 'string' ? typeof key === 'string' : typeof key === 'number';
    }

    /**
     * 验证属性值
     * @param value 待验证的值
     * @param schema 属性的Schema定义
     * @returns 验证结果
     */
    private validatePropertyValue(value: any, schema: BaseProp): boolean {
        switch (schema.type) {
            case 'node':
                return this.validateNodeValue(value, schema.val);
                
            case 'map':
                return this.validateMapValue(value, schema);
                
            case 'number':
                return this.validateNumberValue(value);
                
            case 'boolean':
                return this.validateBooleanValue(value);
                
            case 'string':
                return typeof value === 'string';
                
            case 'undefined':
                return typeof value === 'undefined';
                
            case 'oneOf':
                return this.validateOneOfValue(value, schema);
                
            default:
                const exhaustiveCheck: never = schema;
                throw new Error(`Unknown property type: ${JSON.stringify(exhaustiveCheck)}`);
        }
    }

    /**
     * 验证数字类型值
     */
    private validateNumberValue(value: any): boolean {
        return typeof value === 'number' ||
               Number.parseInt(value).toString() === value ||
               Number.parseFloat(value).toString() === value;
    }

    /**
     * 验证布尔类型值
     */
    private validateBooleanValue(value: any): boolean {
        return typeof value === 'boolean' ||
               value === 'false' ||
               value === 'true';
    }

    /**
     * 验证oneOf类型值
     * @param value 待验证的值
     * @param schema oneOf类型的Schema定义
     * @returns 验证结果
     */
    private validateOneOfValue(value: any, schema: BaseProp & { type: 'oneOf' }): boolean {
        // 尝试匹配任意一个类型
        for (const unionSchema of schema.val) {
            if (this.validatePropertyValue(value, unionSchema)) {
                return true;
            }
        }
        
        console.log('OneOf validation failed: value does not match any union type:', {
            value,
            expectedTypes: schema.val.map(s => s.type)
        });
        
        return false;
    }

    /**
     * 合并节点及其继承链中的所有属性
     * @param schema 节点Schema
     * @param mergedProps 已合并的属性Map（用于递归）
     * @returns 合并后的属性Map
     */
    private mergeInheritedProperties(schema: Node, mergedProps = new Map<string, NamedProp>()): Map<string, NamedProp> {
        if (schema.value.type !== 'object') {
            throw new Error(`Expected object schema, got ${schema.value.type}`);
        }
        
        // 添加当前节点的属性
        for (const property of schema.value.props) {
            mergedProps.set(property.name, property);
        }
        
        // 递归处理继承的属性
        if (schema.extend) {
            const parentSchema = this.schemas.get(schema.extend);
            if (!parentSchema) {
                throw new Error(`Parent schema not found: ${schema.extend}`);
            }
            this.mergeInheritedProperties(parentSchema, mergedProps);
        }
        
        return mergedProps;
    }

    /**
     * 验证对象类型数据
     * @param value 待验证的对象
     * @param schema 对象类型的Schema节点
     * @returns 验证结果
     */
    private validateObjectValue(value: any, schema: Node): boolean {
        if (schema.value.type !== 'object') {
            throw new Error(`Expected object schema, got ${schema.value.type}`);
        }

        // 合并所有属性（包括继承的）
        const allProperties = this.mergeInheritedProperties(schema);
        
        // 验证对象中的每个属性
        if (!this.validateObjectProperties(value, allProperties, schema.name)) {
            return false;
        }
        
        // 验证必需属性是否都存在
        return this.validateRequiredProperties(value, allProperties, schema.name);
    }

    /**
     * 验证对象的属性
     */
    private validateObjectProperties(value: any, allProperties: Map<string, NamedProp>, schemaName: string): boolean {
        const valueKeys = Object.keys(value);
        
        for (const key of valueKeys) {
            const propertyValue = value[key];
            const propertySchema = allProperties.get(key);
            
            if (!propertySchema) {
                throw new Error(`Unknown property '${key}' in schema '${schemaName}'`);
            }

            if (!this.validatePropertyValue(propertyValue, propertySchema)) {
                console.log(`Property validation failed for '${key}' in '${schemaName}':`, propertyValue);
                return false;
            }
        }
        
        return true;
    }

    /**
     * 验证必需属性
     */
    private validateRequiredProperties(value: any, allProperties: Map<string, NamedProp>, schemaName: string): boolean {
        const requiredProperties = Array.from(allProperties.values()).filter(prop => prop.required);
        const valueKeys = Object.keys(value);
        
        for (const requiredProp of requiredProperties) {
            if (!valueKeys.includes(requiredProp.name)) {
                console.log(`Missing required property '${requiredProp.name}' in schema '${schemaName}'`);
                return false;
            }
        }
        
        return true;
    }

    /**
     * 验证数组类型数据
     * @param value 待验证的数组
     * @param schema 数组类型的Schema节点
     * @returns 验证结果
     */
    private validateArrayValue(value: any, schema: Node): boolean {
        if (schema.value.type !== 'array' && schema.value.type !== 'native_array') {
            throw new Error(`Expected array schema, got ${schema.value.type}`);
        }
        
        if (!Array.isArray(value)) {
            console.log('Array validation failed: expected array, got:', typeof value);
            return false;
        }
        
        // 验证数组中的每个元素
        for (let i = 0; i < value.length; i++) {
            if (!this.validatePropertyValue(value[i], schema.value.item)) {
                console.log(`Array element validation failed at index ${i}:`, value[i]);
                return false;
            }
        }
        
        return true;
    }

    /**
     * 验证节点值
     * @param value 待验证的值
     * @param schemaId Schema ID
     * @returns 验证结果
     */
    private validateNodeValue(value: any, schemaId: string): boolean {
        const schema = this.schemas.get(schemaId);
        if (!schema) {
            throw new Error(`Schema not found: ${schemaId}`);
        }

        switch (schema.value.type) {
            case 'object':
                return this.validateObjectValue(value, schema);
                
            case 'enum':
                return this.validateEnumValue(value, schema);
                
            case 'array':
                return this.validateArrayValue(value, schema);
            case 'native_array':
                return this.validateArrayValue(value, schema);
            default:
                const exhaustiveCheck: never = schema.value;
                throw new Error(`Unknown schema type: ${JSON.stringify(exhaustiveCheck)}`);
        }
    }

    /**
     * 验证数据
     * @param value 待验证的实际数据
     * @param schemaId 要使用的Schema ID（schema文件名）
     * @returns 验证结果
     */
    public validate(value: any, schemaId: string): boolean {
        try {
            const normalizedSchemaId = toPascalCase(schemaId);
            return this.validateNodeValue(value, normalizedSchemaId);
        } catch (error) {
            console.error(`Validation error for schema '${schemaId}':`, (error as Error).message);
            return false;
        }
    }

    /**
     * 获取已加载的Schema数量
     */
    public getSchemaCount(): number {
        return this.schemas.size;
    }

    /**
     * 检查是否存在指定的Schema
     */
    public hasSchema(schemaId: string): boolean {
        return this.schemas.has(toPascalCase(schemaId));
    }

    /**
     * 获取所有Schema ID列表
     */
    public getSchemaIds(): string[] {
        return Array.from(this.schemas.keys());
    }
}