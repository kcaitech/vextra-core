import { Api, CoopRepository } from "../../coop";
import { Modifier } from "../basic/modifier";
import {
    BasicArray,
    Color,
    Fill,
    FillType, Gradient,
    GradientType,
    ImageScaleMode,
    importGradient,
    Page, Point2D,
    Stop
} from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { Document } from "../../data";
import { exportGradient } from "../../data/baseexport";
import { uuid } from "../../basic/uuid";

/* 填充修改器 */
export class FillModifier extends Modifier {
    constructor(repo: CoopRepository) {
        super(repo);
    }

    /* 修改填充类型 */
    setFillsType(actions: { fill: Fill, type: string }[]) {
        try {
            const api = this.getApi('setFillsType');
            for (const action of actions) {
                if (action.type === FillType.SolidColor) {
                    api.setFillType(action.fill, FillType.SolidColor);
                } else if (action.type === FillType.Pattern) {
                    api.setFillType(action.fill, FillType.Pattern);
                    if (!action.fill.imageScaleMode) api.setFillScaleMode(action.fill, ImageScaleMode.Fill);
                } else {
                    api.setFillType(action.fill, FillType.Gradient);
                    initGradient(api, action);
                }
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }

        function initGradient(api: Api, action: { fill: Fill, type: string }) {
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
                gCopy.stops[0].color = action.fill.color;
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
    }

    /* 隐藏与显示一条填充 */
    setFillsEnabled(fills: Fill[], enable: boolean) {
        try {
            const api = this.getApi('setFillsEnabled');
            for (const fill of fills) api.setFillEnable(fill, enable);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改填充颜色 */
    setFillsColor(actions: { fill: Fill, color: Color }[]) {
        try {
            const api = this.getApi('setFillsColor');
            for (const action of actions) api.setFillColor(action.fill, action.color);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 创建一个填充 */
    createFill(actions: { fills: BasicArray<Fill>, fill: Fill, index: number }[]) {
        try {
            const api = this.getApi('createFill');
            actions.forEach(action => api.addFillAt(action.fills, action.fill, action.index));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 删除一个填充 */
    removeFill(actions: { fills: BasicArray<Fill>, index: number }[]) {
        try {
            const api = this.getApi('removeFill');
            actions.forEach(action => api.deleteFillAt(action.fills, action.index));
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改图层的填充遮罩 */
    setShapesFillMask(document: Document, pageView: PageView, actions: { target: ShapeView, value: string }[]) {
        try {
            const page = adapt2Shape(pageView) as Page;
            const api = this.getApi('setShapesFillMask');
            for (const action of actions) {
                const { target, value } = action;
                api.addfillmask(document, page, adapt2Shape(target), value);
            }
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 解绑图层上的填充遮罩 */
    unbindShapesFillMask(document: Document, pageView: PageView, actions: { target: ShapeView, value: Fill[] }[]) {
        try {
            const api = this.getApi('removeShapesFillMask');
            const page = adapt2Shape(pageView) as Page;
            for (const action of actions) {
                const { target, value } = action;
                api.deleteFills(target.style.fills, 0, target.style.fills.length);
                api.addFills(target.style.fills, value);
                api.delfillmask(document, page, adapt2Shape(target));
            }
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 删除填充遮罩(与解绑有所不同) */
    removeShapesFillMask(document: Document, pageView: PageView, views: ShapeView[]) {
        try {
            const api = this.getApi('removeShapesFillMask');
            const page = adapt2Shape(pageView) as Page;
            for (const view of views) {
                const shape = adapt2Shape(view);
                api.delfillmask(document, page, shape);
                api.deleteFills(shape.style.fills, 0, shape.getFills().length);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
}