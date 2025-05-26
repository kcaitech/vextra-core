/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { v4 as uuid } from "uuid";
import { AutoLayout, Page, Artboard, Document, PageListItem, StyleMangerMember, TableShape } from "../../data";
import {
    GroupShape,
    LineShape,
    OvalShape,
    PathShape,
    SymbolShape,
    RectShape,
    Shape,
    TextShape,
    PathSegment,
    CutoutShape,
    SymbolUnionShape,
    BoolShape,
    PolygonShape,
    StarShape,
    ShapeSize,
    Transform,
    ContactShape
} from "../../data";
import * as types from "../../data/typesdefine"
import {
    importArtboard,
    importGroupShape,
    importPage,
    importText,
    importTextShape, importBoolShape
} from "../../data/baseimport";
import template_group_shape from "../template/group-shape.json";
import template_bool_shape from "../template/bool-shape.json";
import template_page from "../template/page.json";
import template_artboard from "../template/artboard.json"
import template_text_shape from "../template/text-shape.json"
import {
    Border,
    Color,
    CurveMode,
    CurvePoint,
    Ellipse,
    Fill,
    FillType,
    Para,
    ParaAttr,
    ShapeFrame,
    Span,
    Style,
    Text,
    UserInfo,
    Shadow,
    BorderStyle,
    SymbolRefShape,
    TextAttr,
} from "../../data";
import { BasicArray, BasicMap } from "../../data";
import { TransactDataGuard } from "../../data";
import { Comment } from "../../data";
import { ResourceMgr } from "../../data";
import { TableShape2 } from "../../data";

export { newText, newText2 } from "../../data/text/textutils";
import {
    BorderSideSetting,
    ContactForm,
    CrdtNumber,
    ExportFileFormat,
    ExportFormat,
    ExportFormatNameingScheme,
    ExportOptions,
    ExportVisibleScaleType,
    SideType
} from "../../data";
import { ResizingConstraints2 } from "../../data";
import { SymbolMgr } from "../../data/symbolmgr";
import { newText } from "../../data/text/textutils";
import { getPolygonPoints, getPolygonVertices } from "../utils/path";
import { is_mac } from "../../data/utils";
import { Path } from "@kcdesign/path";
import { convertPath2CurvePoints } from "../../data/pathconvert";

function _checkNum(num: number) {
    if (Number.isNaN(num) || (!Number.isFinite(num))) throw new Error(String(num));
}

function _checkFrame(frame: ShapeSize) {
    if (frame.width === 0 || frame.height === 0) throw new Error();
    _checkNum(frame.width);
    _checkNum(frame.height);
}

export function addCommonAttr(shape: Shape) {
    const transform2 = (shape.transform);
    transform2.setRotateZ(0);
    // updateShapeTransform1By2(shape.transform, transform2);
    shape.isVisible = true;
    shape.isLocked = false;
    shape.constrainerProportions = false;
    shape.nameIsFixed = false;
    shape.resizingConstraint = ResizingConstraints2.Default;
}

export function newDocument(documentName: string, repo: TransactDataGuard): Document {
    const dId = uuid();
    const pageList = new BasicArray<PageListItem>();
    return new Document(dId, documentName, repo, { pageList });
}

export function newPage(name: string): Page {
    template_page.id = uuid();
    template_page.name = name;
    const page = importPage(template_page as types.Page)
    page.backgroundColor = new Color(1, 239, 239, 239);
    return page;
}

export function newGroupShape(name: string, style?: Style): GroupShape {
    template_group_shape.id = uuid();
    template_group_shape.name = name // i18n
    const group = importGroupShape(template_group_shape as types.GroupShape);
    if (style) group.style = style;
    addCommonAttr(group);
    return group;
}

export function newBoolShape(name: string, style?: Style): BoolShape {
    template_bool_shape.id = uuid();
    template_bool_shape.name = name // i18n
    const group = importBoolShape(template_bool_shape as types.BoolShape);
    if (style) group.style = style;
    addCommonAttr(group);
    return group;
}

export function newSolidColorFill(fillColor = new Color(1, 216, 216, 216)): Fill {
    return new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, fillColor);
}

export function newStyle(styleMgr: ResourceMgr<StyleMangerMember>): Style {
    const fill = newSolidColorFill();
    const fills = new BasicArray<Fill>();
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(fills, new BasicArray<Shadow>(), border);
    style.setStylesMgr(styleMgr);
    style.fills.push(fill);
    return style;
}

