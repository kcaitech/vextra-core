import { Page } from "../../data/page";
import { GroupShape, PathShape, PathShape2, RectShape, Shape, SymbolShape, Variable } from "../../data/shape";
import { ContactShape, SymbolRefShape, ContactForm } from "../../data/classes";
import { BoolOp, CurveMode, MarkerType, OverrideType, Point2D } from "../../data/typesdefine";
import { BasicMap } from "../../data/basic";
import { crdtArrayRemove, crdtSetAttr } from "./basic";

function _checkNum(x: number) {
    // check
    if (Number.isNaN(x) || (!Number.isFinite(x))) throw new Error(String(x));
}

export function shapeModifyX(page: Page, shape: Shape, x: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // check
    _checkNum(x);
    const frame = shape.frame;
    if (x !== frame.x) {
        const op = crdtSetAttr(frame, 'x', x);
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return op;
    }
}
export function shapeModifyY(page: Page, shape: Shape, y: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // check
    _checkNum(y);
    const frame = shape.frame;
    if (y !== frame.y) {
        const op = crdtSetAttr(frame, 'y', y);
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return op;
    }
}
export function shapeModifyWH(page: Page, shape: Shape, w: number, h: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // check
    if (Number.isNaN(w) || (!Number.isFinite(w))) throw new Error(String(w));
    if (Number.isNaN(h) || (!Number.isFinite(h))) throw new Error(String(h));
    const frame = shape.frame;
    if (w !== frame.width || h !== frame.height) {
        const op = [crdtSetAttr(frame, 'width', w), crdtSetAttr(frame, 'height', h)];
        // shape.setFrameSize(w, h); // todo
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return op;
    }
}
export function shapeModifyStartMarkerType(shape: Shape, mt: MarkerType) {
    const style = shape.style;
    if (mt !== style.startMarkerType) return crdtSetAttr(style, 'startMarkerType', mt);
}
export function shapeModifyEndMarkerType(shape: Shape, mt: MarkerType) {
    const style = shape.style;
    if (mt !== style.endMarkerType) return crdtSetAttr(style, 'endMarkerType', mt);
}
export function shapeModifyWidth(page: Page, shape: Shape, w: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // check
    if (Number.isNaN(w) || (!Number.isFinite(w))) throw new Error(String(w));
    const frame = shape.frame;
    if (w !== frame.width) {
        // shape.setFrameSize(w, frame.height); // todo
        const op = crdtSetAttr(frame, 'width', w);
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return op;
    }
}
export function shapeModifyHeight(page: Page, shape: Shape, h: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    // check
    if (Number.isNaN(h) || (!Number.isFinite(h))) throw new Error(String(h));
    const frame = shape.frame;
    if (h !== frame.height) {
        // shape.setFrameSize(frame.width, h);
        const op = crdtSetAttr(frame, 'height', h);
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return op;
    }
}
export function shapeModifyRotate(page: Page, shape: Shape, rotate: number, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    rotate = rotate % 360;
    if (rotate !== shape.rotation) {
        const op = crdtSetAttr(shape, 'rotation', rotate);
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return op;
    }
}
export function shapeModifyConstrainerProportions(shape: Shape, prop: boolean) {
    if (shape.constrainerProportions !== prop) return crdtSetAttr(shape, 'constrainerProportions', prop);
}
export function shapeModifyNameFixed(shape: Shape, isFixed: boolean) {
    if (shape.nameIsFixed !== isFixed) return crdtSetAttr(shape, 'nameIsFixed', isFixed);
}
export function shapeModifyContactTo(shape: ContactShape, to: ContactForm | undefined) {
    return crdtSetAttr(shape, 'to', to);
}
export function shapeModifyContactFrom(shape: ContactShape, from: ContactForm | undefined) {
    return crdtSetAttr(shape, 'from', from);
}
export function shapeModifyEditedState(shape: ContactShape, state: boolean) {
    return crdtSetAttr(shape, 'isEdited', state);
}
export function shapeModifyName(shape: Shape, name: string) {
    return crdtSetAttr(shape, 'name', name);
}
export function shapeModifyVisible(shape: Shape | Variable, isVisible: boolean) {
    if (shape instanceof Shape) return crdtSetAttr(shape, 'isVisible', isVisible);
    else return crdtSetAttr(shape, 'value', isVisible); // shape.value = isVisible;
}
export function shapeModifyLock(shape: Shape, isLocked: boolean) {
    return crdtSetAttr(shape, 'isLocked', isLocked);
}
export function shapeModifyHFlip(page: Page, shape: Shape, hflip: boolean | undefined, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    const op = crdtSetAttr(shape, 'isFlippedHorizontal', hflip);
    if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    return op;
}
export function shapeModifyVFlip(page: Page, shape: Shape, vflip: boolean | undefined, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    const op = crdtSetAttr(shape, 'isFlippedVertical', vflip);
    if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    return op;
}
export function shapeModifyResizingConstraint(shape: Shape, resizingConstraint: number) {
    return crdtSetAttr(shape, 'resizingConstraint', resizingConstraint);
}
// export function shapeModifyContextSettingOpacity(shape: Shape, contextSettingsOpacity: number) {
//     if (!shape.style.contextSettings) {
//         shape.style.contextSettings = new ContextSettings(BlendMode.Normal, 1);
//     }
//     return crdtSetAttr(shape.style.contextSettings, 'opacity', contextSettingsOpacity);
// }
export function shapeModifyRadius(shape: RectShape, lt: number, rt: number, rb: number, lb: number) {
    const ps = shape.points;
    if (ps.length === 4) {
        return [crdtSetAttr(ps[0], 'radius', lt), crdtSetAttr(ps[1], 'radius', rt), crdtSetAttr(ps[2], 'radius', rb), crdtSetAttr(ps[3], 'radius', lb)];
    }
}
export function shapeModifyFixedRadius(shape: GroupShape | PathShape | PathShape2, fixedRadius: number | undefined) {
    return crdtSetAttr(shape, 'fixedRadius', fixedRadius);
}
export function shapeModifyBoolOp(shape: Shape, op: BoolOp | undefined) {
    return crdtSetAttr(shape, 'boolOp', op);
}
export function shapeModifyPathShapeClosedStatus(shape: Shape, val: boolean, segment = -1) {
    if (segment > -1) {
        const seg = (shape as PathShape2).pathsegs[segment];
        if (seg) {
            return crdtSetAttr(seg, 'isClosed', val);
        }
    } else {
        return crdtSetAttr(shape, 'isClosed', val);
    }
}

