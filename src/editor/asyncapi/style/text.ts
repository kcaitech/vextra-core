/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { AsyncApiCaller } from "../basic/asyncapi";
import {
    BasicArray,
    Color,
    Gradient, GradientType,
    GroupShape,
    OverrideType,
    Point2D,
    Shape,
    Stop,
    string2Text,
    SymbolRefShape,
    SymbolShape,
    Text,
    Variable,
    VariableType
} from "../../../data";
import { exportGradient } from "../../../data/baseexport";
import { importGradient, importStop, importText } from "../../../data/baseimport";
import { Api } from "../../../repo";
import { ShapeView, TextShapeView } from "../../../dataview";
import { varParent } from "../../symbol";
import { uuid } from "../../../basic/uuid";
import { prepareVar } from "../../symbol_utils";

export class TextAsyncApi extends AsyncApiCaller {
    importGradient = importGradient;
    importStop = importStop;

    overrideVariable(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, api: Api, view: ShapeView) {
        return prepareVar(api, this.pageView, view, overrideType, varType, valuefun)?.var;
    }
    shape4edit(api: Api, shape: TextShapeView): Variable | TextShapeView {
        let _var = this.overrideVariable(VariableType.Text, OverrideType.Text, (_var) => {
            if (_var) {
                if (_var.value instanceof Text) return importText(_var.value);
                if (typeof _var.value === 'string') {
                    return string2Text(_var.value)
                }
            }
            else {
                return string2Text(shape.text.toString())
            }
            throw new Error();
        }, api, shape);

        if (_var && (typeof _var.value === 'string')) { // 这有问题！
            const host = varParent(_var)! as SymbolRefShape | SymbolShape;
            const textVar = new Variable(uuid(), VariableType.Text, _var.name, string2Text(shape.text.toString()));
            if (host instanceof SymbolShape) {
                api.shapeRemoveVariable(this.page, host, _var.id);
                api.shapeAddVariable(this.page, host, textVar);
                const bindid = _var.id;
                const rebind = (shape: Shape) => {
                    if (shape.varbinds?.get(OverrideType.Text) === bindid) {
                        api.shapeUnbinVar(this.page, shape, OverrideType.Text);
                        api.shapeBindVar(this.page, shape, OverrideType.Text, textVar.id);
                    }
                    if (shape instanceof GroupShape) {
                        shape.childs.forEach(c => rebind(c));
                    }
                }
                rebind(host);
            } else {
                let override_id: string | undefined;
                for (let [k, v] of host.overrides!) {
                    if (v === _var.id) {
                        override_id = k;
                        break;
                    }
                }
                if (!override_id) throw new Error();
                api.shapeRemoveOverride(this.page, host, override_id);
                api.shapeRemoveVariable(this.page, host, _var.id);
                api.shapeAddVariable(this.page, host, textVar);
                api.shapeAddOverride(this.page, host, override_id, textVar.id);
            }
            _var = textVar;
        }
        if (_var && _var.value instanceof Text) {
            this.__repo.updateTextSelectionPath(_var.value);
            return _var;
        }
        return shape;
    }
    start() {
        return this.__repo.start('modify-text-color');
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }

    // 修改填充类型
    modifyFillType(mission: Function[]) {
        try {
            mission.forEach((call) => call(this.api));
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    initGradient(gradient: Gradient | undefined, type: GradientType, color: Color) {
        if (gradient) {
            const gCopy = importGradient(exportGradient(gradient));
            if (type === GradientType.Linear && gradient.gradientType !== GradientType.Linear) {
                gCopy.from.y = gCopy.from.y - (gCopy.to.y - gCopy.from.y);
                gCopy.from.x = gCopy.from.x - (gCopy.to.x - gCopy.from.x);
            } else if (type !== GradientType.Linear && gradient.gradientType === GradientType.Linear) {
                gCopy.from.y = gCopy.from.y + (gCopy.to.y - gCopy.from.y) / 2;
                gCopy.from.x = gCopy.from.x + (gCopy.to.x - gCopy.from.x) / 2;
            }
            if (type === GradientType.Radial && gCopy.elipseLength === undefined) gCopy.elipseLength = 1;
            gCopy.gradientType = type;
            return gCopy;
        } else {
            const stops = new BasicArray<Stop>();
            const { alpha, red, green, blue } = color;
            stops.push(
                new Stop(new BasicArray(), uuid(), 0, new Color(alpha, red, green, blue)),
                new Stop(new BasicArray(), uuid(), 1, new Color(0, red, green, blue))
            );
            const from = type === GradientType.Linear ? { x: 0.5, y: 0 } : { x: 0.5, y: 0.5 };
            const to = { x: 0.5, y: 1 };
            let ellipseLength;
            if (type === GradientType.Radial) ellipseLength = 1;
            const gradient = new Gradient(from as Point2D, to as Point2D, type as GradientType, stops, ellipseLength);
            gradient.stops.forEach((v, i) => {
                const idx = new BasicArray<number>();
                idx.push(i);
                v.crdtidx = idx;
            })
            gradient.gradientType = type;
            return gradient;
        }
    }

    modifySolidColor(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
        }
    }

    // 新增一个渐变色站点
    createGradientStop(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    // 删除一个渐变色站点
    removeGradientStop(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 修改站点颜色 */
    modifyStopColor(missions: Function[]): void {
        try {
            this.modifyStopColorOnce(missions);
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
        }
    }

    /* 修改站点位置 */
    modifyStopPosition(missions: Function[]): void {
        try {
            missions.forEach((call) => call(this.api));
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    /* 修改一次站点颜色 */
    modifyStopColorOnce(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 逆转站点 */
    reverseGradientStops(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 旋转站点 */
    rotateGradientStops(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
}