import {
    Artboard,
    BasicArray,
    BasicMap,
    Border,
    BorderPosition,
    BorderSideSetting,
    BorderStyle,
    CornerType,
    CurveMode,
    CurvePoint,
    Fill,
    FillRule,
    FillType,
    Gradient,
    GradientType,
    GroupShape,
    ImageShape,
    makeShapeTransform2By1,
    OvalShape, OverrideType,
    Page,
    PathSegment,
    PathShape,
    Point2D,
    PolygonShape,
    RectShape,
    Shadow,
    ShadowPosition,
    Shape,
    ShapeFrame,
    ShapeSize,
    ShapeType,
    SideType,
    StarShape,
    Stop,
    Style,
    SymbolRefShape,
    SymbolShape,
    SymbolUnionShape,
    Text,
    TextBehaviour,
    TextShape,
    Transform,
    Variable,
    VariableType,
} from "../../../data";
import { uuid } from "../../../basic/uuid";
import { IJSON, ImportFun, LoadContext } from "./basic";
import * as shapeCreator from "../../../editor/creator";
import * as types from "../../../data/typesdefine";
import { float_accuracy } from "../../../basic/consts";
import { ColVector3D } from "../../../basic/matrix2";
import { Transform as Transform2 } from "../../../basic/transform";
import { getPolygonPoints, getPolygonVertices } from "../../../editor/utils/path";
import { importText } from "./textio";
import { importColor } from "./common";

function toStrId(id?: {
    localID: string,
    sessionID: string,
}) {
    if (!id) return '';
    return [id.localID, id.sessionID].join(',');
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
        const { col0: from, col1: to } = transform.transform([
            ColVector3D.FromXY(0, 0.5),
            ColVector3D.FromXY(1, 0.5),
        ]);

        const from1 = new Point2D(from.x, from.y);
        const to1 = new Point2D(to.x, to.y);
        const colorType = GradientType.Linear;
        const stops1 = stops.map((item, i) => {
            return new Stop([i] as BasicArray<number>, uuid(), item.position, importColor(item.color))
        }) as BasicArray<Stop>;

        item.gradient = new Gradient(from1, to1, colorType, stops1 as BasicArray<Stop>, undefined, opacity);
        item.fillType = FillType.Gradient;
    } else if (type === 'GRADIENT_RADIAL' || type === 'GRADIENT_ANGULAR') {
        const { col0: from, col1: to } = transform.transform([
            ColVector3D.FromXY(0.5, 0.5),
            ColVector3D.FromXY(1, 0.5),
        ]);
        const decompose = transform.decompose();

        const from1 = new Point2D(from.x, from.y);
        const to1 = new Point2D(to.x, to.y);
        const colorType = type === 'GRADIENT_RADIAL' ? GradientType.Radial : GradientType.Angular;
        const elipseLength = decompose.scale.y / decompose.scale.x * size.y / size.x;
        const stops1 = stops.map((item, i) => {
            return new Stop([i] as BasicArray<number>, uuid(), item.position, importColor(item.color))
        }) as BasicArray<Stop>;

        item.gradient = new Gradient(from1, to1, colorType, stops1 as BasicArray<Stop>, elipseLength, opacity);
        item.fillType = FillType.Gradient;
    }
}

function parseFills(fills: {
    fillPaints: IJSON[],
}, fillsIndex: number = 0, size?: IJSON) {
    const fillPaints = fills.fillPaints;
    if (!Array.isArray(fillPaints)) return;
    size = size || {x: 1, y: 1};

    const result = new BasicArray<Fill>();
    for (let i = 0; i < fillPaints.length; i++) {
        const fill = fillPaints[i];
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
        const f = new Fill([fillsIndex + i] as BasicArray<number>, uuid(), visible, FillType.SolidColor, importColor(color, opacity));
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

        result.push(f);
    }

    return result;
}

function importFills(style: Style, data: IJSON) {
    const fills = parseFills(data as any, style.fills.length, data.size);
    if (fills) style.fills.push(...fills);
}

