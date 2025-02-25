import { AsyncApiCaller } from "../basic/asyncapi";
import {
    BasicArray,
    Color,
    Fill, Gradient, GradientType,
    importGradient, OverrideType,
    Point2D,
    Stop,
    VariableType
} from "../../../data";
import { exportGradient } from "../../../data/baseexport";
import { importFill, importStop } from "../../../data/baseimport";
import * as types from "../../../data/typesdefine";
import { Matrix } from "../../../basic/matrix";
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

    /* 修改纯色 */
    modifySolidColor(actions: { fill: Fill, color: Color }[]) {
        try {
            for (const action of actions) this.api.setFillColor(action.fill, action.color);
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
        }
    }

    modifySolidColor2(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
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
            this.__repo.rollback();
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
        missions.forEach((call) => call(this.api));
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
    rotateGradientStops(fills: Fill[]) {
        try {
            for (const fill of fills) {
                const gradientCopy = importGradient(exportGradient(fill.gradient!));
                const { from, to } = gradientCopy;
                const gradientType = gradientCopy.gradientType;
                if (gradientType === types.GradientType.Linear) {
                    const midpoint = { x: (to.x + from.x) / 2, y: (to.y + from.y) / 2 };
                    const m = new Matrix();
                    m.trans(-midpoint.x, -midpoint.y);
                    m.rotate(Math.PI / 2);
                    m.trans(midpoint.x, midpoint.y);
                    gradientCopy.to = m.computeCoord3(to) as Point2D;
                    gradientCopy.from = m.computeCoord3(from) as Point2D;
                } else if (gradientType === types.GradientType.Radial || gradientType === types.GradientType.Angular) {
                    const m = new Matrix();
                    m.trans(-from.x, -from.y);
                    m.rotate(Math.PI / 2);
                    m.trans(from.x, from.y);
                    gradientCopy.to = m.computeCoord3(to) as any;
                }
                this.api.setFillGradient(fill, gradientCopy);
            }
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