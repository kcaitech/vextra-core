import { AsyncApiCaller } from "../basic/asyncapi";
import { BasicArray, Color, Fill, FillMask, ImageScaleMode, importGradient, PaintFilterType, Point2D, Shape, Stop, Variable } from "../../../data";
import { ShapeView } from "../../../dataview";
import { shape4fill } from "../../symbol";
import { exportGradient, exportStop } from "../../../data/baseexport";
import { importStop } from "../../../data/baseimport";
import * as types from "../../../data/typesdefine";
import { Matrix } from "../../../basic/matrix";

export class FillsAsyncApi extends AsyncApiCaller {
    start() {
        return this.__repo.start('modify-fills-color');
    }

    private m_targets: any;

    private getTargets(shapes: ShapeView[]): (Shape | FillMask | Variable)[] {
        return this.m_targets ?? (this.m_targets = ((shapes: ShapeView[]) => {
            return shapes.map(i => shape4fill(this.api, this.pageView, i));
        })(shapes))
    }

    private getFills(target: Shape | FillMask | Variable): Fill[] {
        return target instanceof Shape ? target.getFills() : target instanceof FillMask ? target.fills : target.value;
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

    /* 修改站点颜色 */
    modifyStopColor(actions: { fill: Fill, color: Color, stopAt: number }[]): void {
        try {
            this.modifyStopColorOnce(actions);
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
        }
    }

    /* 修改图片填充的滤镜 */
    modifyFillImageFilter(key: PaintFilterType, value: number, index: number, shapes: ShapeView[]) {
        try {
            const targets = this.getTargets(shapes);
            for (const target of targets) {
                this.api.setFillImageFilter(this.page, target as any, index, key, value);
                this.updateView();
            }
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 修改站点位置 */
    modifyStopPosition(actions: { fill: Fill, position: number, stopAt: number }[]): void {
        try {
            for (const action of actions) {
                const { fill, position, stopAt } = action;
                const gradient = fill.gradient!;
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.stops[stopAt].position = position;
                gradientCopy.stops.sort((a, b) => a.position > b.position ? 1 : -1);
                this.api.setFillGradient(fill, gradientCopy);
            }
            this.updateView();
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
        this.m_targets = undefined;
    }

    /*非连续性指令*/
    removeGradientStop(actions: { fill: Fill, stopAt: number }[]) {
        try {
            for (const action of actions) {
                const { fill, stopAt } = action;
                const gradient = fill.gradient!;
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.stops.splice(stopAt, 1);
                this.api.setFillGradient(fill, gradientCopy);
            }
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
    /* 修改一次站点颜色 */
    modifyStopColorOnce(actions: { fill: Fill, color: Color, stopAt: number }[]) {
        for (const action of actions) {
            const { fill, color, stopAt } = action;
            const gradient = fill.gradient!;
            const gradientCopy = importGradient(exportGradient(gradient));
            gradientCopy.stops[stopAt].color = color;
            this.api.setFillGradient(fill, gradient);
        }
    }

    /* 逆转站点 */
    reverseGradientStops(fills: Fill[]) {
        try {
            for (const fill of fills) {
                const gradient = fill.gradient!;
                const stops = gradient.stops;
                const reversedStops: BasicArray<Stop> = new BasicArray<Stop>();
                for (let _i = 0, _l = stops.length; _i < _l; _i++) {
                    const _stop = stops[_i];
                    const inverseIndex = stops.length - 1 - _i;
                    reversedStops.push(importStop(exportStop(new Stop(_stop.crdtidx, _stop.id, _stop.position, stops[inverseIndex].color))));
                }
                this.api.setFillColor(fill, reversedStops[0].color as Color);
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.stops = reversedStops;
                this.api.setFillGradient(fill, gradientCopy);
            }
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
                const {from, to} = gradientCopy;
                const gradientType = gradientCopy.gradientType;
                if (gradientType === types.GradientType.Linear) {
                    const midpoint = {x: (to.x + from.x) / 2, y: (to.y + from.y) / 2};
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
    modifyObjectFit(fills: Fill[], type: ImageScaleMode) {
        try {
            for (const fill of fills) {
                this.api.setFillScaleMode(fill, type);
                // if (type === types.ImageScaleMode.Tile) {
                //     const fills = this.getFills(target);
                //     if (!fills[index].scale) this.api.setFillImageScale(this.page, target as any, index, 0.5);
                // }
            }
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 修改平铺状态下，图片的原始比例 */
    modifyTileScale(fills: Fill[], scale: number) {
        try {
            for (const fill of fills) this.api.setFillImageScale(fill, scale);
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 旋转图片 */
    rotateImg(index: number, rotate: number, shapes: ShapeView[]) {
        try {
            const targets = this.getTargets(shapes);
            for (const target of targets) {
                this.api.setFillImageRotate(this.page, target as any, index, rotate);
            }
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 修改图片的引用 */
    modifyFillImageRef(fills: Fill[], ref: string, media: { buff: Uint8Array, base64: string }, width: number, height: number) {
        try {
            for (const fill of fills) {
                this.api.setFillImageRef(this.__document, fill, ref, media);
                this.api.setFillImageOriginWidth(fill, width);
                this.api.setFillImageOriginHeight(fill, height);
            }
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
}