function parseStroke(strokes: {
    strokePaints: IJSON[],
    strokeAlign: string,
    strokeWeight: number,
    strokeJoin: string,
    dashPattern: number[],
}, strokesIndex: number = 0, size?: IJSON) {
    const strokePaints = strokes.strokePaints;
    if (!Array.isArray(strokePaints)) return;

    const strokeAlign = strokes.strokeAlign;
    const strokeWeight = strokes.strokeWeight;
    const strokeJoin = strokes.strokeJoin;
    const dashPattern = strokes.dashPattern || [0, 0];

    const result = new BasicArray<Border>();
    for (let i = 0; i < strokePaints.length; i++) {
        const stroke = strokePaints[i];
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
            [strokesIndex + i] as BasicArray<number>,
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

        result.push(border);
    }

    return result;
}

function importStroke(style: Style, data: IJSON) {
    const strokes = parseStroke(data as any, style.fills.length, data.size);
    if (strokes) style.borders.push(...strokes);
}

function parseEffects(effects0: {
    effects: IJSON[],
}, effectsIndex: number = 0) {
    const effects = effects0.effects;
    if (!Array.isArray(effects)) return;

    const result = new BasicArray<Shadow>();
    for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];
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

        if (shadowType) result.push(new Shadow(
            [effectsIndex + i] as BasicArray<number>,
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

    return result;
}

function importEffects(style: Style, data: IJSON) {
    const effects = parseEffects(data as any, style.shadows.length);
    if (effects) style.shadows.push(...effects);
}

function importStyle(style: Style, data: IJSON) {
    importFills(style, data);
    importStroke(style, data);
    importEffects(style, data);
}

function importShapeFrame(data: IJSON) {
    const size = data.size || { x: 1, y: 1 };
    const trans = data.transform || { m00: 1, m10: 0, m01: 0, m11: 1, m02: 0, m12: 0 };
    return {
        size: new ShapeSize(size.x, size.y),
        trans: new Transform(trans.m00, trans.m01, trans.m02, trans.m10, trans.m11, trans.m12)
    }
}

function importComponentPropRefs(data: IJSON, shape: Shape, rawVariables: Map<string, IJSON>, variables: BasicMap<string, Variable>) {
    const componentPropRefs = data.componentPropRefs;
    if (!Array.isArray(componentPropRefs)) return;

    function getVarbinds() {
        let varbinds = shape.varbinds;
        if (!varbinds) varbinds = shape.varbinds = new BasicMap();
        return varbinds;
    }

    function getParentPropDef(rawVariable?: IJSON) {
        if (!rawVariable) return;
        let res = rawVariable;
        while (res.parentPropDefId) {
            const next = rawVariables.get(toStrId(res.parentPropDefId));
            if (!next) return;
            res = next;
        }
        return res;
    }

    for (const componentPropRef of componentPropRefs) {
        const defId = toStrId(componentPropRef.defID);
        const componentPropNodeField = componentPropRef.componentPropNodeField;
        const rawVariable = getParentPropDef(rawVariables.get(defId));
        const variable = rawVariable?.kcVariable;
        if (!variable) continue;
        const varId = variable.id;

        if (componentPropNodeField === 'VISIBLE') {
            const varbinds = getVarbinds();
            varbinds.set(OverrideType.Visible, varId)
        } else if (componentPropNodeField === 'OVERRIDDEN_SYMBOL_ID') {
            const varbinds = getVarbinds();
            varbinds.set(OverrideType.SymbolID, varId)
        }
    }
}

function importSymbolOverrides(data: IJSON, shape: Shape, rawVariables: Map<string, IJSON>, variables: BasicMap<string, Variable>, nodeChangesMap: Map<string, IJSON>) {
    const symbolOverrides = data.symbolData?.symbolOverrides;
    if (!Array.isArray(symbolOverrides)) return;

    const shapeVariables = (shape as SymbolRefShape).variables;
    if (!shapeVariables) return;

    let shapeOverrides = (shape as SymbolRefShape).overrides;
    if (!shapeOverrides) {
        shapeOverrides = new BasicMap();
        (shape as SymbolRefShape).overrides = shapeOverrides;
    }

    for (const symbolOverride of symbolOverrides) {
        const guidPath = symbolOverride.guidPath;
        const guids = guidPath?.guids;
        if (!Array.isArray(guids) || guids.length === 0) continue;

        const shapeIds = guids.map(guid => nodeChangesMap.get(toStrId(guid))?.kcId);
        if (shapeIds.find(id => !id)) continue;

        const varId = uuid();
        const joinId = shapeIds.join('/');

        if (symbolOverride.fillPaints) {
            const fills = parseFills(symbolOverride);
            if (fills) {
                shapeVariables.set(varId, new Variable(varId, VariableType.Fills, 'fills', fills));
                shapeOverrides.set(`${joinId}/${OverrideType.Fills}`, varId);
            }
        }

        if (symbolOverride.strokePaints) {
            const strokes = parseStroke(symbolOverride);
            if (strokes) {
                shapeVariables.set(varId, new Variable(varId, VariableType.Borders, 'borders', strokes));
                shapeOverrides.set(`${joinId}/${OverrideType.Borders}`, varId);
            }
        }

        if (symbolOverride.effects) {
            const effects = parseEffects(symbolOverride);
            if (effects) {
                shapeVariables.set(varId, new Variable(varId, VariableType.Shadows, 'effects', effects));
                shapeOverrides.set(`${joinId}/${OverrideType.Shadows}`, varId);
            }
        }
    }
}

function importShapeProperty(data: IJSON, shape: Shape, rawVariables: Map<string, IJSON>, variables: BasicMap<string, Variable>, nodeChangesMap: Map<string, IJSON>) {
    importComponentPropRefs(data, shape, rawVariables, variables);
    importSymbolOverrides(data, shape, rawVariables, variables, nodeChangesMap);
}

export function importPage(ctx: LoadContext, data: IJSON, f: ImportFun, nodeChangesMap: Map<string, IJSON>): Page {
    const visible = data.visible;
    const frame = importShapeFrame(data);
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const childs: Shape[] = (data.childs as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new Page(new BasicArray<number>(), data.id, data.name, ShapeType.Page, frame.trans, frame.size, style, new BasicArray<Shape>(...childs));

    shape.isVisible = visible;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

function importSegments(data: IJSON): PathSegment[] {
    const vectorData = data.vectorData;
    const vectorNetwork = vectorData?.vectorNetwork;
    const vertices = vectorNetwork?.vertices as any[];
    const segments = vectorNetwork?.segments as any[];
    const regions = vectorNetwork?.regions as any[];
    const normalizedSize = vectorData?.normalizedSize as any;

    if (!Array.isArray(vertices) || !Array.isArray(segments) || !Array.isArray(regions) || !normalizedSize) {
        return [];
    }

    function getCycleIndex(length: number, i: number) {
        i %= length;
        if (i < 0) i += length;
        return i;
    }

    function getVertex(index: {
        vertex: number,
        dx?: number,
        dy?: number,
    }) {
        const vertex = { ...vertices[index.vertex] };
        vertex.x += (index.dx || 0);
        vertex.y += (index.dy || 0);
        vertex.x /= normalizedSize.x;
        vertex.y /= normalizedSize.y;
        return vertex;
    }

    function toCurvePoints(points: {
        from?: any,
        to?: any,
    }[]) {
        return points.map((item, i) => {
            const basePoint = getVertex({ vertex: item.from ? item.from.vertex : item.to.vertex });
            const p = new CurvePoint([i] as BasicArray<number>, uuid(), basePoint.x, basePoint.y, CurveMode.Straight);
            const hasCurveFrom = item.from && (Math.abs(item.from.dx) > float_accuracy || Math.abs(item.from.dy) > float_accuracy);
            const hasCurveTo = item.to && (Math.abs(item.to.dx) > float_accuracy || Math.abs(item.to.dy) > float_accuracy);
            if (hasCurveFrom) {
                const point = getVertex(item.from);
                p.mode = CurveMode.Disconnected;
                p.hasFrom = true;
                p.fromX = point.x;
                p.fromY = point.y;
            }
            if (hasCurveTo) {
                const point = getVertex(item.to);
                p.mode = CurveMode.Disconnected;
                p.hasTo = true;
                p.toX = point.x;
                p.toY = point.y;
            }
            return p;
        })
    }

    const segments1 = [];

    if (regions.length > 0) {
        for (const region of regions) {
            const regionLoop = region?.loops?.[0]
            let regionLoopSegments = regionLoop?.segments;

            if (regionLoopSegments) {
                const points: {
                    from?: any,
                    to?: any,
                }[] = [];
                let isEqualLastPoint = false;
                const length = regionLoopSegments.length;
                for (let i = 0; i < length; i++) {
                    const currentSegmentsIndex = regionLoopSegments[getCycleIndex(length, i)];
                    const nextSegmentsIndex = regionLoopSegments[getCycleIndex(length, i + 1)];

                    const currentSegment = segments[currentSegmentsIndex];
                    const nextSegment = segments[nextSegmentsIndex];

                    if (!isEqualLastPoint) {
                        points.push({
                            from: currentSegment.start,
                        });
                    }

                    isEqualLastPoint = currentSegment.end.vertex === nextSegment.start.vertex;

                    if (i !== length - 1 || !isEqualLastPoint) {
                        const point1 = { to: currentSegment.end } as any;
                        if (isEqualLastPoint) point1.from = nextSegment.start;
                        points.push(point1);
                    } else { // 是最后一个且isEqualLastPoint为true
                        points[0].to = currentSegment.end;
                    }
                }

                const isClosed = segments[regionLoopSegments[0]].start.vertex === segments[regionLoopSegments[regionLoopSegments.length - 1]].end.vertex;
                segments1.push(new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...toCurvePoints(points)), isClosed));
            }
        }
    } else {
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const points = toCurvePoints([
                { from: segment.start },
                { to: segment.end },
            ]);
            segments1.push(new PathSegment([i] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...points), false))
        }
    }

    return segments1;
}

