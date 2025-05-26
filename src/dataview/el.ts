/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


// const _el_instance: EL[] = [];
// let _el_id: number = 0;

import { stringh } from "./basic";

// function recycleEL(el: EL) {
//     // el.el = undefined;
//     el.childs.length = 0;
//     _el_instance.push(el);
// }

export type ELAttr = { [key: string]: string | { [key: string]: string } };

const _check_el_childs = false; // for debug
function assignELChilds(childs?: string | EL | EL[]): string | EL[] {
    if (!childs) {
        return [];
    }
    else if (Array.isArray(childs)) {
        // check childs
        if (_check_el_childs) {
            const _childs = childs as EL[];
            for (let i = 0; i < _childs.length; i++) {
                if (!(_childs[i] instanceof EL)) {
                    throw new Error('childs must be EL array');
                }
            }
        }
        return childs;
    }
    else if (typeof childs == 'string') {
        return childs;
    }
    else if (childs instanceof EL) {
        return [childs]
    }
    else {
        throw new Error('childs must be string or EL or EL array')
    }
}

export class EL {
    // el?: HTMLElement | SVGElement;
    // _id: number;
    // kid? : string; // 关键节点,回收整棵树时到些打住
    eltag: string;
    elattr: ELAttr;
    elchilds: string | EL[];

    static make(tag: string, attr?: { [key: string]: string }, childs?: string | EL | EL[]): EL {
        return new EL(tag, attr, childs);
        // let el = _el_instance.pop();
        // if (el) {
        //     el.reset(tag, attr, childs);
        // } else {
        //     el = new EL(tag, attr, childs);
        // }
        // return el;
    }

    // id() {
    //     return this._id;
    // }

    public reset(tag: string, attr?: ELAttr, childs?: string | EL | EL[]) {
        // this._id = id;
        this.eltag = tag;
        this.elattr = attr || {};
        this.elchilds = assignELChilds(childs);
    }

    constructor(tag: string, attr?: ELAttr, childs?: string | EL | EL[]) {
        // this._id = id;
        this.eltag = tag;
        this.elattr = attr || {};
        this.elchilds = assignELChilds(childs);
    }

    get isViewNode() {
        return false;
    }

    recycle(recycleFun: (el: EL) => void) {
        // 不能回收,有缓存复用
        // for (let i = 0, len = this.childs.length; i < len; i++) {
        //     const c = this.childs[i];
        //     if (!c.kid) {
        //         c.recycle(recycleFun);
        //     }
        // }
        // recycleFun(this);
        // this.childs.length = 0;
        // _el_instance.push(this);
    }

    get outerHTML(): string {
        const toSVGString = (el: EL): string => {
            const childs = Array.isArray(el.elchilds) ? el.elchilds.map((c: EL) => {
                return toSVGString(c);
            }) : (el.elchilds);
            return stringh(el.eltag, el.elattr, childs)
        }
        return toSVGString(this);
    }

    get innerHTML(): string {
        const toSVGString = (el: EL): string => {
            const childs = Array.isArray(el.elchilds) ? el.elchilds.map((c: EL) => {
                return toSVGString(c);
            }) : (el.elchilds);
            return stringh(el.eltag, el.elattr, childs)
        }
        if (Array.isArray(this.elchilds)) {
            return this.elchilds.reduce((p, c) => p + toSVGString(c), '');
        } else {
            return this.elchilds;
        }
    }
}

export function recycleELArr(arr: EL[], recycleFun: (el: EL) => void) {
    arr.forEach(el => {
        el.recycle(recycleFun);
    });
}

// export class ELARR extends Array<EL> {
//     recycle() {
//         for (let i = 0; i < this.length; i++) {
//             this[i].recycle();
//         }
//         this.length = 0;
//     }
// }

export function elh(tag: string, attr?: any, childs?: EL | EL[]): EL {
    if (Array.isArray(attr)) return EL.make(tag, undefined, attr);
    return EL.make(tag, attr, childs);
}
