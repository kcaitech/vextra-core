import { Api, CoopRepository } from "../../coop";
import { Modifier } from "../basic/modifier";
import {
    BasicArray,
    Border,
    BorderMaskType,
    BorderPosition,
    BorderSideSetting,
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
    RadiusType,
    Shape,
    SideType,
    Stop,
    Variable,
    VariableType
} from "../../data";
import { adapt2Shape, PageView, ShapeView } from "../../dataview";
import { exportGradient } from "../../data/baseexport";
import { uuid } from "../../basic/uuid";
import { _ov, override_variable } from "../symbol";
import { importBorder, importFill } from "../../data/baseimport";

/* 填充修改器 */
export class BorderModifier extends Modifier {
    constructor(repo: CoopRepository) {
        super(repo);
    }

    private getFillMaskVariable(api: Api, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.BorderFillsMask, OverrideType.BorderFillsMask, () => value, view, page, api);
    }

    private getStrokeMaskVariable(api: Api, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.BordersMask, OverrideType.BordersMask, () => value, view, page, api);
    }

    private getBorderVariable(api: Api, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Borders, OverrideType.Borders, (_var) => {
            const border = _var?.value ?? view.getBorders();
            return border;
        }, api, view);
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
    setGradientOpacity(actions: { fill: Fill, opacity: number }[]) {
        try {
            const api = this.getApi('setGradientOpacity');
            for (const action of actions) {
                const { fill, opacity } = action;
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

    /* 修改mask边框 */
    setBorderMaskSide(actions: { border: BorderMaskType, side: BorderSideSetting }[]) {
        try {
            const api = this.getApi('setBorderMaskSide');
            actions.forEach(action => api.setBorderSide(action.border, action.side));
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改边框粗细 */
    setBorderThickness(document: Document, pageView: PageView, views: ShapeView[], thickness: number) {
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
                        api.delbordermask(document, adapt2Shape(view).style);
                    }
                    api.setBorderPosition(source, border.position);
                }
                const sideType = border.sideSetting.sideType;
                switch (sideType) {
                    case SideType.Normal:
                        console.log(source, 'thickness');
                        
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
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
    /* 修改边框位置 */
    setBorderPosition(document: Document, pageView: PageView, views: ShapeView[], position: BorderPosition) {
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
                        api.delbordermask(document, adapt2Shape(view).style);
                    }
                    api.setBorderSide(source, border.sideSetting);
                }
                api.setBorderPosition(source, position);
            }
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
    setShapesStrokeMask(document: Document, pageView: PageView, views: ShapeView[], value: string) {
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
            for (const shape of shapes) api.addbordermask(document, shape.style, value);
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
    unbindShapesBorderMask(document: Document, pageView: PageView, views: ShapeView[]) {
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
                    api.delbordermask(document, adapt2Shape(view).style);
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
                    api.delbordermask(document, adapt2Shape(view).style);
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