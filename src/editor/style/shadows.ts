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
    OverrideType,
    Page,
    Shape,
    Variable,
    VariableType,
    Shadow,
    ShadowMask, StyleMangerMember
} from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { _ov, override_variable } from "../symbol";
import { importShadow } from "../../data/baseimport";

/* 阴影修改器 */
export class ShadowsModifier extends Modifier {
    importShadow = importShadow;

    getMaskVariable(op: Operator, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.ShadowsMask, OverrideType.ShadowsMask, () => value, view, page, op);
    }

    getShadowsVariable(op: Operator, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Shadows, OverrideType.Shadows, (_var) => {
            const shadows = _var?.value ?? view.getShadows();
            return new BasicArray(...(shadows as Array<Shadow>).map((v) => {
                return importShadow(v);
            }))
        }, op, view)!;
    }

    /* 创建一个阴影 */
    createShadow(missions: Function[]) {
        try {
            const op = this.getOperator('createShadow');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 隐藏与显示一条阴影 */
    setShadowEnabled(missions: Function[]) {
        try {
            const op = this.getOperator('setShadowEnabled');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 删除一个阴影 */
    removeShadows(missions: Function[]) {
        try {
            const op = this.getOperator('removeShadows');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 统一多个shadows */
    unifyShapesShadows(missions: Function[]) {
        try {
            const op = this.getOperator('unifyShapesShadows');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影颜色 */
    setShadowsColor(missions: Function[]) {
        try {
            const op = this.getOperator('setShadowsColor');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影位置 */
    setShadowsPosition(missions: Function[]) {
        try {
            const op = this.getOperator('setShadowsPosition');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影X轴 */
    setShadowOffsetX(missions: Function[]) {
        try {
            const op = this.getOperator('setShadowOffsetX');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影Y轴 */
    setShadowOffsetY(missions: Function[]) {
        try {
            const op = this.getOperator('setShadowOffsetY');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影扩散半径 */
    setShadowSpread(missions: Function[]) {
        try {
            const op = this.getOperator('setShadowSpread');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影模糊半径 */
    setShadowsBlur(missions: Function[]) {
        try {
            const op = this.getOperator('setShadowsBlur');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 统一多个图层的fillsMask */
    unifyShapesShadowsMask(views: ShapeView[], mask: string) {
        if (!views.length) return;
        try {
            const op = this.getOperator('unifyShapesShadowsMask');
            const pageView = views[0].getPage() as PageView;
            const page = pageView.data;
            for (const view of views) {
                const linked = this.getMaskVariable(op, pageView, view, mask);
                linked ? op.shapeModifyVariable(page, linked, mask) : op.modifyShadowsMask(page, adapt2Shape(view), mask);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 创建一个阴影遮罩 */
    createShadowsMask(document: Document, mask: ShadowMask, pageView: PageView, views?: ShapeView[]) {
        try {
            const op = this.getOperator('createShadowsMask');
            mask.shadows = new BasicArray(...mask.shadows.map(i => importShadow(i)));
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
                for (const shape of shapes) op.modifyShadowsMask(page, shape, mask.id);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改图层的阴影遮罩 */
    setShapesShadowsMask(pageView: PageView, views: ShapeView[], value: string) {
        try {
            const page = adapt2Shape(pageView) as Page;
            const op = this.getOperator('setShapesShadowsMask');
            const variables: Variable[] = [];
            const shapes: Shape[] = [];
            for (const view of views) {
                const variable = this.getMaskVariable(op, pageView, view, value);
                variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
            }
            for (const variable of variables) {
                if (variable.value !== value) op.shapeModifyVariable(page, variable, value);
            }
            for (const shape of shapes) op.modifyShadowsMask(page, shape, value);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 解绑图层上的阴影遮罩 */
    unbindShapesShadowsMask(pageView: PageView, views: ShapeView[]) {
        try {
            if (!views.length) return;

            const op = this.getOperator('unbindShapesShadowsMask');
            const shadowsCopy = views[0].getShadows().map(i => importShadow(i));

            // 处理遮罩
            const shadowsMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedShadowsMaskVariable = this.getMaskVariable(op, pageView, view, undefined);
                linkedShadowsMaskVariable ? shadowsMaskVariables.push(linkedShadowsMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }
            const page = adapt2Shape(pageView) as Page;
            shadowsMaskVariables.forEach(variable => op.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => op.modifyShadowsMask(page, shape, undefined));

            // 固定现有填充到本地
            const shadowsContainer: BasicArray<Shadow>[] = [];
            for (const view of views) {
                const linkedVariable = this.getShadowsVariable(op, pageView, view);
                shadowsContainer.push(linkedVariable ? linkedVariable.value : adapt2Shape(view).style.shadows);
            }

            shadowsContainer.forEach(source => {
                const __shadowsCopy = shadowsCopy.map(i => importShadow(i));
                op.deleteShadows(source, 0, source.length);
                op.addShadows(source, __shadowsCopy);
            });
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 删除阴影遮罩(与解绑有所不同) */
    removeShapesShadowsMask(pageView: PageView, views: ShapeView[]) {
        try {
            const op = this.getOperator('removeShapesShadowsMask');
            const shadowsMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedShadowsMaskVariable = this.getMaskVariable(op, pageView, view, undefined);
                linkedShadowsMaskVariable ? shadowsMaskVariables.push(linkedShadowsMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }

            const page = adapt2Shape(pageView) as Page;
            shadowsMaskVariables.forEach(variable => op.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => op.modifyShadowsMask(page, shape, undefined));

            const shadowsContainer: BasicArray<Shadow>[] = [];
            for (const view of views) {
                const linkedVariable = this.getShadowsVariable(op, pageView, view);
                shadowsContainer.push(linkedVariable ? linkedVariable.value : adapt2Shape(view).style.shadows);
            }
            shadowsContainer.forEach(source => op.deleteShadows(source, 0, source.length));
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