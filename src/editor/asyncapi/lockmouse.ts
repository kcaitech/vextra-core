/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { AsyncApiCaller } from "./basic/asyncapi";
import { IRepository } from "../../repo";
import { adapt2Shape, ArtboardView, GroupShapeView, PageView, ShapeView, SymbolRefView } from "../../dataview";
import { translate } from "../frame";
import { _ov, override_variable, shape4Autolayout, shape4cornerRadius } from "../symbol";
import {
    GroupShape,
    PathShape,
    PolygonShape,
    Shape,
    StarShape,
    SymbolShape,
    TextShape,
    Transform,
    Artboard,
    ShapeType,
    SymbolRefShape,
    Document,
    RadiusType,
    TextBehaviour,
    StackSizing,
    OvalShape, ContactShape,
    Shadow,
    VariableType,
    OverrideType,
    SideType,
    BorderSideSetting
} from "../../data";
import {
    calculateInnerAnglePosition,
} from "../utils/path";
import {
    getPolygonPoints,
    getPolygonVertices
} from "../../data/utils";
import {
    RangeRecorder,
    reLayoutBySizeChanged,
    SizeRecorder,
    TransformRecorder,
} from "./transform";
import { fixTextShapeFrameByLayout } from "../utils/other";
import { TidyUpAlign, tidyUpLayout } from "../utils/auto_layout";
import { modifyPathByArc } from "./arc";
import { Operator } from "../../operator";
import { importBorder } from "../../data/baseimport";

export class LockMouseHandler extends AsyncApiCaller {
    private recorder: RangeRecorder = new Map();
    private sizeRecorder: SizeRecorder = new Map();
    private transformRecorder: TransformRecorder = new Map();
    private valueRecorder: Map<string, number> = new Map();
    private whRatioMap = new Map<string, number>();
    updateFrameTargets: Set<Shape> = new Set();
    protected _page: PageView;

    constructor(repo: IRepository, document: Document, page: PageView) {
        super(repo, document, page);
        this._page = page;
    }

    start() {
        return this.__repo.start('lock-mouse');
    }

    executeX(shapes: ShapeView[], dx: number) {
        try {
            const op = this.operator;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const parent = shape.parent;
                if (parent && (parent as ArtboardView).autoLayout) continue;
                if (shape.isVirtualShape) continue;
                translate(op, page, adapt2Shape(shape), dx, 0);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeX', e);
        }
    }

    executeY(shapes: ShapeView[], dy: number) {
        try {
            const op = this.operator;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const parent = shape.parent;
                if (parent && (parent as ArtboardView).autoLayout) continue;
                if (shape.isVirtualShape) continue;
                translate(op, page, adapt2Shape(shape), 0, dy);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeY', e);
        }
    }

    executeW(shapes: ShapeView[], dw: number) {
        try {
            const op = this.operator;
            const page = this.page;
            const whRatioMap = this.whRatioMap;
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const shape = adapt2Shape(view);
                if (shape.isVirtualShape) continue;
                const size = shape.size;
                let dh = 0;
                if (shape.constrainerProportions) {
                    if (!whRatioMap.has(shape.id)) {
                        const ratio = size.width / size.height;
                        whRatioMap.set(shape.id, ratio);
                    }
                    const ratio = whRatioMap.get(shape.id);
                    if (ratio) dh = dw / ratio;
                }
                op.shapeModifyWidth(page, shape, size.width + dw)
                if (dh) op.shapeModifyHeight(page, shape, size.height + dh);
                if (shape instanceof TextShape) {
                    const textBehaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
                    if (textBehaviour === TextBehaviour.Flexible) {
                        op.shapeModifyTextBehaviour(page, shape.text, TextBehaviour.Fixed);
                    }
                    fixTextShapeFrameByLayout(op, page, shape);
                } else {
                    if ((view as ArtboardView).autoLayout) {
                        const _shape = shape4Autolayout(op, view, this._page);
                        op.shapeModifyAutoLayoutSizing(page, _shape, StackSizing.Fixed, 'hor');
                    }
                }

                if (view instanceof GroupShapeView) {
                    reLayoutBySizeChanged(op, page, view, {
                        x: Math.abs(size.width / (size.width - dw)),
                        y: Math.abs(size.height / (size.height - dh))
                    });
                }
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeW', e);
        }
    }

