import { BoolOp, CurveMode, ExportOptions, GroupShape, ImageShape, PathShape, Point, PointType, RectShape, Shape, ShapeFrame, ShapeType, Symbol, SymbolRef, TextShape } from "@/data/shape";
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
            case 'shapeGroup': return ShapeType.ShapeGroup;
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
            case 'symbolMaster': return ShapeType.Symbol;
            case 'symbolInstance': return ShapeType.SymbolRef;
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
    let booleanOperation: BoolOp = ((o: number) => {
        // if (type === ShapeType.Group) {
        //     o = -1;
        // }
        switch(o) {
            case 0: {
                // if (type === ShapeType.ShapeGroup)return BoolOp.GroupUnion;
                if (type === ShapeType.Group) return BoolOp.None;
                return BoolOp.Union;
            }
            case 1: return BoolOp.Sbutract;
            case 2: return BoolOp.Intersect;
            case 3: return BoolOp.Difference;
            case 4: return BoolOp.SimpleUnion;
            default: return BoolOp.None;
        }
    })(data['booleanOperation']);
    if (type === ShapeType.ShapeGroup && booleanOperation === BoolOp.Union) {
        booleanOperation = BoolOp.None;
        (data['layers'] || []).forEach((d:IJSON) => {
            if (d['booleanOperation'] === -1) {
                d['booleanOperation'] = 4; // SimpleUnions
            }
        })
    }

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
    const style = importStyle(env, data['style']);
    const text = data['attributedString'] && importText(data['attributedString']);
    const isClosed = data['isClosed'];

    const shape = ((type: ShapeType) => {
        switch(type) {
            case ShapeType.Artboard: return new GroupShape(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
            case ShapeType.ShapeGroup:
            case ShapeType.Group: return new GroupShape(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
            case ShapeType.Image: return new ImageShape(parent, lzData, type, name, booleanOperation, exportOptions, frame, imageRef, style);
            case ShapeType.Page: return new Page(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
            case ShapeType.Path: return new PathShape(parent, lzData, type, name, booleanOperation, exportOptions, frame, points, style, isClosed);
            case ShapeType.Boolean: // 虚拟对象, 实际上不应该出现的
            case ShapeType.Rectangle: return new RectShape(parent, lzData, type, name, booleanOperation, exportOptions, frame, style);
            case ShapeType.Text: return new TextShape(parent, lzData, type, name, booleanOperation, exportOptions, frame, style, text);
            case ShapeType.Star:
            case ShapeType.Polygon:
            case ShapeType.Triangle:
            case ShapeType.Oval: return new PathShape(parent, lzData, type, name, booleanOperation, exportOptions, frame, points, style, isClosed);
            case ShapeType.Symbol: return new Symbol(parent, lzData, type, name, booleanOperation, exportOptions, frame, style, data['symbolID'], env.symbolManager);
            case ShapeType.SymbolRef: return new SymbolRef(parent, lzData, type, name, booleanOperation, exportOptions, frame, style, env.symbolManager, data['symbolID']);
        }
    })(type);

    // todo 不确定，是否sketch旧版本写的数据，现在的版本做不出来样张
    // if (data['_class'] == "shapeGroup" && data['booleanOperation'] == 0) {
    //     (data['layers'] || []).forEach((element:IJSON) => {
    //         if (element['booleanOperation'] == -1) {
    //             element['booleanOperation'] = 3;
    //         }
    //     });
    // }

    // const shape = new Class(parent, lzData, type, name, booleanOperation, exportOptions, frame, points, imageRef, style);
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => importShape(env, shape, lzData, d));
    if (shape instanceof GroupShape) shape.appendChilds(childs);

    return shape;
}