export function importPathShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): PathShape {
    if (Array.isArray(data.fillPaints)) {
        const imageInfo = data.fillPaints.find(item => item.type === 'IMAGE');
        if (imageInfo?.image?.hash instanceof Uint8Array) return importImageShape(ctx, data, f, index, nodeChangesMap);
    }

    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const id = data.kcId || uuid();

    let cls = PathShape;
    let shapeType = types.ShapeType.Path;
    let segments = importSegments(data);
    if (segments.length === 0) {
        segments = [new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(
            new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight), // lt
            new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight), // rt
            new CurvePoint([2] as BasicArray<number>, uuid(), 1, 1, CurveMode.Straight), // rb
            new CurvePoint([3] as BasicArray<number>, uuid(), 0, 1, CurveMode.Straight), // lb
        ), true)];
        cls = RectShape;
        shapeType = types.ShapeType.Rectangle;
    }
    const shape = new cls([index] as BasicArray<number>, id, data.name, shapeType, frame.trans, frame.size, style, new BasicArray<PathSegment>(...segments));

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

export function importPolygon(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): PathShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const id = data.kcId || uuid();

    const count = data.count || 3;
    const vertices = getPolygonVertices(count);
    const points = getPolygonPoints(vertices);

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...points), true)
    const shape = new PolygonShape([index] as BasicArray<number>, id, data.name, types.ShapeType.Polygon, frame.trans, frame.size, style, new BasicArray<PathSegment>(segment), count);

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

