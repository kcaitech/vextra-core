import { Api, CoopRepository } from "../../coop";
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
    VariableType,
    Shadow,
    ShadowPosition
} from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { exportGradient } from "../../data/baseexport";
import { uuid } from "../../basic/uuid";
import { _ov, override_variable } from "../symbol";
import { importFill } from "../../data/baseimport";

/* 填充修改器 */
export class ShadowsModifier extends Modifier {
    constructor(repo: CoopRepository) {
        super(repo);
    }

    private getMaskVariable(api: Api, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.ShadowsMask, OverrideType.ShadowsMask, () => value, view, page, api);
    }

    private getShadowsVariable(api: Api, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Shadows, OverrideType.Shadows, (_var) => {
            const fills = _var?.value ?? view.getShadows();
            return new BasicArray(...(fills as Array<Fill>).map((v) => {
                const ret = importFill(v);
                const imgmgr = v.getImageMgr();
                if (imgmgr) ret.setImageMgr(imgmgr)
                return ret;
            }
            ))
        }, api, view);
    }

    /* 创建一个阴影 */
    createShadows(actions: { shadows: Shadow[], shadow: Shadow, index: number }[]) {
        try {
            const api = this.getApi('createShadows');
            actions.forEach(action => api.addShadow(action.shadows, action.shadow, action.index));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 隐藏与显示一条阴影 */
    setShadowEnabled(shadows: Shadow[], enable: boolean) {
        try {
            const api = this.getApi('setShadowEnabled');
            for (const shadow of shadows) api.setShadowEnable(shadow, enable);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影位置 */
    setShadowsPosition(actions: { shadow: Shadow, type: ShadowPosition }[]) {
        try {
            const api = this.getApi('setShadowsPosition');
            actions.forEach(action => api.setShadowPosition(action.shadow, action.type));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影X轴 */
    setShadowOffsetX(actions: { shadow: Shadow, value: number }[]) {
        try {
            const api = this.getApi('setShadowOffsetX');
            for (const action of actions) api.setShadowOffsetX(action.shadow, action.value);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影Y轴 */
    setShadowOffsetY(actions: { shadow: Shadow, value: number }[]) {
        try {
            const api = this.getApi('setShadowOffsetY');
            for (const action of actions) api.setShadowOffsetY(action.shadow, action.value);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影扩散半径 */
    setShadowSpread(actions: { shadow: Shadow, value: number }[]) {
        try {
            const api = this.getApi('setShadowSpread');
            for (const action of actions) api.setShadowSpread(action.shadow, action.value);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影模糊半径 */
    setShadowsBlur(actions: { shadow: Shadow, value: number }[]) {
        try {
            const api = this.getApi('setShadowsBlur');
            for (const action of actions) api.setShadowBlur(action.shadow, action.value);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改阴影颜色 */
    setShadowsColor(actions: { shadow: Shadow, color: Color }[]) {
        try {
            const api = this.getApi('setShadowsColor');
            for (const action of actions) api.setShadowColor(action.shadow, action.color);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 删除一个阴影 */
    removeShadows(actions: { shadows: Shadow[], index: number }[]) {
        try {
            const api = this.getApi('removeShadows');
            for (const action of actions) api.deleteShadowAt(action.shadows, action.index);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 统一多个shadows */
    unifyShapesShadows(shadowsContainers:Shadow[]) {
        if (!shadowsContainers.length) return;
        try {
            const api = this.getApi('unifyShapesShadows');
         
            for (const shadowContainer of shadowsContainers) {
                api.deleteShadows(this.page, adapt2Shape(target), 0, target.style.shadows.length);
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
    unifyShapesFillsMask(document: Document, views: ShapeView[], fillsMask: string) {
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
    setShapesFillMask(document: Document, pageView: PageView, views: ShapeView[], value: string) {
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