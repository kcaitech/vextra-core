import { Api } from "../../coop";
import { Modifier } from "../basic/modifier";
import {
    BasicArray,
    Color,
    Document,
    Fill, FillMask,
    FillType,
    Gradient,
    GradientType,
    ImageScaleMode,
    importGradient,
    OverrideType,
    Page,
    Point2D,
    Shape,
    Stop,
    Variable,
    VariableType
} from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { exportGradient } from "../../data/baseexport";
import { uuid } from "../../basic/uuid";
import { _ov, override_variable, shape4fill2 } from "../symbol";
import { importFill } from "../../data/baseimport";

/* 填充修改器 */
export class FillModifier extends Modifier {
    private getMaskVariable(api: Api, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.FillsMask, OverrideType.FillsMask, () => value, view, page, api);
    }

    private getFillsVariable(api: Api, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Fills, OverrideType.Fills, (_var) => {
            const fills = _var?.value ?? view.getFills();
            return new BasicArray(...(fills as Array<Fill>).map((v) => {
                    const ret = importFill(v);
                    const imgmgr = v.getImageMgr();
                    if (imgmgr) ret.setImageMgr(imgmgr)
                    return ret;
                }
            ))
        }, api, view);
    }

    /* 创建一个填充 */
    createFill(actions: { fills: BasicArray<Fill>, fill: Fill }[]) {
        try {
            const api = this.getApi('createFill');
            actions.forEach(action => api.addFillAt(action.fills, action.fill, action.fills.length));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
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

    /* 修改渐变色透明度 */
    setGradientOpacity(fills: Fill[], opacity: number) {
        try {
            const api = this.getApi('setGradientOpacity');
            for (const fill of fills) {
                const gradient = fill.gradient!;
                api.setGradientOpacity(gradient, opacity);
            }
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
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 统一多个fills */
    unifyShapesFills(fillContainers: BasicArray<Fill>[]) {
        if (!fillContainers.length) return;
        try {
            const api = this.getApi('unifyShapesFills');
            const master = fillContainers[0].map(i => importFill(i));
            for (const fillContainer of fillContainers) {
                api.deleteFills(fillContainer, 0, fillContainer.length);
                api.addFills(fillContainer, master.map(i => importFill(i)));
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 统一多个图层的fillsMask */
    unifyShapesFillsMask(views: ShapeView[], fillsMask: string) {
        if (!views.length) return;
        try {
            const api = this.getApi('unifyShapesFillsMask');
            const pageView = views[0].getPage() as PageView;
            const page = pageView.data;
            for (const view of views) {
                const linked = this.getMaskVariable(api, pageView, view, fillsMask);
                linked ? api.shapeModifyVariable(page, linked, fillsMask) : api.modifyFillsMask(page, adapt2Shape(view), fillsMask);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 创建一个填充遮罩 */
    createFillsMask(document: Document, mask: FillMask, pageView: PageView, views?: ShapeView[]) {
        try {
            const api = this.getApi('createFillsMask');
            api.styleInsert(document, mask);
            if (views) {
                const variables: Variable[] = [];
                const shapes: Shape[] = [];
                for (const view of views) {
                    const variable = this.getMaskVariable(api, pageView, view, mask.id);
                    variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
                }
                const page = pageView.data;
                for (const variable of variables) {
                    if (variable.value !== mask.id) api.shapeModifyVariable(page, variable, mask.id);
                }
                for (const shape of shapes) api.modifyFillsMask(page, shape, mask.id);
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改图层的填充遮罩 */
    setShapesFillMask(pageView: PageView, views: ShapeView[], value: string) {
        try {
            const page = adapt2Shape(pageView) as Page;
            const api = this.getApi('setShapesFillMask');
            const variables: Variable[] = [];
            const shapes: Shape[] = [];
            for (const view of views) {
                const variable = this.getMaskVariable(api, pageView, view, value);
                variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
            }
            for (const variable of variables) {
                if (variable.value !== value) api.shapeModifyVariable(page, variable, value);
            }
            for (const shape of shapes) api.modifyFillsMask(page, shape, value);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 解绑图层上的填充遮罩 */
    unbindShapesFillMask(document: Document, pageView: PageView, views: ShapeView[]) {
        try {
            if (!views.length) return;

            const api = this.getApi('unbindShapesFillMask');
            const fillsCopy = views[0].getFills().map(i => importFill(i));

            // 处理遮罩
            const fillMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedFillMaskVariable = this.getMaskVariable(api, pageView, view, undefined);
                linkedFillMaskVariable ? fillMaskVariables.push(linkedFillMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }
            const page = adapt2Shape(pageView) as Page;
            fillMaskVariables.forEach(variable => api.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => api.delfillmask(document, page, shape));

            // 固定现有填充到本地
            const fillsContainer: BasicArray<Fill>[] = [];
            for (const view of views) {
                const linkedVariable = this.getFillsVariable(api, pageView, view);
                fillsContainer.push(linkedVariable ? linkedVariable.value : adapt2Shape(view).style.fills);
            }

            fillsContainer.forEach(source => {
                const __fillsCopy = fillsCopy.map(i => importFill(i));
                api.deleteFills(source, 0, source.length);
                api.addFills(source, __fillsCopy);
            });
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 删除填充遮罩(与解绑有所不同) */
    removeShapesFillMask(document: Document, pageView: PageView, views: ShapeView[]) {
        try {
            const api = this.getApi('removeShapesFillMask');
            const fillMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedFillMaskVariable = this.getMaskVariable(api, pageView, view, undefined);
                linkedFillMaskVariable ? fillMaskVariables.push(linkedFillMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }
            const page = adapt2Shape(pageView) as Page;
            fillMaskVariables.forEach(variable => api.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => api.delfillmask(document, page, shape));

            const fillsContainer: BasicArray<Fill>[] = [];
            for (const view of views) {
                const linkedVariable = this.getFillsVariable(api, pageView, view);
                fillsContainer.push(linkedVariable ? linkedVariable.value : adapt2Shape(view).style.fills);
            }
            fillsContainer.forEach(source => api.deleteFills(source, 0, source.length));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
}

/* 实例填充修改器，与FillModifier同名修改器但操作针对实例 */
export class RefFillModifier extends Modifier {
    createFill(pageView: PageView, actions: { view: ShapeView, fill: Fill }[]) {
        try {
            const api = this.getApi('createFill');
            for (const action of actions) {
                const variable = shape4fill2(api, pageView, action.view);
                api.addFillAt(variable.value, importFill(action.fill), variable.value.length);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    setFillsEnabled(pageView: PageView, views: ShapeView[], index: number, enable: boolean) {
        try {
            const api = this.getApi('setFillsEnabled');
            for (const view of views) {
                const variable = shape4fill2(api, pageView, view);
                api.setFillEnable(variable.value[index], enable)
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    setFillsType(pageView: PageView, views: ShapeView[], index: number, type: string) {
        try {
            const api = this.getApi('createFill');
            for (const view of views) {
                const variable = shape4fill2(api, pageView, view);
                const fill = variable.value[index];
                if (type === FillType.SolidColor) {
                    api.setFillType(fill, FillType.SolidColor);
                } else if (type === FillType.Pattern) {
                    api.setFillType(fill, FillType.Pattern);
                    if (!fill.imageScaleMode) api.setFillScaleMode(fill, ImageScaleMode.Fill);
                } else {
                    api.setFillType(fill, FillType.Gradient);
                    initGradient(api, { fill, type });
                }
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    setFillsColor(pageView: PageView, views: ShapeView[], index: number, color: Color) {
        try {
            if (!views.length) return;
            const api = this.getApi('setFillsColor');
            for (const view of views) {
                const variable = shape4fill2(api, pageView, view);
                api.setFillColor(variable.value[index], color);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    setGradientOpacity(pageView: PageView, views: ShapeView[], index: number, opacity: number) {
        try {
            const api = this.getApi('setGradientOpacity');
            for (const view of views) {
                const variable = shape4fill2(api, pageView, view);
                const fill = variable.value[index];
                const gradient = fill.gradient!;
                api.setGradientOpacity(gradient, opacity);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    removeFill(pageView: PageView, views: ShapeView[], index: number) {
        try {
            const api = this.getApi('removeFill');
            for (const view of views) {
                const variable = shape4fill2(api, pageView, view);
                api.deleteFillAt(variable.value, index);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    unifyShapesFills(pageView: PageView, views: ShapeView[]) {
        if (!views.length) return;
        try {
            const api = this.getApi('unifyShapesFills');
            const master: Fill[] = shape4fill2(api, pageView, views[0]).value.map((i: Fill) => importFill(i));
            for (const view of views) {
                const fillContainer = shape4fill2(api, pageView, view).value;
                api.deleteFills(fillContainer, 0, fillContainer.length);
                api.addFills(fillContainer, master.map(i => importFill(i)));
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
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