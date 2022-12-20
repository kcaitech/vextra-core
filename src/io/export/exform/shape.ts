import { GroupShape, ImageShape, Shape, ShapeType } from "@/data/shape";
import { exportExportOptions, exportFrame } from "./common";
import { exportStyle } from "./style";

export function shapesExporter(shape: Shape) {
    switch (shape.type) {
        case ShapeType.Artboard:
        case ShapeType.Boolean:
        case ShapeType.Page:
            throw new Error("wrong shape type.")
        case ShapeType.Group: return exportGroupShape;
        case ShapeType.Image: return exportImage;
        case ShapeType.Oval:
        case ShapeType.Path:
        case ShapeType.Polygon:
        case ShapeType.Rectangle:
        case ShapeType.ShapeGroup:
        case ShapeType.Star:
        case ShapeType.Symbol:
        case ShapeType.SymbolRef:
        case ShapeType.Text:
        case ShapeType.Triangle: return exportShape;
    }
}

export function exportShapeCommons(shape: Shape) {
    return '"id":' + shape.id
        + ',"name":' + shape.name
        + ',"frame":' + exportFrame(shape.frame)
        + ',"style":' + exportStyle(shape.style)
        + ',"exopt":' + exportExportOptions(shape.exportOptions)
}

export function exportChilds(group: GroupShape, exporter: (s: Shape) => Function) {
    let ret = '[';
    for (let i = 0, len = group.childsCount; i < len; i++) {
        const ex = exporter(group.getChildByIndex(i));
        if (i > 0) ret += ',';
        ret += ex();
    }
    ret += ']';
    return ret;
}

export function exportShape(shape: Shape) {
    return '{'
        + '"type":shape,' 
        + exportShapeCommons(shape)
    + '}';
}

export function exportGroupShape(group: GroupShape) {

}

export function exportImage(image: ImageShape) {

}