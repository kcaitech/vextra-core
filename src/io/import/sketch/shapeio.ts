/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    BoolShape, CurveMode, CurvePoint, ExportFormat, ExportOptions, GroupShape, TextShape, Variable,
    OverrideType, PathSegment, PathShape, RectShape, Shape, SymbolShape, VariableType, CornerRadius,
    string2Text
} from "../../../data";
import { importColor, importStyle, importXY } from "./styleio";
import { importText } from "./textio";
import {
    BoolOp, Border, Color, ExportFormatNameingScheme, ExportVisibleScaleType, Fill, BasicArray, BasicMap, Artboard,
    FillType, ImageScaleMode, Point2D, ShapeSize, ShapeType, SymbolRefShape, TextBehaviour, Transform, Text, Page
} from "../../../data"
import { IJSON, ImportFun, LoadContext } from "./basic";
import { uuid } from "../../../basic/uuid";
import { ResizingConstraints2 } from "../../../data";
import { float_accuracy } from "../../../basic/consts";
import { Matrix } from "../../../basic/matrix";
import { v4 } from "uuid";

function uniqueId(ctx: LoadContext, id: string): string {
    // if (ctx.shapeIds.has(id)) id = uuid();
    // ctx.shapeIds.add(id);
    return id;
}
function importExportFormats(data: IJSON): BasicArray<ExportFormat> {
    return (data['exportFormats'] || []).map((d: IJSON, i: number) => {
        const absoluteSize = d['absoluteSize'];
        const fileFormat = d['fileFormat'];
        const name = d['name'];
        const namingScheme = ((t) => {
            switch (t) {
                case 0: return ExportFormatNameingScheme.Prefix;
                case 1: return ExportFormatNameingScheme.Suffix;
                default: return ExportFormatNameingScheme.Prefix;
            }
        })(d['namingScheme']);
        const scale = d['scale'];
        const visibleScaleType = ((t) => {
            switch (t) {
                case 0: return ExportVisibleScaleType.Scale;
                case 1: return ExportVisibleScaleType.Width;
                case 2: return ExportVisibleScaleType.Height;
                default: return ExportVisibleScaleType.Scale;
            }
        })(d['visibleScaleType']);
        return new ExportFormat([i], uuid(), absoluteSize, fileFormat, name, namingScheme, scale, visibleScaleType);
    })
}
function importExportOptions(data: IJSON): ExportOptions {
    const d: IJSON = data['exportOptions'];
    if (!d) {
        return new ExportOptions(
            new BasicArray<ExportFormat>(),
            0,
            false, false, false, false)
    }
    const formats = importExportFormats(d);
    const trim = d['shouldTrim'] || false;
    return new ExportOptions(formats, 0, trim, false, false, false)
}

function importShapeFrame(data: IJSON) {
    const d: IJSON = data['frame'];
    const x = d['x'];
    const y = d['y'];
    const width = d['width'];
    const height = d['height'];
    const isFlippedHorizontal: boolean = data['isFlippedHorizontal'];
    const isFlippedVertical: boolean = data['isFlippedVertical'];
    const rotation: number = -data['rotation'];

    // to transform
    const size = new ShapeSize(width, height);
    if (!isFlippedHorizontal && !isFlippedVertical && !rotation) {
        return { size, trans: new Transform(1, 0, x, 0, 1, y) }
    }
    const m = new Matrix();
    const cx = width / 2;
    const cy = height / 2;
    m.trans(-cx, -cy);
    if (rotation) m.rotate(rotation / 360 * 2 * Math.PI);
    if (isFlippedHorizontal) m.flipHoriz();
    if (isFlippedVertical) m.flipVert();
    m.trans(cx, cy);
    m.trans(x, y);
    return { size, trans: new Transform(m.m00, m.m01, m.m02, m.m10, m.m11, m.m12) }
}

