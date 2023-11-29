import {
    ExportOptions,
    GroupShape,
    ImageShape,
    PathShape,
    CurvePoint,
    RectShape,
    Shape,
    ShapeFrame,
    SymbolShape,
    SymbolRefShape,
    TextShape,
    ExportFormat
} from "../../../data/shape";
import { BlendMode, Color, ContextSettings } from "../../../data/style";
import { importXY, importStyle, importColor } from "./styleio";
import { Page } from "../../../data/page";
import { importText } from "./textio";
import { Artboard } from "../../../data/artboard";
import { Text } from "../../../data/text";
import { ShapeType, TextBehaviour, BoolOp, CurveMode, Point2D } from "../../../data/classes"
import { BasicArray } from "../../../data/basic";
import { IJSON, ImportFun, LoadContext } from "./basic";
import { uuid } from "../../../basic/uuid";
import { Fill, FillType } from "../../../data/classes";
import { importFill } from "../../../io/baseimport";

function uniqueId(ctx: LoadContext, id: string): string {
    // if (ctx.shapeIds.has(id)) id = uuid();
    // ctx.shapeIds.add(id);
    return id;
}

function importExportOptions(data: IJSON): ExportOptions {
    return ((d) => {
        return new ExportOptions(
            new BasicArray<ExportFormat>(),
            new BasicArray<string>(),
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
    return (data['points'] || []).map((d: IJSON) => {
        const cornerRadius: number = d['cornerRadius'];
        const curveFrom: Point2D = importXY(d['curveFrom']);
        const curveMode: CurveMode = ((t) => {
            return [CurveMode.None, CurveMode.Straight, CurveMode.Mirrored, CurveMode.Asymmetric, CurveMode.Disconnected][t] ?? CurveMode.None;
        })(d['curveMode']);
        const curveTo: Point2D = importXY(d['curveTo']);
        const hasCurveFrom: boolean = d['hasCurveFrom'];
        const hasCurveTo: boolean = d['hasCurveTo'];
        const point: Point2D = importXY(d['point']);
        return new CurvePoint(uuid(), cornerRadius, curveFrom, curveTo, hasCurveFrom, hasCurveTo, curveMode, point);
    });
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
        const attr = name.substring(_idx + 1);

        shape.addOverrid(id, attr, value);
    }
}

function importShapePropertys(shape: Shape, data: IJSON) {
    shape.isFlippedHorizontal = data['isFlippedHorizontal'];
    shape.isFlippedVertical = data['isFlippedVertical'];
    shape.rotation = -data['rotation'];
    shape.resizingConstraint = data['resizingConstraint'];
    shape.isVisible = data['isVisible'];
    shape.isLocked = data['isLocked'];
    shape.constrainerProportions = data.frame['constrainerProportions'];
}

export function importArtboard(ctx: LoadContext, data: IJSON, f: ImportFun): Artboard {
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
        const fill = new Fill(uuid(), true, FillType.SolidColor, backgroundColor);
        style.fills.length = 0;
        style.fills.push(fill);
    } else {
        const fill = new Fill(uuid(), true, FillType.SolidColor, new Color(1, 255, 255, 255));
        style.fills.length = 0;
        style.fills.push(fill);
    }
    const childs = (data['layers'] || []).map((d: IJSON) => f(ctx, d));
    const shape = new Artboard(id, name, ShapeType.Artboard, frame, style, new BasicArray<Shape>(...childs));

    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importGroupShape(ctx: LoadContext, data: IJSON, f: ImportFun): GroupShape {
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
    style.fills.length = 0;
    style.borders.length = 0;
    if (data['sharedStyleID']) {
        // env.styleMgr.addShared(data['sharedStyleID'], style);
    }
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => f(ctx, d));
    const shape = new GroupShape(id, name, ShapeType.Group, frame, style, new BasicArray<Shape>(...childs));
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importShapeGroupShape(ctx: LoadContext, data: IJSON, f: ImportFun): GroupShape {
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
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => f(ctx, d));
    const shape = new GroupShape(id, name, ShapeType.Group, frame, style, new BasicArray<Shape>(...childs));
    shape.isBoolOpShape = true;
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importImage(ctx: LoadContext, data: IJSON, f: ImportFun): ImageShape {
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
    const p1 = new CurvePoint(uuid(), 0, new Point2D(0, 0), new Point2D(0, 0), false, false, CurveMode.Straight, new Point2D(0, 0)); // lt
    const p2 = new CurvePoint(uuid(), 0, new Point2D(1, 0), new Point2D(1, 0), false, false, CurveMode.Straight, new Point2D(1, 0)); // rt
    const p3 = new CurvePoint(uuid(), 0, new Point2D(1, 1), new Point2D(1, 1), false, false, CurveMode.Straight, new Point2D(1, 1)); // rb
    const p4 = new CurvePoint(uuid(), 0, new Point2D(0, 1), new Point2D(0, 1), false, false, CurveMode.Straight, new Point2D(0, 1)); // lb
    curvePoint.push(p1, p2, p3, p4);
    const shape = new ImageShape(id, name, ShapeType.Image, frame, style, curvePoint, true, imageRef);
    // shape.setImageMgr(env.mediaMgr);
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

    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => f(ctx, d));
    const shape = new Page(id, name, ShapeType.Page, frame, style, new BasicArray<Shape>(...childs));
    // shape.appendChilds(childs);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importPathShape(ctx: LoadContext, data: IJSON, f: ImportFun): PathShape {
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
    const isClosed = data['isClosed'];

    const shape = new PathShape(id, name, ShapeType.Path, frame, style, new BasicArray<CurvePoint>(...points), isClosed);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importRectShape(ctx: LoadContext, data: IJSON, f: ImportFun): RectShape {
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
    const shape = new RectShape(id, name, ShapeType.Rectangle, frame, style, new BasicArray<CurvePoint>(...points), true);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importTextShape(ctx: LoadContext, data: IJSON, f: ImportFun): TextShape {
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
    const shape = new TextShape(id, name, ShapeType.Text, frame, style, text);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importSymbol(ctx: LoadContext, data: IJSON, f: ImportFun): SymbolShape {
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
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => f(ctx, d));
    const shape = new SymbolShape(id, name, ShapeType.Symbol, frame, style, new BasicArray<Shape>(...childs));
    // env.symbolManager.addSymbol(id, name, env.pageId, shape);
    // shape.appendChilds(childs);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    return shape;
}

export function importSymbolRef(ctx: LoadContext, data: IJSON, f: ImportFun): SymbolRefShape {
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

    const shape = new SymbolRefShape(id, name, ShapeType.SymbolRef, frame, style, data['symbolID']);

    if (data['overrideValues']) importOverrides(shape, data['overrideValues']);
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    return shape;
}

// export function importShape(data: IJSON): Shape {
//     switch ((data['_class'])) {
//         case 'rectangle':
//             return importRectShape(data); // ShapeType.Rectangle;
//         case 'shapeGroup':
//             return importShapeGroupShape(data); // ShapeType.ShapeGroup;
//         case 'group':
//             return importGroupShape(data); // ShapeType.Group;
//         case 'shapePath':
//             return importPathShape(data); // ShapeType.Path;
//         case 'artboard':
//             return importArtboard(data); // ShapeType.Artboard;
//         case 'bitmap':
//             return importImage(data); // ShapeType.Image;
//         case 'page':
//             return importPage(data); // ShapeType.Page;
//         case 'text':
//             return importTextShape(data); // ShapeType.Text;
//         case 'oval':
//         case 'star':
//         case 'triangle':
//         case 'polygon':
//             return importPathShape(data); // ShapeType.Path;
//         case 'symbolMaster':
//             return importSymbol(data); // ShapeType.Symbol;
//         case 'symbolInstance':
//             return importSymbolRef(data); // ShapeType.SymbolRef;
//         default:
//             return importRectShape(data); // ShapeType.Rectangle;
//     }
// }