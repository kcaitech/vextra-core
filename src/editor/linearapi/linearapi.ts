/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Document, OvalShape, Fill, Blur, Variable, StackSizing, PaddingDir } from "../../data";
import { adapt2Shape, ArtboardView, PageView, ShapeView, SymbolRefView, SymbolView, TableCellView, TableView, TextShapeView } from "../../dataview";
import { modifyPathByArc } from "../asyncapi";
import { Api, IRepository } from "../../repo";
import { modify_shapes_height, modify_shapes_width } from "../utils/common";
import {
    Artboard,
    Border,
    BorderSideSetting,
    Color,
    FillType,
    OverrideType,
    PathShape,
    Shadow,
    Shape,
    ShapeType,
    SideType,
    SymbolRefShape,
    Transform,
    VariableType
} from "../../data";
import { _ov, override_variable, shape4Autolayout, shape4border, shape4contextSettings, shape4cornerRadius, shape4fill, shape4shadow } from "../symbol";
import { update_frame_by_points } from "../utils/path";
import { GroupShape, PathShape2, SymbolShape, TextShape, RadiusType } from "../../data";
import { BatchAction, BatchAction5, PageEditor } from "../page";
import { TableEditor } from "../table";
import { TidyUpAlign, tidyUpLayout } from "../utils/auto_layout";
import { TextShapeEditor } from "../textshape";
import { importGradient } from "../../data/baseimport";

/**
 * @description 合并同类型API，适用于键盘的连续动作，相较于asyncapi，linearapi是自动启停，所以无法跟asyncapi一样控制启停时机
 */
export class LinearApi {
    private readonly __repo: IRepository;
    private readonly __document: Document;

    private readonly _page: PageView;

    private exception: boolean = false;

    private api: Api | undefined;

    constructor(repo: IRepository, document: Document, page: PageView) {
        this.__repo = repo;
        this.__document = document;

        this._page = page;
    }

    get page() {
        return this._page.data
    }

    private __timer: any = null;
    // (ms)等待时长，达到后断开连接，为0时在执行完任务之后立刻断开; 键盘长按判定一般是500ms，加20ms用来包括长按
    private __duration: number = 520;

    set duration(val: number) {
        this.__duration = val;
    }

    private __update() {
        this.__repo.fireNotify();
    }

    private __commit() {
        this.__repo.commit();
    }

    private __rollback() {
        this.__repo.rollback();
    }

    private __connected: boolean = false;

    private connected(desc = 'linear-action') {
        if (this.__connected) return true;
        else if (this.__repo.isInTransact()) return false;
        else {
            this.api = this.__repo.start(desc);
            this.__connected = true;
            return true;
        }
    }

    private disconnected() {
        if (!this.__connected) return;
        this.__connected = false;
        this.exception ? this.__rollback() : this.__commit();
    }

    private execute(desc: string, exe: Function) {
        try {
            if (!this.connected(desc)) return;
            exe();
            this.__update();
        } catch (error) {
            this.exception = true;
            console.error(error);
        } finally {
            const duration = this.__duration;

            if (!duration) this.disconnected();
            else {
                clearTimeout(this.__timer);
                this.__timer = setTimeout(() => {
                    this.disconnected();
                    clearTimeout(this.__timer);
                    this.__timer = null;
                }, duration);
            }
        }
    }

    // private---------divide---------public

    /**
     * @description 修改弧形起点
     */
    modifyStartingAngle(shapes: ShapeView[], value: number) {
        this.execute('modify-starting-angle-linear', () => {
            const api = this.api!;
            const round = Math.PI * 2;
            const page = this.page;

            for (const view of shapes) {
                const shape = adapt2Shape(view);
                if (!(shape instanceof OvalShape)) continue;
                const end = shape.endingAngle ?? round;
                const start = shape.startingAngle ?? 0;
                const delta = end - start;
                api.ovalModifyStartingAngle(page, shape, value);
                api.ovalModifyEndingAngle(page, shape, value + delta);

                modifyPathByArc(api, page, shape);
            }
        });
    }

