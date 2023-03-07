import { Artboard } from "@/data/data/artboard";
import { IJSON, LzData } from "@/data/data/lzdata";
import { Page } from "@/data/data/page";
import { BoolOp, ExportOptions, GroupShape, ImageShape, Shape, ShapeFrame, ShapeType } from "@/data/data/shape";
import { Env } from "./env";
import { importStyle } from "./style";

function importShapeFrame(data: IJSON): ShapeFrame {
    const d:IJSON = data['frame'];
    const x = d['x'];
    const y = d['y'];
    const width = d['w'];
    const height = d['h'];
    return new ShapeFrame(x, y, width, height);
}

function importExportOptions(data: IJSON): ExportOptions {
    return ((d) => {
        return new ExportOptions(); // todo
    })(data['exopt']);
}

function importBoolOp(data:IJSON, type: ShapeType): BoolOp {
    return BoolOp.None; // TODO
}

function importGroupShape(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): GroupShape {
    // const type = importShapeType(data);
    const id: string = data['id'];
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

    const childs: Shape[] = (data['childs'] || []).map((d: IJSON) => importShape(env, shape, lzData, d));
    shape.appendChilds(childs);

    return shape;
}

function importBasicShape(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): Shape {
    // const type = importShapeType(data);
    const id: string = data['id'];
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

    return new Shape(parent, type, name, id, booleanOperation, exportOptions, frame, style);
}


function importPage(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): Page {
    // const type = importShapeType(data);
    const id: string = data['id'];
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
    const childs: Shape[] = (data['childs'] || []).map((d: IJSON) => importShape(env, shape, lzData, d));
    shape.appendChilds(childs);

    return shape;
}


function importArtboard(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): Artboard {
    // const type = importShapeType(data);
    const id: string = data['id'];
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

    // const hasBackgroundColor: boolean = data['hasBackgroundColor'];
    // const includeBackgroundColorInExport: boolean = data['includeBackgroundColorInExport'];
    // const backgroundColor: Color | undefined = data['backgroundColor'] && importColor(data['backgroundColor']);

    const shape = new Artboard(parent, type, name, id, booleanOperation, exportOptions, frame, style);

    // shape.hasBackgroundColor = hasBackgroundColor;
    // shape.includeBackgroundColorInExport = includeBackgroundColorInExport;
    // if (backgroundColor) shape.backgroundColor = backgroundColor;

    const childs: Shape[] = (data['childs'] || []).map((d: IJSON) => importShape(env, shape, lzData, d));
    shape.appendChilds(childs);

    return shape;
}

function importImage(env:Env, type: ShapeType, parent: Shape | undefined, lzData: LzData, data: IJSON): ImageShape {
    // const type = importShapeType(data);
    const id: string = data['id'];
	const exportOptions = importExportOptions(data);
    const frame = importShapeFrame(data);
    const name: string = data['name'];
    const booleanOperation = importBoolOp(data, type);
    // const points: Point[] = importPoints(data);
    // const image = data['image'];
    const ref = data['ref'] || "";
    // const imageRef = ref.substring(ref.indexOf('/') + 1);
    const style = importStyle(env, data['style']);
    // const text = data['attributedString'] && importText(data['attributedString']);
    // const isClosed = data['isClosed'];
    // env.mediaMgr.addRef(ref);
    return new ImageShape(parent, env.mediaMgr, type, name, id, booleanOperation, exportOptions, frame, ref, style);
}


export function importShape(env: Env, parent: Shape | undefined, lzData: LzData, data: IJSON): Shape {
    switch((data['type'])) {
        case 'group': return importGroupShape(env, ShapeType.Group, parent, lzData, data);
        case 'page': return importPage(env, ShapeType.Page, parent, lzData, data);
        case 'image': return importImage(env, ShapeType.Image, parent, lzData, data);
        case 'artboard': return importArtboard(env, ShapeType.Artboard, parent, lzData, data);
        case 'shape':
        default:
            return importBasicShape(env, ShapeType.Rectangle, parent, lzData, data);
    }
}