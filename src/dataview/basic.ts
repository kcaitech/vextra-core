import { SymbolRefShape, SymbolShape } from "../data";

export { findVar, findOverride, findOverrideAndVar } from "../data/utils"

export function stringh(tag: string, attrs?: any, childs?: Array<string> | string): string;
export function stringh(tag: string, childs?: Array<string> | string): string;
export function stringh(...args: any[]): string {
    const tag = args[0];
    let attrs = args[1];
    let childs = args[2];
    if (args.length === 3) {
        //
    } else if (args.length === 2) {
        if (Array.isArray(args[1])) {
            attrs = undefined;
            childs = args[1];
        }
    } else {
        throw new Error("args err!");
    }

    if (typeof tag !== 'string') {
        throw new Error("not support:" + tag);
    } else if (tag.length === 0) {
        throw new Error("tag is empty");
    }

    let ret = '<' + tag;
    if (attrs) for (let a in attrs) {
        const attr = attrs[a];
        if (a === 'style') {
            let style = ""
            for (let b in attr) {
                if (attr[b] !== undefined) style += b + ':' + attr[b] + ';';
            }
            ret += ' ' + a + '="' + style + '"';
        } else {
            if (attr !== undefined) ret += ' ' + a + '="' + attr + '"';
        }
    }
    ret += '>';
    if (!childs) {
        // 
    } else if (Array.isArray(childs)) for (let i = 0, len = childs.length; i < len; i++) {
        ret += childs[i];
    }
    else if (typeof childs === 'string') {
        ret += childs;
    } else {
        throw new Error("unknow childs:" + childs);
    }
    ret += '</' + tag + '>';
    return ret;
}

export function genid(shapeId: string,
                      varsContainer: (SymbolRefShape | SymbolShape)[]) {
    if (varsContainer.length > 0) {
        let id = "";
        for (let i = 0, len = varsContainer.length; i < len; ++i) {
            const container = varsContainer[i];
            if (container instanceof SymbolRefShape) {
                if (id.length > 0) id += '/';
                id += container.id;
            }
        }
        if (id.length > 0) {
            return id + '/' + shapeId;
        }
    }
    return shapeId;
}

export function getShapeViewId(shapeId: string,
                               varsContainer?: (SymbolRefShape | SymbolShape)[]) {
    if (varsContainer) return genid(shapeId, varsContainer);
    return shapeId;
}