function importBoolOp(shape: Shape, data: IJSON) {
    const op = [BoolOp.Union, BoolOp.Subtract, BoolOp.Intersect, BoolOp.Diff][data['booleanOperation']];
    if (op) shape.boolOp = op;
}

function importPoints(data: IJSON): CurvePoint[] {
    return (data['points'] || []).map((d: IJSON, i: number) => {
        const cornerRadius: number = d['cornerRadius'];
        const curveFrom: Point2D = importXY(d['curveFrom']);
        const curveMode: CurveMode = ((t) => {
            return [CurveMode.None, CurveMode.Straight, CurveMode.Mirrored, CurveMode.Asymmetric, CurveMode.Disconnected][t] ?? CurveMode.None;
        })(d['curveMode']);
        const curveTo: Point2D = importXY(d['curveTo']);
        const hasCurveFrom: boolean = d['hasCurveFrom'];
        const hasCurveTo: boolean = d['hasCurveTo'];
        const point: Point2D = importXY(d['point']);
        const p = new CurvePoint([i], uuid(), point.x, point.y, curveMode);
        if (hasCurveFrom) {
            if (Math.abs(curveFrom.x - p.x) > float_accuracy || Math.abs(curveFrom.y - p.y) > float_accuracy) {
                p.hasFrom = true;
                p.fromX = curveFrom.x;
                p.fromY = curveFrom.y;
            }
        }
        if (hasCurveTo) {
            if (Math.abs(curveTo.x - p.x) > float_accuracy || Math.abs(curveTo.y - p.y) > float_accuracy) {
                p.hasTo = true;
                p.toX = curveTo.x;
                p.toY = curveTo.y;
            }
        }

        if (!p.hasTo && !p.hasFrom) {
            p.mode = CurveMode.Straight;
        } else if (!p.hasTo || !p.hasFrom) {
            p.mode = CurveMode.Disconnected;
        }

        p.radius = cornerRadius;
        return p;
    });
}

function _createVar4Override(type: OverrideType, value: any) {
    switch (type) {
        case OverrideType.Borders:
            return new Variable(uuid(), VariableType.Borders, "", value);
        case OverrideType.Fills:
            return new Variable(uuid(), VariableType.Fills, "", value);
        case OverrideType.Image:
            return new Variable(uuid(), VariableType.ImageRef, "", value);
        case OverrideType.Text:
            return new Variable(uuid(), VariableType.Text, "", string2Text(value as string));
        case OverrideType.Visible:
            return new Variable(uuid(), VariableType.Visible, "", value);
        case OverrideType.Lock:
            return new Variable(uuid(), VariableType.Lock, "", value);
        case OverrideType.SymbolID:
            return new Variable(uuid(), VariableType.SymbolRef, "", value);
        case OverrideType.EndMarkerType:
            return new Variable(uuid(), VariableType.MarkerType, "", value);
        case OverrideType.StartMarkerType:
            return new Variable(uuid(), VariableType.MarkerType, "", value);
        case OverrideType.ContextSettings:
            return new Variable(uuid(), VariableType.ContextSettings, "", value);
        case OverrideType.Shadows:
            return new Variable(uuid(), VariableType.Shadows, "", value);
        case OverrideType.AutoLayout:
            return new Variable(uuid(), VariableType.AutoLayout, "", value);
        default:
            // throw new Error("unknow override type: " + type)
            console.error("unknow override: " + type, value)
    }
}

function _importOverrides(shape: SymbolRefShape, refId: string, type: OverrideType, value: any) {

    refId = refId + '/' + type; // genRefId(refId, type); // id+type->var

    const v = _createVar4Override(type, value);
    if (!v) return;

    if (!shape.variables) shape.variables = new BasicMap<string, Variable>();
    shape.variables.set(v.id, v);

    if (!shape.overrides) shape.overrides = new BasicMap<string, string>();
    shape.overrides.set(refId, v.id);
}

