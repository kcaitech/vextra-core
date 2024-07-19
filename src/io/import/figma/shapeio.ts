import {BasicArray, BasicMap} from "../../../data/basic";
import {
    CurveMode,
    CurvePoint,
    FillRule,
    GroupShape,
    ImageShape,
    OvalShape,
    PathSegment,
    PathShape,
    Point2D,
    RectShape,
    Shape,
    ShapeFrame,
    ShapeType,
    SymbolShape,
    TextShape,
    Transform,
} from "../../../data/shape";
import {uuid} from "../../../basic/uuid";
import {IJSON, ImportFun, LoadContext} from "./basic";
import {
    Artboard,
    Border,
    BorderPosition,
    BorderSideSetting,
    BorderStyle,
    Color,
    CornerType,
    Fill,
    FillType,
    Gradient,
    GradientType,
    Page,
    Shadow,
    ShadowPosition,
    ShapeSize,
    SideType,
    Stop,
    Style,
    SymbolRefShape,
    Text,
    TextBehaviour,
} from "../../../data/classes";
import * as shapeCreator from "../../../editor/creator";
import * as types from "../../../data/typesdefine";
import {importText} from "../sketch/textio";
import {float_accuracy} from "../../../basic/consts";
import {makeShapeTransform2By1} from "../../../data";
import {ColVector3D} from "../../../basic/matrix2";
import {Transform as Transform2} from "../../../basic/transform";

function importColor(color: IJSON, opacity: number = 1) {
    return new Color(color.a * opacity, Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255));
}

function setGradient(
    type: string,
    transform: Transform2,
    stops: {
        color: {
            r: number,
            g: number,
            b: number,
            a: number,
        },
        position: number,
    }[],
    opacity: number,
    size: any,
    item: Fill | Border,
) {
    if (type === 'GRADIENT_LINEAR') {
        const {col0: from, col1: to} = transform.transform([
            ColVector3D.FromXY(0, 0.5),
            ColVector3D.FromXY(1, 0.5),
        ])

        const from1 = new Point2D(from.x, from.y)
        const to1 = new Point2D(to.x, to.y)
        const colorType = GradientType.Linear
        const stops1 = stops.map((item, i) => {
                return new Stop([i] as BasicArray<number>, uuid(), item.position, importColor(item.color))
            }
        ) as BasicArray<Stop>

        item.gradient = new Gradient(from1, to1, colorType, stops1 as BasicArray<Stop>, undefined, opacity);
        item.fillType = FillType.Gradient
    } else if (type === 'GRADIENT_RADIAL' || type === 'GRADIENT_ANGULAR') {
        const {col0: from, col1: to} = transform.transform([
            ColVector3D.FromXY(0.5, 0.5),
            ColVector3D.FromXY(1, 0.5),
        ])
        const decompose = transform.decompose()

        const from1 = new Point2D(from.x, from.y)
        const to1 = new Point2D(to.x, to.y)
        const colorType = type === 'GRADIENT_RADIAL' ? GradientType.Radial : GradientType.Angular
        const elipseLength = decompose.scale.y / decompose.scale.x * size.y / size.x
        const stops1 = stops.map((item, i) => {
                return new Stop([i] as BasicArray<number>, uuid(), item.position, importColor(item.color))
            }
        ) as BasicArray<Stop>

        item.gradient = new Gradient(from1, to1, colorType, stops1 as BasicArray<Stop>, elipseLength, opacity);
        item.fillType = FillType.Gradient
    }
}

function importFills(style: Style, data: IJSON) {
    const fillPaints = data.fillPaints;
    const fillGeometry = data.fillGeometry;
    if (!fillPaints) return;
    const size = data.size || {x: 1, y: 1};

    for (const fill of fillPaints) {
        const type = fill.type;

        const opacity = fill.opacity;
        const visible = fill.visible;
        const blendMode = fill.blendMode;

        const color = fill.color || {
            r: 1,
            g: 1,
            b: 1,
            a: 1,
        };
        const f = new Fill([style.fills.length] as BasicArray<number>, uuid(), visible, FillType.SolidColor, importColor(color, opacity));
        f.fillRule = FillRule.Nonzero;

        const stops = fill.stops as {
            color: {
                r: number,
                g: number,
                b: number,
                a: number,
            },
            position: number,
        }[];
        const transform = fill.transform ? makeShapeTransform2By1(fill.transform).getInverse() : new Transform2();
        const stopsVar = fill.stopsVar;

        setGradient(type, transform, stops, opacity, size, f);

        style.fills.push(f);
    }
}

