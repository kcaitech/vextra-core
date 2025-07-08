/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { IRepository } from "../../repo";
import { Operator } from "../../operator";
import { Modifier } from "../basic/modifier";
import {
    BasicArray,
    Border,
    BorderMask,
    BorderMaskType,
    BorderPosition,
    BorderSideSetting,
    Document,
    Fill, FillMask,
    OverrideType,
    Page,
    RadiusType,
    Shape,
    SideType, StyleMangerMember,
    Variable,
    VariableType
} from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { _ov, override_variable, shape4border } from "../symbol";
import { importBorder, importFill } from "../../data/baseimport";

export class BorderModifier extends Modifier {
    importFill = importFill;
    constructor(repo: IRepository) {
        super(repo);
    }

    getFillMaskVariable(op: Operator, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.BorderFillsMask, OverrideType.BorderFillsMask, () => value, view, page, op);
    }

    getStrokeMaskVariable(op: Operator, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.BordersMask, OverrideType.BordersMask, () => value, view, page, op);
    }

    getBorderVariable(op: Operator, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Borders, OverrideType.Borders, (_var) => {
            return importBorder(_var?.value ?? view.getBorder());
        }, op, view)!;
    }

    /* 创建一个填充 */
    createFill(missions: Function[]) {
        try {
            const op = this.getOperator('createFill');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 隐藏与显示一条填充 */
    setFillsEnabled(missions: Function[]) {
        try {
            const op = this.getOperator('setFillsEnabled');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改填充颜色 */
    setFillsColor(missions: Function[]) {
        try {
            const op = this.getOperator('setFillsColor');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改渐变色透明度 */
    setGradientOpacity(missions: Function[]) {
        try {
            const op = this.getOperator('setGradientOpacity');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 删除一个填充 */
    removeFill(missions: Function[]) {
        try {
            const op = this.getOperator('removeFill');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 统一多个fills */
    unifyShapesFills(missions: Function[]) {
        try {
            const op = this.getOperator('unifyShapesFills');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    // 设置单边类型
    modifyBorderSideSetting(missions: Function[]) {
        try {
            const op = this.getOperator('modifyBorderSideSetting');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改mask边框 */
    setBorderMaskSide(actions: { border: Border, side: BorderSideSetting }[]) {
        try {
            const op = this.getOperator('setBorderMaskSide');
            actions.forEach(action => op.setBorderSide(action.border, action.side));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改边框粗细 */
    setBorderThickness(pageView: PageView, views: ShapeView[], thickness: number) {
        try {
            const op = this.getOperator('setBorderThickness');
            const page = adapt2Shape(pageView) as Page;
            for (const view of views) {
                const border = view.getBorder();
                const linkedVariable = this.getBorderVariable(op, pageView, view);
                const source = linkedVariable ? linkedVariable.value as Border : view.data.style.borders;
                if (view.bordersMask) {
                    const linkedBorderMaskVariable = this.getStrokeMaskVariable(op, pageView, view, undefined);
                    if (linkedBorderMaskVariable) {
                        op.shapeModifyVariable(page, linkedBorderMaskVariable, undefined);
                    } else {
                        op.modifyBorderMask(adapt2Shape(view).style, undefined);
                    }
                    op.setBorderPosition(source, border.position);
                }
                const sideType = border.sideSetting.sideType;
                switch (sideType) {
                    case SideType.Normal:
                        const sides = new BorderSideSetting(sideType, thickness, thickness, thickness, thickness);
                        op.setBorderSide(source, sides);
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
                        const customSides = new BorderSideSetting(SideType.Custom, thickness, thickness, thickness, thickness);
                        op.setBorderSide(source, customSides);
                        break;
                }
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改边框自定义粗细 */
    setBorderCustomThickness(pageView: PageView, shapes: ShapeView[], thickness: number, type: SideType) {
        try {
            const op = this.getOperator('setBorderCustomThickness');
            for (const view of shapes) {
                const linkedVariable = this.getBorderVariable(op, pageView, view);
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
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改mask边框位置 */
    setBorderMaskPosition(actions: { border: BorderMaskType, position: BorderPosition }[]) {
        try {
            const op = this.getOperator('setBorderMaskPosition');
            actions.forEach(action => op.setBorderPosition(action.border, action.position));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改边框位置 */
    setBorderPosition(pageView: PageView, views: ShapeView[], position: BorderPosition) {
        try {
            const op = this.getOperator('setBorderPosition');
            const page = adapt2Shape(pageView) as Page;
            for (const view of views) {
                const border = view.getBorder();
                const linkedVariable = this.getBorderVariable(op, pageView, view);
                const source = linkedVariable ? (linkedVariable.value as Border) : adapt2Shape(view).style.borders;
                if (view.bordersMask) {
                    const linkedBorderMaskVariable = this.getStrokeMaskVariable(op, pageView, view, undefined);
                    if (linkedBorderMaskVariable) {
                        op.shapeModifyVariable(page, linkedBorderMaskVariable, undefined);
                    } else {
                        op.modifyBorderMask(adapt2Shape(view).style, undefined);
                    }
                    op.setBorderSide(source, border.sideSetting);
                }
                op.setBorderPosition(source, position);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 统一多个图层的fillsMask */
    unifyShapesFillsMask(document: Document, views: ShapeView[], fillsMask: string) {
        if (!views.length) return;
        try {
            const op = this.getOperator('unifyShapesFillsMask');
            const pageView = views[0].getPage() as PageView;
            const page = pageView.data;
            for (const view of views) {
                const linked = this.getFillMaskVariable(op, pageView, view, fillsMask);
                linked ? op.shapeModifyVariable(page, linked, fillsMask) : op.setBorderFillMask(adapt2Shape(view).style, fillsMask);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    // 修改边框样式（虚线/实线）
    modifyStrokeStyle(pageView: PageView, actions: { target: ShapeView, value: any }[]) {
        try {
            const op = this.getOperator('modifyStrokeStyle');
            const page = pageView.data;
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const s = shape4border(op, pageView, target);
                op.setBorderStyle(page, s, value);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    // 修改边框拐角样式
    modifyCornerType(pageView: PageView, actions: { target: ShapeView, value: any }[]) {
        try {
            const op = this.getOperator('modifyCornerType');
            const page = pageView.data;
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const s = shape4border(op, pageView, target);
                op.setBorderCornerType(page, s, value);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 创建一个填充遮罩 */
    createFillsMask(document: Document, mask: FillMask, pageView: PageView, views?: ShapeView[]) {
        try {
            const op = this.getOperator('createFillsMask');
            mask.fills = new BasicArray(...mask.fills.map(i => {
                const fill = importFill(i);
                fill.setImageMgr(document.mediasMgr);
                return fill;
            }));
            op.styleInsert(document, mask);
            if (views) {
                const variables: Variable[] = [];
                const shapes: Shape[] = [];
                for (const view of views) {
                    const variable = this.getFillMaskVariable(op, pageView, view, mask.id);
                    variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
                }
                const page = pageView.data;
                for (const variable of variables) {
                    if (variable.value !== mask.id) op.shapeModifyVariable(page, variable, mask.id);
                }
                for (const shape of shapes) op.setBorderFillMask(shape.style, mask.id);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 创建一个边框遮罩 */
    createBorderMask(document: Document, mask: BorderMask, pageView: PageView, views?: ShapeView[]) {
        try {
            const op = this.getOperator('createBorderMask');
            op.styleInsert(document, mask);
            if (views) {
                const variables: Variable[] = [];
                const shapes: Shape[] = [];
                for (const view of views) {
                    const variable = this.getStrokeMaskVariable(op, pageView, view, mask.id);
                    variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
                }
                const page = pageView.data;
                for (const variable of variables) {
                    if (variable.value !== mask.id) op.shapeModifyVariable(page, variable, mask.id);
                }
                for (const shape of shapes) op.modifyBorderMask(shape.style, mask.id);
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改图层的边框填充遮罩 */
    setShapesFillMask(document: Document, pageView: PageView, views: ShapeView[], value: string) {
        try {
            const page = adapt2Shape(pageView) as Page;
            const op = this.getOperator('setShapesFillMask');
            const variables: Variable[] = [];
            const shapes: Shape[] = [];
            for (const view of views) {
                const variable = this.getFillMaskVariable(op, pageView, view, value);
                variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
            }
            for (const variable of variables) {
                if (variable.value !== value) op.shapeModifyVariable(page, variable, value);
            }
            for (const shape of shapes) op.setBorderFillMask(shape.style, value);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改图层的边框遮罩 */
    setShapesStrokeMask(pageView: PageView, views: ShapeView[], value: string) {
        try {
            const page = adapt2Shape(pageView) as Page;
            const op = this.getOperator('setShapesStrokeMask');
            const variables: Variable[] = [];
            const shapes: Shape[] = [];
            for (const view of views) {
                const variable = this.getStrokeMaskVariable(op, pageView, view, value);
                variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
            }
            for (const variable of variables) {
                if (variable.value !== value) op.shapeModifyVariable(page, variable, value);
            }
            for (const shape of shapes) op.modifyBorderMask(shape.style, value);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 解绑图层上的填充遮罩 */
    unbindShapesFillMask(document: Document, pageView: PageView, views: ShapeView[]) {
        try {
            if (!views.length) return;

            const op = this.getOperator('unbindShapesFillMask');
            const borderCopy = views[0].getBorder();

            // 处理遮罩
            const fillMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedFillMaskVariable = this.getFillMaskVariable(op, pageView, view, undefined);
                linkedFillMaskVariable ? fillMaskVariables.push(linkedFillMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }
            const page = adapt2Shape(pageView) as Page;
            fillMaskVariables.forEach(variable => op.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => op.delBorderFillMask(shape.style));

            // 固定现有填充到本地
            const fillsContainer: BasicArray<Fill>[] = [];
            for (const view of views) {
                const linkedVariable = this.getBorderVariable(op, pageView, view);
                fillsContainer.push(linkedVariable ? (linkedVariable.value as Border).strokePaints : adapt2Shape(view).style.borders.strokePaints);
            }

            fillsContainer.forEach(source => {
                const __borderCopy = borderCopy.strokePaints.map(i => importFill(i));
                op.deleteFills(source, 0, source.length);
                op.addFills(source, __borderCopy);
            });
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 解绑图层上的边框遮罩 */
    unbindShapesBorderMask(pageView: PageView, views: ShapeView[]) {
        try {
            if (!views.length) return;

            const op = this.getOperator('unbindShapesBorderMask');
            const page = adapt2Shape(pageView) as Page;
            const borderCopy = views[0].getBorder();
            // 处理遮罩
            for (const view of views) {
                const linkedBorderMaskVariable = this.getStrokeMaskVariable(op, pageView, view, undefined);
                if (linkedBorderMaskVariable) {
                    op.shapeModifyVariable(page, linkedBorderMaskVariable, undefined);
                } else {
                    op.modifyBorderMask(adapt2Shape(view).style, undefined);
                }
            }

            for (const view of views) {
                const linkedVariable = this.getBorderVariable(op, pageView, view);
                const source = linkedVariable ? (linkedVariable.value as Border) : adapt2Shape(view).style.borders;
                let sideSetting = borderCopy.sideSetting;
                if (view.radiusType !== RadiusType.Rect) {
                    const type = SideType.Normal;
                    const side = borderCopy.sideSetting;
                    const thickness = side.thicknessTop || side.thicknessLeft || side.thicknessBottom || side.thicknessRight || 1;
                    sideSetting = new BorderSideSetting(type, thickness, thickness, thickness, thickness);
                }
                op.setBorderPosition(source, borderCopy.position);
                op.setBorderSide(source, sideSetting);
            }

            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 删除填充遮罩(与解绑有所不同) */
    removeShapesFillMask(document: Document, pageView: PageView, views: ShapeView[]) {
        try {
            const op = this.getOperator('removeShapesFillMask');
            const fillMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedFillMaskVariable = this.getFillMaskVariable(op, pageView, view, undefined);
                linkedFillMaskVariable ? fillMaskVariables.push(linkedFillMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }
            const page = adapt2Shape(pageView) as Page;
            fillMaskVariables.forEach(variable => op.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => op.delBorderFillMask(shape.style));

            const fillsContainer: BasicArray<Fill>[] = [];
            for (const view of views) {
                const linkedVariable = this.getBorderVariable(op, pageView, view);
                fillsContainer.push(linkedVariable ? (linkedVariable.value as Border).strokePaints : adapt2Shape(view).style.borders.strokePaints);
            }
            fillsContainer.forEach(source => op.deleteFills(source, 0, source.length));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 删除边框 */
    removeShapesBorder(pageView: PageView, views: ShapeView[]) {
        try {
            const op = this.getOperator('removeShapesBorder');
            const page = adapt2Shape(pageView) as Page;
            for (const view of views) {
                const linkedFillMaskVariable = this.getFillMaskVariable(op, pageView, view, undefined);
                const linkedBorderMaskVariable = this.getStrokeMaskVariable(op, pageView, view, undefined);

                if (linkedFillMaskVariable) {
                    op.shapeModifyVariable(page, linkedFillMaskVariable, undefined);
                } else {
                    op.delBorderFillMask(adapt2Shape(view).style);
                }

                if (linkedBorderMaskVariable) {
                    op.shapeModifyVariable(page, linkedBorderMaskVariable, undefined);
                } else {
                    op.modifyBorderMask(adapt2Shape(view).style, undefined);
                }
            }

            for (const view of views) {
                const linkedVariable = this.getBorderVariable(op, pageView, view);
                const source = linkedVariable ? (linkedVariable.value as Border).strokePaints : adapt2Shape(view).style.borders.strokePaints;
                op.deleteFills(source, 0, source.length);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    disableMask(mask: StyleMangerMember) {
        try {
            const op = this.getOperator('disableMask');
            op.disableMask(mask);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
}