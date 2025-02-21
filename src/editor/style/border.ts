import { Api, CoopRepository } from "../../coop";
import { Modifier } from "../basic/modifier";
import {
    BasicArray,
    Border,
    BorderMask,
    BorderMaskType,
    BorderPosition,
    BorderSideSetting,
    Document,
    Fill, FillMask,
    OverrideType,
    Page,
    RadiusType,
    Shape,
    SideType,
    Variable,
    VariableType
} from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { _ov, override_variable } from "../symbol";
import { importFill } from "../../data/baseimport";

/* 填充修改器 */
export class BorderModifier extends Modifier {
    importFill = importFill;
    constructor(repo: CoopRepository) {
        super(repo);
    }

    getFillMaskVariable(api: Api, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.BorderFillsMask, OverrideType.BorderFillsMask, () => value, view, page, api);
    }

    getStrokeMaskVariable(api: Api, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.BordersMask, OverrideType.BordersMask, () => value, view, page, api);
    }

    getBorderVariable(api: Api, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Borders, OverrideType.Borders, (_var) => {
            const border = _var?.value ?? view.getBorders();
            return border;
        }, api, view)!;
    }

    /* 创建一个填充 */
    createFill(missions: Function[]) {
        try {
            const api = this.getApi('createFill');
            missions.forEach(call => call(api));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 隐藏与显示一条填充 */
    setFillsEnabled(missions: Function[]) {
        try {
            const api = this.getApi('setFillsEnabled');
            missions.forEach(call => call(api));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改填充颜色 */
    setFillsColor(missions: Function[]) {
        try {
            const api = this.getApi('setFillsColor');
            missions.forEach(call => call(api));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改渐变色透明度 */
    setGradientOpacity(missions: Function[]) {
        try {
            const api = this.getApi('setGradientOpacity');
            missions.forEach(call => call(api));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 删除一个填充 */
    removeFill(missions: Function[]) {
        try {
            const api = this.getApi('removeFill');
            missions.forEach(call => call(api));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 统一多个fills */
    unifyShapesFills(missions: Function[]) {
        try {
            const api = this.getApi('unifyShapesFills');
            missions.forEach(call => call(api));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改mask边框 */
    setBorderMaskSide(actions: { border: BorderMaskType, side: BorderSideSetting }[]) {
        try {
            const api = this.getApi('setBorderMaskSide');
            actions.forEach(action => api.setBorderSide(action.border, action.side));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改边框粗细 */
    setBorderThickness(pageView: PageView, views: ShapeView[], thickness: number) {
        try {
            const api = this.getApi('setBorderThickness');
            const page = adapt2Shape(pageView) as Page;
            for (const view of views) {
                const border = view.getBorders();
                const linkedVariable = this.getBorderVariable(api, pageView, view);
                const source = linkedVariable ? (linkedVariable.value as Border) : adapt2Shape(view).style.borders;
                if (view.bordersMask) {
                    const linkedBorderMaskVariable = this.getStrokeMaskVariable(api, pageView, view, undefined);
                    if (linkedBorderMaskVariable) {
                        api.shapeModifyVariable(page, linkedBorderMaskVariable, undefined);
                    } else {
                        api.modifyBorderMask(adapt2Shape(view).style, undefined);
                    }
                    api.setBorderPosition(source, border.position);
                }
                const sideType = border.sideSetting.sideType;
                switch (sideType) {
                    case SideType.Normal:
                        api.setBorderSide(source, new BorderSideSetting(sideType, thickness, thickness, thickness, thickness));
                        break;
                    case SideType.Top:
                        api.setBorderThicknessTop(source, thickness);
                        break
                    case SideType.Right:
                        api.setBorderThicknessRight(source, thickness);
                        break
                    case SideType.Bottom:
                        api.setBorderThicknessBottom(source, thickness);
                        break
                    case SideType.Left:
                        api.setBorderThicknessLeft(source, thickness);
                        break
                    default:
                        api.setBorderSide(source, new BorderSideSetting(SideType.Custom, thickness, thickness, thickness, thickness));
                        break;
                }
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改边框自定义粗细 */
    setBorderCustomThickness(pageView: PageView, shapes: ShapeView[], thickness: number, type: SideType) {
        try {
            const api = this.getApi('setBorderCustomThickness');
            for (const view of shapes) {
                const linkedVariable = this.getBorderVariable(api, pageView, view);
                const source = linkedVariable ? (linkedVariable.value as Border) : adapt2Shape(view).style.borders;
                switch (type) {
                    case SideType.Top:
                        api.setBorderThicknessTop(source, thickness);
                        break
                    case SideType.Right:
                        api.setBorderThicknessRight(source, thickness);
                        break
                    case SideType.Bottom:
                        api.setBorderThicknessBottom(source, thickness);
                        break
                    case SideType.Left:
                        api.setBorderThicknessLeft(source, thickness);
                        break
                    default:
                        break;
                }
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改mask边框位置 */
    setBorderMaskPosition(actions: { border: BorderMaskType, position: BorderPosition }[]) {
        try {
            const api = this.getApi('setBorderMaskPosition');
            actions.forEach(action => api.setBorderPosition(action.border, action.position));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改边框位置 */
    setBorderPosition(pageView: PageView, views: ShapeView[], position: BorderPosition) {
        try {
            const api = this.getApi('setBorderPosition');
            const page = adapt2Shape(pageView) as Page;
            for (const view of views) {
                const border = view.getBorders();
                const linkedVariable = this.getBorderVariable(api, pageView, view);
                const source = linkedVariable ? (linkedVariable.value as Border) : adapt2Shape(view).style.borders;
                if (view.bordersMask) {
                    const linkedBorderMaskVariable = this.getStrokeMaskVariable(api, pageView, view, undefined);
                    if (linkedBorderMaskVariable) {
                        api.shapeModifyVariable(page, linkedBorderMaskVariable, undefined);
                    } else {
                        api.modifyBorderMask(adapt2Shape(view).style, undefined);
                    }
                    api.setBorderSide(source, border.sideSetting);
                }
                api.setBorderPosition(source, position);
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
                const linked = this.getFillMaskVariable(api, pageView, view, fillsMask);
                linked ? api.shapeModifyVariable(page, linked, fillsMask) : api.setBorderFillMask(document, adapt2Shape(view).style, fillsMask);
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
            const fills = new BasicArray(...mask.fills.map(i => importFill(i)));
            mask.fills = fills;
            api.styleInsert(document, mask);
            if (views) {
                const variables: Variable[] = [];
                const shapes: Shape[] = [];
                for (const view of views) {
                    const variable = this.getFillMaskVariable(api, pageView, view, mask.id);
                    variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
                }
                const page = pageView.data;
                for (const variable of variables) {
                    if (variable.value !== mask.id) api.shapeModifyVariable(page, variable, mask.id);
                }
                for (const shape of shapes) api.setBorderFillMask(document, shape.style, mask.id);
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 创建一个边框遮罩 */
    createBorderMask(document: Document, mask: BorderMask, pageView: PageView, views?: ShapeView[]) {
        try {
            const api = this.getApi('createBorderMask');
            api.styleInsert(document, mask);
            if (views) {
                const variables: Variable[] = [];
                const shapes: Shape[] = [];
                for (const view of views) {
                    const variable = this.getStrokeMaskVariable(api, pageView, view, mask.id);
                    variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
                }
                const page = pageView.data;
                for (const variable of variables) {
                    if (variable.value !== mask.id) api.shapeModifyVariable(page, variable, mask.id);
                }
                for (const shape of shapes) api.modifyBorderMask(shape.style, mask.id);
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    /* 修改图层的边框填充遮罩 */
    setShapesFillMask(document: Document, pageView: PageView, views: ShapeView[], value: string) {
        try {
            const page = adapt2Shape(pageView) as Page;
            const api = this.getApi('setShapesFillMask');
            const variables: Variable[] = [];
            const shapes: Shape[] = [];
            for (const view of views) {
                const variable = this.getFillMaskVariable(api, pageView, view, value);
                variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
            }
            for (const variable of variables) {
                if (variable.value !== value) api.shapeModifyVariable(page, variable, value);
            }
            for (const shape of shapes) api.setBorderFillMask(document, shape.style, value);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改图层的边框遮罩 */
    setShapesStrokeMask(pageView: PageView, views: ShapeView[], value: string) {
        try {
            const page = adapt2Shape(pageView) as Page;
            const api = this.getApi('setShapesStrokeMask');
            const variables: Variable[] = [];
            const shapes: Shape[] = [];
            for (const view of views) {
                const variable = this.getStrokeMaskVariable(api, pageView, view, value);
                variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
            }
            for (const variable of variables) {
                if (variable.value !== value) api.shapeModifyVariable(page, variable, value);
            }
            for (const shape of shapes) api.modifyBorderMask(shape.style, value);
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
            const borderCopy = views[0].getBorders();

            // 处理遮罩
            const fillMaskVariables: Variable[] = [];
            const shapes4mask: Shape[] = [];
            for (const view of views) {
                const linkedFillMaskVariable = this.getFillMaskVariable(api, pageView, view, undefined);
                linkedFillMaskVariable ? fillMaskVariables.push(linkedFillMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }
            const page = adapt2Shape(pageView) as Page;
            fillMaskVariables.forEach(variable => api.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => api.delBorderFillMask(document, shape.style));

            // 固定现有填充到本地
            const fillsContainer: BasicArray<Fill>[] = [];
            for (const view of views) {
                const linkedVariable = this.getBorderVariable(api, pageView, view);
                fillsContainer.push(linkedVariable ? (linkedVariable.value as Border).strokePaints : adapt2Shape(view).style.borders.strokePaints);
            }

            fillsContainer.forEach(source => {
                const __borderCopy = borderCopy.strokePaints.map(i => importFill(i));
                api.deleteFills(source, 0, source.length);
                api.addFills(source, __borderCopy);
            });
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 解绑图层上的边框遮罩 */
    unbindShapesBorderMask(pageView: PageView, views: ShapeView[]) {
        try {
            if (!views.length) return;

            const api = this.getApi('unbindShapesBorderMask');
            const page = adapt2Shape(pageView) as Page;
            const borderCopy = views[0].getBorders();
            // 处理遮罩
            for (const view of views) {
                const linkedBorderMaskVariable = this.getStrokeMaskVariable(api, pageView, view, undefined);
                if (linkedBorderMaskVariable) {
                    api.shapeModifyVariable(page, linkedBorderMaskVariable, undefined);
                } else {
                    api.modifyBorderMask(adapt2Shape(view).style, undefined);
                }
            }

            for (const view of views) {
                const linkedVariable = this.getBorderVariable(api, pageView, view);
                const source = linkedVariable ? (linkedVariable.value as Border) : adapt2Shape(view).style.borders;
                let sideSetting = borderCopy.sideSetting;
                if (view.radiusType !== RadiusType.Rect) {
                    const type = SideType.Normal;
                    const side = borderCopy.sideSetting;
                    const thickness = side.thicknessTop || side.thicknessLeft || side.thicknessBottom || side.thicknessRight || 1;
                    sideSetting = new BorderSideSetting(type, thickness, thickness, thickness, thickness);
                }
                api.setBorderPosition(source, borderCopy.position);
                api.setBorderSide(source, sideSetting);
            }

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
                const linkedFillMaskVariable = this.getFillMaskVariable(api, pageView, view, undefined);
                linkedFillMaskVariable ? fillMaskVariables.push(linkedFillMaskVariable) : shapes4mask.push(adapt2Shape(view));
            }
            const page = adapt2Shape(pageView) as Page;
            fillMaskVariables.forEach(variable => api.shapeModifyVariable(page, variable, undefined));
            shapes4mask.forEach(shape => api.delBorderFillMask(document, shape.style));

            const fillsContainer: BasicArray<Fill>[] = [];
            for (const view of views) {
                const linkedVariable = this.getBorderVariable(api, pageView, view);
                fillsContainer.push(linkedVariable ? (linkedVariable.value as Border).strokePaints : adapt2Shape(view).style.borders.strokePaints);
            }
            fillsContainer.forEach(source => api.deleteFills(source, 0, source.length));
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 删除边框 */
    removeShapesBorder(document: Document, pageView: PageView, views: ShapeView[]) {
        try {
            const api = this.getApi('removeShapesBorder');
            const page = adapt2Shape(pageView) as Page;
            for (const view of views) {
                const linkedFillMaskVariable = this.getFillMaskVariable(api, pageView, view, undefined);
                const linkedBorderMaskVariable = this.getStrokeMaskVariable(api, pageView, view, undefined);

                if (linkedFillMaskVariable) {
                    api.shapeModifyVariable(page, linkedFillMaskVariable, undefined);
                } else {
                    api.delBorderFillMask(document, adapt2Shape(view).style);
                }

                if (linkedBorderMaskVariable) {
                    api.shapeModifyVariable(page, linkedBorderMaskVariable, undefined);
                } else {
                    api.modifyBorderMask(adapt2Shape(view).style, undefined);
                }
            }

            for (const view of views) {
                const linkedVariable = this.getBorderVariable(api, pageView, view);
                const source = linkedVariable ? (linkedVariable.value as Border).strokePaints : adapt2Shape(view).style.borders.strokePaints;
                api.deleteFills(source, 0, source.length);
            }
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
}