export function newFlatStyle(styleMgr: ResourceMgr<StyleMangerMember>): Style {
    const fills = new BasicArray<Fill>();
    const shadows = new BasicArray<Shadow>();
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(fills, shadows, border);
    style.setStylesMgr(styleMgr)
    return style;
}

export function newArtboard(name: string, frame: ShapeFrame, styleMgr: ResourceMgr<StyleMangerMember>, fill?: Fill): Artboard {
    _checkFrame(frame);
    template_artboard.id = uuid();
    template_artboard.name = name;
    const size = new ShapeSize(frame.width, frame.height);
    const trans = new Transform();
    trans.m02 = frame.x;
    trans.m12 = frame.y;
    template_artboard.size = size;
    template_artboard.transform = trans;

    const artboard = importArtboard(template_artboard as types.Artboard);
    artboard.style.setStylesMgr(styleMgr);
    if (fill) {
        artboard.style.fills.push(fill);
    }

    addCommonAttr(artboard);

    artboard.fixedRadius = 0;

    return artboard
}

export function newArtboard2(name: string, frame: ShapeFrame): Artboard {
    _checkFrame(frame);
    template_artboard.id = uuid();
    template_artboard.name = name;

    template_artboard.transform.m02 = frame.x;
    template_artboard.transform.m12 = frame.y;
    template_artboard.size.width = frame.width;
    template_artboard.size.height = frame.height;

    const artboard = importArtboard(template_artboard as types.Artboard);

    const fillColor = new Color(1, 255, 255, 255);
    const fill = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, fillColor);
    artboard.style.fills.push(fill);

    addCommonAttr(artboard);

    artboard.fixedRadius = 0;

    return artboard
}

export function newAutoLayoutArtboard(name: string, frame: ShapeFrame, autoLayout: AutoLayout): Artboard {
    _checkFrame(frame);
    template_artboard.id = uuid();
    template_artboard.name = name;

    template_artboard.transform.m02 = frame.x;
    template_artboard.transform.m12 = frame.y;
    template_artboard.size.width = frame.width;
    template_artboard.size.height = frame.height;

    const artboard = importArtboard(template_artboard as types.Artboard);
    artboard.autoLayout = autoLayout;
    addCommonAttr(artboard);

    artboard.fixedRadius = 0;

    return artboard
}

export function newPathShape(name: string, frame: ShapeFrame, path: Path, styleMgr: ResourceMgr<StyleMangerMember>, style?: Style): PathShape {
    frame.width = frame.width || 1;
    frame.height = frame.height || 1;

    style = style || newStyle(styleMgr);
    const id = uuid();
    const segs = convertPath2CurvePoints(path, frame.width, frame.height);
    const pathsegs = new BasicArray<PathSegment>();
    segs.forEach((seg, i) => {
        const points = seg.points;
        const isClosed = seg.isClosed || false;
        const curvePoint = new BasicArray<CurvePoint>(...points);
        pathsegs.push(new PathSegment([i] as BasicArray<number>, uuid(), curvePoint, isClosed))
    })

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);
    const shape = new PathShape(new BasicArray(), id, name, types.ShapeType.Path, transform, style, size, pathsegs);
    addCommonAttr(shape);
    return shape;
}

export function newRectShape(name: string, frame: ShapeFrame, styleMgr: ResourceMgr<StyleMangerMember>): RectShape {
    _checkFrame(frame);
    const style = newStyle(styleMgr);
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb
    curvePoint.push(p1, p2, p3, p4);

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, true);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const shape = new RectShape(new BasicArray(), id, name, types.ShapeType.Rectangle, transform, style, size, new BasicArray<PathSegment>(segment));
    addCommonAttr(shape);
    return shape;
}

