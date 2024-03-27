import {
    BoolShape,
    GroupShape,
    OverrideType,
    PathShape2,
    RectShape,
    Shape,
    ShapeFrame,
    SymbolShape,
    SymbolUnionShape, TextShape,
    Variable,
    VariableType
} from "../data/shape";
import { ShapeEditor } from "./shape";
import * as types from "../data/typesdefine";
import { BoolOp, BorderPosition, ExportFileFormat, ExportFormatNameingScheme, FillType, GradientType, MarkerType, ShadowPosition, ShapeType } from "../data/typesdefine";
import { Page } from "../data/page";
import {
    initFrame,
    newArrowShape,
    newArtboard,
    newArtboard2,
    newBoolShape,
    newGroupShape,
    newLineShape,
    newOvalShape,
    newPathShape,
    newRectShape,
    newSolidColorFill,
    newSymbolRefShape,
    newSymbolShape
} from "./creator";
import { Document } from "../data/document";
import { expand, translate, translateTo } from "./frame";
import { uuid } from "../basic/uuid";
import {
    Artboard,
    Border,
    Color,
    Path,
    PathShape,
    Style,
    SymbolRefShape,
    Stop,
    Gradient,
    Fill
} from "../data/classes";
import { TextShapeEditor } from "./textshape";
import { modify_frame_after_insert, set_childs_id, transform_data } from "../io/cilpboard";
import { deleteEmptyGroupShape, expandBounds, group, ungroup } from "./group";
import { render2path } from "../render";
import { Matrix } from "../basic/matrix";
import {
    IImportContext,
    importArtboard,
    importBorder, importCornerRadius, importGradient, importShapeFrame,
    importStop,
    importStyle,
    importSymbolShape
} from "../data/baseimport";
import { gPal } from "../basic/pal";
import { findUsableBorderStyle, findUsableFillStyle } from "../render/boolgroup";
import { BasicArray } from "../data/basic";
import { TableEditor } from "./table";
import { exportArtboard, exportGradient, exportShapeFrame, exportStop, exportStyle, exportSymbolShape, exportVariable } from "../data/baseexport";
import {
    adjust_selection_before_group,
    after_remove,
    clear_binds_effect,
    find_state_space,
    get_symbol_by_layer,
    init_state,
    make_union,
    modify_frame_after_inset_state,
    modify_index,
    trans_after_make_symbol
} from "./utils/other";
import { v4 } from "uuid";
import {
    is_exist_invalid_shape2, is_part_of_symbol,
    is_part_of_symbolref, is_state,
    modify_variable_with_api,
    shape4border, shape4cornerRadius,
    shape4fill
} from "./symbol";
import { is_circular_ref2 } from "./utils/ref_check";
import { BorderStyle, ExportFormat, Point2D, Shadow } from "../data/baseclasses";
import { get_rotate_for_straight, is_straight, update_frame_by_points } from "./utils/path";
import { modify_shapes_height, modify_shapes_width } from "./utils/common";
import { CoopRepository } from "./coop/cooprepo";
import { Api } from "./coop/recordapi";
import { ISave4Restore, LocalCmd, SelectionState } from "./coop/localcmd";
import { unable_to_migrate } from "./utils/migrate";
import {
    PageView,
    ShapeView,
    SymbolView,
    TableCellView,
    TableView,
    TextShapeView,
    adapt2Shape,
    SymbolRefView
} from "../dataview";
import { RadiusType, ResizingConstraints2 } from "../data/consts";

// 用于批量操作的单个操作类型
export interface PositonAdjust { // 涉及属性：frame.x、frame.y
    target: Shape
    transX: number
    transY: number
}
export interface FrameAdjust { // frame.width、frame.height
    target: Shape
    widthExtend: number
    heightExtend: number
}

export interface BatchAction { // targer、index、value
    target: ShapeView
    index: number
    value: any
}
export interface BatchAction2 { // targer、value
    target: ShapeView
    value: any
}
export interface BatchAction3 { // targer、index
    target: ShapeView
    index: number
}
export interface BatchAction4 { // targer、value、type
    target: ShapeView
    index: number
    type: 'fills' | 'borders'
}
export interface BatchAction5 { // targer、value、type
    target: ShapeView
    index: number
    value: any
    type: 'fills' | 'borders'
}

export interface BorderEnableAction { // border.Enabled
    target: ShapeView
    index: number
    value: boolean
}

export interface BorderAddAction { // style.borders
    target: ShapeView
    value: Border
}

export interface BorderDeleteAction { // style.borders
    target: ShapeView
    index: number
}

export interface BordersReplaceAction { // style.borders
    target: ShapeView
    value: Border[]
}

export interface BorderPositionAction {
    target: ShapeView
    index: number
    value: BorderPosition
}

export interface BorderThicknessAction {
    target: ShapeView
    index: number
    value: number
}

export interface BorderStyleAction {
    target: ShapeView
    index: number
    value: BorderStyle
}

export interface ShadowReplaceAction {
    target: Shape;
    value: Shadow[];
}

export interface ShadowAddAction {
    target: Shape
    value: Shadow
}

export interface ShadowDeleteAction {
    target: Shape
    index: number
}

export interface ShadowEnableAction {
    target: Shape
    index: number
    value: boolean
}

export interface ShadowPositionAction {
    target: Shape
    index: number
    value: ShadowPosition
}

export interface ShadowColorAction {
    target: Shape
    index: number
    value: Color
}

export interface ShadowBlurRadiusAction {
    target: Shape
    index: number
    value: number
}

export interface ShadowSpreadAction {
    target: Shape
    index: number
    value: number
}

export interface ShadowOffsetXAction {
    target: Shape
    index: number
    value: number
}

export interface ShadowOffsetYAction {
    target: Shape
    index: number
    value: number
}

export interface ExportFormatReplaceAction {
    target: Shape;
    value: ExportFormat[];
}

export interface ExportFormatAddAction {
    target: Shape
    value: ExportFormat[]
}

export interface ExportFormatDeleteAction {
    target: Shape
    index: number
}

export interface ExportFormatScaleAction {
    target: Shape
    index: number
    value: number
}
export interface ExportFormatNameAction {
    target: Shape
    index: number
    value: string
}
export interface ExportFormatPerfixAction {
    target: Shape
    index: number
    value: ExportFormatNameingScheme
}
export interface ExportFormatFileFormatAction {
    target: Shape
    index: number
    value: ExportFileFormat
}

export function getHorizontalRadians(A: { x: number, y: number }, B: { x: number, y: number }) {
    return Math.atan2(B.y - A.y, B.x - A.x)
}

export function getHorizontalAngle(A: { x: number, y: number }, B: { x: number, y: number }) {
    const deltaX = B.x - A.x;
    const deltaY = B.y - A.y;
    const angleInDegrees = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    const angle = (angleInDegrees + 360) % 360;
    return angle;
}

export class PageEditor {
    private __repo: CoopRepository;
    private __page: Page;
    private __document: Document;

    constructor(repo: CoopRepository, page: Page, document: Document) {
        // check
        if (!(page instanceof Page)) {
            console.error("page wrong", page ? JSON.stringify(page, (k, v) => k.startsWith('__')) : page)
            throw new Error("page wrong");
        }
        if (!(repo instanceof CoopRepository)) throw new Error("repo wrong");
        if (!(document instanceof Document)) throw new Error("document wrong");

        this.__repo = repo;
        this.__page = page;
        this.__document = document;
    }

