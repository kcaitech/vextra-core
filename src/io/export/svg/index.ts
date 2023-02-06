import { BoolOp, GroupShape, ImageShape, PathShape, Shape, ShapeGroupShape, ShapeType, SymbolRef, TextShape } from "@/data/shape";
import { Artboard } from "@/data/artboard";
import { render as art } from "@/render/artboard";
import { render as group } from "@/render/group";
import { render as shapegroup } from "@/render/shapegroup";
import { render as image } from "@/render/image";
import { render as path } from "@/render/pathshape";
import { render as rect } from "@/render/rectangle";
import { render as text } from "@/render/text";
import { render as bool } from "@/render/boolshape";
import { render as symref } from "@/render/symbolref";

const comsMap: Map<ShapeType, any> = new Map();

function h(com: Function, attrs?: any): string;
function h(tag: string, attrs?: any, childs?: Array<string>): string;
function h(...args: any[]): string {
    if (typeof args[0] === 'function') {
        if (args.length > 2) {
            throw new Error("function args err!");
        }
        const com = args[0];
        const attrs = args[1];
        return com(attrs.data, attrs.boolop, attrs.path); // todo
    }
    else if (typeof args[0] === 'string') {
        const tag = args[0];
        const attrs = args[1];
        const childs = args[2];
        let ret = '<' + tag;
        if (attrs) for (let a in attrs) {
            ret += ' ' + a + '=' + attrs[a];
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

comsMap.set(ShapeType.Artboard, (data: Shape) => {
    return art(h, data as Artboard, comsMap);
});
comsMap.set(ShapeType.Group, (data: Shape) => {
    return group(h, data as GroupShape, comsMap);
});
comsMap.set(ShapeType.ShapeGroup, (data: Shape) => {
    return shapegroup(h, data as ShapeGroupShape);
});
comsMap.set(ShapeType.Image, (data: Shape) => {
    const s = data as ImageShape;
    const url = s.peekImage() || "";
    return image(h, s, url);
});
comsMap.set(ShapeType.Page, (data: Shape) => {
    return group(h, data as GroupShape, comsMap);
});
comsMap.set(ShapeType.Path, (data: Shape) => {
    return path(h, data as PathShape);
});
comsMap.set(ShapeType.Rectangle, (data: Shape) => {
    return rect(h, data);
});
comsMap.set(ShapeType.Text, (data: Shape) => {
    return text(h, data as TextShape);
});
comsMap.set(ShapeType.Boolean, (data: Shape, path: string) => { // todo
    return bool(h, data, path);
});
comsMap.set(ShapeType.Symbol, (data: Shape) => {
    return group(h, data as GroupShape, comsMap);
});
comsMap.set(ShapeType.SymbolRef, (data: Shape) => {
    return symref(h, data as SymbolRef, comsMap);
});

export function exportSvg(shape: Shape): string {
    // todo svg head
    const com = comsMap.get(shape.type);
    return h(com, { data: shape, boolop: BoolOp.None });
}