// 三次贝塞尔曲线绘制椭圆
export function newOvalShape(name: string, frame: ShapeFrame, styleMgr: ResourceMgr<StyleMangerMember>): OvalShape {
    _checkFrame(frame);
    const style = newStyle(styleMgr);
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const ellipse = new Ellipse(0, 0, 0, 0);

    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0.5, 1, CurveMode.Mirrored);
    p1.hasFrom = true;
    p1.hasTo = true;
    p1.fromX = 0.775892388889507;
    p1.fromY = 1;
    p1.toX = 0.224107611110493;
    p1.toY = 1;

    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0.5, CurveMode.Mirrored);
    p2.hasFrom = true;
    p2.hasTo = true;
    p2.fromX = 1;
    p2.fromY = 0.224107611110493;
    p2.toX = 1;
    p2.toY = 0.775892388889507;

    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 0.5, 0, CurveMode.Mirrored);
    p3.hasFrom = true;
    p3.hasTo = true;
    p3.fromX = 0.224107611110493;
    p3.fromY = 0;
    p3.toX = 0.775892388889507;
    p3.toY = 0;

    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 0.5, CurveMode.Mirrored);
    p4.hasFrom = true;
    p4.hasTo = true;
    p4.fromX = 0;
    p4.fromY = 0.775892388889507;
    p4.toX = 0;
    p4.toY = 0.224107611110493;

    curvePoint.push(p1, p2, p3, p4);

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, true);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const shape = new OvalShape([0] as BasicArray<number>, id, name, types.ShapeType.Oval, transform, style, size, new BasicArray<PathSegment>(segment), ellipse);

    addCommonAttr(shape);
    return shape;
}

// 多边形--默认三条边
export function newPolygonShape(name: string, frame: ShapeFrame, styleMgr: ResourceMgr<StyleMangerMember>): PolygonShape {
    _checkFrame(frame);
    const style = newStyle(styleMgr);
    const id = uuid();
    const vertices = getPolygonVertices(3);
    const curvePoint = getPolygonPoints(vertices);
    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, true);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const shape = new PolygonShape(new BasicArray(), id, name, types.ShapeType.Polygon, transform, style, size, new BasicArray<PathSegment>(segment), 3);
    addCommonAttr(shape);
    return shape;
}

// 五角星
export function newStellateShape(name: string, frame: ShapeFrame, styleMgr: ResourceMgr<StyleMangerMember>): StarShape {
    _checkFrame(frame);
    const style = newStyle(styleMgr);
    const vertices = getPolygonVertices(10, 0.382);
    const id = uuid();
    const curvePoint = getPolygonPoints(vertices);
    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, true);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const shape = new StarShape(new BasicArray(), id, name, types.ShapeType.Star, transform, style, size, new BasicArray<PathSegment>(segment), 5, 0.382);
    addCommonAttr(shape);
    return shape;
}

export function newLineShape(name: string, frame: ShapeFrame, styleMgr: ResourceMgr<StyleMangerMember>): LineShape {
    _checkFrame(frame);
    const style = newFlatStyle(styleMgr);
    const sPoint = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0.5, CurveMode.Straight);
    const ePoint = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0.5, CurveMode.Straight);
    frame.height = 1;

    const curvePoint = new BasicArray<CurvePoint>(sPoint, ePoint);
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const strokePaint = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(1, 0, 0, 0))
    strokePaints.push(strokePaint);
    style.borders = new Border(types.BorderPosition.Center, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, false);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const shape = new LineShape(new BasicArray(), uuid(), name, types.ShapeType.Line, transform, style, size, new BasicArray<PathSegment>(segment));
    addCommonAttr(shape);
    return shape;
}

export function newArrowShape(name: string, frame: ShapeFrame, styleMgr: ResourceMgr<StyleMangerMember>): LineShape {
    _checkFrame(frame);
    const style = newFlatStyle(styleMgr);
    style.endMarkerType = types.MarkerType.OpenArrow;
    const sPoint = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0.5, CurveMode.Straight);
    const ePoint = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0.5, CurveMode.Straight);
    frame.height = 1;
    const curvePoint = new BasicArray<CurvePoint>(sPoint, ePoint);
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const strokePaint = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(1, 0, 0, 0))
    strokePaints.push(strokePaint);
    style.borders = new Border(types.BorderPosition.Center, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, false);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const shape = new LineShape(new BasicArray(), uuid(), name, types.ShapeType.Line, transform, style, size, new BasicArray<PathSegment>(segment));
    addCommonAttr(shape);
    return shape;
}

// 后续需要传入字体、字号、颜色信息
export function newDefaultTextShape(name: string, styleMgr: ResourceMgr<StyleMangerMember>, attr: TextAttr, frame?: ShapeFrame): TextShape {
    frame && _checkFrame(frame);
    template_text_shape.id = uuid();
    template_text_shape.name = name;
    // 后续需要传入字体、字号、颜色信息
    const textshape: TextShape = importTextShape(template_text_shape as types.TextShape);
    if (frame) {
        textshape.transform.m02 = frame.x;
        textshape.transform.m12 = frame.y;
        textshape.size.width = frame.width;
        textshape.size.height = frame.height;
    }
    textshape.style = newFlatStyle(styleMgr);
    textshape.text = newText(attr);
    textshape.text.setStylesMgr(styleMgr)
    addCommonAttr(textshape);
    return textshape;
}

