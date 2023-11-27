import { GroupShape, ImageShape, PathShape, RectShape, Shape, SymbolUnionShape, SymbolShape, TextShape } from "../../../data/shape";
import { RenderTransform, renderArtboard as art } from "../../../render";
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

comsMap.set(ShapeType.Artboard, (data: Shape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return art(h, data as Artboard, comsMap, transform, varsContainer, undefined);
});
comsMap.set(ShapeType.Group, (data: Shape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return group(h, data as GroupShape, comsMap, transform, varsContainer, undefined);
});

comsMap.set(ShapeType.Image, (data: Shape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return image(h, data as ImageShape, "", transform, varsContainer, undefined);
});
comsMap.set(ShapeType.Page, (data: Shape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return group(h, data as GroupShape, comsMap, transform, varsContainer, undefined);
});
comsMap.set(ShapeType.Path, (data: Shape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return path(h, data as PathShape, transform, varsContainer, undefined);
});
comsMap.set(ShapeType.Rectangle, (data: Shape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return rect(h, data as RectShape, transform, varsContainer, undefined);
});
comsMap.set(ShapeType.Text, (data: Shape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return text(h, data as TextShape, transform, varsContainer, undefined);
});

comsMap.set(ShapeType.SymbolRef, (data: Shape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {

    const symMgr = data.getSymbolMgr();
    if (!symMgr) return "";
    const refId = data.getRefId2(varsContainer);
    const sym0 = symMgr.getSync(refId);
    if (!sym0) return "";

    let sym1;
    if (sym0 && sym0 instanceof SymbolUnionShape) {
        sym1 = sym0.getTagedSym(data, varsContainer || []);
    }

    return symref(h, data as SymbolRefShape, sym1 || sym0, comsMap, transform, varsContainer, undefined);
});
comsMap.set(ShapeType.Symbol, (data: Shape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return sym(h, data as SymbolShape, comsMap);
});

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