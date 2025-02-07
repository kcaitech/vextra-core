import { AsyncApiCaller } from "../basic/asyncapi";
import { ShapeView } from "../../../dataview";
import { Color, FillMask, Shape, Variable, Fill, importGradient, BasicArray, Stop, Point2D } from "../../../data";
import { shape4border } from "../../symbol";
import { exportGradient, exportStop } from "../../../data/baseexport";
import { importStop } from "../../../data/baseimport";
import * as types from "../../../data/typesdefine";
import { Matrix } from "../../../basic/matrix";

export class BorderPaintsAsyncApi extends AsyncApiCaller {
    start() {
        return this.__repo.start('modify-paints-color');
    }

    private m_targets: any;

    private getTargets(shapes: ShapeView[]): (Shape | FillMask | Variable)[] {
        return this.m_targets ?? (this.m_targets = ((shapes: ShapeView[]) => {
            return shapes.map(i => shape4border(this.api, this.pageView, i));
        })(shapes))
    }

    private getFills(target: Shape | FillMask | Variable): Fill[] {
        return target instanceof Shape ? target.getBorders().strokePaints : target instanceof FillMask ? target.fills : target.value;
    }

    /* 修改纯色 */
    modifySolidColor(shapes: ShapeView[], index: number, color: Color) {
        try {
            const targets = this.getTargets(shapes);
            for (const t of targets) this.api.setBorderColor(this.page, t, index, color);
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
        }
    }

    /* 修改站点颜色 */
    modifyStopColor(shapes: ShapeView[], index: number, color: Color, stopAt: number) {
        try {
            this.modifyStopColorOnce(shapes, index, color, stopAt);
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
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

    /* 修改一次站点颜色 */
    modifyStopColorOnce(shapes: ShapeView[], index: number, color: Color, stopAt: number) {
        const targets = this.getTargets(shapes);
        for (const target of targets) {
            const fills = this.getFills(target);
            const fill = fills[index];
            const gradient = fill.gradient!;
            const gradientCopy = importGradient(exportGradient(gradient));
            gradientCopy.stops[stopAt].color = color;
            gradientCopy.stops.sort((a, b) => a.position > b.position ? 1 : -1);
            gradientCopy.stops.forEach((v, i) => {
                const idx = new BasicArray<number>();
                idx.push(i);
                v.crdtidx = idx;
            })
            this.api.setBorderGradient(this.page, target as any, index, gradientCopy);
        }
    }

    /* 逆转站点 */
    reverseGradientStops(shapes: ShapeView[], index: number) {
        try {
            const targets = this.getTargets(shapes);
            for (const target of targets) {
                const fills = this.getFills(target);
                const fill = fills[index];
                const gradient = fill.gradient!;
                const stops = gradient.stops;
                const reversedStops: BasicArray<Stop> = new BasicArray<Stop>();
                for (let _i = 0, _l = stops.length; _i < _l; _i++) {
                    const _stop = stops[_i];
                    const inverseIndex = stops.length - 1 - _i;
                    reversedStops.push(importStop(exportStop(new Stop(_stop.crdtidx, _stop.id, _stop.position, stops[inverseIndex].color))));
                }
                this.api.setBorderColor(this.page, target as any, index, reversedStops[0].color as Color);
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.stops = reversedStops;
                this.api.setBorderGradient(this.page, target as any, index, gradientCopy);
            }
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 旋转站点 */
    rotateGradientStops(shapes: ShapeView[], index: number) {
        try {
            const targets = this.getTargets(shapes);
            for (const target of targets) {
                const fills = this.getFills(target);
                const gradientCopy = importGradient(exportGradient(fills[index].gradient!));
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
                this.api.setBorderGradient(this.page, target as any, index, gradientCopy);
            }
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
}