function importStroke(style: Style, data: IJSON) {
    const strokePaints = data.strokePaints;
    const strokeGeometry = data.strokeGeometry;
    if (!strokePaints) return;
    const size = data.size || {x: 1, y: 1};

    const strokeAlign = data.strokeAlign;
    const strokeWeight = data.strokeWeight;
    const strokeJoin = data.strokeJoin;
    const dashPattern = data.dashPattern || [0, 0];

    for (const stroke of strokePaints) {
        const type = stroke.type;

        const visible = stroke.visible;
        const blendMode = stroke.blendMode;

        const stops = stroke.stops as {
            color: {
                r: number,
                g: number,
                b: number,
                a: number,
            },
            position: number,
        }[];
        const transform = stroke.transform ? makeShapeTransform2By1(stroke.transform).getInverse() : new Transform2();
        const stopsVar = stroke.stopsVar;

        const color = stroke.color || {
            r: 1,
            g: 1,
            b: 1,
            a: 1,
        }
        const opacity = stroke.opacity;

        let position: BorderPosition;
        if (strokeAlign === "INSIDE") position = BorderPosition.Inner;
        else if (strokeAlign === "CENTER") position = BorderPosition.Center;
        else position = BorderPosition.Outer;

        const borderStyle = new BorderStyle(dashPattern[0], dashPattern[1]);
        const side = new BorderSideSetting(SideType.Normal, strokeWeight, strokeWeight, strokeWeight, strokeWeight);

        let cornerType: CornerType;
        if (strokeJoin) {
            if (strokeJoin === "MITER") cornerType = CornerType.Miter;
            else if (strokeJoin === "ROUND") cornerType = CornerType.Round;
            else cornerType = CornerType.Bevel;
        } else {
            cornerType = CornerType.Miter;
        }

        const border = new Border(
            [style.borders.length] as BasicArray<number>,
            uuid(),
            true,
            FillType.SolidColor,
            importColor(color, opacity),
            position,
            strokeWeight,
            borderStyle,
            cornerType,
            side,
        );

        setGradient(type, transform, stops, opacity, size, border);

        style.borders.push(border)
    }
}

function importEffects(style: Style, data: IJSON) {
    const effects = data.effects;
    if (!effects) return;

    for (const effect of effects) {
        const type = effect.type;

        const visible = effect.visible;
        const blendMode = effect.blendMode;

        const color = effect.color;
        const offset = effect.offset;
        const radius = effect.radius;
        const spread = effect.spread;
        const showShadowBehindNode = effect.showShadowBehindNode;

        let shadowType;
        if (type === 'DROP_SHADOW') shadowType = ShadowPosition.Outer;
        else if (type === 'INNER_SHADOW') shadowType = ShadowPosition.Inner;

        if (shadowType) {
            style.shadows.push(new Shadow(
                [style.shadows.length] as BasicArray<number>,
                uuid(),
                visible,
                radius,
                importColor(color),
                offset.x,
                offset.y,
                spread,
                shadowType,
            ));
        }
    }
}

function importStyle(style: Style, data: IJSON) {
    importFills(style, data);
    importStroke(style, data);
    importEffects(style, data);
}

function importShapeFrame(data: IJSON) {
    const size = data['size'] || {x: 1, y: 1};
    const trans = data['transform'] || {m00: 1, m10: 0, m01: 0, m11: 1, m02: 0, m12: 0};
    return {
        size: new ShapeSize(size.x, size.y),
        trans: new Transform(trans.m00, trans.m01, trans.m02, trans.m10, trans.m11, trans.m12)
    }
}

