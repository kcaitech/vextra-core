/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Page } from "../data/page";
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
} from "../data/shape";
import { ContactShape, SymbolRefShape, ContactForm, Artboard, AutoLayout } from "../data/classes";
import { BasicArray, BasicMap } from "../data/basic";
import { v4 } from "uuid";
import { BoolOp, CurveMode, MarkerType, OverrideType, Point2D, Transform } from "../data/typesdefine";
import { Transform as TransformImpl } from "../data/transform"
import { BasicOp } from "./basicop";

function _checkNum(x: number) {
    // check
    if (Number.isNaN(x) || (!Number.isFinite(x))) throw new Error(String(x));
}

export class ShapeOp {
    constructor(private _basicop: BasicOp) { }

    shapeModifyXY(page: Page, shape: Shape, x: number, y: number) {
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
            return this.shapeModifyTransform(page, shape, transform)
        }
    }

    shapeModifyWH(page: Page, shape: Shape, w: number, h: number) {
        // check
        if (Number.isNaN(w) || (!Number.isFinite(w))) throw new Error(String(w));
        if (Number.isNaN(h) || (!Number.isFinite(h))) throw new Error(String(h));
        if (!shape.hasSize()) return;
        const size = shape.size;
        if (w !== size.width || h !== size.height) {
            const op = [this._basicop.crdtSetAttr(size, 'width', w), this._basicop.crdtSetAttr(size, 'height', h)];
            // shape.setFrameSize(w, h); // todo
            // if (needUpdateFrame) needUpdateFrame.push({ shape, page });
            return op;
        }
    }
    shapeModifyStartMarkerType(shape: Shape, mt: MarkerType) {
        const style = shape.style;
        if (mt !== style.startMarkerType) return this._basicop.crdtSetAttr(style, 'startMarkerType', mt);
    }
    shapeModifyEndMarkerType(shape: Shape, mt: MarkerType) {
        const style = shape.style;
        if (mt !== style.endMarkerType) return this._basicop.crdtSetAttr(style, 'endMarkerType', mt);
    }
    shapeModifyWidth(page: Page, shape: Shape, w: number) {
        // check
        if (Number.isNaN(w) || (!Number.isFinite(w))) throw new Error(String(w));
        if (shape.hasSize() && shape.size.width !== w) {
            // shape.setFrameSize(w, frame.height); // todo
            const op = this._basicop.crdtSetAttr(shape.size, 'width', w);
            // if (needUpdateFrame) needUpdateFrame.push({ shape, page });
            return op;
        }
    }
    shapeModifyHeight(page: Page, shape: Shape, h: number) {
        // check
        if (Number.isNaN(h) || (!Number.isFinite(h))) throw new Error(String(h));
        if (shape.hasSize() && h !== shape.size.height) {
            // shape.setFrameSize(frame.width, h);
            const op = this._basicop.crdtSetAttr(shape.size, 'height', h);
            // if (needUpdateFrame) needUpdateFrame.push({ shape, page });
            return op;
        }
    }
    shapeModifyTransform(page: Page, shape: Shape, transform: Transform) {
        const ops = [];
        ops.push(this._basicop.crdtSetAttr(shape, 'transform', TransformImpl.from(transform) /* 拷贝一下,防止外面重用transform */));
        // ops.push(crdtSetAttr(shape.transform, 'm00', transform.m00));
        // ops.push(crdtSetAttr(shape.transform, 'm10', transform.m10));
        // ops.push(crdtSetAttr(shape.transform, 'm01', transform.m01));
        // ops.push(crdtSetAttr(shape.transform, 'm11', transform.m11));
        // ops.push(crdtSetAttr(shape.transform, 'm02', transform.m02));
        // ops.push(crdtSetAttr(shape.transform, 'm12', transform.m12));
        // if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return ops;
    }

    shapeModifyCounts(shape: (PolygonShape | StarShape), counts: number) {
        if (Number.isNaN(counts) || (!Number.isFinite(counts))) throw new Error(String(counts));
        if (counts !== shape.counts) {
            return this._basicop.crdtSetAttr(shape, 'counts', counts);
        }
    }
    shapeModifyInnerAngle(shape: StarShape, offset: number) {
        if (Number.isNaN(offset)) throw new Error(String(offset));
        offset = Math.min(Math.max(offset, 0.001), 1);
        if (offset !== shape.innerAngle) {
            return this._basicop.crdtSetAttr(shape, 'innerAngle', offset);
        }
    }
    shapeModifyConstrainerProportions(shape: Shape, prop: boolean) {
        if (shape.constrainerProportions !== prop) return this._basicop.crdtSetAttr(shape, 'constrainerProportions', prop);
    }
    shapeModifyNameFixed(shape: Shape, isFixed: boolean) {
        if (shape.nameIsFixed !== isFixed) return this._basicop.crdtSetAttr(shape, 'nameIsFixed', isFixed);
    }
    shapeModifyContactTo(shape: ContactShape, to: ContactForm | undefined) {
        return this._basicop.crdtSetAttr(shape, 'to', to);
    }
    shapeModifyContactFrom(shape: ContactShape, from: ContactForm | undefined) {
        return this._basicop.crdtSetAttr(shape, 'from', from);
    }
    shapeModifyEditedState(shape: ContactShape, state: boolean) {
        return this._basicop.crdtSetAttr(shape, 'isEdited', state);
    }
    shapeModifyName(shape: Shape, name: string) {
        return this._basicop.crdtSetAttr(shape, 'name', name);
    }
    shapeModifyVisible(shape: Shape | Variable, isVisible: boolean) {
        if (shape instanceof Shape) return this._basicop.crdtSetAttr(shape, 'isVisible', isVisible);
        else return this._basicop.crdtSetAttr(shape, 'value', isVisible); // shape.value = isVisible;
    }
    shapeModifyLock(shape: Shape, isLocked: boolean) {
        return this._basicop.crdtSetAttr(shape, 'isLocked', isLocked);
    }

    shapeAutoLayout(shape: SymbolShape | Artboard | Variable, autoLayout: AutoLayout | undefined) {
        if (shape instanceof Shape) return this._basicop.crdtSetAttr(shape, 'autoLayout', autoLayout);
        else return this._basicop.crdtSetAttr(shape, 'value', autoLayout); // shape.value = autoLayout;
    }
    shapeModifyHFlip(page: Page, shape: Shape, needUpdateFrame?: { shape: Shape, page: Page }[]) {
        const transform2 = (shape.transform.clone());
        const center = shape.matrix2Parent().computeCoord2(shape.size.width / 2, shape.size.height / 2);
        transform2.flipHoriz(center.x);
        // updateShapeTransform1By2(shape.transform, transform2);
        const ops = this.shapeModifyTransform(page, shape, transform2);
        // ops.push(crdtSetAttr(shape.transform, 'm00', transform2.m00));
        // ops.push(crdtSetAttr(shape.transform, 'm10', transform2.m10));
        // ops.push(crdtSetAttr(shape.transform, 'm01', transform2.m01));
        // ops.push(crdtSetAttr(shape.transform, 'm11', transform2.m11));
        // ops.push(crdtSetAttr(shape.transform, 'm02', transform2.m03));
        // ops.push(crdtSetAttr(shape.transform, 'm12', transform2.m13));
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return ops;
    }
    shapeModifyVFlip(page: Page, shape: Shape, needUpdateFrame?: { shape: Shape, page: Page }[]) {
        const transform2 = (shape.transform.clone());
        const center = shape.matrix2Parent().computeCoord2(shape.size.width / 2, shape.size.height / 2);
        transform2.flipVert(center.y);
        // updateShapeTransform1By2(shape.transform, transform2);
        const ops = this.shapeModifyTransform(page, shape, transform2);
        // ops.push(crdtSetAttr(shape.transform, 'm00', transform2.m00));
        // ops.push(crdtSetAttr(shape.transform, 'm10', transform2.m10));
        // ops.push(crdtSetAttr(shape.transform, 'm01', transform2.m01));
        // ops.push(crdtSetAttr(shape.transform, 'm11', transform2.m11));
        // ops.push(crdtSetAttr(shape.transform, 'm02', transform2.m03));
        // ops.push(crdtSetAttr(shape.transform, 'm12', transform2.m13));
        if (needUpdateFrame) needUpdateFrame.push({ shape, page });
        return ops;
    }

    shapeModifyResizingConstraint(shape: Shape, resizingConstraint: number) {
        return this._basicop.crdtSetAttr(shape, 'resizingConstraint', resizingConstraint);
    }
    shapeModifyRadius(shape: RectShape, lt: number, rt: number, rb: number, lb: number) {
        const ps = shape.pathsegs[0].points;
        if (ps.length === 4) {
            this._basicop.crdtSetAttr(ps[0], 'radius', lt)
            this._basicop.crdtSetAttr(ps[1], 'radius', rt)
            this._basicop.crdtSetAttr(ps[2], 'radius', rb)
            this._basicop.crdtSetAttr(ps[3], 'radius', lb)
        }
    }
    shapeModifyRadius2(parent: Artboard | SymbolShape | Variable, cornerRadius: CornerRadius | undefined, lt: number, rt: number, rb: number, lb: number) {
        // let cornerRadius = shape.cornerRadius;
        if (!cornerRadius) {
            if (parent instanceof Variable) {
                throw new Error();
            }
            parent.cornerRadius = new CornerRadius(v4(), 0, 0, 0, 0);
            cornerRadius = parent.cornerRadius;
        }

        if (cornerRadius.lt !== lt && lt >= 0) this._basicop.crdtSetAttr(cornerRadius, 'lt', lt);
        if (cornerRadius.rt !== rt && rt >= 0) this._basicop.crdtSetAttr(cornerRadius, 'rt', rt);
        if (cornerRadius.lb !== lb && lb >= 0) this._basicop.crdtSetAttr(cornerRadius, 'lb', lb);
        if (cornerRadius.rb !== rb && rb >= 0) this._basicop.crdtSetAttr(cornerRadius, 'rb', rb);
    }
    shapeModifyFixedRadius(shape: GroupShape | PathShape, fixedRadius: number | undefined) {
        return this._basicop.crdtSetAttr(shape, 'fixedRadius', fixedRadius);
    }
    shapeModifyBoolOp(shape: Shape, op: BoolOp | undefined) {
        return this._basicop.crdtSetAttr(shape, 'boolOp', op);
    }
    shapeModifyPathShapeClosedStatus(shape: PathShape, val: boolean, segmentIndex: number) {
        const seg = shape.pathsegs[segmentIndex];
        if (seg) {
            return this._basicop.crdtSetAttr(seg, 'isClosed', val);
        }
    }

    // path
    shapeModifyCurvPoint(shape: PathShape, index: number, point: Point2D, segment: number) {
        // check
        _checkNum(point.x);
        _checkNum(point.y);

        if (segment > -1) {
            const p = shape.pathsegs[segment]?.points[index];
            if (p) {
                this._basicop.crdtSetAttr(p, 'x', point.x)
                this._basicop.crdtSetAttr(p, 'y', point.y)
            }
        }
        // else {
        //     const p = (shape as PathShape).points[index];
        //     if (p) return [crdtSetAttr(p, 'x', point.x), crdtSetAttr(p, 'y', point.y)];
        // }
    }

    shapeModifyCurvFromPoint(shape: PathShape, index: number, point: Point2D, segmentIndex: number) {
        // check
        _checkNum(point.x);
        _checkNum(point.y);

        const p = shape.pathsegs[segmentIndex]?.points[index];
        if (p) {
            this._basicop.crdtSetAttr(p, 'fromX', point.x)
            this._basicop.crdtSetAttr(p, 'fromY', point.y)
        }
    }

    shapeModifyCurvToPoint(shape: PathShape, index: number, point: Point2D, segmentIndex: number) {
        // check
        _checkNum(point.x);
        _checkNum(point.y);

        const p = shape.pathsegs[segmentIndex]?.points[index];
        if (p) {
            this._basicop.crdtSetAttr(p, 'toX', point.x)
            this._basicop.crdtSetAttr(p, 'toY', point.y)
        }
    }

    shapeModifyCurveMode(shape: PathShape, index: number, curveMode: CurveMode, segmentIndex: number) {
        const p = shape.pathsegs[segmentIndex]?.points[index];
        if (p) this._basicop.crdtSetAttr(p, 'mode', curveMode);
    }
    shapeModifyPointCornerRadius(shape: PathShape, index: number, cornerRadius: number, segmentIndex: number) {
        const p = shape.pathsegs[segmentIndex]?.points[index];
        if (p) this._basicop.crdtSetAttr(p, 'radius', cornerRadius);
    }
    shapeModifyHasFrom(shape: PathShape, index: number, hasFrom: boolean, segmentIndex: number) {
        const p = shape.pathsegs[segmentIndex]?.points[index];
        if (p) this._basicop.crdtSetAttr(p, 'hasFrom', hasFrom);
    }
    shapeModifyHasTo(shape: PathShape, index: number, hasTo: boolean, segmentIndex: number) {
        const p = shape.pathsegs[segmentIndex]?.points[index];
        if (p) this._basicop.crdtSetAttr(p, 'hasTo', hasTo);
    }
    // path end

    shapeModifyVariable(page: Page, _var: Variable, value: any) {
        return this._basicop.crdtSetAttr(_var, 'value', value);
    }



    shapeAddVariable(page: Page, shape: SymbolShape | SymbolRefShape, _var: Variable) {
        // check crdt

        if (!shape.variables) shape.variables = new BasicMap<string, Variable>();
        return this._basicop.crdtSetAttr(shape.variables, _var.id, _var);
    }
    shapeRemoveVariable(page: Page, shape: SymbolShape | SymbolRefShape, key: string) {
        if (shape.variables) return this._basicop.crdtSetAttr(shape.variables, key, undefined);
    }
    shapeBindVar(page: Page, shape: Shape, type: OverrideType, varId: string) {
        if (!shape.varbinds) shape.varbinds = new BasicMap();
        return this._basicop.crdtSetAttr(shape.varbinds, type, varId);
    }
    shapeUnbindVar(shape: Shape, type: OverrideType) {
        if (shape.varbinds) return this._basicop.crdtSetAttr(shape.varbinds, type, undefined);
    }
    shapeModifyOverride(page: Page, shape: SymbolRefShape, refId: string, value: string) {
        this.shapeAddOverride(page, shape, refId, value);
    }
    shapeAddOverride(page: Page, shape: SymbolRefShape, refId: string, value: string) {
        if (!shape.overrides) shape.overrides = new BasicMap<string, string>();
        // refId = genRefId(refId, attr); // id+type->var
        // shape.overrides.set(refId, value);
        return this._basicop.crdtSetAttr(shape.overrides, refId, value);
    }
    shapeModifyVartag(page: Page, shape: SymbolShape, varId: string, tag: string) {
        if (!shape.symtags) shape.symtags = new BasicMap();
        return this._basicop.crdtSetAttr(shape.symtags, varId, tag);
    }
    shapeRemoveOverride(shape: SymbolRefShape, refId: string) {
        if (shape.overrides) return this._basicop.crdtSetAttr(shape.overrides, refId, undefined);
    }
}