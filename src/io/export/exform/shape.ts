import { GroupShape, ImageShape, PathShape, Shape, ShapeType, Symbol, SymbolRef } from "@/data/shape";
import { exportExportOptions, exportFrame } from "./common";
import { ExfContext } from "./context";
import { exportStyle } from "./style";

export function shapesExporter(shape: Shape): (s: any, ctx: ExfContext) => string {
    switch (shape.type) {
        case ShapeType.Artboard:
        case ShapeType.Boolean:
        case ShapeType.Page:
            throw new Error("wrong shape type.")
        case ShapeType.Group: return exportGroupShape;
        case ShapeType.Image: return exportImageShape;
        case ShapeType.Oval:
        case ShapeType.Path:
        case ShapeType.Polygon:
        case ShapeType.Star:
        case ShapeType.Triangle:
        case ShapeType.Rectangle: return exportPathShape;
        case ShapeType.ShapeGroup: return exportGroupShape;
        case ShapeType.Symbol: return exportShape;
        case ShapeType.SymbolRef: return exportShape;
        case ShapeType.Text: return exportShape;
    }
}

export function exportShapeCommons(shape: Shape) {
    return '"id":"' + shape.id + '"'
        + ',"name":"' + shape.name + '"'
        + ',"frame":' + exportFrame(shape.frame)
        + ',"style":' + exportStyle(shape.style)
        + ',"exopt":' + exportExportOptions(shape.exportOptions)
}

export function exportChilds(group: GroupShape, ctx: ExfContext, exporter: (s: Shape) => (s: any, ctx: ExfContext) => string) {
    let ret = '[';
    for (let i = 0, len = group.childsCount; i < len; i++) {
        const shape = group.getChildByIndex(i);
        const exfun = exporter(shape);
        if (i > 0) ret += ',';
        ret += exfun(shape, ctx);
    }
    ret += ']';
    return ret;
}

export function exportShape(shape: Shape) {
    return '{'
        + '"type":"shape",' 
        + exportShapeCommons(shape)
    + '}';
}

export function exportGroupShape(group: GroupShape, ctx: ExfContext) {
    return '{'
        + '"type":"group",' 
        + exportShapeCommons(group)
        + ',"childs":' + exportChilds(group, ctx, shapesExporter)
    + '}';
}

export function exportImageShape(shape: ImageShape, ctx: ExfContext) {
    ctx.exportMedia(shape);
    return '{'
        + '"type":"image",' 
        + exportShapeCommons(shape)
        + ',"ref":' + shape.imageRef
    + '}';
}

export function exportPathShape(shape: PathShape) {
    return '{'
        + '"type":"path"' 
        + ',"path":"' + shape.getPath(true) + '"'
        + ',' + exportShapeCommons(shape)
    + '}';
}

export function exportSymbol(shape: Symbol, ctx: ExfContext) {
    return '{}'
}

export function exportSymbolRef(shape: SymbolRef, ctx: ExfContext) {
    return '{}'
}