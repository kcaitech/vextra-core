/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Shape, StyleMangerMember, Variable } from "../../../data";
import {BasicMap, ResourceMgr} from "../../../data";
import { Page } from "../../../data";

export interface IJSON {
    [key: string]: any
}
export class LoadContext {
    rawVariables = new Map<string, IJSON>();
    variables = new BasicMap<string, Variable>();

    constructor(
        public mediasMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>,
        public styleMgr: ResourceMgr<StyleMangerMember>
    ) {
    }
}

export type ImportFun = (ctx: LoadContext, data: IJSON, i: number) => Shape

export type ImportFun1 = (ctx: LoadContext, data: IJSON, i: number) => Shape | undefined


export function updatePageFrame(p: Page) {
    // const pf = p.size;
    // const cc = p.childs.length;
    // if (cc === 0) {
    //     p.transform.translateX = 0;
    //     p.transform.translateY = 0;
    //     p.size.width = 0
    //     p.size.height = 0
    //     return;
    // }
    // const c = p.childs[0];
    // const cf = c.size;
    // let l = cf.x, t = cf.y, r = l + cf.width, b = t + cf.height;
    // for (let i = 1; i < cc; i++) {
    //     const c = p.childs[i];
    //     const cf = c.size;
    //     const cl = cf.x, ct = cf.y, cr = cl + cf.width, cb = ct + cf.height;
    //     l = Math.min(cl, l);
    //     t = Math.min(ct, t);
    //     r = Math.max(cr, r);
    //     b = Math.max(cb, b);
    //     // console.log("c", i, cf)
    // }
    // // console.log("pf", pf)
    // // console.log(l, t, r, b)
    // // pf.set(pf.x + l, pf.y + t, r - l, b - t);
    // p.transform.translateX = pf.x + l;
    // p.transform.translateY = pf.y + t;
    // p.size.width = r - l
    // p.size.height = b - t
    // // console.log(pf)

    // for (let i = 0; i < cc; i++) {
    //     const c = p.childs[i];
    //     c.transform.translateX -= l;
    //     c.transform.translateY -= t;
    //     // cf.width = cf.width;
    //     // cf.height = cf.height;
    //     // console.log("c", i, cf)
    // }
}
