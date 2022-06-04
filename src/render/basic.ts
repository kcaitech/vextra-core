
// export class EL {
//     private m_tag: string;
//     private m_attr: any;
//     private m_childs: EL[];
//     constructor(tag: string, attr?: any, childs?: EL | EL[]) {
//         this.m_tag = tag;
//         this.m_attr = attr || {};
//         this.m_childs = childs? (Array.isArray(childs)? childs : [childs]) : [];
//     }
//     get tag() {
//         return this.m_tag;
//     }
//     set tag(tag: string) {
//         this.m_tag = tag;
//     }
//     get attr() {
//         return this.m_attr;
//     }
//     set attr(attr: any) {
//         this.m_attr = attr || {};
//     }
//     get childs() {
//         return this.m_childs;
//     }
// }
// export class ELArray extends Array<EL> {}
// export function h(tag: string, attr?: any, childs?: EL | EL[]): EL {
//     return new EL(tag, attr, childs);
// }
// export function transform<T>(e: EL | ELArray, h: (tag: string, attr: any, childs:T[]) => T): T | T[] {
//     return (Array.isArray(e) ? e : [e]).map((a) => h(a.tag, a.attr, create(a.childs, h) as T[]));
// }


import { h as _h, VNode } from "vue";
export interface EL extends VNode {}
export const h = _h;
export class ELArray extends Array<VNode> {}
export function transform(e: EL | ELArray, h: (tag: string, attr: any, childs:VNode[]) => VNode): VNode | VNode[] {
    return e;
}