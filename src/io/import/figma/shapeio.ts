import { BasicArray } from "../../../data/basic";
import { CurveMode, CurvePoint, PathSegment, RectShape, Shape, ShapeFrame, ShapeType } from "../../../data/shape";
import { uuid } from "../../../basic/uuid";
import { IJSON, ImportFun, LoadContext } from "./basic";
import { Color, Fill, FillType, Page, ShapeSize, Style, Transform } from "../../../data/classes";
import * as types from "../../../data/typesdefine";

function importColor(color: IJSON) {
    const round = (c: number) => Math.round(c * 255);
    return new Color(color.a, round(color.r), round(color.g), round(color.b));
}

function importFills(style: Style, fillPaints: IJSON[]) {
    /*
    "type":string"SOLID"
    "color":{4 items
        "r":float0.8509804010391235
        "g":float0.8509804010391235
        "b":float0.8509804010391235
        "a":int1
    }
    "opacity":int1
    "visible":booltrue
    "blendMode":string"NORMAL"
    */
    fillPaints.forEach(fill => {
        const type = fill['type'];
        switch (type) {
            case 'SOLID': {
                const color = fill['color'];
                const opacity = fill['opacity'];
                const visible = fill['visible'];
                const blendMode = fill['blendMode'];
                style.fills.push(new Fill([style.fills.length] as BasicArray<number>, uuid(), visible, FillType.SolidColor, importColor(color)));
            }
        }
    })
}

function importStyle(style: Style, data: IJSON) {
    const fillPaints = data['fillPaints'];
    const strokePaints = data['strokePaints'];
    const fillGeometry = data['fillGeometry'];
    const strokeGeometry = data['strokeGeometry'];
    if (fillPaints) importFills(style, fillPaints);
}

function importShapeFrame(data: IJSON) {
    const size = data['size'];
    const trans = data['transform'];
    return {
        size: new ShapeSize(size.x, size.y),
        trans: new Transform(trans.m00, trans.m01, trans.m02, trans.m10, trans.m11, trans.m12)
    }
}

export function importPage(ctx: LoadContext, data: IJSON, f: ImportFun): Page {
    // const size = data['size']; // 没有
    // const transform = data['transform'];
    const visible = data['visible'];
    const frame = importShapeFrame(data);
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    importStyle(style, data);
    const childs: Shape[] = (data['childs'] || []).map((d: IJSON, i: number) => f(ctx, d, i));
    const shape = new Page(new BasicArray<number>(), data.id, data.name, ShapeType.Page, frame.trans, style, new BasicArray<Shape>(...childs));
    shape.isVisible = visible;
    return shape;
}

export function importRectShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): RectShape {
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
    const shape = new RectShape(new BasicArray(), id, data['name'], types.ShapeType.Rectangle, frame.trans, style, frame.size, new BasicArray<PathSegment>(segment));
    shape.isVisible = visible;
    return shape;
}