/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { SymbolRefShape, SymbolShape } from "../data/classes";

export { findVar, findOverride, findOverrideAndVar } from "../data/utils"

export function stringh(tag: string, childs?: Array<string> | string): string;
export function stringh(tag: string, attrs?: { [key: string]: any }, childs?: Array<string> | string): string;
export function stringh(tag: string, attrs?: { [key: string]: any } | (Array<string> | string), childs?: Array<string> | string): string {

    if (Array.isArray(attrs) || typeof attrs === 'string') {
        attrs = undefined;
        childs = attrs;
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