export function newTextShape(name: string, styleMgr: ResourceMgr<StyleMangerMember>, frame?: ShapeFrame): TextShape {
    frame && _checkFrame(frame);
    template_text_shape.id = uuid();
    template_text_shape.name = name;
    // 后续需要传入字体、字号、颜色信息
    const textshape: TextShape = importTextShape(template_text_shape as types.TextShape);
    if (frame) {
        textshape.transform.m02 = frame.x;
        textshape.transform.m12 = frame.y;
        textshape.size.width = frame.width;
        textshape.size.height = frame.height;
    }
    textshape.style = newFlatStyle(styleMgr);
    addCommonAttr(textshape);
    return textshape;
}

export function newTextShapeByText(name: string, text: types.Text): TextShape {
    template_text_shape.id = uuid();
    template_text_shape.name = name;
    const textshape: TextShape = importTextShape(template_text_shape as types.TextShape);
    textshape.text.insertFormatText(importText(text), 0);
    addCommonAttr(textshape);
    return textshape;
}

export function newImageFillShape(name: string, frame: ShapeFrame, mediasMgr: ResourceMgr<{
    buff: Uint8Array,
    base64: string
}>, originFrame: { width: number, height: number }, styleMgr: ResourceMgr<StyleMangerMember>, ref?: string): RectShape {
    _checkFrame(frame);
    const style = newStyle(styleMgr);
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb
    curvePoint.push(p1, p2, p3, p4);

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, true);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const shape = new RectShape(new BasicArray(), id, name, types.ShapeType.Rectangle, transform, style, size, new BasicArray<PathSegment>(segment));
    addCommonAttr(shape);
    const fillColor = new Color(1, 216, 216, 216);
    const fill = new Fill([0] as BasicArray<number>, uuid(), true, FillType.Pattern, fillColor);
    fill.imageRef = ref;
    fill.originalImageWidth = originFrame.width;
    fill.originalImageHeight = originFrame.height;
    fill.imageScaleMode = types.ImageScaleMode.Fill;
    fill.setImageMgr(mediasMgr);
    const fills = new BasicArray<Fill>();
    fills.push(fill);

    shape.style.fills = fills;
    return shape;
}

export function newTable(name: string, frame: ShapeFrame, rowCount: number, columCount: number, mediasMgr: ResourceMgr<{
    buff: Uint8Array,
    base64: string
}>, styleMgr: ResourceMgr<StyleMangerMember>): TableShape {
    _checkFrame(frame);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const table = new TableShape(
        new BasicArray(),
        uuid(),
        name,
        types.ShapeType.Table,
        transform,
        newStyle(styleMgr),
        size,
        new BasicMap(),
        new BasicArray(),
        new BasicArray());// importTableShape(template_table_shape as types.TableShape);
    // 行高
    for (let ri = 0; ri < rowCount; ri++) {
        table.rowHeights.push(new CrdtNumber(uuid(), [ri] as BasicArray<number>, 1));
    }
    // 列宽
    for (let ci = 0; ci < columCount; ci++) {
        table.colWidths.push(new CrdtNumber(uuid(), [ci] as BasicArray<number>, 1));
    }
    // table.updateTotalWeights();

    table.transform.m02 = frame.x;
    table.transform.m12 = frame.y;
    table.size.width = frame.width;
    table.size.height = frame.height;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const strokePaint = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(0.5, 0, 0, 0))
    strokePaints.push(strokePaint);
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    table.style.borders = border;

    addCommonAttr(table)
    const fillColor = new Color(1, 255, 255, 255);
    const fill = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, fillColor);
    const fills = new BasicArray<Fill>();
    fills.push(fill);
    table.style.fills = fills;
    table.setImageMgr(mediasMgr);
    return table;
}

