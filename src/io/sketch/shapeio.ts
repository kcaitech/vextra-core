import { BooleanOperation, CurveMode, ExportOptions, ImageShape, PathShape, Point, PointType, RectShape, Shape, ShapeFrame, ShapeType, TextShape } from "@/data/shape";
import { LzData } from '@/data/lzdata';
import { XY } from "@/data/style";
import { Env } from "./envio";
import { importXY, importStyle, IJSON } from "./styleio";
import { Page } from "@/data/page";
import { importText } from "./textio";

export function importShape(env:Env, parent: Shape | undefined, lzData: LzData, data: IJSON): Shape {

    const type = ((t) => {
        switch(t) {
            case 'rectangle': return ShapeType.Rectangle;
            case 'shapeGroup': return ShapeType.Group;
            case 'group': return ShapeType.Group;
            case 'shapePath': return ShapeType.Path;
            case 'artboard': return ShapeType.Artboard;
            case 'bitmap': return ShapeType.Image;
            case 'page': return ShapeType.Page;
            case 'text': return ShapeType.Text;
            case 'oval':
            case 'star':
            case 'triangle':
            case 'polygon': return ShapeType.Path;
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
                case 1: return CurveMode.Mode1;
                case 2: return CurveMode.Mode2;
                case 3: return CurveMode.Mode3;
                case 4: return CurveMode.Mode4;
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
    const style = importStyle(env, frame, data['style']);
    const text = data['attributedString'] && importText(data['attributedString']);
    const isClosed = data['isClosed'];

    const shape = ((type: ShapeType) => {
        switch(type) {
            case ShapeType.Artboard: return new Shape(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
            case ShapeType.Group: return new Shape(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
            case ShapeType.Image: return new ImageShape(parent, lzData, type, name, booleanOperation, exportOptions, frame, imageRef, style);
            case ShapeType.Page: return new Page(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
            case ShapeType.Path: return new PathShape(parent, lzData, type, name, booleanOperation, exportOptions, frame, points, style, isClosed);
            case ShapeType.Rectangle: return new Shape(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
            case ShapeType.Text: return new TextShape(parent, lzData, type, name, booleanOperation, exportOptions, frame, style, text);
            case ShapeType.Star:
            case ShapeType.Polygon:
            case ShapeType.Triangle:
            case ShapeType.Oval: return new Page(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
        }
    })(type);

    // const shape = new Class(parent, lzData, type, name, booleanOperation, exportOptions, frame, points, imageRef, style);
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => importShape(env, shape, lzData, d));
    
    shape.initChilds(childs);
    return shape;
}