function importOverrides(shape: SymbolRefShape, data: IJSON[]) {
    // console.log(data)
    for (let i = 0, len = data.length; i < len; i++) {
        const override = data[i];
        // "0E2D5DC1-524E-4198-AA15-E88DC8C4A8C0_stringValue" -> string
        // "1F0F8091-1390-46BB-B3B2-BF697DF68454_layerStyle" -> sharedStyleID
        const name = override['overrideName'];
        // "2A327495-1793-4570-BC24-1429F142D09C"
        const value = override['value'];
        const _idx = name.indexOf('_');
        const id = name.substring(0, _idx);
        let attr = name.substring(_idx + 1);
        if (attr === 'stringValue') attr = 'text'
        _importOverrides(shape, id, attr, value);
    }
}

function importShapePropertys(shape: Shape, data: IJSON) {
    // shape.isFlippedHorizontal = data['isFlippedHorizontal'];
    // shape.isFlippedVertical = data['isFlippedVertical'];
    // shape.rotation = -data['rotation'];
    const resizingConstraint = data['resizingConstraint'];
    if (resizingConstraint) {
        if ([63, 18, 27].includes(resizingConstraint)) shape.resizingConstraint = 0; // 额外约束值
        else shape.resizingConstraint = (~resizingConstraint) & ResizingConstraints2.Mask;
    }
    shape.isVisible = data['isVisible'];
    shape.isLocked = data['isLocked'];
    shape.constrainerProportions = data.frame['constrainerProportions'];
}

const hasFill = (fills: Fill[]) => {
    if (fills.length === 0) return false;
    return fills.some(f => f.isEnabled);
}
const hasBorder = (strokePaint: Fill[]) => {
    if (strokePaint.length === 0) return false;
    return strokePaint.some(b => b.isEnabled);
}

export function importArtboard(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): Artboard {
    const id: string = uniqueId(ctx, data['do_objectID']);
    const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const style = importStyle(ctx, data['style']);
    // if (data['sharedStyleID']) {
    //     env.styleMgr.addShared(data['sharedStyleID'], style);
    // }
    const hasBackgroundColor: boolean = data['hasBackgroundColor'];
    const backgroundColor: Color | undefined = data['backgroundColor'] && importColor(data['backgroundColor']);

    if (data['_class'] === ShapeType.Artboard && hasBackgroundColor && backgroundColor) {
        const fill = new Fill([0], uuid(), true, FillType.SolidColor, backgroundColor);
        style.fills.length = 0;
        style.fills.push(fill);
    }

    const childs = (data['layers'] || []).map((d: IJSON, i: number) => f(ctx, d, i));
    // const shapes = new BasicArray<Shape>(...addMaskRect(childs, ctx, data['layers'] || []));
    const shape = new Artboard([i], id, name, ShapeType.Artboard, frame.trans, style, new BasicArray<Shape>(...childs), frame.size);
    shape['frameMaskDisabled'] = false;
    childs.length && determineAsContainerRadiusShape(shape, childs);

    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    shape.mask = data['hasClippingMask'];
    return shape;
}

export function importGroupShape(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): GroupShape {
    if (data['hasBackgroundColor'] || data['backgroundColor']) {
        return importArtboard(ctx, data, f, i);
    }
    // const type = importShapeType(data);
    const id: string = uniqueId(ctx, data['do_objectID']);
    const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(ctx, data['style']);
    // sketch groupshape不支持填充与边框
    // style.fills.length = 0;
    // style.borders.length = 0;
    if (data['sharedStyleID']) {
        // env.styleMgr.addShared(data['sharedStyleID'], style);
    }
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON, i: number) => f(ctx, d, i));
    const shapes = new BasicArray<Shape>(...addMaskRect(childs, ctx, data['layers'] || []));
    const shape = new GroupShape([i], id, name, ShapeType.Group, frame.trans, style, shapes);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importShapeGroupShape(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): GroupShape {
    // const type = importShapeType(data);
    const id: string = uniqueId(ctx, data['do_objectID']);
    const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(ctx, data['style']);
    if (data['sharedStyleID']) {
        // env.styleMgr.addShared(data['sharedStyleID'], style);
    }
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON, i: number) => f(ctx, d, i));
    const shapes = new BasicArray<Shape>(...addMaskRect(childs, ctx, data['layers'] || []));
    const shape = new BoolShape([i], id, name, ShapeType.BoolShape, frame.trans, style, shapes);
    // shape.isBoolOpShape = true;
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    shape.mask = data['hasClippingMask'];
    return shape;
}