export function newTable2(name: string, frame: ShapeFrame, rowCount: number, columCount: number, mediasMgr: ResourceMgr<{
    buff: Uint8Array,
    base64: string
}>, styleMgr: ResourceMgr<StyleMangerMember>): TableShape2 {
    _checkFrame(frame);
    // template_table_shape.id = uuid();
    // template_table_shape.name = name // i18n
    // template_table_shape.rowHeights.length = 0;
    // template_table_shape.colWidths.length = 0;

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const table = new TableShape2(
        new BasicArray(),
        uuid(),
        name,
        types.ShapeType.Table2,
        transform,
        newStyle(styleMgr),
        size,
        new BasicMap(),
        new BasicMap(),
        new BasicArray(),
        new BasicArray());// importTableShape(template_table_shape as types.TableShape);
    // 行高
    for (let ri = 0; ri < rowCount; ri++) {
        table.rowHeights.push(new CrdtNumber(uuid(), [ri] as BasicArray<number>, 1));
    }
    // 列宽
    for (let ci = 0; ci < columCount; ci++) {
        table.colWidths.push(new CrdtNumber(uuid(), [ci] as BasicArray<number>, 1));
    }
    // table.updateTotalWeights();

    table.transform.m02 = frame.x;
    table.transform.m12 = frame.y;
    table.size.width = frame.width;
    table.size.height = frame.height;
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const strokePaint = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(0.5, 0, 0, 0))
    strokePaints.push(strokePaint);
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    table.style.borders = border;

    addCommonAttr(table)
    const fillColor = new Color(1, 255, 255, 255);
    const fill = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, fillColor);
    const fills = new BasicArray<Fill>();
    fills.push(fill);
    table.style.fills = fills;
    // table.setImageMgr(mediasMgr);
    return table;
}

export function newContact(name: string, frame: ShapeFrame, styleMgr: ResourceMgr<StyleMangerMember>, apex?: ContactForm): ContactShape {
    _checkFrame(frame);
    const style = newFlatStyle(styleMgr);

    style.endMarkerType = types.MarkerType.OpenArrow;

    const sPoint = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight);
    const ePoint = new CurvePoint([1] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight);
    const curvePoint = new BasicArray<CurvePoint>(sPoint, ePoint);
    const side = new BorderSideSetting(SideType.Normal, 2, 2, 2, 2);
    const strokePaints = new BasicArray<Fill>();
    const strokePaint = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(1, 128, 128, 128))
    strokePaints.push(strokePaint);
    style.borders = new Border(types.BorderPosition.Center, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);

    const text = new Text(new BasicArray());
    const para = new Para('添加文本\n', new BasicArray());
    para.attr = new ParaAttr();
    para.attr.autoLineHeight = true;
    text.paras.push(para);
    const span = new Span(para.length);
    span.fontName = is_mac() ? "PingFang SC" : "微软雅黑";
    span.fontSize = 14;
    span.color = new Color(0.85, 0, 0, 0);
    para.spans.push(span);
    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, false);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const shape = new ContactShape(new BasicArray(), uuid(), name, types.ShapeType.Contact, transform, style, size, new BasicArray<PathSegment>(segment), false, text, false);

    shape.from = apex;
    shape.to = undefined;

    shape.fixedRadius = 12;

    addCommonAttr(shape);

    return shape;
}

export function newCutoutShape(name: string, frame: ShapeFrame): CutoutShape {
    _checkFrame(frame);
    const fills = new BasicArray<Fill>();
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    const strokePaints = new BasicArray<Fill>();
    const border = new Border(types.BorderPosition.Inner, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
    const style = new Style(fills, new BasicArray<Shadow>(), border);
    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb
    const p5 = new CurvePoint([4] as BasicArray<number>, uuid(), 0, 0.00001, CurveMode.Straight); // lt
    curvePoint.push(p1, p2, p3, p4, p5);
    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, true);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);
    const exportOptions = new ExportOptions(new BasicArray(), 0, false, false, false, false);
    const exportFormat = new ExportFormat(new BasicArray(), uuid(), 0, ExportFileFormat.Png, '', ExportFormatNameingScheme.Prefix, 1, ExportVisibleScaleType.Scale)
    exportOptions.exportFormats.push(exportFormat);
    const shape = new CutoutShape(new BasicArray(), id, name, types.ShapeType.Cutout, transform, style, size, new BasicArray<PathSegment>(segment));
    shape.exportOptions = exportOptions;
    addCommonAttr(shape);
    return shape;
}

export function newSymbolShape(name: string, frame: ShapeFrame, styleMgr: ResourceMgr<StyleMangerMember>, style?: Style): SymbolShape {
    _checkFrame(frame);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const compo = new SymbolShape(
        new BasicArray(),
        uuid(),
        name,
        types.ShapeType.Symbol,
        transform,
        newFlatStyle(styleMgr),
        new BasicArray(),
        size,
        new BasicMap(),
    );
    if (style) compo.style = style;
    addCommonAttr(compo);
    return compo;
}

