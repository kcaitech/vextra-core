import { GroupShape, ImageShape, OverrideType, PathShape, RectShape, Shape, ShapeFrame, SymbolShape, TextShape, VariableType } from "../../../data/shape";
import { renderArtboard as art } from "../../../render";
import { renderGroup as group } from "../../../render";
import { renderBoolOpShape as boolgroup } from "../../../render";
import { renderImage as image } from "../../../render";
import { renderPathShape as path } from "../../../render";
import { renderPathShape as rect } from "../../../render";
import { renderTextShape as text } from "../../../render";
import { renderSymbolRef as symref } from "../../../render";
import { renderSymbol as sym } from "../../../render";
import { renderTable as table } from "../../../render";
import { renderTableCell as cell } from "../../../render";
import { ComType, h } from "./basic";
import { Artboard } from "../../../data/artboard";
import { ShapeType, SymbolRefShape, TableCell, TableShape } from "../../../data/classes";
import {
    ArtboradView, ContactLineView, CutoutShapeView, DViewCtx,
    GroupShapeView, ImageShapeView,
    LineView, PathShapeView, PathShapeView2,
    RectShapeView, SymbolRefView, SymbolView,
    TableCellView, TableView, TextShapeView,
    adapt2Shape, findOverride, findOverrideAndVar, isAdaptedShape
} from "../../../dataview";
import { layoutTable } from "../../../data/tablelayout";
import { TableCellType } from "../../../data/typesdefine";
import { layoutText } from "../../../data/textlayout";

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


function initComsMap(comsMap: Map<ShapeType, any>) {
    comsMap.set(ShapeType.Artboard, ArtboradView);
    comsMap.set(ShapeType.Group, GroupShapeView);
    comsMap.set(ShapeType.Image, ImageShapeView);
    // comsMap.set(ShapeType.Page, ShapeGroup);
    comsMap.set(ShapeType.Path, PathShapeView);
    comsMap.set(ShapeType.Path2, PathShapeView2);
    // comsMap.set(ShapeType.Rectangle, PathShapeDom);
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
}

function makeAdapt(shape: SymbolRefShape, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): { shape: SymbolRefShape, view: SymbolRefView, ctx: DViewCtx } {
    const adaptCtx = new DViewCtx();
    initComsMap(adaptCtx.comsMap);
    const adaptView = new SymbolRefView(adaptCtx, {
        data: shape,
        varsContainer,
        isVirtual: false
    });
    const adapt = adapt2Shape(adaptView) as SymbolRefShape;
    return { shape: adapt, view: adaptView, ctx: adaptCtx };
}

function getRefId2(_this: SymbolRefShape, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    if (_this.isVirtualShape) return _this.refId;
    if (!varsContainer) return _this.refId;
    const _vars = findOverrideAndVar(_this, OverrideType.SymbolID, varsContainer);
    if (!_vars) return _this.refId;
    const _var = _vars[_vars.length - 1];
    if (_var && _var.type === VariableType.SymbolRef) {
        return _var.value;
    }
    return _this.refId;
}

comsMap.set(ShapeType.SymbolRef, (data: Shape,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    const shape = data as SymbolRefShape;
    const symMgr = shape.getSymbolMgr();
    if (!symMgr) return "";
    const refId = getRefId2(shape, varsContainer);
    const sym0 = symMgr.getSync(refId);
    if (!sym0) return "";

    if (shape.isVirtualShape || isAdaptedShape(shape)) {
        symref(h, shape, sym0, comsMap, varsContainer, undefined);
    }

    const adapt = makeAdapt(shape, varsContainer);
    adapt.ctx.layoutAll();
    const ret = symref(h, adapt.shape, sym0, comsMap, varsContainer, undefined);

    adapt.view.destory();
    return ret;
});
comsMap.set(ShapeType.Symbol, (data: Shape,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    return sym(h, data as SymbolShape, comsMap);
});

comsMap.set(ShapeType.Table, (data: Shape,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) => {
    const _table = data as TableShape;
    const cellGetter = (rowIdx: number, colIdx: number) => {
        const cellId = _table.rowHeights[rowIdx].id + "," + _table.colWidths[colIdx].id;
        const _vars = findOverride(cellId, OverrideType.TableCell, varsContainer || []);
        if (_vars && _vars.length > 0) {
            return _vars[_vars.length - 1].value;
        }
        return _table.cells.get(cellId);
    }
    const layout = layoutTable(data as TableShape,  data.frame, cellGetter);
    return table(h, data as TableShape, comsMap, varsContainer, layout, cellGetter);
});

comsMap.set(ShapeType.TableCell, (data: Shape,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, attrs?: any) => {
    const _cell = data as TableCell;
    const frame = attrs.frame as ShapeFrame;
    let layout;
    if (_cell.cellType === TableCellType.Text && _cell.text) {
        layout = layoutText(_cell.text, frame.width, frame.height);
    }
    return cell(h, _cell, frame, "", varsContainer, layout);
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