export function importStar(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): PathShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const id = data.kcId || uuid();

    const vertices = getPolygonVertices(10, 0.382);
    const points = getPolygonPoints(vertices);

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(...points), true)
    const shape = new StarShape([index] as BasicArray<number>, id, data.name, types.ShapeType.Star, frame.trans, frame.size, style, new BasicArray<PathSegment>(segment), 5, 0.382);

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

export function importLine(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): PathShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const id = data.kcId || uuid();

    frame.size.width = frame.size.width || 1;
    frame.size.height = frame.size.height || 1;

    const segment = new PathSegment([0] as BasicArray<number>, uuid(), new BasicArray<CurvePoint>(
        new CurvePoint([0] as BasicArray<number>, uuid(), 0, 0, CurveMode.Straight),
        new CurvePoint([1] as BasicArray<number>, uuid(), 1, 0, CurveMode.Straight),
    ), false)
    const shape = new PathShape([index] as BasicArray<number>, id, data.name, ShapeType.Path, frame.trans, frame.size, style, new BasicArray<PathSegment>(segment));

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

export function importEllipse(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): OvalShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);

    const shape = shapeCreator.newOvalShape(data.name, new ShapeFrame(frame.trans.translateX, frame.trans.translateY, frame.size.width, frame.size.height));

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