export function importPage(ctx: LoadContext, data: IJSON, f: ImportFun): Page {
    const visible = data['visible'];
    const frame = importShapeFrame(data);
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const childs: Shape[] = (data['childs'] as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new Page(new BasicArray<number>(), data.id, data.name, ShapeType.Page, frame.trans, frame.size, style, new BasicArray<Shape>(...childs));

    shape.isVisible = visible;

    return shape;
}

export function importRectShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): Shape {
    if (Array.isArray(data.fillPaints)) {
        const imageInfo = data.fillPaints.find(item => item.type === 'IMAGE');
        if (imageInfo?.image?.hash instanceof Uint8Array) return importImageShape(ctx, data, f, index);
    }
    if (data.vectorData?.vectorNetwork) {
        return importPathShape(ctx, data, f, index);
    }

    const frame = importShapeFrame(data);
    const visible = data['visible'];
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb
    curvePoint.push(p1, p2, p3, p4);

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, true);
    const shape = new RectShape([index] as BasicArray<number>, id, data['name'], types.ShapeType.Rectangle, frame.trans, frame.size, style, new BasicArray<PathSegment>(segment));

    shape.isVisible = visible;
    shape.style = style;

    return shape;
}

function importPoints(data: IJSON): [CurvePoint[], boolean] {
    const vectorData = data.vectorData;
    const vectorNetwork = vectorData.vectorNetwork;
    const vertices = vectorNetwork?.vertices as any[];
    const segments = vectorNetwork?.segments as any[];
    const regions = vectorNetwork?.regions as any[];
    const normalizedSize = vectorData.normalizedSize as any;

    if (!Array.isArray(vertices) || !Array.isArray(segments) || !Array.isArray(regions) || !normalizedSize) {
        return [[], false];
    }

    const length = vertices.length;

    function getCycleIndex(i: number) {
        i %= length;
        if (i < 0) i += length;
        return i;
    }

    function getVertex(index: {
        vertex: number,
        dx?: number,
        dy?: number,
    }) {
        const vertex = vertices[index.vertex];
        vertex.x += (index.dx || 0);
        vertex.y += (index.dy || 0);
        vertex.x /= normalizedSize.x;
        vertex.y /= normalizedSize.y;
        return vertex;
    }

    const region = regions[0];
    const regionLoop = region.loops[0]
    const regionLoopSegments = regionLoop.segments;
    const points: {
        left: any,
        right: any,
    }[] = [];
    for (let i = 0; i < length; i++) {
        const indexL = regionLoopSegments[getCycleIndex(i - 1)];
        const indexR = regionLoopSegments[getCycleIndex(i)];
        points.push({
            left: segments[indexL].end,
            right: segments[indexR].start,
        });
    }

    return [
        points.map((item, i) => {
            const basePoint = getVertex({vertex: item.left.vertex});
            const p = new CurvePoint([i] as BasicArray<number>, uuid(), basePoint.x, basePoint.y, CurveMode.Straight);
            const hasCurveFrom = Math.abs(item.left.dx) > float_accuracy || Math.abs(item.left.dy) > float_accuracy;
            const hasCurveTo = Math.abs(item.right.dx) > float_accuracy || Math.abs(item.right.dy) > float_accuracy;
            if (hasCurveFrom) {
                const point = getVertex(item.left);
                p.mode = CurveMode.Disconnected;
                p.hasFrom = true;
                p.fromX = point.x;
                p.fromY = point.y;
            }
            if (hasCurveTo) {
                const point = getVertex(item.right);
                p.mode = CurveMode.Disconnected;
                p.hasTo = true;
                p.toX = point.x;
                p.toY = point.y;
            }
            return p;
        }),
        segments[regionLoopSegments[0]].start.vertex === segments[regionLoopSegments[regionLoopSegments.length - 1]].end.vertex,
    ];
}

export function importPathShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): PathShape {
    const frame = importShapeFrame(data);
    const visible = data['visible'];
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const [points, isClosed] = importPoints(data);
    const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...points), isClosed)
    const shape = new PathShape([index] as BasicArray<number>, uuid(), data['name'], ShapeType.Path, frame.trans, frame.size, style, new BasicArray<PathSegment>(segment));

    shape.isVisible = visible;
    shape.style = style;

    return shape;
}

export function importLine(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): PathShape {
    const frame = importShapeFrame(data);
    const visible = data['visible'];
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    frame.size.width = frame.size.width || 1;
    frame.size.height = frame.size.height || 1;

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(
        new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight),
        new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight),
    ), false)
    const shape = new PathShape([index] as BasicArray<number>, uuid(), data['name'], ShapeType.Path, frame.trans, frame.size, style, new BasicArray<PathSegment>(segment));

    shape.isVisible = visible;
    shape.style = style;

    return shape;
}

