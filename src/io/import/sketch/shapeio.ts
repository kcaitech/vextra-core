import {
    BoolShape,
    CurveMode,
    CurvePoint,
    ExportFormat,
    ExportOptions,
    GroupShape,
    ImageShape,
    OverrideType, PathSegment,
    PathShape,
    RectShape,
    Shape,
    ShapeFrame,
    SymbolShape,
    TextShape,
    Variable,
    VariableType
} from "../../../data/shape";
import { importColor, importStyle, importXY } from "./styleio";
import { Page } from "../../../data/page";
import { importText } from "./textio";
import { Artboard } from "../../../data/artboard";
import { Text } from "../../../data/text";
import {
    BoolOp,
    Color,
    Fill,
    FillType,
    ImageScaleMode,
    Point2D,
    ShapeType,
    SymbolRefShape,
    TextBehaviour
} from "../../../data/classes"
import { BasicArray, BasicMap } from "../../../data/basic";
import { IJSON, ImportFun, LoadContext } from "./basic";
import { uuid } from "../../../basic/uuid";
import { ResizingConstraints2 } from "../../../data/consts";
import { float_accuracy } from "../../../basic/consts";

function uniqueId(ctx: LoadContext, id: string): string {
    // if (ctx.shapeIds.has(id)) id = uuid();
    // ctx.shapeIds.add(id);
    return id;
}

function importExportOptions(data: IJSON): ExportOptions {
    return ((d) => {
            return new ExportOptions(
                new BasicArray<ExportFormat>(),
                0,
                false, false, false, false)
        }
    )(data['exportOptions']);
}

function importShapeFrame(data: IJSON): ShapeFrame {
    const d: IJSON = data['frame'];
    const x = d['x'];
    const y = d['y'];
    const width = d['width'];
    const height = d['height'];
    return new ShapeFrame(x, y, width, height);
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
        const p = new CurvePoint([i] as BasicArray<number>, uuid(), point.x, point.y, curveMode);
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
            return new Variable(uuid(), VariableType.Text, "", value);
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
    shape.isFlippedHorizontal = data['isFlippedHorizontal'];
    shape.isFlippedVertical = data['isFlippedVertical'];
    shape.rotation = -data['rotation'];
    const resizingConstraint = data['resizingConstraint'];
    if (resizingConstraint) {
        shape.resizingConstraint = (~resizingConstraint) & ResizingConstraints2.Mask;
    }
    shape.isVisible = data['isVisible'];
    shape.isLocked = data['isLocked'];
    shape.constrainerProportions = data.frame['constrainerProportions'];
}

export function importArtboard(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): Artboard {
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

    const hasBackgroundColor: boolean = data['hasBackgroundColor'];
    const backgroundColor: Color | undefined = data['backgroundColor'] && importColor(data['backgroundColor']);

    if (hasBackgroundColor && backgroundColor) {
        const fill = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, backgroundColor);
        style.fills.length = 0;
        style.fills.push(fill);
    } else {
        const fill = new Fill([0] as BasicArray<number>, uuid(), true, FillType.SolidColor, new Color(1, 255, 255, 255));
        style.fills.length = 0;
        style.fills.push(fill);
    }
    const childs = (data['layers'] || []).map((d: IJSON, i: number) => f(ctx, d, i));

    // const points = createNormalPoints();

    const shape = new Artboard([i] as BasicArray<number>, id, name, ShapeType.Artboard, frame, style, new BasicArray<Shape>(...childs));

    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importGroupShape(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): GroupShape {
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
    const shape = new GroupShape([i] as BasicArray<number>, id, name, ShapeType.Group, frame, style, new BasicArray<Shape>(...childs));
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
    const shape = new BoolShape([i] as BasicArray<number>, id, name, ShapeType.BoolShape, frame, style, new BasicArray<Shape>(...childs));
    // shape.isBoolOpShape = true;
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
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
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb
    curvePoint.push(p1, p2, p3, p4);

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, true);
    // const shape = new ImageShape([i] as BasicArray<number>, id, name, ShapeType.Image, frame, style, new BasicArray<PathSegment>(segment), imageRef);
    const shape = new PathShape([i] as BasicArray<number>, id, name, ShapeType.Path, frame, style, new BasicArray<PathSegment>(segment));
    const fillColor = new Color(1, 216, 216, 216);
    const fill = new Fill(new BasicArray(), uuid(), true, FillType.Pattern, fillColor);
    fill.imageRef = imageRef;
    fill.originalImageWidth = frame.width;
    fill.originalImageHeight = frame.height;
    fill.imageScaleMode = ImageScaleMode.Fill;
    fill.setImageMgr(ctx.mediasMgr);
    const fills = new BasicArray<Fill>();
    fills.push(fill);
    shape.style.fills = fills;
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
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
    const shape = new Page(new BasicArray<number>(), id, name, ShapeType.Page, frame, style, new BasicArray<Shape>(...childs));
    // shape.appendChilds(childs);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
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

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...points), data['isClosed'])

    const shape = new PathShape([i] as BasicArray<number>, id, name, ShapeType.Path, frame, style, new BasicArray<PathSegment>(segment));
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
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

    const segment: PathSegment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...points), data['isClosed']);
    const shape = new RectShape([i] as BasicArray<number>, id, name, ShapeType.Rectangle, frame, style, new BasicArray<PathSegment>(segment));

    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
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
    const shape = new TextShape([i] as BasicArray<number>, id, name, ShapeType.Text, frame, style, text);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importSymbol(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): SymbolShape {
    // const type = importShapeType(data);
    // const id: string = data['do_objectID'];
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
    const id = uniqueId(ctx, data['symbolID']);
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON, i: number) => f(ctx, d, i));
    // const points = createNormalPoints();
    const shape = new SymbolShape([i] as BasicArray<number>, id, name, ShapeType.Symbol, frame, style, new BasicArray<Shape>(...childs), new BasicMap());

    // env.symbolManager.addSymbol(id, name, env.pageId, shape);
    // shape.appendChilds(childs);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    return shape;
}

export function importSymbolRef(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): SymbolRefShape {
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

    const shape = new SymbolRefShape([i] as BasicArray<number>, id, name, ShapeType.SymbolRef, frame, style, data['symbolID'], new BasicMap());

    if (data['overrideValues']) importOverrides(shape, data['overrideValues']);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    return shape;
}