    executeH(shapes: ShapeView[], dh: number) {
        try {
            const op = this.operator;
            const page = this.page;
            const whRatioMap = this.whRatioMap;
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const shape = adapt2Shape(view);
                if (shape.isVirtualShape) continue;
                const size = shape.size;
                let dw = 0;
                if (shape.constrainerProportions) {
                    if (!whRatioMap.has(shape.id)) {
                        const ratio = size.width / size.height;
                        whRatioMap.set(shape.id, ratio);
                    }
                    const ratio = whRatioMap.get(shape.id);
                    if (ratio) dw = dh * ratio;
                }
                op.shapeModifyHeight(page, shape, size.height + dh);
                if (dw) op.shapeModifyWidth(page, shape, size.width + dw);
                if (shape instanceof TextShape) {
                    const textBehaviour = shape.text.attr?.textBehaviour ?? TextBehaviour.Flexible;
                    if (textBehaviour !== TextBehaviour.FixWidthAndHeight) {
                        op.shapeModifyTextBehaviour(page, shape.text, TextBehaviour.FixWidthAndHeight);
                    }
                    fixTextShapeFrameByLayout(op, page, shape);
                } else {
                    if ((view as ArtboardView).autoLayout) {
                        const _shape = shape4Autolayout(op, view, this._page);
                        op.shapeModifyAutoLayoutSizing(page, _shape, StackSizing.Fixed, 'ver');
                    }
                }
                if (view instanceof GroupShapeView) {
                    reLayoutBySizeChanged(op, page, view, {
                        x: Math.abs(size.width / (size.width - dw)),
                        y: Math.abs(size.height / (size.height - dh))
                    });
                }
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeH', e);
        }
    }

    executeCounts(shapes: ShapeView[], count: number) {
        try {
            const op = this.operator;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                if (view.type !== ShapeType.Polygon && view.type !== ShapeType.Star) continue;
                const shape = adapt2Shape(shapes[i]) as PolygonShape | StarShape;
                if (shape.isVirtualShape || shape.haveEdit || shape.counts === count) continue;
                const offset = shape.type === ShapeType.Star ? (shape as StarShape).innerAngle : undefined;
                const counts = getPolygonVertices(shape.type === ShapeType.Star ? count * 2 : count, offset);
                const points = getPolygonPoints(counts, view.radius[0]);
                op.deletePoints(page, shape, 0, shape.type === ShapeType.Star ? shape.counts * 2 : shape.counts, 0);
                op.addPoints(page, shape, points, 0);
                op.shapeModifyCounts(page, shape, count);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeCounts', e);
        }
    }

    executeInnerAngle(shapes: ShapeView[], value: number) {
        try {
            const op = this.operator;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                if (shapes[i].type !== ShapeType.Star) continue;
                const shape = adapt2Shape(shapes[i]) as StarShape;
                let offset = shape.innerAngle + value;
                if (shape.haveEdit) continue;
                if (offset < 0.001) offset = 0.001;
                if (offset > 1) offset = 1;
                const segment = shape?.pathsegs[0];
                if (!segment) continue;
                const points = segment?.points;
                if (!points?.length) continue;
                for (let index = 0; index < points.length; index++) {
                    if (index % 2 === 0) continue;
                    const angle = ((2 * Math.PI) / points.length) * index;
                    const p = calculateInnerAnglePosition(offset, angle);
                    op.shapeModifyCurvPoint(page, shape, index, p, 0);
                }
                op.shapeModifyInnerAngle(page, shape, offset);
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeCounts', e);
        }
    }