export function importEllipse(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): OvalShape {
    const frame = importShapeFrame(data);
    const visible = data['visible'];
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const shape = shapeCreator.newOvalShape(data['name'], new ShapeFrame(frame.trans.translateX, frame.trans.translateY, frame.size.width, frame.size.height));

    shape.isVisible = visible;
    shape.style = style;

    return shape;
}

export function importGroup(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): GroupShape {
    if (!data.resizeToFit) {
        return importArtboard(ctx, data, f, index);
    }

    const frame = importShapeFrame(data);
    const visible = data['visible'];
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const childs: Shape[] = (data['childs'] as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new GroupShape(new BasicArray(), uuid(), data['name'], types.ShapeType.Group, frame.trans, frame.size, style, new BasicArray<Shape>(...childs))
    shape.isVisible = visible;

    return shape;
}

export function importImageShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): ImageShape {
    const frame = importShapeFrame(data);
    const visible = data['visible'];
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const curvePoint = new BasicArray<CurvePoint>();
    const id = uuid();
    const p1 = new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight); // lt
    const p2 = new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight); // rt
    const p3 = new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight); // rb
    const p4 = new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight); // lb
    curvePoint.push(p1, p2, p3, p4);

    const imageInfo = data.fillPaints.find((item: any) => item.type === 'IMAGE');
    const imageHash = imageInfo.image.hash as Uint8Array;
    let hexString = "";
    for (let i = 0; i < imageHash.length; i++) {
        hexString += imageHash[i].toString(16).padStart(2, '0');
    }

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), curvePoint, true);
    const shape = new ImageShape([index] as BasicArray<number>, id, data['name'], types.ShapeType.Image, frame.trans, frame.size, style, new BasicArray<PathSegment>(segment), `${hexString}.png`);

    shape.isVisible = visible;
    shape.style = style;

    return shape;
}

export function importArtboard(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): Artboard {
    const frame = importShapeFrame(data);
    const visible = data['visible'];
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const childs: Shape[] = (data['childs'] as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new Artboard([index] as BasicArray<number>, uuid(), data['name'], ShapeType.Artboard, frame.trans, frame.size, style, new BasicArray<Shape>(...childs));
    shape.isVisible = visible;

    return shape;
}

export function importTextShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): TextShape {
    const frame = importShapeFrame(data);
    const visible = data['visible'];
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const textStyle = data['style'] && data['style']['textStyle'];
    const text: Text = data['textData']?.['characters'] && importText(data['textData']['characters'], textStyle);
    const textBehaviour = [TextBehaviour.Flexible, TextBehaviour.Fixed, TextBehaviour.FixWidthAndHeight][data['textBehaviour']] ?? TextBehaviour.Flexible;
    text.attr && (text.attr.textBehaviour = textBehaviour);

    const shape = new TextShape([index] as BasicArray<number>, uuid(), data['name'], ShapeType.Text, frame.trans, frame.size, style, text);
    shape.isVisible = visible;

    return shape;
}

export function importSymbol(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): SymbolShape {
    const frame = importShapeFrame(data);
    const visible = data['visible'];
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const id = uuid();
    data['symbolID'] = id;
    const childs: Shape[] = (data['childs'] as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new SymbolShape([index] as BasicArray<number>, id, data['name'], ShapeType.Symbol, frame.trans, frame.size, style, new BasicArray<Shape>(...childs), new BasicMap());
    shape.isVisible = visible;

    return shape;
}

export function importSymbolRef(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): SymbolRefShape {
    const frame = importShapeFrame(data);
    const visible = data['visible'];
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const symbolId = [data['symbolData']['symbolID']['localID'], data['symbolData']['symbolID']['sessionID']].join(',')
    const symbol = nodeChangesMap.get(symbolId)
    const symbolRawID = symbol?.['symbolID']

    const shape = new SymbolRefShape([index] as BasicArray<number>, uuid(), data['name'], ShapeType.SymbolRef, frame.trans, frame.size, style, symbolRawID, new BasicMap());
    shape.isVisible = visible;

    return shape;
}