export function importImage(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): PathShape {
    // const type = importShapeType(data);
    const id: string = uniqueId(ctx, data['do_objectID']);
    const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    // const points: Point[] = importPoints(data);
    const image = data['image'];
    const ref = image && image['_ref'] || "";
    const imageRef = ref.substring(ref.indexOf('/') + 1);
    const style = importStyle(ctx, data['style']);
    if (data['sharedStyleID']) {
        // env.styleMgr.addShared(data['sharedStyleID'], style);
    }
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];
    // env.mediaMgr.addRef(imageRef);
    const curvePoint = new BasicArray<CurvePoint>();
    const p1 = new CurvePoint([0], uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1], uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2], uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3], uuid(), 0, 1, CurveMode.Straight); // lb
    curvePoint.push(p1, p2, p3, p4);

    const segment = new PathSegment([0], uuid(), curvePoint, true);
    // shape.setImageMgr(env.mediaMgr);
    // const shape = new ImageShape([i], id, name, ShapeType.Image, frame, style, new BasicArray<PathSegment>(segment), imageRef);
    const shape = new PathShape([i], id, name, ShapeType.Path, frame.trans, style, frame.size, new BasicArray<PathSegment>(segment));
    const fillColor = new Color(1, 216, 216, 216);
    const fill = new Fill(new BasicArray(), uuid(), true, FillType.Pattern, fillColor);
    fill.imageRef = imageRef;
    fill.originalImageWidth = frame.size.width;
    fill.originalImageHeight = frame.size.height;
    fill.imageScaleMode = ImageScaleMode.Fill;
    fill.setImageMgr(ctx.mediasMgr);
    const fills = new BasicArray<Fill>();
    fills.push(fill);
    shape.style.fills = fills;
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    shape.mask = data['hasClippingMask'];
    return shape;
}

export function importPage(ctx: LoadContext, data: IJSON, f: ImportFun): Page {
    // const type = importShapeType(data);
    const id: string = data['do_objectID']; // page 不需要unique先
    const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(ctx, data['style']);
    if (data['sharedStyleID']) {
        // env.styleMgr.addShared(data['sharedStyleID'], style);
    }
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];

    const childs: Shape[] = (data['layers'] || []).map((d: IJSON, i: number) => f(ctx, d, i));
    const shapes = new BasicArray<Shape>(...addMaskRect(childs, ctx, data['layers'] || []));
    const shape = new Page(new BasicArray<number>(), id, name, ShapeType.Page, frame.trans, style, shapes);
    // shape.appendChilds(childs);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    // 导入的页面均为可见页面
    shape.isVisible = true;
    return shape;
}

