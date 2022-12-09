import { BoolOp, 
    CurveMode, 
    ExportOptions, 
    GroupShape, 
    ImageShape, 
    PathShape, 
    Point, 
    PointType, 
    RectShape, 
    Shape, 
    ShapeFrame, 
    ShapeType, 
    Symbol, 
    SymbolRef, 
    TextShape } from "@/data/shape";
import { LzData } from '@/data/lzdata';
import { Color, XY } from "@/data/style";
import { Env } from "./envio";
import { importXY, importStyle, IJSON, importColor } from "./styleio";
import { Page } from "@/data/page";
import { importText } from "./textio";
import { Artboard } from "@/data/artboard";

// function importShapeType(data: IJSON): ShapeType {
//     switch((data['_class'])) {
//         case 'rectangle': return ShapeType.Rectangle;
//         case 'shapeGroup': return ShapeType.ShapeGroup;
//         case 'group': return ShapeType.Group;
//         case 'shapePath': return ShapeType.Path;
//         case 'artboard': return ShapeType.Artboard;
//         case 'bitmap': return ShapeType.Image;
//         case 'page': return ShapeType.Page;
//         case 'text': return ShapeType.Text;
//         case 'oval':
//         case 'star':
//         case 'triangle':
//         case 'polygon': return ShapeType.Path;
//         case 'symbolMaster': return ShapeType.Symbol;
//         case 'symbolInstance': return ShapeType.SymbolRef;
//         default: return ShapeType.Rectangle;
//     }
// }

function importExportOptions(data: IJSON): ExportOptions {
    return ((d) => {
        return new ExportOptions(); // todo
    })(data['exportOptions']);
}

function importShapeFrame(data: IJSON): ShapeFrame {
    const d:IJSON = data['frame'];
    const x = d['x'];
    const y = d['y'];
    const width = d['width'];
    const height = d['height'];
    return new ShapeFrame(x, y, width, height);
}

function importBoolOp(data:IJSON, type: ShapeType): BoolOp {
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
    return booleanOperation;
}

function importPoints(data:IJSON): Point[] {
    return (data['points'] || []).map((d: IJSON) => {
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
}

function importArtboard(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): Artboard {
    // const type = importShapeType(data);
    const id: string = data['do_objectID'];
	const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const booleanOperation = importBoolOp(data, type);
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(env, data['style']);
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];

    const hasBackgroundColor: boolean = data['hasBackgroundColor'];
    const includeBackgroundColorInExport: boolean = data['includeBackgroundColorInExport'];
    const backgroundColor: Color | undefined = data['backgroundColor'] && importColor(data['backgroundColor']);

    const shape = new Artboard(parent, type, name, id, booleanOperation, exportOptions, frame, style);

    shape.hasBackgroundColor = hasBackgroundColor;
    shape.includeBackgroundColorInExport = includeBackgroundColorInExport;
    if (backgroundColor) shape.backgroundColor = backgroundColor;

    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => importShape(env, shape, lzData, d));
    shape.appendChilds(childs);

    return shape;
}

function importGroupShape(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): GroupShape {
    // const type = importShapeType(data);
    const id: string = data['do_objectID'];
	const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const booleanOperation = importBoolOp(data, type);
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(env, data['style']);
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];
    const shape = new GroupShape(parent, type, name, id, booleanOperation, exportOptions, frame, style);

    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => importShape(env, shape, lzData, d));
    shape.appendChilds(childs);

    return shape;
}

function importImage(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): ImageShape {
    // const type = importShapeType(data);
    const id: string = data['do_objectID'];
	const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const booleanOperation = importBoolOp(data, type);
    // const points: Point[] = importPoints(data);
    const image = data['image'];
    const imageRef = image && image['_ref'];
    const style = importStyle(env, data['style']);
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];

    return new ImageShape(parent, lzData, type, name, id, booleanOperation, exportOptions, frame, imageRef, style);
}

