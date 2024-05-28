import { extractRefFileName, fileName2TypeName, loadSchemas, markRefSelf, mergePropers } from "./validate_basic";

const schemaext = '.json'

export class Validator {
    schemas: Map<string, {
        schema: any,
        dependsOn: Set<string>,
        className: string,
        filename: string,
        filepath: string,
        mergedprops : Map<string, {
            schema: any,
            className: string,
            filename: string
        }>,
        mergedrequired: Set<string>
    }>
    schemadir: string

    constructor(schemadir: string) {
        const all = loadSchemas(schemadir);
        this.schemas = new Map();

        all.forEach((v, k) => {
            this.schemas.set(extractRefFileName(k), {
                schema: v.schema,
                dependsOn: v.dependsOn,
                className: v.className,
                filename: v.filename,
                filepath: v.filepath,
                mergedprops: new Map(),
                mergedrequired: new Set()
            })
        })
        this.schemadir = schemadir;

        this.schemas.forEach((v, k) => {
            markRefSelf(v.schema, v.filename)
            mergePropers(v.schema, v.className, v.filename, v.mergedprops, v.mergedrequired, [], all, schemadir)
        })

        // console.log(this.schemas)
    }

    private validate_enum(val: any, schema: any) {
        const idx = schema.enum.indexOf(val)
        if (idx < 0) {

        }
        return idx >= 0
    }

    private validate_type(val: any, schema: any, filename: string, validated: Set<string>): boolean {
        const type = schema.type
        // console.log(type, schema, val)
        if (schema.enum) {
            return this.validate_enum(val, schema)
        }
        if (type === 'object') {
            return this.validate_object(val, schema, filename, validated)
        }
        else if (type === 'integer' || type === 'number') {
            return typeof val === 'number' ||
                Number.parseInt(val).toString() === val ||
                Number.parseFloat(val).toString() === val
        }
        else if (type === 'boolean') {
            return typeof val === 'boolean' ||
                val === 'false' ||
                val === 'true'
        }
        else if (type === 'array') {
            if (!(val instanceof Array)) {
                return false
            }
            // console.log('array s')
            for (let i = 0, len = val.length; i < len; i++) {
                if (!this.validate_type(val[i], schema.items, filename, validated)) {
                    return false
                }
            }
            // console.log('array e')
            return true
        }
        else if (type === 'string') {
            return typeof val === 'string'
        }
        else if (schema['$ref']) {
            return this.validate_ref(val, schema['$ref'], filename, validated)
        }
        else if (schema.oneOf) {
            for (let i = 0, len = schema.oneOf.length; i < len; i++) {
                const sk = schema.oneOf[i]
                if (this.validate_type(val, sk, filename, validated)) {
                    return true
                }
            }
            return false
        }
        else if (schema.allOf) {
            throw new Error('Not support ' + schema)
        }
        else {
            console.log('Unknow type: ' + schema, filename, val)
            throw new Error('Unknow type: ' + type)
        }
    }

    private validate_object(val: any, schema: any, filename: string, validated: Set<string>): boolean {
        let props = new Map<string, {
            schema: any,
            className: string,
            filename: string
        }>()
        const required = new Set<string>()
        // const filename = extractRefFileName(schemapath)
        mergePropers(schema, fileName2TypeName(filename), filename, props, required, [], this.schemas, this.schemadir)

        // 所有val的成员,在schema中都有定义,并且类型正确
        // 所有schema中定义的required的,val中都有对应的值

        if (typeof val !== 'object') return this.validate_type(val, schema.schema, filename, validated)

        // 所有val的成员,在schema中都有定义,并且类型正确
        // 所有schema中定义的required的,val中都有对应的值

        const keys = Object.keys(val)
        for (let i = 0, len = keys.length; i < len; i++) {
            const k = keys[i]
            const v = val[k]

            const sk = props.get(k)
            if (!sk) throw new Error("not find schema <" + k + "> at " + filename)

            if (!this.validate_type(v, sk.schema, sk.filename, validated)) {
                console.log(v, sk, sk.filename)
                return false
            }
        }

        // const required = schema.mergedrequired;
        required.forEach((v) => {
            if (keys.indexOf(v) < 0) {
                console.log(filename + " must have " + v)
                return false
            }
        })

        return true
    }

    private validate_ref(val: any, ref: string, filename: string, validated: Set<string>): boolean {
        if (ref === '#') {
            const schema = this.schemas.get(filename)
            if (!schema) throw new Error("not find schema " + filename)
            return this.validate_inner(val, schema.filename, validated)
        }
        else if (ref.endsWith(schemaext)) {
            // schemapath = path.resolve(this.schemadir, ref)
            filename = extractRefFileName(ref)
            const schema = this.schemas.get(filename)
            if (!schema) throw new Error("not find schema " + ref)
            return this.validate_inner(val, filename, validated)
        }
        else {
            throw new Error("Unknow ref: " + ref)
        }
    }

    private validate_inner(val: any, filename: string, validated: Set<string>) {
        if (validated.has(filename)) return true;

        const schema = this.schemas.get(filename)
        if (!schema) throw new Error("not find schema " + filename)
        // return this.validate_type(val, schema.schema, schemapath)

        if (typeof val !== 'object') return this.validate_type(val, schema.schema, filename, validated)

        // 所有val的成员,在schema中都有定义,并且类型正确
        // 所有schema中定义的required的,val中都有对应的值

        const keys = Object.keys(val)
        for (let i = 0, len = keys.length; i < len; i++) {
            const k = keys[i]
            const v = val[k]

            const sk = schema.mergedprops.get(k)
            if (!sk) throw new Error("not find schema <" + k + "> at " + filename)
            // console.log(k, v, sk)
            if (!this.validate_type(v, sk.schema, sk.filename, validated)) {
                console.log(v, sk, sk.filename)
                return false
            }
        }

        const required = schema.mergedrequired;
        required.forEach((v) => {
            if (keys.indexOf(v) < 0) {
                console.log(filename + " must have " + v)
                return false
            }
        })

        return true
    }

    validate(val: any, filename: string) {
        const validated: Set<string> = new Set();
        return this.validate_inner(val, filename, validated)
    }
}