export function importPathShape(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): PathShape {
    // const type = importShapeType(data);
    const id: string = uniqueId(ctx, data['do_objectID']);
    const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const points: CurvePoint[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(ctx, data['style']);
    if (data['sharedStyleID']) {
        // env.styleMgr.addShared(data['sharedStyleID'], style);
    }
    // const text = data['attributedString'] && importText(data['attributedString']);

    const segment = new PathSegment([0], uuid(), new BasicArray<CurvePoint>(...points), data['isClosed'])
    const shape = new PathShape([i], id, name, ShapeType.Path, frame.trans, style, frame.size, new BasicArray<PathSegment>(segment));
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    shape.mask = data['hasClippingMask'];
    return shape;
}

export function importRectShape(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): RectShape {
    // const type = importShapeType(data);
    const id: string = uniqueId(ctx, data['do_objectID']);
    const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const points: CurvePoint[] = importPoints(data);
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(ctx, data['style']);
    if (data['sharedStyleID']) {
        // env.styleMgr.addShared(data['sharedStyleID'], style);
    }
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];
    // const r = data['fixedRadius'] || 0;
    // const radius = new RectRadius(r, r, r, r);
    const segment: PathSegment = new PathSegment([0], uuid(), new BasicArray<CurvePoint>(...points), data['isClosed']);
    const shape = new RectShape([i], id, name, ShapeType.Rectangle, frame.trans, style, frame.size, new BasicArray<PathSegment>(segment));

    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    shape.mask = data['hasClippingMask'];
    return shape;
}

export function importTextShape(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): TextShape {
    // const type = importShapeType(data);
    const id: string = uniqueId(ctx, data['do_objectID']);
    const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(ctx, data['style']);
    if (data['sharedStyleID']) {
        // env.styleMgr.addShared(data['sharedStyleID'], style);
    }
    const textStyle = data['style'] && data['style']['textStyle'];
    const text: Text = data['attributedString'] && importText(data['attributedString'], textStyle);
    const textBehaviour = [TextBehaviour.Flexible, TextBehaviour.Fixed, TextBehaviour.FixWidthAndHeight][data['textBehaviour']] ?? TextBehaviour.Flexible;
    text.attr && (text.attr.textBehaviour = textBehaviour);
    // const isClosed = data['isClosed'];
    // 导入填充是文字颜色
    style.fills = new BasicArray();
    const shape = new TextShape([i], id, name, ShapeType.Text, frame.trans, style, frame.size, text);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    shape.mask = data['hasClippingMask'];
    return shape;
}

export function importSymbol(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): SymbolShape {
    // const type = importShapeType(data);
    // const id: string = data['do_objectID'];
    // const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(ctx, data['style']);
    // if (data['sharedStyleID']) {
    //     env.styleMgr.addShared(data['sharedStyleID'], style);
    // }
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];
    const id = uniqueId(ctx, data['symbolID']);
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON, i: number) => f(ctx, d, i));
    // const points = createNormalPoints();
    // const shapes = new BasicArray<Shape>(...addMaskRect(childs, ctx, data['layers'] || []));
    const hasBackgroundColor: boolean = data['hasBackgroundColor'];
    const backgroundColor: Color | undefined = data['backgroundColor'] && importColor(data['backgroundColor']);
    if (hasBackgroundColor && backgroundColor) {
        const fill = new Fill([0], uuid(), true, FillType.SolidColor, backgroundColor);
        style.fills.push(fill);
    }
    // const shape = new SymbolShape([i], id, name, ShapeType.Symbol, frame.trans, style, shapes, frame.size, new BasicMap());
    const shape = new SymbolShape([i], id, name, ShapeType.Symbol, frame.trans, style, new BasicArray<Shape>(...childs), frame.size, new BasicMap());

    childs.length && determineAsContainerRadiusShape(shape, childs);

    shape['frameMaskDisabled'] = !data['hasClippingMask'];

    // env.symbolManager.addSymbol(id, name, env.pageId, shape);
    // shape.appendChilds(childs);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.mask = data['hasClippingMask'];
    return shape;
}

