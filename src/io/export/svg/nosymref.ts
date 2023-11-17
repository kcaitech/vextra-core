import { GroupShape, ImageShape, PathShape, RectShape, Shape, SymbolShape, TextShape } from "../../../data/shape";
import { renderArtboard as art } from "../../../render";
import { renderGroup as group } from "../../../render";
import { renderImage as image } from "../../../render";
import { renderPathShape as path } from "../../../render";
import { renderPathShape as rect } from "../../../render";
import { renderTextShape as text } from "../../../render";
import { renderSymbolRef as symref } from "../../../render";
import { renderSymbol as sym } from "../../../render";
import { ComType, h } from "./basic";
import { Artboard } from "../../../data/artboard";
import { ShapeType, SymbolRefShape } from "../../../data/classes";

const comsMap: Map<ShapeType, ComType> = new Map();

comsMap.set(ShapeType.Artboard, (data: Shape) => {
    return art(h, data as Artboard, comsMap, undefined, undefined, undefined);
});
comsMap.set(ShapeType.Group, (data: Shape) => {
    return group(h, data as GroupShape, comsMap, undefined, undefined, undefined);
});

comsMap.set(ShapeType.Image, (data: Shape) => {
    return image(h, data as ImageShape, "", undefined, undefined, undefined);
});
comsMap.set(ShapeType.Page, (data: Shape) => {
    return group(h, data as GroupShape, comsMap, undefined, undefined, undefined);
});
comsMap.set(ShapeType.Path, (data: Shape) => {
    return path(h, data as PathShape, undefined, undefined, undefined);
});
comsMap.set(ShapeType.Rectangle, (data: Shape) => {
    return rect(h, data as RectShape, undefined, undefined, undefined);
});
comsMap.set(ShapeType.Text, (data: Shape) => {
    return text(h, data as TextShape, undefined, undefined, undefined);
});

comsMap.set(ShapeType.SymbolRef, (data: Shape) => {
    return symref(h, data as SymbolRefShape, undefined, comsMap, undefined, undefined, undefined);
});
comsMap.set(ShapeType.Symbol, (data: Shape) => {
    return sym(h, data as SymbolShape, comsMap);
});

// 用于审核等不需要导出symbolref
export function exportNoSymrefSvg(shape: Shape): string {

    const com = comsMap.get(shape.type);
    if (!com) throw new Error("export svg, unknow shape type : " + shape.type)
    const content = h(com, { data: shape });

    const frame = shape.frame;

    const attrs: { [kye: string]: string | number } = {};
    attrs['xmlns'] = "http://www.w3.org/2000/svg";
    attrs['xmlns:xlink'] = "http://www.w3.org/1999/xlink";
    attrs['xmlns:xhtml'] = "http://www.w3.org/1999/xhtml";
    attrs['preserveAspectRatio'] = "xMinYMin meet";
    attrs.width = frame.width;
    attrs.height = frame.height;
    attrs.viewBox = `${frame.x} ${frame.y} ${frame.width} ${frame.height}`;
    attrs.overflow = "visible";
    // attrs.style = "{ transform: matrixWithFrame.toString() }";

    return h('svg', attrs, [content]);
}