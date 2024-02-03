import {
    ExportOptions,
    GroupShape,
    ImageShape,
    PathShape,
    CurvePoint,
    RectShape,
    Shape,
    ShapeFrame,
    TextShape,
    ExportFormat,
    SymbolShape
} from "../../../data/shape";
import { importXY, importStyle, importColor } from "./styleio";
import { Page } from "../../../data/page";
import { importText } from "./textio";
import { Artboard } from "../../../data/artboard";
import { Text } from "../../../data/text";
import { ShapeType, TextBehaviour, BoolOp, CurveMode, Point2D, SymbolRefShape, Color, CrdtIndex, CrdtId } from "../../../data/classes"
import { BasicArray, BasicMap } from "../../../data/basic";
import { IJSON, ImportFun, LoadContext } from "./basic";
import { uuid } from "../../../basic/uuid";
import { Fill, FillType } from "../../../data/classes";
import { ResizingConstraints } from "../../../data/consts";

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
        const p = new CurvePoint(new CrdtIndex([i]), uuid(), point.x, point.y, curveMode);
        if (hasCurveFrom) {
            p.hasFrom = true;
            p.fromX = curveFrom.x;
            p.fromY = curveFrom.y;
        }
        if (hasCurveTo) {
            p.hasTo = true;
            p.toX = curveTo.x;
            p.toY = curveTo.y;
        }
        return p;
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
        let attr = name.substring(_idx + 1);
        if (attr === 'stringValue') attr = 'text'
        shape.addOverrid(id, attr, value);
    }
}

function importShapePropertys(shape: Shape, data: IJSON) {
    shape.isFlippedHorizontal = data['isFlippedHorizontal'];
    shape.isFlippedVertical = data['isFlippedVertical'];
    shape.rotation = -data['rotation'];
    const resizingConstraint = data['resizingConstraint'];
    if (resizingConstraint) {
        shape.resizingConstraint = (~resizingConstraint) & ResizingConstraints.Mask;
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
        const fill = new Fill(new CrdtIndex([0]), uuid(), true, FillType.SolidColor, backgroundColor);
        style.fills.length = 0;
        style.fills.push(fill);
    } else {
        const fill = new Fill(new CrdtIndex([0]), uuid(), true, FillType.SolidColor, new Color(1, 255, 255, 255));
        style.fills.length = 0;
        style.fills.push(fill);
    }
    const childs = (data['layers'] || []).map((d: IJSON, i: number) => f(ctx, d, i));
    const shape = new Artboard(new CrdtIndex([i]), id, name, ShapeType.Artboard, frame, style, new BasicArray<Shape>(...childs));

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
    const shape = new GroupShape(new CrdtIndex([i]), id, name, ShapeType.Group, frame, style, new BasicArray<Shape>(...childs));
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
    const shape = new GroupShape(new CrdtIndex([i]), id, name, ShapeType.Group, frame, style, new BasicArray<Shape>(...childs));
    shape.isBoolOpShape = true;
    importShapePropertys(shape, data);
    importBoolOp(shape, data);
    shape.exportOptions = exportOptions;
    return shape;
}

export function importImage(ctx: LoadContext, data: IJSON, f: ImportFun, i: number): ImageShape {
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
    const p1 = new CurvePoint(new CrdtIndex([0]), uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint(new CrdtIndex([1]), uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint(new CrdtIndex([2]), uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint(new CrdtIndex([3]), uuid(), 0, 1, CurveMode.Straight); // lb
    curvePoint.push(p1, p2, p3, p4);
    const shape = new ImageShape(new CrdtIndex([i]), id, name, ShapeType.Image, frame, style, curvePoint, true, imageRef);
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

    const childs: Shape[] = (data['layers'] || []).map((d: IJSON, i: number) => f(ctx, d, i));
    const shape = new Page(new CrdtIndex([]), id, name, ShapeType.Page, frame, style, new BasicArray<Shape>(...childs));
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
    const isClosed = data['isClosed'];

    const shape = new PathShape(new CrdtIndex([i]), id, name, ShapeType.Path, frame, style, new BasicArray<CurvePoint>(...points), isClosed);
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
    const shape = new RectShape(new CrdtIndex([i]), id, name, ShapeType.Rectangle, frame, style, new BasicArray<CurvePoint>(...points), true);
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
    const shape = new TextShape(new CrdtIndex([i]), id, name, ShapeType.Text, frame, style, text);
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
    const shape = new SymbolShape(new CrdtIndex([i]), id, name, ShapeType.Symbol, frame, style, new BasicArray<Shape>(...childs), new CrdtId(""), new BasicMap());

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

    const shape = new SymbolRefShape(new CrdtIndex([i]), id, name, ShapeType.SymbolRef, frame, style, data['symbolID'], new BasicMap());

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