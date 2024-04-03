import { BasicArray } from "../../../data/basic";
import { CurvePoint, RectShape, Shape, ShapeFrame, ShapeType } from "../../../data/shape";
import { uuid } from "../../../basic/uuid";
import { IJSON, ImportFun, LoadContext } from "./basic";
import { Page, Style } from "../../../data/classes";

export function importPage(ctx: LoadContext, data: IJSON, f: ImportFun): Page {
    const frame = new ShapeFrame(0, 0, 100, 100);
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    const childs: Shape[] = (data['childs'] || []).map((d: IJSON, i: number) => f(ctx, d, i));
    const shape = new Page(new BasicArray<number>(), data.id, data.name, ShapeType.Page, frame, style, new BasicArray<Shape>(...childs));
    return shape;
}

export function importRectShape(ctx: LoadContext, data: IJSON, f: ImportFun, index: number): RectShape {
    const frame = new ShapeFrame(0, 0, 100, 100);
    const style = new Style(new BasicArray(), new BasicArray(), new BasicArray());
    const points = new BasicArray<CurvePoint>();
    const isClosed = true;
    return new RectShape([index] as BasicArray<number>, uuid(), data['name'], ShapeType.Rectangle, frame, style, points, isClosed);
}