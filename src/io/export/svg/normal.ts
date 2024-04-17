import { Shape } from "../../../data/shape";
import { ShapeType } from "../../../data/classes";
import {
    ArtboradView, ContactLineView, CutoutShapeView, DViewCtx,
    GroupShapeView, ImageShapeView,
    LineView, PageView, PathShapeView, PathShapeView2,
    RectShapeView, SymbolRefView, SymbolView,
    TableCellView, TableView, TextShapeView
} from "../../../dataview";
import { BoolShapeView } from "../../../dataview/boolshape";
import { DataView } from "../../../dataview/view"

function initComsMap(comsMap: Map<ShapeType, any>) {
    comsMap.set(ShapeType.Artboard, ArtboradView);
    comsMap.set(ShapeType.Group, GroupShapeView);
    comsMap.set(ShapeType.Image, ImageShapeView);
    comsMap.set(ShapeType.BoolShape, BoolShapeView);
    comsMap.set(ShapeType.Path, PathShapeView);
    comsMap.set(ShapeType.Path2, PathShapeView2);
    comsMap.set(ShapeType.Oval, PathShapeView);
    comsMap.set(ShapeType.Text, TextShapeView);
    comsMap.set(ShapeType.Symbol, SymbolView);
    comsMap.set(ShapeType.SymbolUnion, SymbolView);
    comsMap.set(ShapeType.SymbolRef, SymbolRefView);
    comsMap.set(ShapeType.Line, LineView);
    comsMap.set(ShapeType.Table, TableView);
    comsMap.set(ShapeType.Contact, ContactLineView);
    comsMap.set(ShapeType.TableCell, TableCellView);
    comsMap.set(ShapeType.Cutout, CutoutShapeView);
    comsMap.set(ShapeType.Rectangle, RectShapeView);
    comsMap.set(ShapeType.Page, PageView);
}

export function exportSvg(shape: Shape): string {

    const adaptCtx = new DViewCtx();
    initComsMap(adaptCtx.comsMap);

    const ViewClass = adaptCtx.comsMap.get(shape.type);
    if (!ViewClass) throw new Error("export svg, unknow shape type : " + shape.type)
    const view = new ViewClass(adaptCtx, { data: shape }) as DataView;

    adaptCtx.layoutAll();
    view.render();

    const content = view.toSVGString();
    view.destory();
    return content;
}