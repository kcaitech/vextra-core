
const _el_instance: EL[] = [];
// let _el_id: number = 0;

// function recycleEL(el: EL) {
//     // el.el = undefined;
//     el.childs.length = 0;
//     _el_instance.push(el);
// }

export type ELAttr = { [key: string]: string | { [key: string]: string } };

export class EL {
    // el?: HTMLElement | SVGElement;
    // _id: number;
    // kid? : string; // 关键节点,回收整棵树时到些打住
    tag: string;
    attr: ELAttr;
    childs: string | EL[];

    static make(tag: string, attr?: { [key: string]: string }, childs?: string | EL | EL[]): EL {
        let el = _el_instance.pop();
        if (el) {
            el.reset(tag, attr, childs);
        } else {
            el = new EL(tag, attr, childs);
        }
        return el;
    }

    // id() {
    //     return this._id;
    // }

    public reset(tag: string, attr?: ELAttr, childs?: string | EL | EL[]) {
        // this._id = id;
        this.tag = tag;
        this.attr = attr || {};
        this.childs = childs ? (Array.isArray(childs) ? childs : (typeof childs === 'string' ? childs : [childs])) : [];
    }

    constructor(tag: string, attr?: ELAttr, childs?: string | EL | EL[]) {
        // this._id = id;
        this.tag = tag;
        this.attr = attr || {};
        this.childs = childs ? (Array.isArray(childs) ? childs : (typeof childs === 'string' ? childs : [childs])) : [];
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

/**
xmlns: "http://www.w3.org/2000/svg",
"xmlns:xlink": "http://www.w3.org/1999/xlink",
"xmlns:xhtml": "http://www.w3.org/1999/xhtml",
 */
const xmlns = "http://www.w3.org/2000/svg";
const xlink = "http://www.w3.org/1999/xlink";
const xhtml = "http://www.w3.org/1999/xhtml";

// export function createElement(tag: string): HTMLElement | SVGElement {
//     if (tag === "foreignObject") return document.createElement(tag);
//     if (tag === "div") return document.createElement("div");
//     return document.createElementNS(xmlns, tag);
// }

// export function setAttribute(el: HTMLElement | SVGElement, key: string, value: string) {
//     if (key === "xlink:href") {
//         el.setAttributeNS(xlink, key, value);
//     } else {
//         el.setAttribute(key, value);
//     }
// }

// export function elpatch(old: EL | undefined, nu: EL): EL {
//     if (!old || !old.el || old.tag !== nu.tag) {
//         nu.el = createElement(nu.tag);
//         if (!nu.el) throw new Error("can not create element: " + nu.tag);
//         for (let key in nu.attr) {
//             setAttribute(nu.el, key, nu.attr[key]);
//         }
//         for (let i = 0; i < nu.childs.length; i++) {
//             elpatch(undefined, nu.childs[i]);
//             nu.el.appendChild(nu.childs[i].el!);
//         }
//         if (old) recycleEL(old);
//         return nu;
//     }

//     // attr
//     const nkeys = Object.keys(nu.attr);
//     const okeys = Object.keys(old.attr);
//     for (let i = 0; i < nkeys.length; i++) {
//         const key = nkeys[i];
//         const ov = old.attr[key];
//         const cv = nu.attr[key];
//         if (ov !== cv) {
//             setAttribute(old.el, key, cv);
//         }
//     }
//     for (let i = 0; i < okeys.length; i++) {
//         const key = okeys[i];
//         if (nkeys.indexOf(key) < 0) {
//             old.el.removeAttribute(key);
//         }
//     }
//     old.attr = nu.attr;

//     // childs
//     const childs = [];
//     for (let i = 0; i < nu.childs.length; i++) { // 简单比较
//         const uc = nu.childs[i];
//         const oc = old.childs[i];
//         elpatch(oc, uc);
//         if (!uc.el) {
//             recycleEL(uc);
//             // 使用旧的el
//             childs.push(oc);
//             continue;
//         }
//         childs.push(uc);
//         if (oc) {
//             old.el.replaceChild(uc.el, oc.el!);
//         }
//         else {
//             if (old.childs.length > i) throw new Error("something wrong");
//             old.el.appendChild(uc.el);
//         }
//     }
//     if (old.childs.length > nu.childs.length) {
//         let count = nu.childs.length - old.childs.length;
//         for (let i = 0; i < count; i++) {
//             recycleEL(old.childs[old.childs.length - 1 - i]);
//         }
//         while (count--) old.el.removeChild(old.el.childNodes[old.el.childNodes.length - 1]);
//     }
//     old.childs = childs;

//     return old;
// }