export function importGroup(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): GroupShape {
    if (!data.resizeToFit) {
        return importArtboard(ctx, data, f, index, nodeChangesMap);
    }

    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const id = data.kcId || uuid();

    const childs: Shape[] = (data.childs as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new GroupShape(new BasicArray(), id, data.name, types.ShapeType.Group, frame.trans, frame.size, style, new BasicArray<Shape>(...childs))
    shape.isVisible = visible;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

export function importImageShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): ImageShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const id = data.kcId || uuid();

    const curvePoint = new BasicArray<CurvePoint>();
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
    const shape = new ImageShape([index] as BasicArray<number>, id, data.name, types.ShapeType.Image, frame.trans, frame.size, style, new BasicArray<PathSegment>(segment), `${hexString}.png`);

    shape.isVisible = visible;
    shape.style = style;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

export function importArtboard(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): Artboard {
    if (data.isStateGroup) {
        return importSymbolUnion(ctx, data, f, index, nodeChangesMap);
    }

    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const id = data.kcId || uuid();

    const childs: Shape[] = (data.childs as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new Artboard([index] as BasicArray<number>, id, data.name, ShapeType.Artboard, frame.trans, frame.size, style, new BasicArray<Shape>(...childs));
    shape.isVisible = visible;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

export function importTextShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): TextShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    // importStyle(style, data);
    importEffects(style, data); // FILL,BORDERS都是应用到文本上的
    const id = data.kcId || uuid();

    // const textStyle = data.style && data.style['textStyle'];
    const text: Text = data.textData && importText(data.textData, data);
    const textBehaviour = ((textAutoResize: string) => {
        switch (textAutoResize) {
            case "HEIGHT": return TextBehaviour.Fixed;
            case "NONE": return TextBehaviour.FixWidthAndHeight;
            case "WIDTH_AND_HEIGHT": return TextBehaviour.Flexible;
            default: return TextBehaviour.Flexible;
        }
    })(data.textAutoResize);
    text.attr && (text.attr.textBehaviour = textBehaviour);

    const shape = new TextShape([index] as BasicArray<number>, id, data.name, ShapeType.Text, frame.trans, frame.size, style, text);
    shape.isVisible = visible;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

function importVariables(rawVariables: Map<string, IJSON>, variables: BasicMap<string, Variable>, data: IJSON, nodeChangesMap: Map<string, IJSON>)
    : [Map<string, IJSON>, BasicMap<string, Variable>] {

    const componentPropDefs = data.componentPropDefs;

    const rawVariables1 = new Map<string, IJSON>();
    const variables1 = new BasicMap<string, Variable>();

    if (componentPropDefs) for (const componentPropDef of componentPropDefs) {
        let type = componentPropDef.type;
        const rawVarId = toStrId(componentPropDef.id);
        let varName = componentPropDef.name;
        const varId = uuid();
        let rawVarValue = componentPropDef.varValue;

        rawVariables.set(rawVarId, componentPropDef);
        rawVariables1.set(rawVarId, componentPropDef);

        const parentPropDefId = toStrId(componentPropDef.parentPropDefId);
        if (parentPropDefId) {
            const rawParentPropDef = rawVariables.get(parentPropDefId);
            if (rawParentPropDef) {
                componentPropDef.rawParentPropDef = rawParentPropDef;
                type = rawParentPropDef.type;
                varName = rawParentPropDef.name;
                rawVarValue = rawParentPropDef.varValue;
            }
        }

        let varType, varValue;
        if (type === 'BOOL') {
            varType = VariableType.Visible;
            varValue = rawVarValue.value.boolValue;
        } else if (type === 'INSTANCE_SWAP') {
            varType = VariableType.SymbolRef;
            const symbolId = toStrId(rawVarValue.value.symbolIdValue.guid);
            const symbol = nodeChangesMap.get(symbolId);
            varValue = symbol?.kcId;
        } else {
            continue;
        }

        const variable = new Variable(varId, varType, varName, varValue);
        componentPropDef.kcVariable = variable;
        variables.set(varId, variable);
        variables1.set(varId, variable);
    }

    const stateGroupPropertyValueOrders = data.stateGroupPropertyValueOrders;
    if (Array.isArray(stateGroupPropertyValueOrders)) for (const stateGroupPropertyValueOrder of stateGroupPropertyValueOrders) {
        const property = stateGroupPropertyValueOrder.property;
        const values = stateGroupPropertyValueOrder.values;
        const varId = uuid();
        const variable = new Variable(varId, VariableType.Status, property, '');
        variables.set(varId, variable);
        variables1.set(varId, variable);
        stateGroupPropertyValueOrder.kcVariable = variable;
    }

    return [rawVariables1, variables1];
}

export function importSymbol(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): SymbolShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const id = data.kcId || uuid();

    const variablesRes = importVariables(ctx.rawVariables, ctx.variables, data, nodeChangesMap);

    const childs: Shape[] = (data.childs as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];
    const shape = new SymbolShape([index] as BasicArray<number>, id, data.name, ShapeType.Symbol, frame.trans, frame.size, style, new BasicArray<Shape>(...childs), variablesRes[1]);
    shape.isVisible = visible;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

export function importSymbolRef(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): SymbolRefShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const id = data.kcId || uuid();

    const variablesRes = importVariables(ctx.rawVariables, ctx.variables, data, nodeChangesMap);

    const symbolId = toStrId(data.symbolData.symbolID);
    const symbol = nodeChangesMap.get(symbolId);
    const symbolRawID = symbol?.kcId;

    const shape = new SymbolRefShape([index] as BasicArray<number>, id, data.name, ShapeType.SymbolRef, frame.trans, frame.size, style, symbolRawID, variablesRes[1]);
    shape.isVisible = visible;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}

export function importSymbolUnion(ctx: LoadContext, data: IJSON, f: ImportFun, index: number, nodeChangesMap: Map<string, IJSON>): SymbolUnionShape {
    const frame = importShapeFrame(data);
    const visible = data.visible;
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const id = data.kcId || uuid();

    const variablesRes = importVariables(ctx.rawVariables, ctx.variables, data, nodeChangesMap);

    const childs: Shape[] = (data.childs as IJSON[] || []).map((d: IJSON, i: number) => f(ctx, d, i)).filter(item => item) as Shape[];

    const stateGroupPropertyValueOrders = data.stateGroupPropertyValueOrders;
    if (Array.isArray(stateGroupPropertyValueOrders) && stateGroupPropertyValueOrders.length > 0) for (const child of childs) {
        const name = child.name;
        let symtags = (child as SymbolShape).symtags;
        if (!symtags) {
            symtags = new BasicMap<string, string>();
            (child as SymbolShape).symtags = symtags;
        }

        for (const stateGroupPropertyValueOrder of stateGroupPropertyValueOrders) {
            const property = stateGroupPropertyValueOrder.property;
            const values = stateGroupPropertyValueOrder.values;
            const variable = stateGroupPropertyValueOrder.kcVariable;
            if (!variable) continue;
            const varId = variable.id;
            const regex = new RegExp(`(?:^|,\\s*)${property}=([^,]+)`);
            const match = name.match(regex);
            if (match) symtags.set(varId, match[1].trim());
        }
    }

    const shape = new SymbolUnionShape([index] as BasicArray<number>, id, data.name, ShapeType.SymbolUnion, frame.trans, frame.size, style, new BasicArray<Shape>(...childs), variablesRes[1]);
    shape.isVisible = visible;

    importShapeProperty(data, shape, ctx.rawVariables, ctx.variables, nodeChangesMap);

    return shape;
}
