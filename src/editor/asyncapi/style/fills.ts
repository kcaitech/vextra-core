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
    Fill, Gradient, GradientType,
    OverrideType,
    Point2D,
    Stop,
    VariableType
} from "../../../data";
import { exportGradient } from "../../../data/baseexport";
import { importFill, importGradient, importStop } from "../../../data/baseimport";
import { Api } from "../../../coop";
import { PageView, ShapeView } from "../../../dataview";
import { override_variable } from "../../symbol";
import { uuid } from "../../../basic/uuid";

export class FillsAsyncApi extends AsyncApiCaller {
    importGradient = importGradient;
    importStop = importStop;

    start() {
        return this.__repo.start('modify-fills-color');
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }

    getFillsVariable(api: Api, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Fills, OverrideType.Fills, (_var) => {
            const fills = _var?.value ?? view.getFills();
            return new BasicArray(...(fills as Array<Fill>).map((v) => {
                    const ret = importFill(v);
                    const imgmgr = v.getImageMgr();
                    if (imgmgr) ret.setImageMgr(imgmgr)
                    return ret;
                }
            ))
        }, api, view)!;
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

    initGradient(api: Api, action: { fill: Fill, type: string }) {
        const gradient = action.fill.gradient;
        if (gradient) {
            const gCopy = importGradient(exportGradient(gradient));
            if (action.type === GradientType.Linear && gradient.gradientType !== GradientType.Linear) {
                gCopy.from.y = gCopy.from.y - (gCopy.to.y - gCopy.from.y);
                gCopy.from.x = gCopy.from.x - (gCopy.to.x - gCopy.from.x);
            } else if (action.type !== GradientType.Linear && gradient.gradientType === GradientType.Linear) {
                gCopy.from.y = gCopy.from.y + (gCopy.to.y - gCopy.from.y) / 2;
                gCopy.from.x = gCopy.from.x + (gCopy.to.x - gCopy.from.x) / 2;
            }
            if (action.type === GradientType.Radial && gCopy.elipseLength === undefined) gCopy.elipseLength = 1;
            gCopy.gradientType = action.type as GradientType;
            api.setFillGradient(action.fill, gCopy);
        } else {
            const stops = new BasicArray<Stop>();
            const { alpha, red, green, blue } = action.fill.color;
            stops.push(
                new Stop(new BasicArray(), uuid(), 0, new Color(alpha, red, green, blue)),
                new Stop(new BasicArray(), uuid(), 1, new Color(0, red, green, blue))
            );
            const from = action.type === GradientType.Linear ? { x: 0.5, y: 0 } : { x: 0.5, y: 0.5 };
            const to = { x: 0.5, y: 1 };
            let ellipseLength;
            if (action.type === GradientType.Radial) ellipseLength = 1;
            const gradient = new Gradient(from as Point2D, to as Point2D, action.type as GradientType, stops, ellipseLength);
            gradient.stops.forEach((v, i) => {
                const idx = new BasicArray<number>();
                idx.push(i);
                v.crdtidx = idx;
            })
            gradient.gradientType = action.type as GradientType;
            api.setFillGradient(action.fill, gradient);
        }
    }

    modifySolidColor(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
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

    /* 修改图片填充的滤镜 */
    modifyFillImageFilter(missions: Function[]): void {
        try {
            missions.forEach((call) => call(this.api));
            this.updateView();
        } catch (error) {
            console.error(error);
            this.exception = true;
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

    /* 修改图片的填充方式 */
    modifyObjectFit(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 修改平铺状态下，图片的原始比例 */
    modifyTileScale(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    modifyTileScale2(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
            this.updateView();
        } catch (error) {
            console.error(error);
            this.exception = true;
        }
    }

    /* 旋转图片 */
    rotateImg(mission: Function[]) {
        try {
            mission.forEach((call) => call(this.api));
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 修改图片的引用 */
    modifyFillImageRef(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
}