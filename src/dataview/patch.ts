// import { VDom } from "./basic";
// import { EL } from "./el";

// type _Node = { tag: string, attr: { [key: string]: string }, childs: (VDom | EL)[] }
// export function patch(el: HTMLElement | SVGElement | undefined, node: _Node, oldNode: _Node | undefined): HTMLElement | SVGElement {

//     // patch attr
//     if (!el) {
//         el = createElement(node.tag);
//         Object.keys(node.attr).forEach((key) => {
//             setAttribute(el!, key, node.attr[key]);
//         });
//     }
//     else {
//         const saveprops = oldNode?.attr || {};
//         const nkeys = Object.keys(node.attr);
//         const okeys = Object.keys(saveprops);
//         for (let i = 0; i < nkeys.length; i++) {
//             const key = nkeys[i];
//             const ov = saveprops[key];
//             const cv = node.attr[key];
//             if (ov !== cv) {
//                 setAttribute(el, key, cv);
//             }
//         }
//         for (let i = 0; i < okeys.length; i++) {
//             const key = okeys[i];
//             if (nkeys.indexOf(key) < 0) {
//                 el.removeAttribute(key);
//             }
//         }
//     }

//     // patch childs
    

//     return el;
// }