export function newSymbolShapeUnion(name: string, frame: ShapeFrame, styleMgr: ResourceMgr<StyleMangerMember>): SymbolUnionShape {
    _checkFrame(frame);
    const style = newFlatStyle(styleMgr);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const union = new SymbolUnionShape(
        new BasicArray(),
        uuid(),
        name,
        types.ShapeType.SymbolUnion,
        transform,
        style,
        new BasicArray(),
        size,
        new BasicMap(),
        // createNormalPoints()
    );
    addCommonAttr(union);
    return union;
}

export function newSymbolRefShape(name: string, frame: ShapeFrame, refId: string, symbol_mgr: SymbolMgr, styleMgr: ResourceMgr<StyleMangerMember>): SymbolRefShape {
    _checkFrame(frame);

    const transform = new Transform();
    transform.m02 = frame.x;
    transform.m12 = frame.y;
    const size = new ShapeSize(frame.width, frame.height);

    const ref = new SymbolRefShape(new BasicArray(), uuid(), name, types.ShapeType.SymbolRef, transform, newFlatStyle(styleMgr), size, refId, new BasicMap());
    addCommonAttr(ref);
    ref.setSymbolMgr(symbol_mgr);
    return ref;
}

/**
 * @description 将SVG中的<polygon />、<polyline />中的points属性值转换为Path的d属性值
 * @param pointsString <polygon />、<polyline />中的points属性值
 * @param isLine 元素为<polyline />，否则为<polygon />
 */
export function polylinePointsToPathD(pointsString: string, isLine: boolean) {
    const regex = /(-?\d*\.?\d+)[,\s]+(-?\d*\.?\d+)/g;
    const points = [];
    let match;
    while ((match = regex.exec(pointsString)) !== null) {
        points.push([parseFloat(match[1]), parseFloat(match[2])]);
    }

    // 两点成线，三点成面，所以当为多边形时，points长度一定要大于2，为折线时，一定要大于1
    if (!Array.isArray(points) || (!isLine && points.length < 3) || (points.length < 2)) {
        return '';
    }

    let pathD = 'M' + points[0][0] + ',' + points[0][1];

    for (let i = 1; i < points.length; i++) {
        pathD += ' L' + points[i][0] + ',' + points[i][1];
    }

    if (!isLine) {
        pathD += ' Z';
    }

    return pathD;
}

export function getTransformByEnv(env: GroupShape) {
    const result = { flipH: false, flipV: false, rotation: 0 };

    // flip
    let ohflip = false;
    let ovflip = false;

    // todo flip
    // let p: Shape | undefined = env;
    // while (p) {
    //     if (p.isFlippedHorizontal) {
    //         ohflip = !ohflip;
    //     }
    //     if (p.isFlippedVertical) {
    //         ovflip = !ovflip;
    //     }
    //     p = p.parent;
    // }

    result.flipH = ohflip;
    result.flipV = ovflip;

    // rotate
    const pm = env.matrix2Root();
    const pminverse = pm.inverse;

    const m = (pminverse);

    let sina = m.m10;
    let cosa = m.m00;

    if (result.flipH) sina = -sina;
    if (result.flipV) cosa = -cosa;

    let rotate = Math.asin(sina);

    if (cosa < 0) {
        if (sina > 0) rotate = Math.PI - rotate;
        else if (sina < 0) rotate = -Math.PI - rotate;
        else rotate = Math.PI;
    }

    if (!Number.isNaN(rotate)) {
        result.rotation = (rotate / (2 * Math.PI) * 360) % 360;
    }

    return result;
}

export function modifyTransformByEnv(shape: Shape, env: GroupShape) {
    const transform = getTransformByEnv(env);

    const transform2 = (shape.transform);
    const center = shape.matrix2Parent().computeCoord2(shape.size.width / 2, shape.size.height / 2);
    if (transform.flipH) transform2.flipHoriz(center.x);
    if (transform.flipV) transform2.flipVert(center.y);

    let r = transform.rotation;

    if (transform.flipH) {
        r = r - 180;
    }
    if (transform.flipV) {
        r = r - 180;
    }

    transform2.setRotateZ((r % 360) / 180 * Math.PI);

    // updateShapeTransform1By2(shape.transform, transform2);
}