    group(shapes: Shape[], groupname: string): false | GroupShape { // shapes中元素index越小层级越高，即在图形列表的位置最高
        if (shapes.length === 0) return false;
        if (shapes.find((v) => !v.parent)) return false;
        const fshape = shapes[0];
        const savep = fshape.parent as GroupShape;
        // 1、新建一个GroupShape
        let gshape = newGroupShape(groupname);

        const api = this.__repo.start("group", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = [gshape.id];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            // 0、save shapes[0].parent？最外层shape？位置？  层级最高图形的parent
            const saveidx = savep.indexOfChild(shapes[0]);

            gshape = group(this.__document, this.__page, shapes, gshape, savep, saveidx, api);

            this.__repo.commit();
            return gshape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    ungroup(shapes: GroupShape[]): false | Shape[] {
        const childrens: Shape[] = [];
        const api = this.__repo.start("ungroup", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = childrens.map(s => s.id);
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                if (shape.isVirtualShape) continue;
                if (!shape.parent) continue;
                const childs = ungroup(this.__document, this.__page, shape, api);
                childrens.push(...childs);
            }
            this.__repo.commit();
            return childrens.length > 0 ? childrens : false;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    /**
     * @description 创建一个包裹所有shapes容器
     * @param shapes
     * @param artboardname
     * @returns { false | Artboard } 成功则返回容器
     */
    create_artboard(shapes: Shape[], artboardname: string): false | Artboard {
        if (shapes.length === 0) return false;
        if (shapes.find((v) => !v.parent)) return false;
        const fshape = shapes[0];
        const savep = fshape.parent as GroupShape;
        let artboard = newArtboard(artboardname, new ShapeFrame(0, 0, 100, 100));

        const api = this.__repo.start("create_artboard", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = [artboard.id];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            // 0、save shapes[0].parent？最外层shape？位置？  层级最高图形的parent
            const saveidx = savep.indexOfChild(shapes[0]);
            // 1、新建一个GroupShape
            artboard = group(this.__document, this.__page, shapes, artboard, savep, saveidx, api) as Artboard;

            this.__repo.commit();
            return artboard;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    /**
     * @description 解除容器
     * @param shape
     * @returns { false | Shape[] } 成功则返回被解除容器的所有子元素
     */
    dissolution_artboard(shapes: Artboard[]): false | Shape[] {
        const childrens: Shape[] = [];
        const api = this.__repo.start("dissolution_artboard", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = childrens.map(c => c.id);
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                if (shape.isVirtualShape) continue;
                if (!shape.parent) continue;
                const childs = ungroup(this.__document, this.__page, shape, api);
                childrens.push(...childs);
            }
            this.__repo.commit();
            return childrens.length > 0 ? childrens : false;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    modifyShapesContextSettingOpacity(shapes: Shape[], value: number) {
        if (!shapes.length) return console.log('invalid data');
        try {
            const api = this.__repo.start("modifyShapesContextSettingOpacity");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const item = shapes[i];
                api.shapeModifyContextSettingsOpacity(this.__page, item, value);
            }
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
            return false;
        }
    }

    boolgroup(shapes: Shape[], groupname: string, op: BoolOp): false | BoolShape {
        shapes = shapes.filter(i => i instanceof PathShape || i instanceof PathShape2 || i instanceof BoolShape);
        if (shapes.length === 0) return false;
        if (shapes.find((v) => !v.parent)) return false;
        const fshape = shapes[0];
        const savep = fshape.parent as GroupShape;
        // copy fill and borders
        const copyStyle = findUsableFillStyle(shapes[shapes.length - 1]);
        const style: Style = this.cloneStyle(copyStyle);
        if (style.fills.length === 0) {
            style.fills.push(newSolidColorFill()); // 自动添加个填充
        }
        const borderStyle = findUsableBorderStyle(shapes[shapes.length - 1]);
        if (borderStyle !== copyStyle) {
            style.borders = new BasicArray<Border>(...borderStyle.borders.map((b) => importBorder(b)))
        }
        // 1、新建一个GroupShape
        let gshape = newBoolShape(groupname, style);

        const api = this.__repo.start("boolgroup", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = [gshape.id];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            // 0、save shapes[0].parent？最外层shape？位置？  层级最高图形的parent
            const saveidx = savep.indexOfChild(shapes[0]);
            // gshape.isBoolOpShape = true;
            gshape = group(this.__document, this.__page, shapes, gshape, savep, saveidx, api);
            shapes.forEach((shape) => api.shapeModifyBoolOp(this.__page, shape, op))

            this.__repo.commit();
            return gshape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    boolgroup2(savep: GroupShape, groupname: string, op: BoolOp): false | BoolShape {
        if (savep.childs.length === 0) return false;
        const shapes = savep.childs.slice(0);
        const pp = savep.parent;
        if (!(pp instanceof GroupShape)) return false;
        const style: Style = this.cloneStyle(savep.style);
        if (style.fills.length === 0) {
            style.fills.push(newSolidColorFill()); // 自动添加个填充
        }
        let gshape = newBoolShape(groupname, style);

        const api = this.__repo.start("boolgroup2", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = [gshape.id];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            // 0、save shapes[0].parent？最外层shape？位置？  层级最高图形的parent
            const saveidx = pp.indexOfChild(savep);
            // gshape.isBoolOpShape = true;
            gshape = group(this.__document, this.__page, shapes, gshape, pp, saveidx, api);
            api.shapeDelete(this.__document, this.__page, pp, saveidx + 1);
            shapes.forEach((shape) => api.shapeModifyBoolOp(this.__page, shape, op))

            this.__repo.commit();
            return gshape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    /**
     * 创建组件
     * symbolref引用的symbol可能被其他人取消，那么symbolref应该能引用普通的对象！
     */
    makeSymbol(document: Document, shapes: Shape[], name?: string) {
        if (shapes.length === 0) return;
        const shape0 = shapes[0];
        const frame = importShapeFrame(shape0.frame);

        const replace = shapes.length === 1 &&
            ((shape0 instanceof GroupShape && !(shape0 instanceof BoolShape)) ||
                shape0 instanceof Artboard
            );

        const style = replace ? importStyle((shape0.style)) : undefined;
        const symbolShape = newSymbolShape(replace ? shape0.name : (name ?? shape0.name), frame, style);
        if (replace && shape0 instanceof Artboard && shape0.cornerRadius) {
            symbolShape.cornerRadius = importCornerRadius(shape0.cornerRadius);
        }
        const api = this.__repo.start("makeSymbol", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = [symbolShape.id];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });

        try {
            const need_trans_data: Shape[] = [];
            adjust_selection_before_group(document, this.__page, shapes, api, need_trans_data);
            let sym: Shape;
            if (replace) {
                const index = (shape0.parent as GroupShape).indexOfChild(shape0);
                // api.registSymbol(document, symbolShape.id, this.__page.id);
                sym = api.shapeInsert(document, this.__page, shape0.parent as GroupShape, symbolShape, index + 1);
                const children = shape0.childs;
                for (let i = 0, len = children.length; i < len; ++i) {
                    api.shapeMove(this.__page, shape0, 0, symbolShape, i);
                }
                api.shapeDelete(document, this.__page, shape0.parent as GroupShape, index);
            } else {
                const index = (shape0.parent as GroupShape).indexOfChild(shape0);
                // api.registSymbol(document, symbolShape.id, this.__page.id);
                sym = group(document, this.__page, shapes, symbolShape, shape0.parent as GroupShape, index, api);

                for (let i = 0; i < shapes.length; i++) {
                    const __shape = shapes[i];
                    const old_rc =  __shape.resizingConstraint === undefined
                        ? ResizingConstraints2.Mask
                        : __shape.resizingConstraint;

                    let new_rc = ResizingConstraints2.setToScaleByHeight(ResizingConstraints2.setToScaleByWidth(old_rc));

                    api.shapeModifyResizingConstraint(this.__page, __shape, new_rc);
                }
            }
            if (sym) {
                document.symbolsMgr.add(sym.id, sym as SymbolShape);
                if (need_trans_data.length) {
                    trans_after_make_symbol(this.__page, sym as SymbolShape, need_trans_data, api);
                }
                this.__repo.commit();
                return sym as any as SymbolShape;
            } else {
                throw new Error('failed')
            }
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
    }

    /**
     * @description 给一个组件symbol添加一个属性，如果该组件不是一个union集合，则先创建一个集合
     * @param attri_name 第一个属性名称
     * @param dlt 属性默认值
     * @return symbol 集合union
     */
    makeStatus(symbolView: SymbolView, attri_name: string, dlt: string, isDefault: boolean) {
        let symbol = adapt2Shape(symbolView) as SymbolShape;
        const api = this.__repo.start("makeStatus");
        try {
            if (symbol instanceof SymbolUnionShape) {
                const v = isDefault ? SymbolShape.Default_State : dlt;
                const _var = new Variable(uuid(), VariableType.Status, attri_name, v);
                api.shapeAddVariable(this.__page, symbol, _var);
            } else {
                const u = make_union(api, this.__document, this.__page, symbol, attri_name);
                if (!u) {
                    throw new Error('make union failed!');
                }
                symbol = u;
            }
            this.__repo.commit();
            return symbol;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
    }

    /**
     * @description 给组件创建变量
     */
    makeVar(type: VariableType, symbol: SymbolShape, name: string, values: any) {
        const api = this.__repo.start("makeVar");
        try {
            if (symbol.type !== ShapeType.Symbol || (symbol.parent && symbol.parent instanceof SymbolUnionShape)) throw new Error('wrong role!');
            const _var = new Variable(v4(), type, name, values);
            api.shapeAddVariable(this.__page, symbol, _var);
            this.__repo.commit();
            return symbol;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
    }

    /**
     * @description 基于内部原有状态建立新状态
     * @union union
     */
    makeStateAt(union: SymbolShape, dlt: string, index?: number, hor_align?: number) {
        if (!(union instanceof SymbolUnionShape) || !union.childs.length) return;
        let idx = index === undefined ? union.childs.length - 1 : index;
        if (index !== undefined && (index > union.childs.length || index < 0)) idx = union.childs.length;
        const origin = union.childs[idx];
        if (!origin) return;
        try {
            const source = exportSymbolShape(origin as unknown as SymbolShape);
            source.id = uuid();
            set_childs_id(source.childs as Shape[]);
            if (index === undefined) {
                const space = find_state_space(union);
                if (!space) throw new Error('failed');
                source.frame.y = space.y + 20;
            } else {
                source.frame.x = hor_align || source.frame.x + 20;
            }
            const _this = this;
            const ctx: IImportContext = new class implements IImportContext {
                document: Document = _this.__document;
                curPage: string = _this.__page.id
            };
            const api = this.__repo.start("makeStateAt");
            // api.registSymbol(this.__document, source.id, this.__page.id); // 先设置上, import好加入symmgr
            const copy = importSymbolShape(source, ctx); // 需要设置ctx
            const new_state = api.shapeInsert(this.__document, this.__page, union, copy, idx + 1);
            modify_frame_after_inset_state(this.__page, api, union);
            init_state(api, this.__page, new_state as SymbolShape, dlt);

            if (new_state) {
                this.__repo.commit();
                return new_state as any as SymbolShape;
            } else {
                throw new Error('failed');
            }
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
    }

    /**
     * @description 从外部引入一个状态
     * @symbol 外部组件
     */
    insertStateAt(union: SymbolShape, symbol: SymbolShape, index: number) {

    }

    /**
     * @description 将引用的组件解引用(解绑)
     * todo 考虑union symbol
     */
    extractSymbol(shapes: Shape[]) {
        const actions: { parent: Shape, self: Shape, insertIndex: number }[] = []
        const replaceId = (shape: types.Shape) => {
            shape.id = uuid();
            if ((shape as types.GroupShape).childs) {
                (shape as types.GroupShape).childs.forEach((c) => replaceId(c));
            }
        }

        const clearBindvars = (shape: types.Shape) => {
            if (shape.varbinds) shape.varbinds = undefined;
            const g = shape as types.GroupShape;
            if (Array.isArray(g.childs)) {
                g.childs.forEach((c) => clearBindvars(c));
            }
        }

        const transferVars = (rootRef: SymbolRefShape, g: { childs: types.Shape[] }) => {
            const overrides = rootRef.overrides;
            const vars = rootRef.variables;
            if (!overrides) return;
            for (let i = 0, childs = g.childs; i < childs.length; ++i) {
                const c = childs[i];
                if ((c as any).childs) { // group
                    transferVars(rootRef, c as any);
                    return;
                }
                if (!(c.typeId === "symbol-ref-shape")) {
                    continue;
                }
                let refId = c.id;
                // 去掉头部rootref.id
                refId = refId.substring(refId.indexOf('/') + 1);
                if (refId.length === 0) throw new Error();

                // 查找相关变量
                overrides.forEach((v, k) => {
                    if (!k.startsWith(refId)) return;

                    const _v = vars.get(v);
                    if (!_v) return;

                    const _var = exportVariable(_v);
                    _var.id = uuid();
                    const override_id = k.substring(refId.length + 1);
                    if (override_id.length === 0) throw new Error();

                    const ref = c as types.SymbolRefShape;
                    if ((ref.variables as any)[override_id]) {
                        const origin_var = (ref.variables as any)[override_id] as types.Variable;
                        origin_var.name = _var.name;
                        origin_var.value = _var.value;
                    } else if (ref.overrides && (ref.overrides as any)[override_id]) {
                        const origin_ref = (ref.overrides as any)[override_id];
                        const origin_var = (ref.variables as any)[origin_ref] as types.Variable;
                        if (!origin_var) {
                            (ref.variables as any)[_var.id] = _var;
                            (ref.overrides as any)[override_id] = _var.id;
                        } else {
                            origin_var.name = _var.name;
                            origin_var.value = _var.value;
                        }
                    } else {
                        (ref.variables as any)[_var.id] = _var;
                        if (!ref.overrides) (ref as any).overrides = {};
                        (ref.overrides as any)[override_id] = _var.id;
                    }
                })
            }
        }

        const return_shapes: Shape[] = [];
        for (let i = 0, len = shapes.length; i < len; i++) {
            const shape: SymbolRefShape = shapes[i] as SymbolRefShape;
            if (shape.type !== ShapeType.SymbolRef) {
                return_shapes.push(shape);
                continue;
            }
            if (shape.isVirtualShape) { // 实例内引用组件
                return_shapes.push(shape);
                // todo 失去变量的情况下保持当前状态
                continue;
            }

            const _this = this;
            const ctx: IImportContext = new class implements IImportContext {
                document: Document = _this.__document;
                curPage: string = _this.__page.id
            };
            const { x, y, width, height } = shape.frame;
            const tmpArtboard: Artboard = newArtboard(shape.name, new ShapeFrame(x, y, width, height));
            // initFrame(tmpArtboard, shape.frame);
            tmpArtboard.childs = shape.naviChilds! as BasicArray<Shape>;
            tmpArtboard.varbinds = shape.varbinds;
            tmpArtboard.style = shape.style;
            tmpArtboard.rotation = shape.rotation;
            tmpArtboard.isFlippedHorizontal = shape.isFlippedHorizontal;
            tmpArtboard.isFlippedVertical = shape.isFlippedVertical;
            const symbolData = exportArtboard(tmpArtboard); // todo 如果symbol只有一个child时

            // 遍历symbolData,如有symbolref,则查找根shape是否有对应override的变量,如有则存到symbolref内
            transferVars(shape, symbolData);
            clearBindvars(symbolData);
            replaceId(symbolData);
            const parent = shape.parent;
            if (!parent) {
                return_shapes.push(shape);
                continue;
            }
            const insertIndex = (parent as GroupShape).indexOfChild(shape);
            if (insertIndex < 0) {
                return_shapes.push(shape);
                continue;
            }

            const newShape = importArtboard(symbolData, ctx);
            actions.push({ parent, self: newShape, insertIndex });
        }
        if (!actions.length) return shapes;
        const api = this.__repo.start("extractSymbol", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = actions.map(a => a.self.id);
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            const results: Shape[] = [];
            for (let i = 0, len = actions.length; i < len; i++) {
                const { parent, self, insertIndex } = actions[i];
                const ret = api.shapeInsert(this.__document, this.__page, parent as GroupShape, self, insertIndex);
                api.shapeDelete(this.__document, this.__page, parent as GroupShape, insertIndex + 1);
                results.push(ret);
            }
            this.__repo.commit();
            return [...return_shapes, ...results];
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
    }

    refSymbol(document: Document, name: string, frame: ShapeFrame, refId: string) {
        const ref = newSymbolRefShape(name, frame, refId, document.symbolsMgr);
        const sym = document.symbolsMgr.get(refId);
        if (sym) {
            ref.rotation = sym.rotation;
            ref.isFlippedHorizontal = sym.isFlippedHorizontal;
            ref.isFlippedVertical = sym.isFlippedVertical;
        }
        return ref;
    }

    private cloneStyle(style: Style): Style {
        const _this = this;
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = _this.__document;
            curPage: string = _this.__page.id
        };
        return importStyle(style, ctx);
    }

    flattenShapes(shapes: Shape[], name?: string): PathShape | PathShape2 | false {
        if (shapes.length === 0) return false;
        if (shapes.find((v) => !v.parent)) return false;
        const fshape = shapes[0];
        const savep = fshape.parent as GroupShape;
        const saveidx = savep.indexOfChild(fshape);
        if (!name) name = fshape.name;

        // copy fill and borders
        const copyStyle = findUsableFillStyle(shapes[shapes.length - 1]);
        const style: Style = this.cloneStyle(copyStyle);
        const borderStyle = findUsableBorderStyle(shapes[shapes.length - 1]);
        if (borderStyle !== copyStyle) {
            style.borders = new BasicArray<Border>(...borderStyle.borders.map((b) => importBorder(b)))
        }

        // bounds
        // 计算frame
        //   计算每个shape的绝对坐标
        const boundsArr = shapes.map((s) => {
            const box = s.boundingBox()
            const p = s.parent!;
            const m = p.matrix2Root();
            const lt = m.computeCoord(box.x, box.y);
            const rb = m.computeCoord(box.x + box.width, box.y + box.height);
            return { x: lt.x, y: lt.y, width: rb.x - lt.x, height: rb.y - lt.y }
        })
        const firstXY = boundsArr[0]
        const bounds = { left: firstXY.x, top: firstXY.y, right: firstXY.x, bottom: firstXY.y };

        boundsArr.reduce((pre, cur) => {
            expandBounds(pre, cur.x, cur.y);
            expandBounds(pre, cur.x + cur.width, cur.y + cur.height);
            return pre;
        }, bounds)

        const m = new Matrix(savep.matrix2Root().inverse)
        const xy = m.computeCoord(bounds.left, bounds.top)

        const frame = new ShapeFrame(xy.x, xy.y, bounds.right - bounds.left, bounds.bottom - bounds.top);
        let pathstr = "";
        shapes.forEach((shape) => {
            const shapem = shape.matrix2Root();
            const shapepath = render2path(shape);
            shapem.multiAtLeft(m);
            shapepath.transform(shapem);

            if (pathstr.length > 0) {
                pathstr = gPal.boolop.union(pathstr, shapepath.toString())
            } else {
                pathstr = shapepath.toString();
            }
        })
        const path = new Path(pathstr);
        path.translate(-frame.x, -frame.y);

        let pathShape = newPathShape(name, frame, path, style);

        const api = this.__repo.start("flattenShapes", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = [pathShape.id];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            pathShape = api.shapeInsert(this.__document, this.__page, savep, pathShape, saveidx) as PathShape | PathShape2;

            for (let i = 0, len = shapes.length; i < len; i++) {
                const s = shapes[i];
                const p = s.parent as GroupShape;
                const idx = p.indexOfChild(s);
                api.shapeDelete(this.__document, this.__page, p, idx);
                if (p.childs.length <= 0) {
                    deleteEmptyGroupShape(this.__document, this.__page, p, api)
                }
            }
            this.__repo.commit();
            return pathShape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    flattenBoolShape(shape: BoolShape): PathShape | false {
        // if (!shape.isBoolOpShape) return false;
        const parent = shape.parent as GroupShape;
        if (!parent) return false;

        const path = render2path(shape);

        // copy fill and borders
        const copyStyle = findUsableFillStyle(shape);
        const style: Style = this.cloneStyle(copyStyle);
        const borderStyle = findUsableBorderStyle(shape);
        if (borderStyle !== copyStyle) {
            style.borders = new BasicArray<Border>(...borderStyle.borders.map((b) => importBorder(b)))
        }

        const gframe = shape.frame;
        const boundingBox = path.calcBounds();
        const w = boundingBox.maxX - boundingBox.minX;
        const h = boundingBox.maxY - boundingBox.minY;
        const frame = new ShapeFrame(gframe.x + boundingBox.minX, gframe.y + boundingBox.minY, w, h); // clone
        path.translate(-boundingBox.minX, -boundingBox.minY);

        let pathShape = newPathShape(shape.name, frame, path, style);
        pathShape.fixedRadius = shape.fixedRadius;
        const index = parent.indexOfChild(shape);
        const api = this.__repo.start("flattenBoolShape", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = [pathShape.id];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            api.shapeDelete(this.__document, this.__page, parent, index);
            pathShape = api.shapeInsert(this.__document, this.__page, parent, pathShape, index) as PathShape;

            this.__repo.commit();
            return pathShape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    private removeContactSides(api: Api, page: Page, shape: types.ContactShape) {
        if (shape.from) {
            const fromShape = page.getShape(shape.from.shapeId);
            const contacts = fromShape?.style.contacts;
            if (fromShape && contacts) {
                let idx: number = -1;
                for (let i = 0, len = contacts.length; i < len; i++) {
                    const c = contacts[i];
                    if (c.shapeId === shape.id) {
                        idx = i;
                        break;
                    }
                }
                if (idx > -1) {
                    api.removeContactRoleAt(page, fromShape, idx);
                }
            }
        }
        if (shape.to) {
            const toShape = page.getShape(shape.to.shapeId);
            const contacts = toShape?.style.contacts;
            if (toShape && contacts) {
                let idx: number = -1;
                for (let i = 0, len = contacts.length; i < len; i++) {
                    const c = contacts[i];
                    if (c.shapeId === shape.id) {
                        idx = i;
                        break;
                    }
                }
                if (idx > -1) {
                    api.removeContactRoleAt(page, toShape, idx);
                }
            }
        }
    }

    private removeContact(api: Api, page: Page, shape: Shape) {
        const contacts = shape.style.contacts;
        if (contacts && contacts.length) {
            for (let i = 0, len = contacts.length; i < len; i++) {
                const shape = page.getShape(contacts[i].shapeId);
                if (!shape) continue;
                const p = shape.parent as GroupShape;
                if (!p) continue;
                let idx = -1;
                for (let j = 0, len = p.childs.length; j < len; j++) {
                    if (p.childs[j].id === shape.id) {
                        idx = j;
                        break;
                    }
                }
                if (idx > -1) api.shapeDelete(this.__document, page, p as GroupShape, idx);
            }
        }
    }

    private delete_inner(page: Page, _shape: ShapeView | Shape, api: Api): boolean {
        const shape = _shape instanceof Shape ? _shape : _shape.data;
        const p = shape.parent as GroupShape;
        if (!p) return false;
        if (shape.type === ShapeType.Contact) { // 连接线删除之后需要删除两边的连接关系
            this.removeContactSides(api, page, shape as unknown as types.ContactShape);
        } else {
            this.removeContact(api, page, shape);
        }
        api.shapeDelete(this.__document, page, p as GroupShape, (p as GroupShape).indexOfChild(shape));
        if (p.childs.length <= 0 && p.type === ShapeType.Group) {
            this.delete_inner(page, p, api)
        }
        return true;
    }

    delete(shape: ShapeView): boolean {
        const page = shape.getPage() as PageView;
        if (!page) return false;
        const savep = shape.parent as ShapeView;
        if (!savep) return false;
        const api = this.__repo.start("delete", (selection: ISave4Restore, isUndo: boolean) => {
            const state = {} as SelectionState;
            if (isUndo) state.shapes = [shape.id];
            else state.shapes = [];
            selection.restore(state);
        });
        try {
            if (is_part_of_symbolref(shape)) {
                const isVisible = !shape.isVisible;
                if (modify_variable_with_api(api, this.__page, shape, VariableType.Visible, OverrideType.Visible, isVisible)) return true;
                api.shapeModifyVisible(this.__page, shape.data, isVisible);
                return true;
            }
            const symbol = get_symbol_by_layer(shape);
            if (symbol) {
                clear_binds_effect(page, shape, symbol, api);
            }
            if (this.delete_inner(page.data, shape, api)) {
                if (after_remove(savep)) {
                    this.delete_inner(page.data, savep, api);
                }
                if (shape.type === ShapeType.Symbol) {
                    this.__document.__correspondent.notify('update-symbol-list');
                }
                this.__repo.commit()
                return true;
            } else {
                this.__repo.rollback();
            }
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    // 批量删除
    delete_batch(shapes: ShapeView[]) {
        const api = this.__repo.start("deleteBatch", (selection: ISave4Restore, isUndo: boolean) => {
            const state = {} as SelectionState;
            if (isUndo) state.shapes = shapes.map(s => s.id);
            else state.shapes = [];
            selection.restore(state);
        });
        let need_special_notify = false;
        for (let i = 0; i < shapes.length; i++) {
            try {
                const shape = shapes[i];
                if (is_part_of_symbolref(shape)) {
                    const isVisible = !shape.isVisible;
                    if (modify_variable_with_api(api, this.__page, shape, VariableType.Visible, OverrideType.Visible, isVisible)) continue;
                    api.shapeModifyVisible(this.__page, shape.data, isVisible);
                    continue;
                }
                const symbol = get_symbol_by_layer(shape);
                if (symbol) {
                    clear_binds_effect(this.__page, shape, symbol, api);
                }
                if (shape.type === ShapeType.Symbol) need_special_notify = true;
                const page = shape.getPage() as PageView;
                if (!page) return false;
                const savep = shape.parent as ShapeView;
                if (!savep) return false;
                this.delete_inner(page.data, shape, api);
                if (after_remove(savep)) {
                    this.delete_inner(page.data, savep, api);
                }
            } catch (error) {
                this.__repo.rollback();
                return false;
            }
        }
        if (need_special_notify) {
            this.__document.__correspondent.notify('update-symbol-list');
        }
        this.__repo.commit();
        return true;
    }

    // 插入成功，返回插入的shape
    insert(parent: GroupShape, index: number, shape: Shape, adjusted = false): Shape | false {
        // adjust shape frame refer to parent
        if (!adjusted) {
            const xy = parent.frame2Root();
            shape.frame.x -= xy.x;
            shape.frame.y -= xy.y;
        }
        shape.id = uuid(); // 凡插入对象，不管是复制剪切的，都需要新id。要保持同一id，使用move!
        const api = this.__repo.start("insertshape", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = [shape.id];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            api.shapeInsert(this.__document, this.__page, parent, shape, index);
            shape = parent.childs[index]; // 需要把proxy代理之后的shape返回，否则无法触发notify
            this.__repo.commit();
            return shape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * @description 同一容器下批量粘贴shape
     * @param shapes 未进入文档的shape
     * @param adjusted 是否提前调整过相对位置
     */
    pasteShapes1(parent: GroupShape, shapes: Shape[]): { shapes: Shape[] } | false {
        const api = this.__repo.start("insertShapes1", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = shapes.map(s => s.id);
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            const result: Shape[] = [];
            let index = parent.childs.length;
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shapes[i];
                // shape.id = uuid();
                api.shapeInsert(this.__document, this.__page, parent, shape, index);
                result.push(parent.childs[index]);
                index++;
            }
            modify_frame_after_insert(api, this.__page, result);
            // const frame = get_frame(result);
            this.__repo.commit();
            // return { shapes: result, frame };
            return { shapes: result };
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * @description 指定容器下粘贴shape
     * @param shapes 未进入文档的shape
     * @param actions.index 插入位置
     */
    pasteShapes2(shapes: Shape[], actions: { parent: GroupShape, index: number }[]): Shape[] | false {
        const api = this.__repo.start("insertShapes2", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = shapes.map(s => s.id);
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            const result: Shape[] = [];
            for (let i = 0, len = actions.length; i < len; i++) {
                const shape = shapes[i];
                const { parent, index } = actions[i];
                // shape.id = uuid();
                api.shapeInsert(this.__document, this.__page, parent, shape, index);
                result.push(parent.childs[index]);
            }
            this.__repo.commit();
            return result;
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * @description 批量的图层集体进入不同容器 (与2有区别)
     * @param actions 
     * @returns 
     */
    pasteShapes3(actions: { env: GroupShape, shapes: Shape[] }[]): Shape[] | false {
        const api = this.__repo.start("pasteShapes3", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = actions.reduce((p, c) => {
                return [...p, ...c.shapes.map(s => s.id)]
            }, [] as string[]);
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            const result: Shape[] = [];
            for (let i = 0, len = actions.length; i < len; i++) {
                const { env, shapes } = actions[i];
                for (let j = 0; j < shapes.length; j++) {
                    let index = env.childs.length;
                    api.shapeInsert(this.__document, this.__page, env, shapes[j], index);
                    result.push(env.childs[index]);
                }
            }
            modify_frame_after_insert(api, this.__page, result);
            this.__repo.commit();
            return result;
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
            return false;
        }
    }


    // 创建一个shape
    create(type: ShapeType, name: string, frame: ShapeFrame): Shape {
        switch (type) {
            case ShapeType.Artboard:
                return newArtboard(name, frame);
            case ShapeType.Rectangle:
                return newRectShape(name, frame);
            case ShapeType.Oval:
                return newOvalShape(name, frame);
            case ShapeType.Line:
                return newLineShape(name, frame);
            default:
                return newRectShape(name, frame);
        }
    }

    createArtboard(name: string, frame: ShapeFrame, fill: Fill) { // todo 新建图层存在代码冗余
        return newArtboard(name, frame, fill);
    }

    shapesModifyPointRadius(shapes: Shape[], indexes: number[], val: number) {
        try {
            const api = this.__repo.start("shapesModifyPointRadius");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];
                const points = (shape as PathShape).points;

                for (let _i = 0, l = indexes.length; _i < l; _i++) {
                    const index = indexes[_i];
                    const point = points[index];
                    if (!point) {
                        continue;
                    }
                    api.modifyPointCornerRadius(this.__page, shape, index, val);
                }
                // this.__repo.commit();
            }
            this.__repo.commit();
        } catch (error) {
            console.log('shapesModifyPointRadius', error);
            this.__repo.rollback();
        }

    }

    shapesModifyFixedRadius(shapes: Shape[], val: number) {
        try {
            const api = this.__repo.start("shapesModifyFixedRadius");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const shape = shapes[i];

                if (shape.type === ShapeType.Group) {
                    api.shapeModifyFixedRadius(this.__page, shape as GroupShape, val);
                    continue;
                }

                const is_rect = [ShapeType.Rectangle, ShapeType.Image, ShapeType.Artboard]
                    .includes(shape.type) && shape.isClosed;

                const points = (shape as PathShape).points;

                if (is_rect) {
                    for (let i = 0, l = points.length; i < l; i++) {
                        api.modifyPointCornerRadius(this.__page, shape, i, val);
                    }
                } else {
                    for (let i = 0, l = points.length; i < l; i++) {
                        api.modifyPointCornerRadius(this.__page, shape, i, 0);
                    }

                    api.shapeModifyFixedRadius(this.__page, shape as PathShape, val);
                }

                update_frame_by_points(api, this.__page, shape);
            }
            this.__repo.commit();
        } catch (error) {
            console.log('shapesModifyFixedRadius', error);
            this.__repo.rollback();
        }
    }

    shapesModifyRadius(shapes: ShapeView[], values: number[]) {
        try {
            const api = this.__repo.start("shapesModifyRadius");
            const page = this.__page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                const isRect = shape.radiusType === RadiusType.Rect;

                if (isRect) {
                    if (values.length !== 4) {
                        values = [values[0], values[0], values[0], values[0]];
                    }

                    const [lt, rt, rb, lb] = values;

                    if (shape instanceof  SymbolRefShape) {
                        const _shape = shape4cornerRadius(api, page, shapes[i] as SymbolRefView);
                        api.shapeModifyRadius2(page, _shape, lt, rt, rb, lb);
                    }

                    if (shape.isVirtualShape) {
                        continue;
                    }

                    if (shape instanceof PathShape) {
                        const points = shape.points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) {
                                continue;
                            }

                            api.modifyPointCornerRadius(page, shape, _i, val);
                        }
                    }
                    else if (shape instanceof PathShape2) {
                        const points = shape.pathsegs[0].points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) {
                                continue;
                            }

                            api.modifyPointCornerRadius(page, shape, _i, val, 0);
                        }
                    }
                    else {
                        const __shape = shape as Artboard | SymbolShape;
                        api.shapeModifyRadius2(page, __shape, lt, rt, rb, lb)
                    }
                }
                else {
                    if (shape.isVirtualShape) {
                        continue;
                    }

                    if (shape instanceof PathShape) {
                        const points = shape.points;
                        for (let _i = 0; _i < points.length; _i++) {
                            if (points[_i].radius === values[0]) {
                                continue;
                            }

                            api.modifyPointCornerRadius(page, shape, _i, values[_i]);
                        }
                    }
                    else if (shape instanceof PathShape2) {
                        shape.pathsegs.forEach((seg, index) => {
                            for (let _i = 0; _i < seg.points.length; _i++) {
                                if (seg.points[_i].radius === values[0]) {
                                    continue;
                                }

                                api.modifyPointCornerRadius(page, shape, _i, values[_i], index);
                            }
                        })
                    }
                    else {
                        api.shapeModifyFixedRadius(page, shape as GroupShape | TextShape, values[0]);
                    }
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.log('shapesModifyRadius', error);
            this.__repo.rollback();
        }
    }

    /**
     * @description 参数可选的创建并插入图形
     * @param ex_params 包含某一些属性的特定参数
     *  is_arrow?: 箭头(style)
     *  rotation?: 初始化角度
     *  target_xy?: 插入位置(frame)
     *  media?: 静态资源
     *  ...
     * @returns
     */
    create2(page: Page, parent: GroupShape, type: ShapeType, name: string, frame: ShapeFrame, ex_params: any) {
        const { is_arrow, rotation, target_xy } = ex_params;
        let new_s: Shape | undefined;
        switch (type) {
            case ShapeType.Artboard:
                new_s = newArtboard(name, frame);
                break;
            case ShapeType.Rectangle:
                new_s = newRectShape(name, frame);
                break;
            case ShapeType.Oval:
                new_s = newOvalShape(name, frame);
                break;
            case ShapeType.Line:
                new_s = is_arrow ? newArrowShape(name, frame) : newLineShape(name, frame);
                break;
            default:
                new_s = newRectShape(name, frame);
        }
        if (!new_s) return false;
        const m_p2r = parent.matrix2Root();
        const api = this.__repo.start("create2");
        try {
            const index = parent.childs.length;
            const xy = m_p2r.computeCoord2(0, 0);
            new_s.frame.x -= xy.x, new_s.frame.y -= xy.y;
            if (rotation) {
                new_s.rotation = rotation;
            }
            new_s = api.shapeInsert(this.__document, this.__page, parent, new_s, index);
            if (target_xy) {
                translateTo(api, page, new_s, target_xy.x, target_xy.y);
            }
            this.__repo.commit();
            return new_s;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
            return false;
        }
    }

    // 移动shape到目标Group的指定位置
    move(shape: Shape, target: GroupShape, to: number): boolean {
        const parent = shape.parent as GroupShape | undefined;
        if (!parent) return false;
        const index = parent.childs.length - parent.indexOfChild(shape) - 1;
        if (index < 0) return false;

        // 同一个group内，从index移动到index等于无操作
        if (target.id !== parent.id || to !== index && (to + 1) !== index) { // 还是在原来位置
            const api = this.__repo.start("move");
            try {
                if (target.id === parent.id) to = index >= to ? to : to + 1;
                api.shapeMove(this.__page, parent, index, target, to)
                this.__repo.commit();
                return true;
            } catch (error) {
                console.log(error)
                this.__repo.rollback();
            }
        }
        return false;
    }

    /**
     * @param shapes 逆序图层
     */
    upperLayer(shapes: ShapeView[], step?: number) {
        const fixUpStep = (parent: GroupShape, set: Set<string>, targetIndex: number, currentIndex: number) => {
            const max = parent.childs.length - 1;
            if (targetIndex > max) {
                targetIndex = max;
            }
            const children = parent.childs;

            let result= targetIndex;

            for (let i = targetIndex; i > currentIndex; i--) {
                if (set.has(children[i].id)) {
                    result--;
                } else {
                    break;
                }
            }

            return result;
        }

        try {
            const api = this.__repo.start("upperLayer");

            const set = new Set<string>();
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                set.add(shape.id);
            }

            let adjusted = false;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }

                const parent = shape.parent! as GroupShape;
                const currentIndex = parent.indexOfChild(shape);
                const __target = step ?  (currentIndex + step) : parent.childs.length - 1;
                const targetIndex = fixUpStep(parent, set, __target, currentIndex)

                if (targetIndex !== currentIndex) {
                    adjusted = true;
                    api.shapeMove(this.__page, parent, currentIndex, parent, targetIndex);
                }
            }

            this.__repo.commit();

            return adjusted;
        } catch (e) {
            console.log('upperLayer:', e);
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * @param shapes 正序图层
     */
    lowerLayer(shapes: ShapeView[], step?: number) {
        const fixLowStep = (parent: GroupShape, set: Set<string>, targetIndex: number, currentIndex: number) => {
            if (targetIndex < 0) {
                targetIndex = 0;
            }
            const children = parent.childs;

            let result= targetIndex;

            for (let i = targetIndex; i < currentIndex; i++) {
                if (set.has(children[i].id)) {
                    result++;
                } else {
                    break;
                }
            }

            return result;
        }

        try {
            const api = this.__repo.start("upperLayer");
            const set = new Set<string>();
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                set.add(shape.id);
            }

            let adjusted = false;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }

                const parent = shape.parent! as GroupShape;
                const currentIndex = parent.indexOfChild(shape);
                const __target = step ?  (currentIndex - step) : 0;
                const targetIndex = fixLowStep(parent, set, __target, currentIndex)

                if (targetIndex !== currentIndex) {
                    adjusted = true;
                    api.shapeMove(this.__page, parent, currentIndex, parent, targetIndex);
                }
            }

            this.__repo.commit();

            return adjusted;
        } catch (e) {
            console.log('lowerLayer:', e);
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * @description src中的每个图形都将被替换成replacement
     * @param document 当前文档
     * @param replacement 替代品，里面图形的frame都已经在进入剪切板后被处理过了，都是在page上的绝对位置
     * @param src 即将被替代的图形
     * @returns 如果成功替换则返回所有替代品
     */
    replace(document: Document, replacement: Shape[], src: Shape[]): false | Shape[] {
        // 收集被替换上去的元素
        const src_replacement: Shape[] = [];

        const api = this.__repo.start("replace", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = src_replacement.map(s => s.id);
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            const len = replacement.length;
            // 寻找replacement的左上角(lt_point)，该点将和src中每个图形的左上角重合
            const any_r_f = replacement[0].frame;
            const lt_point = { x: any_r_f.x, y: any_r_f.y };
            for (let i = 1; i < len; i++) {
                const frame = replacement[i].frame;
                if (frame.x < lt_point.x) lt_point.x = frame.x;
                if (frame.y < lt_point.y) lt_point.y = frame.y;
            }

            // 记录每个图形相对lt_point的位置
            const delta_xys: { x: number, y: number }[] = [];
            for (let i = 0; i < len; i++) {
                const r = replacement[i];
                const rf = r.frame;
                const dt = { x: rf.x - lt_point.x, y: rf.y - lt_point.y };
                delta_xys.push(dt);
            }


            // 开始替换
            for (let i = 0; i < src.length; i++) {
                const s = src[i];

                if (is_state(s)) {
                    continue;
                }

                const p = s.parent as GroupShape;
                if (!p) throw new Error('invalid root');
                let save_index = p.indexOfChild(s);
                if (save_index < 0) throw new Error('invalid childs data');

                // 记录被替换掉的图形原先所在的位置
                const fr = s.frame;
                const save_frame = { x: fr.x, y: fr.y };
                // 先删除将被替换的图形
                const del_res = this.delete_inner(this.__page, s, api);
                if (!del_res) throw new Error('delete failed');

                // replacement的原版数据只能使用一次，使用一次之后的替换应该使用replacement的副本数据，并确保每一份副本数据中不存在共同对象引用
                const copy: Shape[] = i < 1 ? replacement : transform_data(document, this.__page, replacement);
                for (let r_i = 0; r_i < len; r_i++) { // 逐个插入replacement中的图形
                    let r = copy[r_i];
                    r.id = uuid();
                    r.frame.x = save_frame.x + delta_xys[r_i].x; // lt_point与s.frame的xy重合后，用delta_xys中的相对位置计算replacement中每个图形的偏移
                    r.frame.y = save_frame.y + delta_xys[r_i].y;
                    api.shapeInsert(this.__document, this.__page, p, r, save_index);
                    src_replacement.push(p.childs[save_index]);
                    save_index++;
                }
            }
            this.__repo.commit();
            return src_replacement;
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
            return false;
        }
    }

    arrange(actions: PositonAdjust[]) {
        const api = this.__repo.start('arrange');
        try {
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                translate(api, this.__page, action.target, action.transX, action.transY);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    modifyShapesX(actions: { target: Shape, x: number }[]) {
        const api = this.__repo.start('modifyShapesX');
        try {
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                api.shapeModifyX(this.__page, action.target, action.x);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    modifyShapesY(actions: { target: Shape, y: number }[]) {
        const api = this.__repo.start('modifyShapesY');
        try {
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                api.shapeModifyY(this.__page, action.target, action.y);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesConstrainerProportions(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapesConstrainerProportions');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.shapeModifyConstrainerProportions(this.__page, adapt2Shape(target), value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesFrame(actions: FrameAdjust[]) {
        const api = this.__repo.start('setShapesFrame');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, widthExtend, heightExtend } = actions[i];
                expand(api, this.__document, this.__page, target, widthExtend, heightExtend);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    modifyShapesWidth(shapes: Shape[], val: number) {
        try {
            const api = this.__repo.start('modifyShapesWidth');
            modify_shapes_width(api, this.__document, this.__page, shapes, val)
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    modifyShapesHeight(shapes: Shape[], val: number) {
        try {
            const api = this.__repo.start('modifyShapesHeight');
            modify_shapes_height(api, this.__document, this.__page, shapes, val)
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesRotate(shapes: Shape[], v: number) {
        try {
            const api = this.__repo.start('setShapesRotate');
            for (let i = 0, len = shapes.length; i < len; i++) {
                const s = shapes[i];

                if (is_straight(s)) {
                    const r = get_rotate_for_straight(s as PathShape, v);

                    api.shapeModifyRotate(this.__page, s, r);

                    update_frame_by_points(api, this.__page, s as PathShape);
                } else {
                    api.shapeModifyRotate(this.__page, s, v);
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    shapesFlip(actions: BatchAction2[]) {
        const api = this.__repo.start('shapesFlip');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                if (value === 'horizontal') {
                    api.shapeModifyHFlip(this.__page, adapt2Shape(target), !target.isFlippedHorizontal);
                } else if (value === 'vertical') {
                    api.shapeModifyVFlip(this.__page, adapt2Shape(target), !target.isFlippedVertical);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    // 渐变
    //翻转
    reverseShapesGradient(actions: BatchAction4[]) {
        try {
            const api = this.__repo.start('reverseShapesGradient');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type } = actions[i];
                const arr = type === 'fills' ? target.getFills() : target.getBorders();
                if (!arr?.length) {
                    continue;
                }
                const gradient_container = arr[index];
                if (!gradient_container || !gradient_container.gradient) {
                    continue;
                }
                const gradient = gradient_container.gradient;
                const stops = gradient.stops;
                if (!stops?.length) {
                    continue;
                }
                const new_stops: BasicArray<Stop> = new BasicArray<Stop>();
                for (let _i = 0, _l = stops.length; _i < _l; _i++) {
                    const _stop = stops[_i];
                    const inver_index = stops.length - 1 - _i;
                    new_stops.push(importStop(exportStop(new Stop(_stop.crdtidx, _stop.id, _stop.position, stops[inver_index].color))));
                }
                const s = shape4fill(api, this.__page, target);
                if (type === 'fills') {
                    api.setFillColor(this.__page, s, index, new_stops[0].color as Color);
                } else {
                    api.setBorderColor(this.__page, s, index, new_stops[0].color as Color);
                }
                const ng = importGradient(exportGradient(gradient));
                ng.stops = new_stops;
                const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                f(this.__page, s, index, ng);
            }
            this.__repo.commit();
        } catch (error) {
            console.log('reverseShapesGradient:', error);
            this.__repo.rollback();
        }
    }
    //旋转90度
    rotateShapesGradient(actions: BatchAction4[]) {
        try {
            const api = this.__repo.start('rotateShapesGradient');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type } = actions[i];
                const arr = type === 'fills' ? target.getFills() : target.getBorders();
                if (!arr?.length) {
                    continue;
                }
                const gradient_container = arr[index];
                if (!gradient_container || !gradient_container.gradient) {
                    continue;
                }
                const gradient = importGradient(exportGradient(gradient_container.gradient));
                const { from, to } = gradient;
                const gradientType = gradient.gradientType;
                if (gradientType === types.GradientType.Linear) {
                    const midpoint = { x: (to.x + from.x) / 2, y: (to.y + from.y) / 2 };
                    const m = new Matrix();
                    m.trans(-midpoint.x, -midpoint.y);
                    m.rotate(Math.PI / 2);
                    m.trans(midpoint.x, midpoint.y);
                    gradient.to = m.computeCoord3(to) as any;
                    gradient.from = m.computeCoord3(from) as any;
                } else if (gradientType === types.GradientType.Radial || gradientType === types.GradientType.Angular) {
                    const m = new Matrix();
                    m.trans(-from.x, -from.y);
                    m.rotate(Math.PI / 2);
                    m.trans(from.x, from.y);
                    gradient.to = m.computeCoord3(to) as any;
                }
                // todo 旋转渐变
                const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                const shape = shape4fill(api, this.__page, target);
                f(this.__page, shape, index, gradient);
            }
            this.__repo.commit();
        } catch (error) {
            console.log('rotateShapesGradient:', error);
            this.__repo.rollback();
        }
    }
    // 添加节点
    addShapesGradientStop(actions: BatchAction5[]) {
        try {
            const api = this.__repo.start('addShapesGradientStop');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type, value } = actions[i];
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders();
                if (!grad_type?.length) {
                    continue;
                }
                const gradient_container = grad_type[index];
                if (!gradient_container) {
                    continue;
                }
                const gradient = gradient_container.gradient;
                if (!gradient) {
                    continue;
                }
                const new_gradient = importGradient(exportGradient(gradient));
                new_gradient.stops.push(importStop(exportStop(value)));
                const s = new_gradient.stops;
                s.sort((a, b) => {
                    if (a.position > b.position) {
                        return 1;
                    } else if (a.position < b.position) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
                new_gradient.stops.forEach((v, i) => {
                    const idx = new BasicArray<number>();
                    idx.push(i);
                    v.crdtidx = idx;
                })
                const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                const shape = shape4fill(api, this.__page, target);
                f(this.__page, shape, index, new_gradient);
            }
            this.__repo.commit();
        } catch (error) {
            console.log('addShapesGradientStop:', error);
            this.__repo.rollback();
        }
    }
    toggerShapeGradientType(actions: BatchAction5[]) {
        try {
            const api = this.__repo.start('toggerShapeGradientType');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type, value } = actions[i];
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders();
                if (!grad_type?.length) {
                    continue;
                }
                const gradient_container = grad_type[index];
                if (!gradient_container) {
                    continue;
                }
                const gradient = gradient_container.gradient;
                const s = shape4fill(api, this.__page, target);
                if (gradient_container.fillType !== FillType.Gradient) {
                    type === 'fills' ? api.setFillType(this.__page, s, index, FillType.Gradient) : api.setBorderFillType(this.__page, s, index, FillType.Gradient);
                }
                if (gradient) {
                    const new_gradient = importGradient(exportGradient(gradient));
                    new_gradient.gradientType = value;
                    if (value === GradientType.Linear && gradient.gradientType !== GradientType.Linear) {
                        new_gradient.from.y = new_gradient.from.y - (new_gradient.to.y - new_gradient.from.y);
                        new_gradient.from.x = new_gradient.from.x - (new_gradient.to.x - new_gradient.from.x);
                    } else if (gradient.gradientType === GradientType.Linear && value !== GradientType.Linear) {
                        new_gradient.from.y = new_gradient.from.y + (new_gradient.to.y - new_gradient.from.y) / 2;
                        new_gradient.from.x = new_gradient.from.x + (new_gradient.to.x - new_gradient.from.x) / 2;
                    }
                    if (value === GradientType.Radial && new_gradient.elipseLength === undefined) {
                        new_gradient.elipseLength = 1;
                    }
                    new_gradient.stops[0].color = gradient_container.color;
                    const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                    f(this.__page, s, index, new_gradient);
                } else {
                    const stops = new BasicArray<Stop>();
                    const frame = target.frame;
                    const { alpha, red, green, blue } = gradient_container.color;
                    stops.push(new Stop(new BasicArray(), uuid(), 0, new Color(alpha, red, green, blue)), new Stop(new BasicArray(), uuid(), 1, new Color(0, red, green, blue)))
                    const from = value === GradientType.Linear ? { x: 0.5, y: 0 } : { x: 0.5, y: 0.5 };
                    const to = { x: 0.5, y: 1 };
                    let elipseLength = undefined;
                    if (value === GradientType.Radial) {
                        elipseLength = 1;
                    }
                    const new_gradient = new Gradient(from as Point2D, to as Point2D, value, stops, elipseLength);
                    new_gradient.stops.forEach((v, i) => {
                        const idx = new BasicArray<number>();
                        idx.push(i);
                        v.crdtidx = idx;
                    })
                    const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                    f(this.__page, s, index, new_gradient);
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.log('toggerShapeGradientType:', error);
            this.__repo.rollback();
        }
    }
    setShapesGradientStopColor(actions: BatchAction5[]) {
        try {
            const api = this.__repo.start('setShapesGradientStopColor');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type, value } = actions[i];
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders();
                if (!grad_type?.length) {
                    continue;
                }
                const gradient_container = grad_type[index];
                if (!gradient_container || !gradient_container.gradient || gradient_container.fillType !== FillType.Gradient) {
                    continue;
                }
                const gradient = gradient_container.gradient;
                const stops = gradient.stops;
                if (!stops?.length) {
                    continue;
                }
                const { color, stop_i } = value;
                const new_gradient = importGradient(exportGradient(gradient));
                new_gradient.stops[stop_i].color = color;
                const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                const shape = shape4fill(api, this.__page, target);
                if (type === 'fills') {
                    api.setFillColor(this.__page, shape, index, new_gradient.stops[0].color as Color);
                } else {
                    api.setBorderColor(this.__page, shape, index, new_gradient.stops[0].color as Color);
                }
                f(this.__page, shape, index, new_gradient);
            }
            this.__repo.commit();
        } catch (error) {
            console.log('setShapesGradientStopColor:', error);
            this.__repo.rollback();
        }
    }
    deleteShapesGradientStop(actions: BatchAction5[]) {
        try {
            const api = this.__repo.start('setShapesGradientStopColor');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type, value } = actions[i];
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders();
                if (!grad_type?.length) {
                    continue;
                }
                const gradient_container = grad_type[index];
                if (!gradient_container || !gradient_container.gradient || gradient_container.fillType !== FillType.Gradient) {
                    continue;
                }
                const gradient = gradient_container.gradient;
                const stops = gradient.stops;
                if (!stops?.length || gradient.stops.length === 1) {
                    continue;
                }
                const new_gradient = importGradient(exportGradient(gradient));
                new_gradient.stops.splice(value, 1);
                const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                const shape = shape4fill(api, this.__page, target);
                f(this.__page, shape, index, new_gradient);
            }
            this.__repo.commit();
        } catch (error) {
            console.log('setShapesGradientStopColor:', error);
            this.__repo.rollback();
        }
    }
    setGradientOpacity(actions: BatchAction5[]) {
        try {
            const api = this.__repo.start('setGradientOpacity');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type, value } = actions[i];
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders();
                if (!grad_type?.length) {
                    continue;
                }
                const gradient_container = grad_type[index];
                if (!gradient_container || !gradient_container.gradient || gradient_container.fillType !== FillType.Gradient) {
                    continue;
                }
                const gradient = gradient_container.gradient;
                const new_gradient = importGradient(exportGradient(gradient));
                new_gradient.gradientOpacity = value;
                const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                const shape = shape4fill(api, this.__page, target);
                f(this.__page, shape, index, new_gradient);
            }
            this.__repo.commit();
        } catch (error) {
            console.log('setGradientOpacity:', error);
            this.__repo.rollback();
        }
    }
    // 填充
    setShapesFillColor(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesFillColor');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4fill(api, this.__page, target);
                api.setFillColor(this.__page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesFillEnabled(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesFillEnabled');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4fill(api, this.__page, target);
                api.setFillEnable(this.__page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesFillType(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesFillType');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4fill(api, this.__page, target);
                api.setFillType(this.__page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesAddFill(actions: BatchAction2[]) {
        const api = this.__repo.start('shapesAddFill');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const s = shape4fill(api, this.__page, target);
                const l = s instanceof Shape ? s.style.fills.length : s.value.length;
                api.addFillAt(this.__page, s, value, l);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesDeleteFill(actions: BatchAction3[]) {
        const api = this.__repo.start('shapesDeleteFill');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index } = actions[i];
                const s = shape4fill(api, this.__page, target);
                api.deleteFillAt(this.__page, s, index);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesFillsUnify(actions: BatchAction2[]) {
        const api = this.__repo.start('shapesFillsUnify'); // 统一多个shape的填充设置。eg:[red, red], [green], [blue, blue, blue] => [red, red], [red, red], [red, red];
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const s = shape4fill(api, this.__page, target);
                // 先清空再填入
                api.deleteFills(this.__page, s, 0, target.style.fills.length); // 清空
                api.addFills(this.__page, s, value); // 填入新的值
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            // throw new Error(`${error}`);
        }
    }

    //boders
    setShapesBorderColor(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesBorderColor');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4border(api, this.__page, target);
                api.setBorderColor(this.__page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderEnabled(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesBorderEnabled');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4border(api, this.__page, target);
                api.setBorderEnable(this.__page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderType(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesBorderType');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4border(api, this.__page, target);
                api.setBorderFillType(this.__page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesAddBorder(actions: BatchAction2[]) {
        const api = this.__repo.start('shapesAddBorder');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const s = shape4border(api, this.__page, target);
                const l = s instanceof Shape ? s.style.borders.length : s.value.length;
                api.addBorderAt(this.__page, s, value, l);
            }
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    shapesDeleteBorder(actions: BatchAction3[]) {
        const api = this.__repo.start('shapesDeleteBorder');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index } = actions[i];
                const s = shape4border(api, this.__page, target);
                api.deleteBorderAt(this.__page, s, index);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesBordersUnify(actions: BatchAction2[]) {
        const api = this.__repo.start('shapesBordersUnify');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const s = shape4border(api, this.__page, target);
                api.deleteBorders(this.__page, s, 0, target.style.borders.length);
                api.addBorders(this.__page, s, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderPosition(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesBorderPosition');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                if (target.type === ShapeType.Table) continue;
                const s = shape4border(api, this.__page, target);
                api.setBorderPosition(this.__page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderThickness(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesBorderThickness');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                const s = shape4border(api, this.__page, target);
                api.setBorderThickness(this.__page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderStyle(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesBorderStyle');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                const s = shape4border(api, this.__page, target);
                api.setBorderStyle(this.__page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesMarkerType(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapesMarkerType');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                if (modify_variable_with_api(api, this.__page, target, VariableType.MarkerType, value.isEnd ? OverrideType.EndMarkerType : OverrideType.StartMarkerType, value.mt)) continue;
                if (value.isEnd) {
                    api.shapeModifyEndMarkerType(this.__page, adapt2Shape(target), value.mt);
                } else {
                    api.shapeModifyStartMarkerType(this.__page, adapt2Shape(target), value.mt);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    exchangeShapesMarkerType(actions: BatchAction2[]) {
        const api = this.__repo.start('exchangeShapesMarkerType');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const startMarkerType = target.startMarkerType;
                const endMarkerType = target.endMarkerType;
                if (endMarkerType === startMarkerType) continue;
                if (modify_variable_with_api(api, this.__page, target, VariableType.MarkerType, OverrideType.EndMarkerType, startMarkerType || MarkerType.Line)) {
                    modify_variable_with_api(api, this.__page, target, VariableType.MarkerType, OverrideType.StartMarkerType, endMarkerType || MarkerType.Line)
                    continue;
                };
                api.shapeModifyEndMarkerType(this.__page, adapt2Shape(target), startMarkerType || MarkerType.Line);
                api.shapeModifyStartMarkerType(this.__page, adapt2Shape(target), endMarkerType || MarkerType.Line);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    // shadow
    setShapesShadowOffsetY(actions: BatchAction[]) {
        try {
            const api = this.__repo.start('setShapesShadowOffsetY');
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                api.setShadowOffsetY(this.__page, adapt2Shape(target), index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesShadowOffsetX(actions: BatchAction[]) {
        try {
            const api = this.__repo.start('setShapesShadowOffsetX');
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                api.setShadowOffsetX(this.__page, adapt2Shape(target), index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesShadowSpread(actions: BatchAction[]) {
        try {
            const api = this.__repo.start('setShapesShadowSpread');
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                api.setShadowSpread(this.__page, adapt2Shape(target), index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesShadowBlurRadius(actions: BatchAction[]) {
        try {
            const api = this.__repo.start('setShapesShadowBlurRadius');
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                api.setShadowBlur(this.__page, adapt2Shape(target), index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesShadowColor(actions: BatchAction[]) {
        try {
            const api = this.__repo.start('setShapesShadowColor');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setShadowColor(this.__page, adapt2Shape(target), index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesShadowPosition(actions: BatchAction[]) {
        try {
            const api = this.__repo.start('setShapesShadowPosition');
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                api.setShadowPosition(this.__page, adapt2Shape(target), index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesShadowEnabled(actions: BatchAction[]) {
        try {
            const api = this.__repo.start('setShapesShadowEnabled');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setShadowEnable(this.__page, adapt2Shape(target), index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesDeleteShasow(actions: BatchAction3[]) {
        try {
            const api = this.__repo.start('shapesDeleteShasow');
            for (let i = 0; i < actions.length; i++) {
                const { target, index } = actions[i];
                api.deleteShadowAt(this.__page, adapt2Shape(target), index);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesAddShadow(actions: BatchAction2[]) {
        try {
            const api = this.__repo.start('shapesAddShadow');
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.addShadow(this.__page, adapt2Shape(target), value, target.style.shadows.length);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesShadowsUnify(actions: BatchAction2[]) {
        try {
            const api = this.__repo.start('shapesShadowsUnify');
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.deleteShadows(this.__page, adapt2Shape(target), 0, target.style.shadows.length);
                api.addShadows(this.__page, adapt2Shape(target), value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    //export cutout
    shapesExportFormatUnify(actions: ExportFormatReplaceAction[]) {
        try {
            const api = this.__repo.start('shapesExportFormatUnify');
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                if (target.exportOptions) {
                    api.deleteExportFormats(this.__page, target, 0, target.exportOptions.exportFormats.length);
                }
                api.addExportFormats(this.__page, target, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    shapesAddExportFormat(actions: ExportFormatAddAction[]) {
        try {
            const api = this.__repo.start('shapesAddExportFormat');
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                for (let v = 0; v < value.length; v++) {
                    const format = value[v];
                    const length = target.exportOptions ? target.exportOptions.exportFormats.length : 0;
                    api.addExportFormat(this.__page, target, format, length);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    pageAddExportFormat(formats: ExportFormat[]) {
        try {
            const api = this.__repo.start('pageAddExportFormat');
            for (let i = 0; i < formats.length; i++) {
                const format = formats[i];
                const length = this.__page.exportOptions ? this.__page.exportOptions.exportFormats.length : 0;
                api.addPageExportFormat(this.__page, format, length);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setPageExportPreviewUnfold(unfold: boolean) {
        try {
            const api = this.__repo.start('setPageExportPreviewUnfold');
            api.setPageExportPreviewUnfold(this.__document, this.__page.id, unfold);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    shapesDeleteExportFormat(actions: ExportFormatDeleteAction[]) {
        try {
            const api = this.__repo.start('shapesDeleteExportFormat');
            for (let i = 0; i < actions.length; i++) {
                const { target, index } = actions[i];
                api.deleteExportFormatAt(this.__page, target, index);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    pageDeleteExportFormat(idx: number) {
        try {
            const format = this.__page.exportOptions?.exportFormats[idx];
            if (format) {
                const api = this.__repo.start('pageDeleteExportFormat');
                api.deletePageExportFormatAt(this.__page, idx);
                this.__repo.commit();
            }
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesExportFormatScale(actions: ExportFormatScaleAction[]) {
        try {
            const api = this.__repo.start('setShapesExportFormatScale');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setExportFormatScale(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setPageExportFormatScale(idx: number, scale: number) {
        try {
            const api = this.__repo.start('setPageExportFormatScale');
            api.setPageExportFormatScale(this.__page, idx, scale);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesExportFormatName(actions: ExportFormatNameAction[]) {
        try {
            const api = this.__repo.start('setShapesExportFormatName');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setExportFormatName(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setPageExportFormatName(idx: number, name: string) {
        try {
            const api = this.__repo.start('setPageExportFormatName');
            api.setPageExportFormatName(this.__page, idx, name);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesExportFormatPerfix(actions: ExportFormatPerfixAction[]) {
        try {
            const api = this.__repo.start('setShapesExportFormatPerfix');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setExportFormatPerfix(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setPageExportFormatPerfix(idx: number, name: ExportFormatNameingScheme) {
        try {
            const api = this.__repo.start('setPageExportFormatPerfix');
            api.setPageExportFormatPerfix(this.__page, idx, name);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesExportFormatFileFormat(actions: ExportFormatFileFormatAction[]) {
        try {
            const api = this.__repo.start('setShapesExportFormatFileFormat');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setExportFormatFileFormat(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setPageExportFormatFileFormat(idx: number, name: ExportFileFormat) {
        try {
            const api = this.__repo.start('setPageExportFormatFileFormat');
            api.setPageExportFormatFileFormat(this.__page, idx, name);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    toggleShapesVisible(shapes: ShapeView[]) {
        const api = this.__repo.start('setShapesVisible');
        try {
            for (let i = 0; i < shapes.length; i++) {
                let shape: ShapeView = shapes[i];
                if (!shape) continue;
                const isVisible = !shape.isVisible;
                if (modify_variable_with_api(api, this.__page, shape, VariableType.Visible, OverrideType.Visible, isVisible)) {
                    continue;
                }
                // ?
                // if (shape.type === ShapeType.Group) {
                //     shape = this.__page.shapes.get(shape.id)!;
                //     if (!shape) continue;
                // }
                api.shapeModifyVisible(this.__page, shape.data, isVisible);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    toggleShapesLock(shapes: ShapeView[]) {
        const api = this.__repo.start('setShapesLocked');
        try {
            for (let i = 0; i < shapes.length; i++) {
                let shape: ShapeView | undefined = shapes[i];
                const isLocked = !shape.isLocked;
                if (modify_variable_with_api(api, this.__page, shape, VariableType.Lock, OverrideType.Lock, isLocked)) {
                    continue;
                }
                // ?
                // if (shape.type === ShapeType.Group) {
                //     shape = this.__page.shapes.get(shape.id)
                // }
                // if (!shape) continue;
                api.shapeModifyLock(this.__page, shape.data, isLocked);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setBackground(color: Color) {
        const api = this.__repo.start('setBackground');
        try {
            api.pageModifyBackground(this.__document, this.__page.id, color);
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    setShapesRadius(shapes: Shape[], lt: number, rt: number, rb: number, lb: number) {
        const api = this.__repo.start('setShapesRadius');
        try {
            for (let i = 0; i < shapes.length; i++) {
                const s = shapes[i];
                api.shapeModifyRadius(this.__page, s as RectShape, lt, rt, rb, lb);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    /**
     * @description 图层拖动调整
     */
    afterShapeListDrag(shapes: Shape[], host: Shape, position: 'upper' | 'inner' | 'lower') {
        // 整体数据校验
        if ((host.type === ShapeType.SymbolRef || host.type === ShapeType.SymbolUnion || host.isVirtualShape) && position === 'inner') {
            return false;
        }

        const host_parent: GroupShape | undefined = host.parent as GroupShape;
        if (!host_parent || host_parent.isVirtualShape) {
            return false;
        }

        let pre: Shape[] = [];
        for (let i = 0, l = shapes.length; i < l; i++) {
            const item = shapes[i];
            if (item.isVirtualShape) {
                continue;
            }

            let next = false;
            let p: Shape | undefined = host;
            while (p) {
                if (p.id === item.id) {
                    next = true;
                    break;
                }
                p = p.parent;
            }

            if (next) {
                continue;
            }

            pre.push(item);
        }

        if (!pre.length) {
            return false;
        }

        try {
            const api = this.__repo.start('afterShapeListDrag');
            if (position === "inner") {
                for (let i = 0, l = pre.length; i < l; i++) {
                    const item = pre[i];
                    const parent: GroupShape | undefined = item.parent as GroupShape;
                    if (!parent) {
                        continue;
                    }

                    if (unable_to_migrate(host, item)) {
                        continue;
                    }

                    const beforeXY = item.frame2Root();

                    let last = (host as GroupShape).childs.length;
                    if (parent.id === host.id) { // 同一父级
                        last--;
                    }

                    api.shapeMove(this.__page, parent, parent.indexOfChild(item), host as GroupShape, last);

                    translateTo(api, this.__page, item, beforeXY.x, beforeXY.y);

                    if (after_remove(parent)) {
                        this.delete_inner(this.__page, parent, api);
                    }
                }
            } else {
                if (position === 'lower') {
                    pre = pre.reverse();
                }

                let previous_index: number = -1;

                for (let i = 0, l = pre.length; i < l; i++) {
                    const item = pre[i];
                    const parent: GroupShape | undefined = item.parent as GroupShape;

                    if (!parent
                        || host_parent.type === ShapeType.SymbolRef
                        || host_parent.type === ShapeType.SymbolUnion
                    ) {
                        continue;
                    }

                    if (is_part_of_symbol(host_parent) && is_exist_invalid_shape2([item])) {
                        continue;
                    }

                    const children = item.naviChilds || (item as any).childs;
                    if (children?.length) {
                        const tree = item instanceof SymbolRefShape ? item.symData : item;
                        if (!tree || is_circular_ref2(tree, host_parent.id)) {
                            continue;
                        }
                    }

                    const beforeXY = item.frame2Root();

                    let index = 0;

                    if (previous_index >= 0) {
                        index = previous_index;
                    } else {
                        index = host_parent.indexOfChild(host);
                    }

                    if (parent.id === host_parent.id) { // 同一父级
                        index = modify_index((parent) as GroupShape, item, host, index);
                    }

                    if (position === "upper") {
                        index++;
                    }

                    api.shapeMove(this.__page, parent, parent.indexOfChild(item), host_parent, index);

                    const _temp_index = host_parent.indexOfChild(item);
                    if (_temp_index >= 0) {
                        previous_index = _temp_index;
                    }

                    translateTo(api, this.__page, item, beforeXY.x, beforeXY.y);

                    if (after_remove(parent)) {
                        this.delete_inner(this.__page, parent, api);
                    }
                }
            }
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
            return false;
        }
    }

    setLinesLength(shapes: Shape[], v: number) {
        const api = this.__repo.start('setLinesLength');
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const s = shapes[i];
                if (s.type !== ShapeType.Line) continue;
                const o1 = s.matrix2Root().computeCoord2(0, 0);
                const f = s.frame, r = getHorizontalRadians({ x: 0, y: 0 }, { x: f.width, y: f.height });
                api.shapeModifyWH(this.__page, s, v * Math.cos(r), v * Math.sin(r));
                const o2 = s.matrix2Root().computeCoord2(0, 0);
                translate(api, this.__page, s, o1.x - o2.x, o1.y - o2.y);
            }
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    editor4Shape(shape: ShapeView): ShapeEditor {
        return new ShapeEditor(shape, this.__page, this.__repo, this.__document);
    }

    editor4TextShape(shape: TextShapeView | TableCellView): TextShapeEditor {
        return new TextShapeEditor(shape, this.__page, this.__repo, this.__document);
    }

    editor4Table(shape: TableView): TableEditor {
        return new TableEditor(shape, this.__page, this.__repo, this.__document);
    }
}