    /**
     * @description 修改弧形覆盖率
     */
    modifySweep(shapes: ShapeView[], value: number) {
        this.execute('modify-sweep-linear', () => {
            const api = this.api!;
            const page = this.page;

            for (const view of shapes) {
                const shape = adapt2Shape(view);
                if (!(shape instanceof OvalShape)) continue;
                const start = shape.startingAngle ?? 0;
                api.ovalModifyEndingAngle(page, shape, start + value);
                modifyPathByArc(api, page, shape);
            }
        });
    }

    /**
     * @description 修改弧形镂空半径
     */
    modifyInnerRadius(shapes: ShapeView[], value: number) {
        this.execute('modify-inner-radius-linear', () => {
            const api = this.api!;
            const page = this.page;

            for (const view of shapes) {
                const shape = adapt2Shape(view);
                if (!(shape instanceof OvalShape)) continue;

                api.ovalModifyInnerRadius(page, shape, value);
                modifyPathByArc(api, page, shape);
            }
        });
    }

    /**
     * @description 修改图形X轴位置
     */
    modifyShapesX(actions: {
        target: ShapeView,
        x: number
    }[]) {
        this.execute('modify-shapes-x', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                const shape = adapt2Shape(action.target)
                api.shapeModifyXY(page, shape, action.x, shape.transform.translateY);
            }
        });
    }

    /**
     * @description 修改图形Y轴位置
     */
    modifyShapesY(actions: {
        target: ShapeView,
        y: number
    }[]) {
        this.execute('modify-shapes-y', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                const shape = adapt2Shape(action.target)
                api.shapeModifyXY(page, shape, shape.transform.translateX, action.y);
            }
        });
    }

    /**
     * @description 偏移图形XY轴位置
     */
    modifyShapesXY(actions: {
        target: ShapeView,
        dx: number,
        dy: number
    }[]) {
        this.execute('modify-shapes-xy', () => {
            const api = this.api!;
            const page = this.page;
            for (const action of actions) {
                const { target, dx, dy } = action;
                if (target.isVirtualShape) continue;
                api.shapeModifyXY(page, adapt2Shape(target), target.transform.translateX + dx, target.transform.translateY + dy);
            }
        });
    }

    /**
    * @description 修改图形宽度
    */

    modifyShapesWidth(shapes: ShapeView[], val: number) {
        this.execute('modify-shapes-width', () => {
            const api = this.api!;
            const page = this.page;
            modify_shapes_width(api, this.__document, page, shapes, val)
        });
    }

    /**
     * @description 修改图形高度
     */

    modifyShapesHeight(shapes: ShapeView[], val: number) {
        this.execute('modify-shapes-height', () => {
            const api = this.api!;
            const page = this.page;
            modify_shapes_height(api, this.__document, page, shapes, val)
        });
    }

    /**
    * @description 修改图形高度
    */

    setShapesRotate(actions: {
        shape: ShapeView,
        transform: Transform
    }[]) {
        this.execute('set-shapes-rotate', () => {
            const api = this.api!;
            const page = this.page;
            for (const action of actions) {
                const { shape: shapeView, transform } = action;
                const s = adapt2Shape(shapeView);
                api.shapeModifyRotate(page, s, transform);
            }
        });
    }

    /**
     * @description 修改图形圆角
     */
    getRadiusMaskVariable(api: Api, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.RadiusMask, OverrideType.RadiusMask, () => value, view, page, api);
    }
    shapesModifyRadius(shapes: ShapeView[], values: number[]) {
        this.execute('set-shapes-rotate', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);

                if (shape.radiusMask) {
                    const variable = this.getRadiusMaskVariable(api, this._page, shapes[i], undefined);
                    if (variable) {
                        api.shapeModifyVariable(page, variable, undefined);
                    } else {
                        api.delradiusmask(shape);
                    }
                }
                let needUpdateFrame = false;

                if (shape.radiusType === RadiusType.Rect) {
                    if (values.length !== 4) {
                        values = [values[0], values[0], values[0], values[0]];
                    }

                    const [lt, rt, rb, lb] = values;
                    if (shape instanceof SymbolRefShape) {
                        const _shape = shape4cornerRadius(api, this._page, shapes[i] as SymbolRefView);
                        api.shapeModifyRadius2(page, _shape, lt, rt, rb, lb);
                    }

                    if (shape.isVirtualShape) continue;

                    if (shape instanceof PathShape || shape instanceof PathShape2) {
                        const points = shape.pathsegs[0].points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) continue;
                            api.modifyPointCornerRadius(page, shape, _i, val, 0);
                        }
                        needUpdateFrame = true;
                    } else {
                        const __shape = shape as Artboard | SymbolShape;
                        api.shapeModifyRadius2(page, __shape, lt, rt, rb, lb)
                    }
                } else {
                    if (shape.isVirtualShape || shape.radiusType === RadiusType.None) continue;
                    if (shape instanceof PathShape || shape instanceof PathShape2) {
                        shape.pathsegs.forEach((seg, index) => {
                            for (let _i = 0; _i < seg.points.length; _i++) {
                                if (seg.points[_i].radius === values[0]) continue;
                                api.modifyPointCornerRadius(page, shape, _i, values[0], index);
                            }
                        });
                        needUpdateFrame = true;
                    } else {
                        api.shapeModifyFixedRadius(page, shape as GroupShape | TextShape, values[0]);
                    }
                }
                if (needUpdateFrame) {
                    update_frame_by_points(api, page, shape as PathShape);
                }
            }
        });
    }

    /**
    * @description 修改图形透明度
    */

    modifyShapesOpacity(shapes: ShapeView[], value: number) {
        this.execute('modify-shapes-opacity', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shape4contextSettings(api, shapes[i], this._page);
                api.shapeModifyContextSettingsOpacity(page, shape, value);
            }
        });
    }

    /**
    * @description 修改图形填充透明度-gradient
    */

    modifyGradientOpacity(actions: BatchAction5[]) {
        this.execute('modify-gradient-opacity', () => {
            const api = this.api!;
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type, value } = actions[i];
                const grad_type = type === 'fills' ? target.getFills() : target.getBorder().strokePaints;
                if (!grad_type?.length) continue;
                const gradient_container = grad_type[index];
                if (!gradient_container || !gradient_container.gradient || gradient_container.fillType !== FillType.Gradient) continue;
                const gradient = gradient_container.gradient;
                const new_gradient = importGradient(gradient);
                new_gradient.gradientOpacity = value;
                if (type === "fills") {
                    const _tar = shape4fill(api, this._page, target);
                    const fills = _tar instanceof Variable ? _tar.value : target.getFills();
                    api.setFillGradient(fills[index], new_gradient);
                } else {
                    const _tar = shape4border(api, this._page, target);
                    const fills = _tar instanceof Variable ? _tar.value.strokePaints : target.getBorder().strokePaints;
                    api.setFillGradient(fills[index], new_gradient);
                }
            }
        });
    }

    /**
    * @description 修改图形填充透明度-solid
    */
    modifyFillOpacity(actions: { fill: Fill, color: Color }[]) {
        this.execute('modify-fill-opacity', () => {
            const api = this.api!;
            for (const action of actions) {
                const { fill, color } = action;
                api.setFillColor(fill, color);
            }
        });
    }

    private editor4table: undefined | TableEditor;
    private TableShape: undefined | TableView;
    private getTableEditor(table: TableView) {
        if (!this.editor4table) {
            this.editor4table = new PageEditor(this.__repo, this._page, this.__document).editor4Table(table)
        }
        return this.editor4table!;
    }

    /**
     * @deprecated 表格功能模块已经被遗弃
     * @description 修改图形填充透明度-table
     */
    modifyFillOpacity4Cell(idx: number, color: Color, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }, table: TableView) {
        const editor = this.getTableEditor(table);
        this.execute('modify-fill-opacity-4Cell', () => {
            const api = this.api!;
            const page = this.page;
            editor.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = editor.cell4edit(cell.rowIdx, cell.colIdx, api);
                    // api.setFillColor(page, c.data, idx, color);
                }
            })
        });
    }

    /**
     * @description 修改边框透明度
     */

    modifyBorderOpacity(actions: BatchAction[]) {
        this.execute('modify-border-opacity', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4border(api, this._page, target);
                api.setBorderColor(page, s, index, value);
            }
        });
    }

    /**
     * @description 修改边框透明度-table
     */

    modifyBorderOpacity4Cell(idx: number, color: Color, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }, table: TableView) {
        const editor = this.getTableEditor(table);
        this.execute('modify-border-opacity-4Cell', () => {
            const api = this.api!;
            const page = this.page;
            editor.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = editor.cell4edit(cell.rowIdx, cell.colIdx, api);
                    api.setBorderColor(page, c.data, idx, color);
                }
            })
        });
    }

    /**
     *  @description 修改边框粗细
     */

    private getBorderVariable(api: Api, page: PageView, view: ShapeView) {
        return override_variable(page, VariableType.Borders, OverrideType.Borders, (_var) => {
            const border = _var?.value ?? view.getBorder();
            return border;
        }, api, view);
    }

    private getStrokeMaskVariable(api: Api, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.BordersMask, OverrideType.BordersMask, () => value, view, page, api);
    }

    modifyShapesBorderThickness(shapes: ShapeView[], thickness: number) {
        this.execute('modify-shapes-border-Thickness', () => {
            const api = this.api!;
            for (const view of shapes) {
                const border = view.getBorder();
                const linkedVariable = this.getBorderVariable(api, this._page, view);
                const source = linkedVariable ? (linkedVariable.value as Border) : adapt2Shape(view).style.borders;
                if (view.bordersMask) {
                    const linkedBorderMaskVariable = this.getStrokeMaskVariable(api, this._page, view, undefined);
                    if (linkedBorderMaskVariable) {
                        api.shapeModifyVariable(this.page, linkedBorderMaskVariable, undefined);
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
        });
    }

    modifyBorderCustomThickness(shapes: ShapeView[], thickness: number, sideType: SideType) {
        this.execute('modify-shapes-border-Thickness', () => {
            const api = this.api!;
            for (const view of shapes) {
                const linkedVariable = this.getBorderVariable(api, this._page, view);
                const source = linkedVariable ? linkedVariable.value : view.style.borders;
                switch (sideType) {
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
        });
    }

    /**
     * @description 修改边框粗细 table
     */

    modifyBorderThickness4Cell(thickness: number, range: { rowStart: number, rowEnd: number, colStart: number, colEnd: number }, table: TableView) {
        const editor = this.getTableEditor(table);
        this.execute('modify-border-thickness-4Cell', () => {
            const api = this.api!;
            const page = this.page;
            editor.view._getVisibleCells(range.rowStart, range.rowEnd, range.colStart, range.colEnd).forEach((cell) => {
                if (cell.cell) {
                    const c = editor.cell4edit(cell.rowIdx, cell.colIdx, api);
                    api.setBorderSide(c.data.getBorders(), new BorderSideSetting(SideType.Normal, thickness, thickness, thickness, thickness));
                }
            })
        });
    }

    /**
     * @description 修改图形模糊样式
     */

    modifyShapeBlurSaturation(actions: { blur: Blur, value: number }[]) {
        this.execute('modify-shape-blur-saturation', () => {
            const api = this.api!;
            for (let i = 0; i < actions.length; i++) {
                const { blur, value } = actions[i];
                api.shapeModifyBlurSaturation(blur, value);
            }
        })
    }

    /**
     * @description 修改图形阴影位置 X
     */
    private shape: undefined | ShapeView
    private shape4shadow(api: Api, shape?: ShapeView) {
        if (!this.shape || this.shape !== shape) this.shape = shape;
        return shape4shadow(api, this._page, this.shape!);
    }
    modifyShapesShadowOffsetX(actions: { shadow: Shadow, value: number }[]) {
        this.execute('modify-shapes-shadow-offset-x', () => {
            const api = this.api!;
            for (let i = 0; i < actions.length; i++) {
                const { shadow, value } = actions[i];
                api.setShadowOffsetX(shadow, value);
            }
        })
    }

    /**
     * @description 修改图形阴影位置 Y
     */

    modifyShapesShadowOffsetY(actions: { shadow: Shadow, value: number }[]) {
        this.execute('modify-shapes-shadow-offset-y', () => {
            const api = this.api!;
            for (let i = 0; i < actions.length; i++) {
                const { shadow, value } = actions[i];
                api.setShadowOffsetY(shadow, value);
            }
        })
    }

    /**
     * @description 修改图形阴影blur
     */
    modifyShapesShadowBlur(actions: { shadow: Shadow, value: number }[]) {
        this.execute('modify-shapes-shadow-blur', () => {
            const api = this.api!;
            for (let i = 0; i < actions.length; i++) {
                const { shadow, value } = actions[i];
                api.setShadowBlur(shadow, value);
            }
        })
    }

    /**
    * @description 修改图形阴影spread
    */
    modifyShapesShadowSpread(actions: { shadow: Shadow, value: number }[]) {
        this.execute('modify-shapes-shadow-spread', () => {
            const api = this.api!;
            for (let i = 0; i < actions.length; i++) {
                const { shadow, value } = actions[i];
                api.setShadowSpread(shadow, value);
            }
        })
    }

    /**
     * @description 修改图形阴影color
     */

    modifyShadowColor(idx: number, color: Color, s: ShapeView) {
        this.execute('modify-shadow-color', () => {
            const api = this.api!;
            const target = this.shape4shadow(api, s);
            const shadow = target instanceof Variable ? target.value[idx] : s.getShadows()[idx];
            api.setShadowColor(shadow, color);
        })
    }

    modifyShapesShadowColor(actions: BatchAction[]) {
        this.execute('modify-shapes-shadow-color', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                const _tar = this.shape4shadow(api, target);
                const shadow = _tar instanceof Variable ? _tar.value[index] : target.getShadows()[index];
                api.setShadowColor(shadow, value);
            }
        })
    }

    /**
     * @description 修改自动布局间距
     */

    tidyUpShapesLayout(shape_rows: ShapeView[][], hor: number, ver: number, dir: boolean, algin: TidyUpAlign) {
        this.execute('tidyup-shapes-layout', () => {
            const api = this.api!;
            const page = this.page;
            tidyUpLayout(page, api, shape_rows, hor, ver, dir, algin);
        })
    }


    /**
     *  @description 自动布局内重新布局
     */

    reLayout(env: ArtboardView | SymbolView, sort: Map<string, number>) {
        this.execute('re-layout-linear', () => {
            const parent = shape4Autolayout(this.api!, env, this._page) as GroupShape;
            const childs = parent.childs.filter(s => s.isVisible);
            const hidden_childs = parent.childs.filter(s => !s.isVisible);
            const shapesSorted: Shape[] = [...childs].sort((a, b) => sort.get(a.id)! < sort.get(b.id)! ? -1 : 1);
            shapesSorted.unshift(...hidden_childs);
            for (let i = 0; i < shapesSorted.length; i++) {
                const s = shapesSorted[i];
                const currentIndex = parent.indexOfChild(s);
                if (currentIndex === i || !s.isVisible) continue;
                this.api!.shapeMove(this.page, parent, currentIndex, parent, i);
            }
        });
    }

    private editor4text: undefined | TextShapeEditor;
    private TextShape: undefined | TextShapeView;
    private getTextEditor(text: TextShapeView) {
        if (!this.editor4text || this.TextShape !== text) {
            this.editor4text = new PageEditor(this.__repo, this._page, this.__document).editor4TextShape(text)
            this.TextShape = text
        }
        return this.editor4text!;
    }

    /**
     * @description 修改文本颜色 alpha
     */

    modifyTextColor(index: number, len: number, color: Color | undefined, text: TextShapeView) {
        const editor4text = this.getTextEditor(text)
        if (len === 0) {
            let cacheAttr = editor4text.getCachedSpanAttr();
            if (cacheAttr === undefined) {
                editor4text.setCachedSpanAttr;
                cacheAttr = editor4text.getCachedSpanAttr()
                if (cacheAttr) cacheAttr.color = color;
                return;
            }
        }
        this.execute('modify-text-color', () => {
            const api = this.api!;
            const page = this.page;
            const shape = editor4text.shape4edit(api);
            api.textModifyColor(page, shape, index, len, color)
        })
    }

    modifyTextColorMulti(shapes: (TextShapeView | TableCellView)[], color: Color | undefined) {
        this.execute('modify-text-color-multi', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const editor4text = this.getTextEditor(text_shape as TextShapeView)
                const shape = editor4text.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyColor(page, shape, 0, text_length, color);
            }
        })
    }

    /**
     * @description 修改文本高亮 alpha
     */

    modifyTextHighlightColor(index: number, len: number, color: Color | undefined, text: TextShapeView) {
        const editor4text = this.getTextEditor(text)
        if (len === 0) {
            let cacheAttr = editor4text.getCachedSpanAttr();
            if (cacheAttr) cacheAttr.highlight = color;
            return;
        }
        this.execute('modify-text-highlight-color', () => {
            const api = this.api!;
            const page = this.page;
            const shape = editor4text.shape4edit(api);
            api.textModifyHighlightColor(page, shape, index, len, color)
        })
    }

    modifyTextHighlightColorMulti(shapes: (TextShapeView | TableCellView)[], color: Color | undefined) {
        this.execute('modify-text-highlight-color-multi', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const editor4text = this.getTextEditor(text_shape as TextShapeView)
                const shape = editor4text.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyHighlightColor(page, shape, 0, text_length, color);
            }
        })
    }

    /**
     * @description 修改文本字号 size
     */

    modifyTextFontSize(index: number, len: number, fontSize: number, text: TextShapeView) {
        const editor4text = this.getTextEditor(text)
        if (typeof fontSize !== 'number') {
            fontSize = Number.parseFloat(fontSize);
        }
        if (len === 0) {
            let cacheAttr = editor4text.getCachedSpanAttr();
            if (cacheAttr) cacheAttr.fontSize = fontSize;
            return;
        }
        this.execute('modify-text-font-size', () => {
            const api = this.api!;
            const page = this.page;
            const shape = editor4text.shape4edit(api);
            const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
            const text_length = text.length;
            if (len === text_length - 1) {
                len = text_length;
            }
            api.textModifyFontSize(page, shape, index, len, fontSize)
            editor4text.fixFrameByLayout(api);
        })
    }

    modifyTextFontSizeMulti(shapes: (TextShapeView | TableCellView)[], fontSize: number) {
        this.execute('modify-text-font-size-multi', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0, len = shapes.length; i < len; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const editor4text = this.getTextEditor(text_shape as TextShapeView)
                const shape = editor4text.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                const text_length = text.length;
                if (text_length === 0) continue;
                api.textModifyFontSize(page, shape, 0, text_length, fontSize);
            }
        })
    }

    /**
     * @description 修改文本行高
     */

    modifyTextLineHeight(lineHeight: number | undefined, isAuto: boolean, index: number, len: number, text: TextShapeView) {
        const editor4text = this.getTextEditor(text)
        this.execute('modify-text-line-height', () => {
            const api = this.api!;
            const page = this.page;
            const shape = editor4text.shape4edit(api);
            api.textModifyAutoLineHeight(page, shape, isAuto, index, len)
            api.textModifyMinLineHeight(page, shape, lineHeight, index, len)
            api.textModifyMaxLineHeight(page, shape, lineHeight, index, len)
            editor4text.fixFrameByLayout(api);
        })
    }

    modifyTextLineHeightMulti(shapes: (TextShapeView | TableCellView)[], lineHeight: number | undefined, isAuto: boolean) {
        this.execute('modify-text-line-height-mulit', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const editor4text = this.getTextEditor(text_shape as TextShapeView)
                const shape = editor4text.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                const text_length = text.length;
                api.textModifyAutoLineHeight(page, shape, isAuto, 0, text_length)
                api.textModifyMinLineHeight(page, shape, lineHeight, 0, text_length)
                api.textModifyMaxLineHeight(page, shape, lineHeight, 0, text_length)
                editor4text.fixFrameByLayout2(api, shape);
            }
        })
    }

    /**
     * @description 修改文本字间距
     */

    modifyTextCharSpacing(kerning: number, index: number, len: number, text: TextShapeView) {
        const editor4text = this.getTextEditor(text)
        if (len === 0) {
            let cacheAttr = editor4text.getCachedSpanAttr();
            if (cacheAttr) cacheAttr.kerning = kerning;
            return;
        }
        this.execute('modify-text-char-spacing', () => {
            const api = this.api!;
            const page = this.page;
            const shape = editor4text.shape4edit(api);
            api.textModifyKerning(page, shape, kerning, index, len)
            editor4text.fixFrameByLayout(api);
        })
    }

    modifyTextCharSpacingMulti(shapes: (TextShapeView | TableCellView)[], kerning: number) {
        this.execute('modify-text-char-spacing-multi', () => {
            const api = this.api!;
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const text_shape = shapes[i];
                if (text_shape.type !== ShapeType.Text) continue;
                const editor4text = this.getTextEditor(text_shape as TextShapeView)
                const shape = editor4text.shape4edit(api, text_shape);
                const text = shape instanceof ShapeView ? shape.text : shape.value as Text;
                const text_length = text.length;
                api.textModifyKerning(page, shape, kerning, 0, text_length);
                editor4text.fixFrameByLayout2(api, shape);
            }
        })
    }

    modifyAutoLayoutSpace(views: ShapeView[], direction: PaddingDir, value: number) {
        this.execute('modify-auto-layout-space', () => {
            const api = this.api!;
            const page = this.page;
            const space = Math.round(value);
            for (const view of views) {
                const shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutSpace(page, shape, space, direction);
                api.shapeModifyAutoLayoutGapSizing(page, shape, StackSizing.Fixed, direction);
            }
        })
    }
    modifyAutoLayoutPadding(views: ShapeView[], direction: PaddingDir, value: number) {
        this.execute('modify-auto-layout-hor-padding', () => {
            const api = this.api!;
            const page = this.page;
            for (const view of views) {
                const shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutPadding(page, shape, value, direction);
            }
        })
    }
    modifyAutoLayoutHorPadding(views: ShapeView[], left: number, right: number) {
        this.execute('modify-auto-layout-hor-padding', () => {
            const api = this.api!;
            const page = this.page;
            for (const view of views) {
                const shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutHorPadding(page, shape, left, right);
            }
        })
    }
    modifyAutoLayoutVerPadding(views: ShapeView[], top: number, bottom: number) {
        this.execute('modify-auto-layout-ver-padding', () => {
            const api = this.api!;
            const page = this.page;
            for (const view of views) {
                const shape = shape4Autolayout(api, view, this._page);
                api.shapeModifyAutoLayoutVerPadding(page, shape, top, bottom);
            }
        })
    }
}