export function importSymbolRef(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): SymbolRefShape {
    // const type = importShapeType(data);
    const id: string = uniqueId(ctx, data['do_objectID']);
    // const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(ctx, data['style']);
    if (data['sharedStyleID']) {
        // env.styleMgr.addShared(data['sharedStyleID'], style);
    }
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];
    const hasBackgroundColor: boolean = data['hasBackgroundColor'];
    const backgroundColor: Color | undefined = data['backgroundColor'] && importColor(data['backgroundColor']);
    if (hasBackgroundColor && backgroundColor) {
        const fill = new Fill([0], uuid(), true, FillType.SolidColor, backgroundColor);
        style.fills.push(fill);
    }
    const shape = new SymbolRefShape([i], id, name, ShapeType.SymbolRef, frame.trans, style, frame.size, data['symbolID'], new BasicMap());
    // shape['frameMaskDisabled'] = !data['hasClippingMask'];
    shape['isCustomSize'] = true; // 因为无法判定是否修改了尺寸，默认都给已经修改了尺寸
    if (data['overrideValues']) importOverrides(shape, data['overrideValues']);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.mask = data['hasClippingMask'];
    return shape;
}

function addMaskRect(childs: Shape[], ctx: LoadContext, data: IJSON[]) {
    const shapes: Shape[] = [];
    for (let i = 0; i < childs.length; i++) {
        const shape = childs[i];
        const d = data[i];
        if (d['hasClippingMask'] && d['clippingMaskMode'] === 0) {
            const style = importStyle(ctx, d['style']);
            if (!hasFill(shape.style.fills)) {
                const fill = new Fill([shape.style.fills.length], uuid(), true, FillType.SolidColor, new Color(1, 0, 0, 0));
                shape.style.fills.push(fill);
                if (hasBorder(shape.style.borders.strokePaints)) {
                    const points: CurvePoint[] = importPoints(d);
                    const segment: PathSegment = new PathSegment([0], uuid(), new BasicArray<CurvePoint>(...points), d['isClosed']);
                    const s = new RectShape([i], uuid(), shape.name, ShapeType.Rectangle, shape.transform, style, shape.size, new BasicArray<PathSegment>(segment));
                    importShapePropertys(s, d);
                    importBoolOp(s, d);
                    shapes.push(s, shape);
                } else {
                    shapes.push(shape);
                }
            } else {
                const points: CurvePoint[] = importPoints(d);
                const segment: PathSegment = new PathSegment([0], uuid(), new BasicArray<CurvePoint>(...points), d['isClosed']);
                const s = new RectShape([i], uuid(), shape.name, ShapeType.Rectangle, shape.transform, style, shape.size, new BasicArray<PathSegment>(segment));
                importShapePropertys(s, d);
                importBoolOp(s, d);
                shapes.push(s, shape);
            }
        } else {
            shapes.push(shape);
        }
    }
    return shapes;
}

function determineAsContainerRadiusShape(parent: Artboard | SymbolShape, childs: Shape[]) {
    // 判断shape是否为用来给容器做圆角的遮罩，如果是，直接去掉shape，并把与遮罩等效的圆角/填充/边框设置到容器上
    const shape = childs[0];
    const parentSize = parent.size;
    const shapeSize = shape.size;
    const sizeEqual = shapeSize.width === parentSize.width && shapeSize.height === parentSize.height;
    const isRect = shape instanceof RectShape;
    const rect = isRect && shape.pathsegs.length === 1 && shape.pathsegs[0].points.length === 4 && shape.pathsegs[0].isClosed;

    // if (!!(shape.resizingConstraint === 228 && rect && sizeEqual && shape.mask)) {
    if (!!(rect && sizeEqual && shape.mask)) {
        const drop = childs.splice(0, 1)[0];
        const points = (drop as PathShape).pathsegs[0].points;
        const radius = points.map(i => i.radius!);
        parent.cornerRadius = new CornerRadius(v4(),radius[0], radius[1], radius[3], radius[2]);
        parent.childs = new BasicArray<Shape>(...childs);
        if (drop.style.fills.length) parent.style.fills = drop.style.fills;
        if (drop.style.borders.strokePaints.length) parent.style.borders = drop.style.borders;
        if (drop.style.shadows.length) parent.style.shadows = drop.style.shadows;
    }
}