export function deleteSegmentAt(shape: PathShape2, segment: number) {
    return crdtArrayRemove(shape.pathsegs, segment)
}

// path
export function shapeModifyCurvPoint(shape: Shape, index: number, point: Point2D, segment = -1) {
    // check
    _checkNum(point.x);
    _checkNum(point.y);

    if (segment > -1) {
        const p = (shape as PathShape2)?.pathsegs[segment]?.points[index];
        if (p) return [crdtSetAttr(p, 'x', point.x), crdtSetAttr(p, 'y', point.y)];
    } else {
        const p = (shape as PathShape).points[index];
        if (p) return [crdtSetAttr(p, 'x', point.x), crdtSetAttr(p, 'y', point.y)];
    }
}
export function shapeModifyCurvFromPoint(shape: Shape, index: number, point: Point2D, segment = -1) {
    // check
    _checkNum(point.x);
    _checkNum(point.y);

    if (segment > -1) {
        const p = (shape as PathShape2)?.pathsegs[segment]?.points[index];
        if (p) return [crdtSetAttr(p, 'fromX', point.x), crdtSetAttr(p, 'fromY', point.y)];
    } else {
        const p = (shape as PathShape).points[index];
        if (p) return [crdtSetAttr(p, 'fromX', point.x), crdtSetAttr(p, 'fromY', point.y)];
    }

}
export function shapeModifyCurvToPoint(shape: Shape, index: number, point: Point2D, segment = -1) {
    // check
    _checkNum(point.x);
    _checkNum(point.y);

    if (segment > -1) {
        const p = (shape as PathShape2)?.pathsegs[segment]?.points[index];
        if (p) return [crdtSetAttr(p, 'toX', point.x), crdtSetAttr(p, 'toY', point.y)];
    } else {
        const p = (shape as PathShape).points[index];
        if (p) return [crdtSetAttr(p, 'toX', point.x), crdtSetAttr(p, 'toY', point.y)];
    }
}
export function shapeModifyCurveMode(shape:Shape, index: number, curveMode: CurveMode, segment = -1) {
    if (segment > -1) {
        const p = (shape as PathShape2)?.pathsegs[segment]?.points[index];
        if (p) return crdtSetAttr(p, 'mode', curveMode);
    } else {
        const p = (shape as PathShape).points[index];
        if (p) return crdtSetAttr(p, 'mode', curveMode);
    }
}
export function shapeModifyPointCornerRadius(shape: Shape, index: number, cornerRadius: number, segment = -1) {
    if (segment > -1) {
        const p = (shape as PathShape2)?.pathsegs[segment]?.points[index];
        if (p) return crdtSetAttr(p, 'radius', cornerRadius);
    } else {
        const p = (shape as PathShape).points[index];
        if (p) return crdtSetAttr(p, 'radius', cornerRadius);
    }
}
export function shapeModifyHasFrom(shape: Shape, index: number, hasFrom: boolean, segment = -1) {
    if (segment > -1) {
        const p = (shape as PathShape2)?.pathsegs[segment]?.points[index];
        if (p) return crdtSetAttr(p, 'hasFrom', hasFrom);
    } else {
        const p = (shape as PathShape).points[index];
        if (p) return crdtSetAttr(p, 'hasFrom', hasFrom);
    }
}
export function shapeModifyHasTo(shape: Shape, index: number, hasTo: boolean, segment = -1) {
    if (segment > -1) {
        const p = (shape as PathShape2)?.pathsegs[segment]?.points[index];
        if (p) return crdtSetAttr(p, 'hasTo', hasTo);
    } else {
        const p = (shape as PathShape).points[index];
        if (p) return crdtSetAttr(p, 'hasTo', hasTo);
    }
}
// path end