function importPage(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): Page {
    // const type = importShapeType(data);
    const id: string = data['do_objectID'];
	const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const booleanOperation = importBoolOp(data, type);
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(env, data['style']);
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];

    const shape = new Page(parent, type, name, id, booleanOperation, exportOptions, frame, style);
    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => importShape(env, shape, lzData, d));
    shape.appendChilds(childs);

    return shape;
}

function importPathShape(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): PathShape {
    // const type = importShapeType(data);
    const id: string = data['do_objectID'];
	const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const booleanOperation = importBoolOp(data, type);
    const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(env, data['style']);
    // const text = data['attributedString'] && importText(data['attributedString']);
    const isClosed = data['isClosed'];

    return new PathShape(parent, type, name, id, booleanOperation, exportOptions, frame, points, style, isClosed);
}

function importRectShape(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): RectShape {
    // const type = importShapeType(data);
    const id: string = data['do_objectID'];
	const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const booleanOperation = importBoolOp(data, type);
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(env, data['style']);
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];

    return new RectShape(parent, type, name, id, booleanOperation, exportOptions, frame, style);
}

function importTextShape(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): TextShape {
    // const type = importShapeType(data);
    const id: string = data['do_objectID'];
	const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const booleanOperation = importBoolOp(data, type);
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(env, data['style']);
    const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];
    return new TextShape(parent, type, name, id, booleanOperation, exportOptions, frame, style, text);
}

function importSymbol(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): Symbol {
    // const type = importShapeType(data);
    // const id: string = data['do_objectID'];
	const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const booleanOperation = importBoolOp(data, type);
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(env, data['style']);
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];

    const shape = new Symbol(parent, type, name, data['symbolID'], booleanOperation, exportOptions, frame, style, env.symbolManager);

    const childs: Shape[] = (data['layers'] || []).map((d: IJSON) => importShape(env, shape, lzData, d));
    shape.appendChilds(childs);

    return shape;
}

function importSymbolRef(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): SymbolRef {
    // const type = importShapeType(data);
    const id: string = data['do_objectID'];
	const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const booleanOperation = importBoolOp(data, type);
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    // const imageRef = image && image['_ref'];
    const style = importStyle(env, data['style']);
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];

    return new SymbolRef(parent, type, name, id, booleanOperation, exportOptions, frame, style, env.symbolManager, data['symbolID']);
}

export function importShape(env:Env, parent: Shape | undefined, lzData: LzData, data: IJSON): Shape {

    switch((data['_class'])) {
        case 'rectangle': 
            return importRectShape(env, ShapeType.Rectangle, parent, lzData, data); // ShapeType.Rectangle;
        case 'shapeGroup':
            return importGroupShape(env, ShapeType.ShapeGroup, parent, lzData, data); // ShapeType.ShapeGroup;
        case 'group': 
            return importGroupShape(env, ShapeType.Group, parent, lzData, data); // ShapeType.Group;
        case 'shapePath':
            return importPathShape(env, ShapeType.Path, parent, lzData, data); // ShapeType.Path;
        case 'artboard':
            return importArtboard(env, ShapeType.Artboard, parent, lzData, data); // ShapeType.Artboard;
        case 'bitmap':
            return importImage(env, ShapeType.Image, parent, lzData, data); // ShapeType.Image;
        case 'page':
            return importPage(env, ShapeType.Page, parent, lzData, data); // ShapeType.Page;
        case 'text':
            return importTextShape(env, ShapeType.Text, parent, lzData, data); // ShapeType.Text;
        case 'oval':
        case 'star':
        case 'triangle':
        case 'polygon':
            return importPathShape(env, ShapeType.Path, parent, lzData, data); // ShapeType.Path;
        case 'symbolMaster':
            return importSymbol(env, ShapeType.Symbol, parent, lzData, data); // ShapeType.Symbol;
        case 'symbolInstance':
            return importSymbolRef(env, ShapeType.SymbolRef, parent, lzData, data); // ShapeType.SymbolRef;
        default:
            return importRectShape(env, ShapeType.Rectangle, parent, lzData, data); // ShapeType.Rectangle;
    }
}