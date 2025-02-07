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

    modifySolidColor(shapes: ShapeView[], index: number, color: Color) {
        try {
            const targets = this.getTargets(shapes);
            for (const t of targets) this.api.setFillColor(this.page, t, index, color);
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
        }
    }

    modifyStopColor(shapes: ShapeView[], index: number, color: Color, stopAt: number) {
        try {
            this.modifyStopColorOnce(shapes, index, color, stopAt);
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
        }
    }

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
            this.api.setFillGradient(this.page, target as any, index, gradientCopy);
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
                this.api.setFillColor(this.page, target as any, index, reversedStops[0].color as Color);
                const gradientCopy = importGradient(exportGradient(gradient));
                gradientCopy.stops = reversedStops;
                this.api.setFillGradient(this.page, target as any, index, gradientCopy);
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
                this.api.setFillGradient(this.page, target as any, index, gradientCopy);
            }
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 修改图片的填充方式 */
    modifyObjectFit(shapes: ShapeView[], index: number, type: ImageScaleMode) {
        try {
            const targets = this.getTargets(shapes);
            for (const target of targets) {
                this.api.setFillScaleMode(this.page, target as any, index, type);
                if (type === types.ImageScaleMode.Tile) {
                    const fills = this.getFills(target);
                    if (!fills[index].scale) this.api.setFillImageScale(this.page, target as any, index, 0.5);
                }
            }
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    /* 修改平铺状态下，图片的原始比例 */
    modifyTileScale(index: number, scale: number, shapes: ShapeView[]) {
        try {
            const targets = this.getTargets(shapes);
            for (const target of targets) {
                this.api.setFillImageScale(this.page, target as any, index, scale);
            }
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
    modifyFillImageRef(index: number, ref: string, media: { buff: Uint8Array, base64: string }, width: number, height: number, shapes: ShapeView[]) {
        try {
            const targets = this.getTargets(shapes);
            for (const target of targets) {
                this.api.setFillImageRef(this.__document, this.page, target as any, index, ref, media);
                this.api.setFillImageOriginWidth(this.page, target as any, index, width);
                this.api.setFillImageOriginHeight(this.page, target as any, index, height);
            }
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }
}