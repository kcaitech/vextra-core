/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page } from "../../data/page";
import {
    CornerRadius,
    GroupShape,
    PathShape,
    PolygonShape,
    RectShape,
    Shape,
    StarShape,
    SymbolShape,
    Variable
} from "../../data/shape";
import { ContactShape, SymbolRefShape, ContactForm, Artboard, AutoLayout } from "../../data/classes";
import { BasicArray, BasicMap } from "../../data/basic";
import { crdtSetAttr } from "./basic";
import { v4 } from "uuid";
import { BoolOp, CurveMode, MarkerType, OverrideType, Point2D, Transform } from "../../data/typesdefine";
import { isGoodCrdtArr } from "../basic/crdt";
import { Transform as TransformImpl } from "../../data/transform"

function _checkNum(x: number) {
    // check
    if (Number.isNaN(x) || (!Number.isFinite(x))) throw new Error(String(x));
}

export function shapeModifyXY(page: Page, shape: Shape, x: number, y: number) {
    // check
    _checkNum(x);
    let transform = shape.transform;
    if (x !== transform.m02 || y !== transform.m12) {
        // transform整个一起改，不能单独修改其中一个值
        // 或者只能单独修改一个值，不可以整个替换transform
        // 这里选择整个替换，要保证transform不给改坏，要能可逆
        // const op = crdtSetAttr(shape.transform, 'm02', x);
        // if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        transform = TransformImpl.from(transform)
        transform.m02 = x
        transform.m12 = y
        return shapeModifyTransform(page, shape, transform)
    }
}

