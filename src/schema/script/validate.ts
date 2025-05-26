/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BaseProp, loadSchemas, NamedProp, Node, toPascalCase } from "./basic";

export class Validator {
    schemas: Map<string, Node>
    schemadir: string

    constructor(schemadir: string) {
        this.schemas = loadSchemas(schemadir);
        this.schemadir = schemadir;
    }

    private validate_enum(val: any, schema: Node) {
        if (schema.value.type !== 'enum') throw new Error("")
        const idx = schema.value.enum.indexOf(val)
        if (idx < 0) {
            console.log("enum err:", val, schema.value.enum)
        }
        return idx >= 0
    }

    private validate_map(val: any, schema: BaseProp): boolean {
        if (schema.type !== 'map') throw new Error("")

            // json序列化回来的不是个map
        if (typeof val !== 'object') {
            console.log(val, "expected to be a K-V object")
            return false
        }

        if (!(val instanceof Map)) {
            val = Object.entries(val)
        }

        for (const [key, value] of val) {
            if (!this.validate_prop(value, schema.val)) {
                console.log(key, ' prop type wrong')
                return false
            }
            if (typeof key !== 'string' || typeof key !== 'number') {
                console.log('map key type if not string or number', value)
                return false
            }
        }
        return true
    }

    private validate_prop(val: any, schema: BaseProp): boolean {
        const _type = schema.type
        // console.log(type, schema, val)
        if (_type === 'node') {
            return this.validate_node(val, schema.val)
        }
        if (_type === 'map') {
            return this.validate_map(val, schema)
        }
        else if (_type === 'number') {
            return typeof val === 'number' ||
                Number.parseInt(val).toString() === val ||
                Number.parseFloat(val).toString() === val
        }
        else if (_type === 'boolean') {
            return typeof val === 'boolean' ||
                val === 'false' ||
                val === 'true'
        }
        else if (_type === 'string') {
            return typeof val === 'string'
        }
        else if (_type === 'undefined') {
            return typeof val === 'undefined'
        }
        else if (_type === 'oneOf') {
            for (let i = 0, len = schema.val.length; i < len; i++) {
                const sk = schema.val[i]
                if (this.validate_prop(val, sk)) {
                    return true
                }
            }
            console.log('oneOf prop type wrong', schema.val)
            return false
        }
        else {
            console.log('Unknow type: ' + schema)
            throw new Error('Unknow type: ' + _type)
        }
    }

    private merge_props(schema: Node, props = new Map<string, NamedProp>()): Map<string, NamedProp> {
        if (schema.value.type !== 'object') throw new Error("")
        for (let i = 0, len = schema.value.props.length; i < len; ++i) {
            const p = schema.value.props[i]
            props.set(p.name, p)
        }
        if (schema.extend) {
            const extend = this.schemas.get(schema.extend)
            if (!extend) throw new Error("")
            this.merge_props(extend, props)
        }
        return props
    }

    private validate_object(val: any, schema: Node): boolean {

        // 所有val的成员,在schema中都有定义,并且类型正确
        // 所有schema中定义的required的,val中都有对应的值

        if (schema.value.type !== 'object') throw new Error("")

        // merge props
        const props = this.merge_props(schema)

        const keys = Object.keys(val)
        for (let i = 0, len = keys.length; i < len; i++) {
            const k = keys[i]
            const v = val[k]

            // const sk = props.get(k)
            const prop = props.get(k)
            if (!prop) {
                // console.log(schema.value.props)
                throw new Error("not find schema <" + k + "> at " + schema.name)
            }

            if (!this.validate_prop(v, prop)) {
                console.log(v, prop.name)
                return false
            }
        }

        const required = Array.from(props.values()).filter((p) => p.required)

        // const required = schema.mergedrequired;
        required.forEach((v) => {
            if (keys.indexOf(v.name) < 0) {
                console.log(schema.name + " must have " + v)
                return false
            }
        })

        return true
    }

    private validate_array(val: any, schema: Node): boolean {
        if (schema.value.type !== 'array') throw new Error("")
        if (!(val instanceof Array)) {
            console.log("val is not array", val)
            return false
        }
        // console.log('array s')
        for (let i = 0, len = val.length; i < len; i++) {
            if (!this.validate_prop(val[i], schema.value.item)) {
                console.log('item prop type wrong', val[i])
                return false
            }
        }
        // console.log('array e')
        return true
    }

    private validate_node(val: any, schemaId: string): boolean {
        // if (validated.has(schemaId)) return true; // todo 不对吧，重复同类型的数据呢

        const schema = this.schemas.get(schemaId)
        if (!schema) throw new Error("not find schema " + schemaId)
        // return this.validate_type(val, schema.schema, schemapath)

        const _type = schema.value.type
        if (_type === 'object') {
            return this.validate_object(val, schema)
        }
        if (_type === 'enum') {
            return this.validate_enum(val, schema)
        }
        if (_type === 'array') {
            return this.validate_array(val, schema)
        }

        throw new Error("unknow schema type:", _type)
    }

    /**
     * 
     * @param val 实际数据
     * @param schemaId 要校验的数据的schemaId(schema文件名)
     * @returns 
     */
    validate(val: any, schemaId: string) {
        return this.validate_node(val, toPascalCase(schemaId))
    }
}