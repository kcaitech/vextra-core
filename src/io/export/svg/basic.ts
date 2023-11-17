import { Shape } from "../../../data/shape";

export type ComType = (data: Shape) => string;

export function h(com: ComType, attrs?: any): string;
export function h(tag: string, attrs?: any, childs?: Array<string>): string;
export function h(...args: any[]): string {
    if (typeof args[0] === 'function') {
        if (args.length > 2) {
            throw new Error("function args err!");
        }
        const com = args[0];
        const attrs = args[1];
        return com(attrs.data); // todo
    }
    else if (typeof args[0] === 'string') {
        const tag = args[0];
        const attrs = args[1];
        const childs = args[2];
        let ret = '<' + tag;
        if (attrs) for (let a in attrs) {
            ret += ' ' + a + '="' + attrs[a] + '"';
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
