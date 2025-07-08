/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Modifier } from "../basic/modifier";
import {
    Blur,
    BlurMask, BlurType,
    Document,
    OverrideType,
    Page, Point2D,
    Shape, StyleMangerMember,
    Variable,
    VariableType
} from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { Operator } from "../../operator";
import { _ov } from "../symbol";
import { importBlur } from "../../data/baseimport";

export class BlurModifier extends Modifier {
    importBlur = importBlur;

    getMaskVariable(op: Operator, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.BlursMask, OverrideType.BlursMask, () => value, view, page, op);
    }

    getBlurVariable(op: Operator, page: PageView, view: ShapeView) {
        const valueFun = (_var: Variable | undefined) => {
            const blur = _var?.value ?? view.blur;
            return blur && importBlur(blur) || new Blur(true, new Point2D(0, 0), 10, BlurType.Gaussian);
        };
        return _ov(VariableType.Blur, OverrideType.Blur, valueFun, view, page, op)!;
    }

    createBlur(missions: Function[]) {
        try {
            const op = this.getOperator('createBlur');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    unifyShapesBlur(missions: Function[]) {
        try {
            const op = this.getOperator('unifyShapesBlurMask');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    modifyBlurType(missions: Function[]) {
        try {
            const op = this.getOperator('modifyBlurType');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    modifyBlurEnabled(missions: Function[]) {
        try {
            const op = this.getOperator('modifyBlurEnabled');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    modifyBlurSaturation(missions: Function[]) {
        try {
            const op = this.getOperator('modifyBlurSaturation');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    removeBlur(missions: Function[]) {
        try {
            const op = this.getOperator('removeBlur');
            missions.forEach(call => call(op));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    unifyShapesBlurMask(views: ShapeView[], mask: string) {
        if (!views.length) return;
        try {
            const op = this.getOperator('unifyShapesBlurMask');
            const pageView = views[0].getPage() as PageView;
            const page = pageView.data;
            for (const view of views) {
                const linked = this.getMaskVariable(op, pageView, view, mask);
                linked ? op.shapeModifyVariable(page, linked, mask) : op.modifyBlurMask(page, adapt2Shape(view), mask);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    createBlurMask(document: Document, mask: BlurMask, pageView: PageView, views?: ShapeView[]) {
        try {
            const op = this.getOperator('createBlurMask');
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
                for (const shape of shapes) op.modifyBlurMask(page, shape, mask.id);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    setShapesBlurMask(pageView: PageView, views: ShapeView[], value: string) {
        try {
            const page = adapt2Shape(pageView) as Page;
            const op = this.getOperator('setShapesBlurMask');
            const variables: Variable[] = [];
            const shapes: Shape[] = [];
            for (const view of views) {
                const variable = this.getMaskVariable(op, pageView, view, value);
                variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
            }
            for (const variable of variables) {
                if (variable.value !== value) op.shapeModifyVariable(page, variable, value);
            }
            for (const shape of shapes) op.modifyBlurMask(page, shape, value);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    unbindShapesBlurMask(pageView: PageView, views: ShapeView[]) {
        try {
            if (!views.length) return;

            const op = this.getOperator('unbindShapesBlurMask');
            const blur = importBlur(views.find(i => i.blur)?.blur!);

            const blurMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedBlurMaskVariable = this.getMaskVariable(op, pageView, view, undefined);
                linkedBlurMaskVariable ? blurMaskVariables.push(linkedBlurMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }
            const page = adapt2Shape(pageView) as Page;
            blurMaskVariables.forEach(variable => op.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => op.modifyBlurMask(page, shape, undefined));

            for (const view of views) {
                const linkedVariable = this.getBlurVariable(op, pageView, view);
                if (linkedVariable) {
                    op.shapeModifyVariable(page, linkedVariable, importBlur(blur));
                } else {
                    op.addBlur(view.style, importBlur(blur));
                }
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    removeShapesBlurMask(pageView: PageView, views: ShapeView[]) {
        try {
            const op = this.getOperator('removeShapesBlurMask');

            const blurMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedBlurMaskVariable = this.getMaskVariable(op, pageView, view, undefined);
                linkedBlurMaskVariable ? blurMaskVariables.push(linkedBlurMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }

            const page = adapt2Shape(pageView) as Page;
            blurMaskVariables.forEach(variable => op.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => op.modifyBlurMask(page, shape, undefined));

            for (const view of views) {
                const linkedVariable = this.getBlurVariable(op, pageView, view);
                if (linkedVariable) {
                    op.shapeModifyVariable(page, linkedVariable, undefined);
                } else {
                    op.deleteBlur(view.style);
                }
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    disableMask(mask: StyleMangerMember) {
        try {
            const op = this.getOperator('modifyMaskStatus');
            op.disableMask(mask);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
}