    executeRotate(shapes: ShapeView[], deg: number) {
        try {
            const op = this.operator;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];

                if (shape.isVirtualShape) continue;

                const d = (shape.rotation || 0) + deg;

                const t = (shape.transform.clone());
                const { width, height } = shape.frame;

                const angle = d % 360 * Math.PI / 180;
                const os = t.decomposeRotate();

                t.rotateInLocal(angle - os, width / 2, height / 2);

                const transform = (t);
                op.shapeModifyRotate(page, adapt2Shape(shape), transform)
            }
            this.updateView();
        } catch (e) {
            console.log('LockMouseHandler.executeRotate', e);
            this.exception = true;
        }
    }

    getRadiusMaskVariable(op: Operator, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.RadiusMask, OverrideType.RadiusMask, () => value, view, page, op);
    }

    executeRadius(shapes: ShapeView[], values: number[]) {
        try {
            const op = this.operator;
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);

                if (shape.isVirtualShape) continue;
                if (shape.radiusMask) {
                    const variable = this.getRadiusMaskVariable(op, this._page, shapes[i], undefined);
                    if (variable) {
                        op.shapeModifyVariable(page, variable, undefined);
                    } else {
                        op.delradiusmask(shape);
                    }
                }

                if (shape.radiusType === RadiusType.Rect) {
                    if (values.length !== 4) {
                        values = [values[0], values[0], values[0], values[0]];
                    }

                    const [lt, rt, rb, lb] = values;

                    if (shape instanceof SymbolRefShape) {
                        const _shape = shape4cornerRadius(op, this.pageView, shapes[i] as SymbolRefView);
                        op.shapeModifyRadius2(page, _shape, lt, rt, rb, lb);
                    }

                    if (shape instanceof PathShape) {
                        const points = shape.pathsegs[0].points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) continue;
                            op.modifyPointCornerRadius(page, shape, _i, val, 0);
                        }
                        this.updateFrameTargets.add(shape);
                    } else {
                        const __shape = shape as Artboard | SymbolShape;
                        op.shapeModifyRadius2(page, __shape, lt, rt, rb, lb)
                    }
                } else {
                    if (shape instanceof ContactShape || !(shape instanceof PathShape)) {
                        op.shapeModifyFixedRadius(page, shape as ContactShape | GroupShape | TextShape, values[0]);
                    } else {
                        shape.pathsegs.forEach((seg, index) => {
                            for (let _i = 0; _i < seg.points.length; _i++) {
                                if (seg.points[_i].radius === values[0]) continue;
                                op.modifyPointCornerRadius(page, shape, _i, values[0], index);
                            }
                        });
                        this.updateFrameTargets.add(shape);
                    }
                }
            }
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeRadius', e);
        }
    }

    executeShadowX(actions: { shadow: Shadow, value: number }[]) {
        try {
            const op = this.operator;
            for (let i = 0; i < actions.length; i++) {
                const { shadow, value } = actions[i];
                op.setShadowOffsetX(shadow, value);
            }

            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeShadowX');
        }
    }

    executeShadowY(actions: { shadow: Shadow, value: number }[]) {
        try {
            const op = this.operator;
            for (let i = 0; i < actions.length; i++) {
                const { shadow, value } = actions[i];
                op.setShadowOffsetY(shadow, value);
            }

            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeShadowY');
        }
    }

    executeShadowB(actions: { shadow: Shadow, value: number }[]) {
        try {
            const op = this.operator;
            for (let i = 0; i < actions.length; i++) {
                const { shadow, value } = actions[i];
                op.setShadowBlur(shadow, value);
            }

            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeShadowB');
        }
    }

    executeShadowS(actions: { shadow: Shadow, value: number }[]) {
        try {
            const op = this.operator;
            for (let i = 0; i < actions.length; i++) {
                const { shadow, value } = actions[i];
                op.setShadowSpread(shadow, value);
            }

            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeShadowS');
        }
    }

    executeTidyup(shapes: ShapeView[][], hor: number, ver: number, dir: boolean, algin: TidyUpAlign) {
        try {
            const op = this.operator;
            const page = this.page;
            tidyUpLayout(page, op, shapes, hor, ver, dir, algin);
            this.updateView();
        } catch (e) {
            this.exception = true;
            console.log('LockMouseHandler.executeHorTidyup', e);
        }
    }

    modifyStartingAngleBy(shapes: ShapeView[], delta: number) {
        try {
            const round = Math.PI * 2;
            const op = this.operator;
            const page = this.page;

            for (const view of shapes) {
                const shape = adapt2Shape(view);
                if (!(shape instanceof OvalShape)) continue;
                const end = shape.endingAngle ?? round;
                const start = shape.startingAngle ?? 0;

                const d = end - start;

                let targetStart = start + delta;

                if (targetStart > round) targetStart %= round;
                else if (targetStart < 0) targetStart += round;

                const targetEnd = targetStart + d;

                op.ovalModifyStartingAngle(page, shape, targetStart);
                op.ovalModifyEndingAngle(page, shape, targetEnd);

                modifyPathByArc(op, page, shape);
            }
            this.updateView();
        } catch (error) {
            console.error(error);
            this.exception = true;
        }
    }

    modifySweepBy(shapes: ShapeView[], delta: number) {
        try {
            const round = Math.PI * 2;
            const op = this.operator;
            const page = this.page;

            for (const view of shapes) {
                const shape = adapt2Shape(view);
                if (!(shape instanceof OvalShape)) continue;

                const start = shape.startingAngle ?? 0;
                const end = shape.endingAngle ?? round;

                let targetEnd = end + delta;
                if (targetEnd - start < -round) targetEnd = -round + start;
                else if (targetEnd - start > round) targetEnd = round + start;

                op.ovalModifyEndingAngle(page, shape, targetEnd);

                modifyPathByArc(op, page, shape);
            }

            this.updateView();
        } catch (error) {
            console.error(error);
            this.exception = true;
        }
    }

    modifyInnerRadiusBy(shapes: ShapeView[], delta: number) {
        try {
            const op = this.operator;
            const page = this.page;

            for (const view of shapes) {
                const shape = adapt2Shape(view);
                if (!(shape instanceof OvalShape)) continue;

                let targetInnerRadius = (shape.innerRadius ?? 0) + delta;

                if (targetInnerRadius < 0) targetInnerRadius = 0;
                else if (targetInnerRadius > 1) targetInnerRadius = 1;

                op.ovalModifyInnerRadius(page, shape, targetInnerRadius);

                modifyPathByArc(op, page, shape);
            }

            this.updateView();
        } catch (error) {
            console.error(error);
            this.exception = true;
        }
    }

    private getBorderVariable(op: Operator, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Borders, OverrideType.Borders, (_var) => {
            return importBorder(_var?.value ?? view.style.borders);
        }, op, view);
    }

    private getStrokeMaskVariable(op: Operator, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.BordersMask, OverrideType.BordersMask, () => value, view, page, op);
    }

    modifyBorderThickness(shapes: ShapeView[], thickness: number) {
        try {
            const op = this.operator;
            for (const view of shapes) {
                const border = view.getBorder();
                const linkedVariable = this.getBorderVariable(op, this._page, view);
                const source = linkedVariable ? linkedVariable.value : view.style.borders;
                if (view.bordersMask) {
                    const linkedBorderMaskVariable = this.getStrokeMaskVariable(op, this._page, view, undefined);
                    if (linkedBorderMaskVariable) {
                        op.shapeModifyVariable(this.page, linkedBorderMaskVariable, undefined);
                    } else {
                        op.modifyBorderMask(adapt2Shape(view).style, undefined);
                    }
                    op.setBorderPosition(source, border.position);
                }
                const sideType = border.sideSetting.sideType;
                switch (sideType) {
                    case SideType.Normal:
                        op.setBorderSide(source, new BorderSideSetting(sideType, thickness, thickness, thickness, thickness));
                        break;
                    case SideType.Top:
                        op.setBorderThicknessTop(source, thickness);
                        break
                    case SideType.Right:
                        op.setBorderThicknessRight(source, thickness);
                        break
                    case SideType.Bottom:
                        op.setBorderThicknessBottom(source, thickness);
                        break
                    case SideType.Left:
                        op.setBorderThicknessLeft(source, thickness);
                        break
                    default:
                        op.setBorderSide(source, new BorderSideSetting(SideType.Custom, thickness, thickness, thickness, thickness));
                        break;
                }
            }
            this.updateView();
        } catch (error) {
            console.error(error);
            this.exception = true;
        }
    }

    modifyBorderCustomThickness(shapes: ShapeView[], thickness: number, type: SideType) {
        try {
            const op = this.operator;
            for (const view of shapes) {
                const linkedVariable = this.getBorderVariable(op, this._page, view);
                const source = linkedVariable ? linkedVariable.value : view.style.borders;
                switch (type) {
                    case SideType.Top:
                        op.setBorderThicknessTop(source, thickness);
                        break
                    case SideType.Right:
                        op.setBorderThicknessRight(source, thickness);
                        break
                    case SideType.Bottom:
                        op.setBorderThicknessBottom(source, thickness);
                        break
                    case SideType.Left:
                        op.setBorderThicknessLeft(source, thickness);
                        break
                    default:
                        break;
                }
            }
            this.updateView();
        } catch (error) {
            console.error(error);
            this.exception = true;
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }
}