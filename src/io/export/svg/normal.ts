import { GroupShape, ImageShape, PathShape, RectShape, Shape, SymbolUnionShape, SymbolShape, TextShape } from "../../../data/shape";
import { renderArtboard as art } from "../../../render";
import { renderGroup as group } from "../../../render";
import { renderBoolOpShape as boolgroup } from "../../../render";
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

comsMap.set(ShapeType.Artboard, (data: Shape, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return art(h, data as Artboard, comsMap, varsContainer, undefined);
});
comsMap.set(ShapeType.Group, (data: Shape, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    if ((data as GroupShape).isBoolOpShape) return boolgroup(h, data as GroupShape, varsContainer);
    return group(h, data as GroupShape, comsMap, varsContainer, undefined);
});

comsMap.set(ShapeType.Image, (data: Shape, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return image(h, data as ImageShape, "", varsContainer, undefined);
});
comsMap.set(ShapeType.Page, (data: Shape, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return group(h, data as GroupShape, comsMap, varsContainer, undefined);
});
comsMap.set(ShapeType.Path, (data: Shape, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return path(h, data as PathShape, varsContainer, undefined);
});
comsMap.set(ShapeType.Rectangle, (data: Shape, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return rect(h, data as RectShape, varsContainer, undefined);
});
comsMap.set(ShapeType.Text, (data: Shape, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return text(h, data as TextShape, varsContainer, undefined);
});

comsMap.set(ShapeType.SymbolRef, (data: Shape, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    const shape = data as SymbolRefShape;
    const symMgr = shape.getSymbolMgr();
    if (!symMgr) return "";
    const refId = shape.getRefId2(varsContainer);
    const sym0 = symMgr.getSync(refId);
    if (!sym0) return "";

    return symref(h, data as SymbolRefShape, sym0, comsMap, varsContainer, undefined);
});
comsMap.set(ShapeType.Symbol, (data: Shape, 
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return sym(h, data as SymbolShape, comsMap);
});

export function exportInnerSvg(shape: Shape): string {
    const com = comsMap.get(shape.type);
    if (!com) throw new Error("export svg, unknow shape type : " + shape.type)
    const content = h(com, { data: shape });
    return content;
}

export function exportSvg(shape: Shape): string {

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

    return h('svg', attrs, [content]);
}