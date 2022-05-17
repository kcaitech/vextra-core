import { BooleanOperation, CurveMode, ExportOptions, Point, PointType, Shape, ShapeFrame, ShapeType } from "@/data/shape";
import { LzData } from '@/data/lzdata';
import { Pair, Style, XY } from "@/data/style";
import { Env } from "./envio";
import { importXY, importStyle, IJSON } from "./styleio";

export function importShape<T extends Shape>(Class: any, env:Env, parent: Shape | undefined, lzData: LzData, data: IJSON): T {

    const type = ((t) => {
        switch(t) {
            case 'rectangle': return ShapeType.Rectangle;
            case 'shapeGroup': return ShapeType.Group;
            case 'group': return ShapeType.Group;
            case 'shapePath': return ShapeType.Path;
            case 'artboard': return ShapeType.Artboard;
            case 'bitmap': return ShapeType.Image;
            case 'page': return ShapeType.Page;
            default: return ShapeType.Rectangle;
        }
    })(data['_class']);

	const exportOptions: ExportOptions = ((d) => {
        return new ExportOptions(); // todo
    })(data['exportOptions']);

    const frame: ShapeFrame = ((d) => {
        const x = d['x'];
        const y = d['y'];
        const width = d['width'];
        const height = d['height'];
        return new ShapeFrame(x, y, width, height);
    })(data['frame']);

    const name: string = data['name'];
    const booleanOperation: BooleanOperation = ((o) => {
        return BooleanOperation.op0;
    })(data['booleanOperation']);

    const points: Point[] = (data['points'] || []).map((d: IJSON) => {
        const type: PointType = ((t) => {
            return PointType.Type0; // todo
        })(d['_class']);
        const cornerRadius: number = d['cornerRadius'];
        const curveFrom: XY<number, number> = importXY(d['curveFrom']);
        const curveMode: CurveMode = ((t) => {
            switch(t) {
                case 0: return CurveMode.Mode0;
                default: return CurveMode.Mode0;
            }
        })(d['curveMode']);
        const curveTo: XY<number, number> = importXY(d['curveTo']);
        const hasCurveFrom: boolean = d['hasCurveFrom'];
        const hasCurveTo: boolean = d['hasCurveTo'];
        const point: XY<number, number> = importXY(d['point']);
        return new Point(type, cornerRadius, curveFrom, curveMode, curveTo, hasCurveFrom, hasCurveTo, point);
    });

    const image = data['image'];
    const imageRef = image && image['_ref'];
    const style = importStyle(env, data['style']);

    const shape = new Class(parent, lzData, type, name, booleanOperation, exportOptions, frame, points, imageRef, style);
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => importShape(Shape, env, shape, lzData, d));
    
    shape.initChilds(childs);
    return shape;
}