export function shapeModifyVariable(page: Page, _var: Variable, value: any) {
    return crdtSetAttr(_var, 'value', value);
}
export function shapeAddVariable(page: Page, shape: SymbolShape | SymbolRefShape, _var: Variable) {
    if (!shape.variables) shape.variables = new BasicMap<string, Variable>();
    return crdtSetAttr(shape.variables, _var.id, _var);
}
export function shapeRemoveVariable(page: Page, shape: SymbolShape | SymbolRefShape, key: string) {
    if (shape.variables) return crdtSetAttr(shape.variables, key, undefined);
}
export function shapeBindVar(page: Page, shape: Shape, type: OverrideType, varId: string) {
    if (!shape.varbinds) shape.varbinds = new BasicMap();
    return crdtSetAttr(shape.varbinds, type, varId);
}
export function shapeUnbindVar(shape: Shape, type: OverrideType) {
    if (shape.varbinds) return crdtSetAttr(shape.varbinds, type, undefined);
}
export function shapeModifyOverride(page: Page, shape: SymbolRefShape, refId: string, value: string) {
    shapeAddOverride(page, shape, refId, value);
}
export function shapeAddOverride(page: Page, shape: SymbolRefShape, refId: string, value: string) {
    if (!shape.overrides) shape.overrides = new BasicMap<string, string>();
    // refId = genRefId(refId, attr); // id+type->var
    shape.overrides.set(refId, value);
    return crdtSetAttr(shape.overrides, refId, value);
}
export function shapeModifyVartag(page: Page, shape: SymbolShape, varId: string, tag: string) {
    if (!shape.symtags) shape.symtags = new BasicMap();
    return crdtSetAttr(shape.symtags, varId, tag);
}
export function shapeRemoveOverride(shape: SymbolRefShape, refId: string) {
    if (shape.overrides) return crdtSetAttr(shape.overrides, refId, undefined);
}