/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Operator } from "../../operator";
import { Modifier } from "../basic/modifier";
import {
    BasicArray,
    Document,
    Fill, FillMask,
    OverrideType,
    Page,
    Shape, StyleMangerMember,
    Variable,
    VariableType
} from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";

import { _ov, override_variable } from "../symbol";
import { importFill } from "../../data/baseimport";

/* 填充修改器 */
export class FillModifier extends Modifier {
    importFill = importFill;

    getMaskVariable(op: Operator, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.FillsMask, OverrideType.FillsMask, () => value, view, page, op);
    }

    getFillsVariable(op: Operator, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Fills, OverrideType.Fills, (_var) => {
            const fills = _var?.value ?? view.getFills();
            return new BasicArray(...(fills as Array<Fill>).map((v) => {
                    const ret = importFill(v);
                    const imgmgr = v.getImageMgr();
                    if (imgmgr) ret.setImageMgr(imgmgr)
                    return ret;
                }
            ))
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

    /* 统一多个图层的fillsMask */
    unifyShapesFillsMask(views: ShapeView[], fillsMask: string) {
        if (!views.length) return;
        try {
            const op = this.getOperator('unifyShapesFillsMask');
            const pageView = views[0].getPage() as PageView;
            const page = pageView.data;
            for (const view of views) {
                const linked = this.getMaskVariable(op, pageView, view, fillsMask);
                linked ? op.shapeModifyVariable(page, linked, fillsMask) : op.modifyFillsMask(page, adapt2Shape(view), fillsMask);
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
                    const variable = this.getMaskVariable(op, pageView, view, mask.id);
                    variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
                }
                const page = pageView.data;
                for (const variable of variables) {
                    if (variable.value !== mask.id) op.shapeModifyVariable(page, variable, mask.id);
                }
                for (const shape of shapes) op.modifyFillsMask(page, shape, mask.id);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改图层的填充遮罩 */
    setShapesFillMask(pageView: PageView, views: ShapeView[], value: string) {
        try {
            const page = adapt2Shape(pageView) as Page;
            const op = this.getOperator('setShapesFillMask');
            const variables: Variable[] = [];
            const shapes: Shape[] = [];
            for (const view of views) {
                const variable = this.getMaskVariable(op, pageView, view, value);
                variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
            }
            for (const variable of variables) {
                if (variable.value !== value) op.shapeModifyVariable(page, variable, value);
            }
            for (const shape of shapes) op.modifyFillsMask(page, shape, value);
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
            const fillsCopy = views[0].getFills().map(i => importFill(i));
            // 处理遮罩
            const fillMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedFillMaskVariable = this.getMaskVariable(op, pageView, view, undefined);
                linkedFillMaskVariable ? fillMaskVariables.push(linkedFillMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }
            const page = adapt2Shape(pageView) as Page;
            fillMaskVariables.forEach(variable => op.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => op.modifyFillsMask(page, shape, undefined));

            // 固定现有填充到本地
            const fillsContainer: BasicArray<Fill>[] = [];
            for (const view of views) {
                const linkedVariable = this.getFillsVariable(op, pageView, view);
                fillsContainer.push(linkedVariable ? linkedVariable.value : adapt2Shape(view).style.fills);
            }

            fillsContainer.forEach(source => {
                const __fillsCopy = fillsCopy.map(i => {
                    const fill = importFill(i);
                    fill.setImageMgr(document.mediasMgr);
                    return fill;
                });
                op.deleteFills(source, 0, source.length);
                op.addFills(source, __fillsCopy);
            });
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 删除填充遮罩(与解绑有所不同) */
    removeShapesFillMask(pageView: PageView, views: ShapeView[]) {
        try {
            const op = this.getOperator('removeShapesFillMask');
            const fillMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedFillMaskVariable = this.getMaskVariable(op, pageView, view, undefined);
                linkedFillMaskVariable ? fillMaskVariables.push(linkedFillMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }
            const page = adapt2Shape(pageView) as Page;
            fillMaskVariables.forEach(variable => op.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => op.modifyFillsMask(page, shape, undefined));

            const fillsContainer: BasicArray<Fill>[] = [];
            for (const view of views) {
                const linkedVariable = this.getFillsVariable(op, pageView, view);
                fillsContainer.push(linkedVariable ? linkedVariable.value : adapt2Shape(view).style.fills);
            }
            fillsContainer.forEach(source => op.deleteFills(source, 0, source.length));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    // 修改填充遮罩状态(弱删除)
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