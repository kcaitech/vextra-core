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
    Document,
    OverrideType,
    Page,
    RadiusMask,
    Shape, StyleMangerMember,
    Variable,
    VariableType
} from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";

import { _ov } from "../symbol";

export class RadiusModifier extends Modifier {

    getMaskVariable(op: Operator, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.RadiusMask, OverrideType.RadiusMask, () => value, view, page, op);
    }

    /* 修改mask圆角 */
    setShapeMaskRadius(radiusMask: RadiusMask, radius: number[]) {
        try {
            const op = this.getOperator('setShapeMaskRadius');
            op.modifyMaskRadius(radiusMask, radius);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 创建一个圆角遮罩 */
    createRadiusMask(document: Document, mask: RadiusMask, pageView: PageView, views?: ShapeView[]) {
        try {
            const op = this.getOperator('createRadiusMask');
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
                for (const shape of shapes) op.modifyRadiusMask(shape, mask.id);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改图层的圆角遮罩 */
    setShapesRadiusMask(pageView: PageView, views: ShapeView[], value: string) {
        try {
            const page = adapt2Shape(pageView) as Page;
            const op = this.getOperator('setShapesRadiusMask');
            const variables: Variable[] = [];
            const shapes: Shape[] = [];
            for (const view of views) {
                const variable = this.getMaskVariable(op, pageView, view, value);
                variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
            }
            for (const variable of variables) {
                if (variable.value !== value) op.shapeModifyVariable(page, variable, value);
            }
            for (const shape of shapes) op.modifyRadiusMask(shape, value);
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