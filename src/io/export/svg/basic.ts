/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { Shape } from "../../../data/shape";
import { SymbolRefShape, SymbolShape } from "../../../data/classes";

export type ComType = (data: Shape,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, attrs?: any) => string;

export function h(com: ComType, attrs?: any): string;
export function h(tag: string, attrs?: any, childs?: Array<string>): string;
export function h(tag: string, childs?: Array<string>): string;
export function h(...args: any[]): string {
    let attrs = args[1];
    let childs = args[2];
    if (args.length === 3) {
        //
    }
    else if (args.length === 2) {
        if (Array.isArray(args[1])) {
            attrs = undefined;
            childs = args[1];
        }
    }
    else {
        throw new Error("args err!");
    }
    if (typeof args[0] === 'function') {
        if (args.length > 2) {
            throw new Error("function args err!");
        }
        const com = args[0] as ComType;
        // const attrs = args[1];
        return com(attrs?.data, attrs?.varsContainer, attrs);
    }
    else if (typeof args[0] === 'string') {
        const tag = args[0];
        // const attrs = args[1];
        // const childs = args[2];
        let ret = '<' + tag;
        if (attrs) for (let a in attrs) {
            const attr = attrs[a];
            if (a === 'style') {
                let style = ""
                for (let b in attr) {
                    style += b + ':' + attr[b] + ';';
                }
                ret += ' ' + a + '="' + style + '"';
            }
            else {
                ret += ' ' + a + '="' + attr + '"';
            }
        }
        ret += '>';
        if (childs) for (let i = 0, len = childs.length; i < len; i++) {
            ret += childs[i];
        }
        ret += '</' + tag + '>';
        return ret;
    }
    else {
        throw new Error("h function args err!");
    }
}
