import { Page } from "../../data/page";
import { GroupShape, PathShape, PathShape2, RectShape, Shape, SymbolShape, Variable } from "../../data/shape";
import { ContactShape, SymbolRefShape, ContactForm } from "../../data/classes";
import { BoolOp, CurveMode, MarkerType, OverrideType, Point2D } from "../../data/typesdefine";
import { BasicMap } from "../../data/basic";


export function shapeModifyX(page: Page, shape: Shape, x: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // translateTo(shape, x, y)
    // needUpdateFrame.push(shape);
    const frame = shape.frame;
    if (x !== frame.x) {
        frame.x = x;
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyY(page: Page, shape: Shape, y: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // translateTo(shape, x, y)
    // needUpdateFrame.push(shape);
    const frame = shape.frame;
    if (y !== frame.y) {
        // frame.x = x;
        frame.y = y;
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyWH(page: Page, shape: Shape, w: number, h: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    const frame = shape.frame;
    if (w !== frame.width || h !== frame.height) {
        // frame.width = w;
        // frame.height = h;
        shape.setFrameSize(w, h);
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyWideX(page: Page, shape: Shape, x: number) {
    const frame = (shape as GroupShape).frame;
    if (x !== frame.x) {
        frame.x = x;
    }
}
export function shapeModifyWideY(page: Page, shape: Shape, y: number) {
    const frame = (shape as GroupShape).frame;
    if (y !== frame.y) {
        frame.y = y;
    }
}
export function shapeModifyWideWH(page: Page, shape: Shape, w: number, h: number) {
    const frame = shape.frame;
    if (w !== frame.width || h !== frame.height) {
        (shape as GroupShape).setWideFrameSize(w, h);
    }
}
export function shapeModifyStartMarkerType(shape: Shape, mt: MarkerType) {
    const style = shape.style;
    if (mt !== style.startMarkerType) {
        style.startMarkerType = mt;
    }
}
export function shapeModifyEndMarkerType(shape: Shape, mt: MarkerType) {
    const style = shape.style;
    if (mt !== style.endMarkerType) {
        style.endMarkerType = mt;
    }
}
export function shapeModifyWidth(page: Page, shape: Shape, w: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    const frame = shape.frame;
    if (w !== frame.width) {
        // frame.width = w;
        // frame.height = h;
        shape.setFrameSize(w, frame.height);
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyHeight(page: Page, shape: Shape, h: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    const frame = shape.frame;
    if (h !== frame.height) {
        // frame.width = w;
        // frame.height = h;
        shape.setFrameSize(frame.width, h);
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyRotate(page: Page, shape: Shape, rotate: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    if (rotate !== shape.rotation) {
        shape.rotation = rotate;
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    }
}
export function shapeModifyConstrainerProportions(shape: Shape, prop: boolean) {
    shape.constrainerProportions = prop;
}
export function shapeModifyNameFixed(shape: Shape, isFixed: boolean) {
    shape.nameIsFixed = isFixed;
}
export function shapeModifyContactTo(shape: ContactShape, to: ContactForm | undefined) {
    shape.to = to;
}
export function shapeModifyContactFrom(shape: ContactShape, from: ContactForm | undefined) {
    shape.from = from;
}
export function shapeModifyEditedState(shape: ContactShape, state: boolean) {
    shape.isEdited = state;
}
export function shapeModifyName(shape: Shape, name: string) {
    shape.name = name;
}
export function shapeModifyVisible(shape: Shape | Variable, isVisible: boolean) {
    if (shape instanceof Shape) shape.setVisible(isVisible);
    else shape.value = isVisible;
}
export function shapeModifyLock(shape: Shape, isLocked: boolean) {
    shape.isLocked = isLocked;
}
export function shapeModifyHFlip(page: Page, shape: Shape, hflip: boolean | undefined, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    shape.isFlippedHorizontal = hflip;
    if (needUpdateFrame) needUpdateFrame.push({ shape, page });
}
export function shapeModifyVFlip(page: Page, shape: Shape, vflip: boolean | undefined, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    shape.isFlippedVertical = vflip;
    if (needUpdateFrame) needUpdateFrame.push({ shape, page });
}
export function shapeModifyResizingConstraint(shape: Shape, resizingConstraint: number) {
    shape.setResizingConstraint(resizingConstraint);
}
export function shapeModifyContextSettingOpacity(shape: Shape, contextSettingsOpacity: number) {
    shape.setContextSettingsOpacity(contextSettingsOpacity);
}
export function shapeModifyRadius(shape: RectShape, lt: number, rt: number, rb: number, lb: number) {
    shape.setRectRadius(lt, rt, rb, lb);
}
export function shapeModifyFixedRadius(shape: GroupShape | PathShape | PathShape2, fixedRadius: number | undefined) {
    shape.fixedRadius = fixedRadius;
}
export function shapeModifyBoolOp(shape: Shape, op: BoolOp | undefined) {
    shape.boolOp = op;
}
export function shapeModifyPathShapeClosedStatus(shape: PathShape, is: boolean) {
    shape.isClosed = is;
}
export function shapeModifyBoolOpShape(shape: GroupShape, isOpShape: boolean | undefined) {
    if (isOpShape) shape.isBoolOpShape = true;
    else shape.isBoolOpShape = undefined;
}

export function shapeModifyCurvPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
    const p = shape.points[index];
    p.x = point.x;
    p.y = point.y;
}
export function shapeModifyCurvFromPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
    const p = shape.points[index];
    p.fromX = point.x;
    p.fromY = point.y;
}
export function shapeModifyCurvToPoint(page: Page, shape: PathShape, index: number, point: Point2D) {
    const p = shape.points[index];
    p.toX = point.x;
    p.toY = point.y;
}
export function shapeModifyCurveMode(page: Page, shape: PathShape, index: number, curveMode: CurveMode) {
    const p = shape.points[index];
    p.mode = curveMode;
}
export function shapeModifyPointCornerRadius(page: Page, shape: PathShape, index: number, cornerRadius: number) {
    const p = shape.points[index];
    p.radius = cornerRadius;
}
export function shapeModifyHasFrom(page: Page, shape: PathShape, index: number, hasFrom: boolean) {
    const p = shape.points[index];
    p.hasFrom = hasFrom;
}
export function shapeModifyHasTo(page: Page, shape: PathShape, index: number, hasTo: boolean) {
    const p = shape.points[index];
    p.hasTo = hasTo;
}
export function shapeModifyVariable(page: Page, _var: Variable, value: any) {
    _var.value = value;
}
export function shapeAddVariable(page: Page, shape: SymbolShape | SymbolRefShape, _var: Variable) {
    shape.addVar(_var);
}
export function shapeRemoveVariable(page: Page, shape: SymbolShape | SymbolRefShape, key: string) {
    shape.removeVar(key);
}
export function shapeBindVar(page: Page, shape: Shape, type: OverrideType, varId: string) {
    if (!shape.varbinds) shape.varbinds = new BasicMap();
    shape.varbinds.set(type, varId);
}
export function shapeModifyOverride(page: Page, shape: SymbolShape | SymbolRefShape, refId: string, attr: OverrideType, value: string) {
    shape.addOverrid2(refId, attr, value);
}
export function shapeAddOverride(page: Page, shape: SymbolShape | SymbolRefShape, refId: string, attr: OverrideType, value: string) {
    shape.addOverrid2(refId, attr, value);
}
export function shapeModifyVartag(page: Page, shape: SymbolShape, varId: string, tag: string) {
    if (!shape.symtags) shape.symtags = new BasicMap();
    shape.setTag(varId, tag);
}