export function shapeModifyWH(page: Page, shape: Shape, w: number, h: number) {
    // check
    if (Number.isNaN(w) || (!Number.isFinite(w))) throw new Error(String(w));
    if (Number.isNaN(h) || (!Number.isFinite(h))) throw new Error(String(h));
    if (!shape.hasSize()) return;
    const size = shape.size;
    if (w !== size.width || h !== size.height) {
        const op = [crdtSetAttr(size, 'width', w), crdtSetAttr(size, 'height', h)];
        // shape.setFrameSize(w, h); // todo
        // if (needUpdateFrame) needUpdateFrame.push({ shape, page });
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
export function shapeModifyWidth(page: Page, shape: Shape, w: number) {
    // check
    if (Number.isNaN(w) || (!Number.isFinite(w))) throw new Error(String(w));
    if (shape.hasSize() && shape.size.width !== w) {
        // shape.setFrameSize(w, frame.height); // todo
        const op = crdtSetAttr(shape.size, 'width', w);
        // if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return op;
    }
}
export function shapeModifyHeight(page: Page, shape: Shape, h: number) {
    // check
    if (Number.isNaN(h) || (!Number.isFinite(h))) throw new Error(String(h));
    if (shape.hasSize() && h !== shape.size.height) {
        // shape.setFrameSize(frame.width, h);
        const op = crdtSetAttr(shape.size, 'height', h);
        // if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return op;
    }
}
export function shapeModifyTransform(page: Page, shape: Shape, transform: Transform) {
    const ops = [];
    ops.push(crdtSetAttr(shape, 'transform', TransformImpl.from(transform) /* 拷贝一下,防止外面重用transform */));
    // ops.push(crdtSetAttr(shape.transform, 'm00', transform.m00));
    // ops.push(crdtSetAttr(shape.transform, 'm10', transform.m10));
    // ops.push(crdtSetAttr(shape.transform, 'm01', transform.m01));
    // ops.push(crdtSetAttr(shape.transform, 'm11', transform.m11));
    // ops.push(crdtSetAttr(shape.transform, 'm02', transform.m02));
    // ops.push(crdtSetAttr(shape.transform, 'm12', transform.m12));
    // if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    return ops;
}

export function shapeModifyCounts(shape: (PolygonShape | StarShape), counts: number) {
    if (Number.isNaN(counts) || (!Number.isFinite(counts))) throw new Error(String(counts));
    if (counts !== shape.counts) {
        return crdtSetAttr(shape, 'counts', counts);
    }
}
export function shapeModifyInnerAngle(shape: StarShape, offset: number) {
    if (Number.isNaN(offset)) throw new Error(String(offset));
    offset = Math.min(Math.max(offset, 0.001), 1);
    if (offset !== shape.innerAngle) {
        return crdtSetAttr(shape, 'innerAngle', offset);
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

export function shapeAutoLayout(shape: SymbolShape | Artboard | Variable, autoLayout: AutoLayout | undefined) {
    if (shape instanceof Shape) return crdtSetAttr(shape, 'autoLayout', autoLayout);
    else return crdtSetAttr(shape, 'value', autoLayout); // shape.value = autoLayout;
}
export function shapeModifyHFlip(page: Page, shape: Shape, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    const transform2 = (shape.transform.clone());
    const center = shape.matrix2Parent().computeCoord2(shape.size.width / 2, shape.size.height / 2);
    transform2.flipHoriz(center.x);
    // updateShapeTransform1By2(shape.transform, transform2);
    const ops = shapeModifyTransform(page, shape, transform2);
    // ops.push(crdtSetAttr(shape.transform, 'm00', transform2.m00));
    // ops.push(crdtSetAttr(shape.transform, 'm10', transform2.m10));
    // ops.push(crdtSetAttr(shape.transform, 'm01', transform2.m01));
    // ops.push(crdtSetAttr(shape.transform, 'm11', transform2.m11));
    // ops.push(crdtSetAttr(shape.transform, 'm02', transform2.m03));
    // ops.push(crdtSetAttr(shape.transform, 'm12', transform2.m13));
    if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    return ops;
}
export function shapeModifyVFlip(page: Page, shape: Shape, needUpdateFrame?: { shape: Shape, page: Page }[]) {
    const transform2 = (shape.transform.clone());
    const center = shape.matrix2Parent().computeCoord2(shape.size.width / 2, shape.size.height / 2);
    transform2.flipVert(center.y);
    // updateShapeTransform1By2(shape.transform, transform2);
    const ops = shapeModifyTransform(page, shape, transform2);
    // ops.push(crdtSetAttr(shape.transform, 'm00', transform2.m00));
    // ops.push(crdtSetAttr(shape.transform, 'm10', transform2.m10));
    // ops.push(crdtSetAttr(shape.transform, 'm01', transform2.m01));
    // ops.push(crdtSetAttr(shape.transform, 'm11', transform2.m11));
    // ops.push(crdtSetAttr(shape.transform, 'm02', transform2.m03));
    // ops.push(crdtSetAttr(shape.transform, 'm12', transform2.m13));
    if (needUpdateFrame) needUpdateFrame.push({ shape, page });
    return ops;
}

export function shapeModifyResizingConstraint(shape: Shape, resizingConstraint: number) {
    return crdtSetAttr(shape, 'resizingConstraint', resizingConstraint);
}
export function shapeModifyRadius(shape: RectShape, lt: number, rt: number, rb: number, lb: number) {
    const ps = shape.pathsegs[0].points;
    if (ps.length === 4) {
        return [crdtSetAttr(ps[0], 'radius', lt), crdtSetAttr(ps[1], 'radius', rt), crdtSetAttr(ps[2], 'radius', rb), crdtSetAttr(ps[3], 'radius', lb)];
    }
}
export function shapeModifyRadius2(parent: Artboard | SymbolShape | Variable, cornerRadius: CornerRadius | undefined, lt: number, rt: number, rb: number, lb: number) {
    // let cornerRadius = shape.cornerRadius;
    if (!cornerRadius) {
        if (parent instanceof Variable) {
            throw new Error();
        }
        parent.cornerRadius = new CornerRadius(v4(), 0, 0, 0, 0);
        cornerRadius = parent.cornerRadius;
    }
    const ops = [];
    if (cornerRadius.lt !== lt && lt >= 0) ops.push(crdtSetAttr(cornerRadius, 'lt', lt));
    if (cornerRadius.rt !== rt && rt >= 0) ops.push(crdtSetAttr(cornerRadius, 'rt', rt));
    if (cornerRadius.lb !== lb && lb >= 0) ops.push(crdtSetAttr(cornerRadius, 'lb', lb));
    if (cornerRadius.rb !== rb && rb >= 0) ops.push(crdtSetAttr(cornerRadius, 'rb', rb));
    return ops;
}
export function shapeModifyFixedRadius(shape: GroupShape | PathShape, fixedRadius: number | undefined) {
    return crdtSetAttr(shape, 'fixedRadius', fixedRadius);
}
export function shapeModifyBoolOp(shape: Shape, op: BoolOp | undefined) {
    return crdtSetAttr(shape, 'boolOp', op);
}
export function shapeModifyPathShapeClosedStatus(shape: PathShape, val: boolean, segmentIndex: number) {
    const seg = shape.pathsegs[segmentIndex];
    if (seg) {
        return crdtSetAttr(seg, 'isClosed', val);
    }
}

// path
export function shapeModifyCurvPoint(shape: PathShape, index: number, point: Point2D, segment: number) {
    // check
    _checkNum(point.x);
    _checkNum(point.y);

    if (segment > -1) {
        const p = shape.pathsegs[segment]?.points[index];
        if (p) return [crdtSetAttr(p, 'x', point.x), crdtSetAttr(p, 'y', point.y)];
    }
    // else {
    //     const p = (shape as PathShape).points[index];
    //     if (p) return [crdtSetAttr(p, 'x', point.x), crdtSetAttr(p, 'y', point.y)];
    // }
}

export function shapeModifyCurvFromPoint(shape: PathShape, index: number, point: Point2D, segmentIndex: number) {
    // check
    _checkNum(point.x);
    _checkNum(point.y);

    const p = shape.pathsegs[segmentIndex]?.points[index];
    if (p) {
        return [crdtSetAttr(p, 'fromX', point.x), crdtSetAttr(p, 'fromY', point.y)];
    }
}

export function shapeModifyCurvToPoint(shape: PathShape, index: number, point: Point2D, segmentIndex: number) {
    // check
    _checkNum(point.x);
    _checkNum(point.y);

    const p = shape.pathsegs[segmentIndex]?.points[index];
    if (p) return [crdtSetAttr(p, 'toX', point.x), crdtSetAttr(p, 'toY', point.y)];
}

export function shapeModifyCurveMode(shape: PathShape, index: number, curveMode: CurveMode, segmentIndex: number) {
    const p = shape.pathsegs[segmentIndex]?.points[index];
    if (p) return crdtSetAttr(p, 'mode', curveMode);
}
export function shapeModifyPointCornerRadius(shape: PathShape, index: number, cornerRadius: number, segmentIndex: number) {
    const p = shape.pathsegs[segmentIndex]?.points[index];
    if (p) return crdtSetAttr(p, 'radius', cornerRadius);
}
export function shapeModifyHasFrom(shape: PathShape, index: number, hasFrom: boolean, segmentIndex: number) {
    const p = shape.pathsegs[segmentIndex]?.points[index];
    if (p) return crdtSetAttr(p, 'hasFrom', hasFrom);
}
export function shapeModifyHasTo(shape: PathShape, index: number, hasTo: boolean, segmentIndex: number) {
    const p = shape.pathsegs[segmentIndex]?.points[index];
    if (p) return crdtSetAttr(p, 'hasTo', hasTo);
}
// path end

export function shapeModifyVariable(page: Page, _var: Variable, value: any) {
    return crdtSetAttr(_var, 'value', value);
}

function _checkVariableValue(value: any) {
    // check crdt
    if (Array.isArray(value) && value.length > 0 && value[0].crdtidx) {
        if (!isGoodCrdtArr(value)) throw new Error("wrong variable value")
    } else if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(k => (!k.startsWith('__')) && _checkVariableValue(value[k]))
    }
}

export function shapeAddVariable(page: Page, shape: SymbolShape | SymbolRefShape, _var: Variable) {
    // check crdt
    _checkVariableValue(_var.value)
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
    // shape.overrides.set(refId, value);
    return crdtSetAttr(shape.overrides, refId, value);
}
export function shapeModifyVartag(page: Page, shape: SymbolShape, varId: string, tag: string) {
    if (!shape.symtags) shape.symtags = new BasicMap();
    return crdtSetAttr(shape.symtags, varId, tag);
}
export function shapeRemoveOverride(shape: SymbolRefShape, refId: string) {
    if (shape.overrides) return crdtSetAttr(shape.overrides, refId, undefined);
}