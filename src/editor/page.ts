/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    Artboard,
    BasicArray,
    BoolOp,
    BoolShape,
    Border,
    Color,
    ContactShape,
    Document,
    ExportFileFormat,
    ExportFormatNameingScheme,
    Fill,
    FillType,
    GroupShape,
    MarkerType,
    OverrideType,
    Page,
    PathShape,
    PathShape2,
    PolygonShape,
    RadiusType,
    RectShape,
    ResizingConstraints2,
    ResourceMgr,
    Shape,
    ShapeFrame,
    ShapeType,
    SideType,
    StarShape,
    Stop,
    Style,
    SymbolRefShape,
    SymbolShape,
    SymbolUnionShape,
    TextShape,
    Transform,
    Variable,
    VariableType
} from "../data";
import { ShapeEditor } from "./shape";
import * as types from "../data/typesdefine";
import {
    newArtboard,
    newAutoLayoutArtboard,
    newBoolShape,
    newGroupShape,
    newImageFillShape,
    newPathShape,
    newSolidColorFill,
    newSymbolRefShape,
    newSymbolShape
} from "./creator/creator";
import { expand, expandTo, translate, translateTo } from "./frame";
import { uuid } from "../basic/uuid";
import { TextShapeEditor } from "./textshape";
import { set_childs_id, transform_data } from "../io/cilpboard";
import { deleteEmptyGroupShape, expandBounds, group, ungroup } from "./group";
import {
    IImportContext,
    importArtboard,
    importAutoLayout,
    importBlur,
    importBorder,
    importCornerRadius,
    importFill,
    importGradient,
    importMarkerType,
    importOverlayBackgroundAppearance,
    importOverlayPosition,
    importPrototypeInteraction,
    importPrototypeStartingPoint,
    importShadow,
    importStop,
    importStyle,
    importSymbolShape,
    importText,
    importTransform
} from "../data/baseimport";
import { TableEditor } from "./table";
import { exportGradient, exportSymbolShape } from "../data/baseexport";
import {
    after_remove,
    clear_binds_effect,
    find_state_space,
    fixTextShapeFrameByLayout,
    get_symbol_by_layer,
    init_state,
    make_union,
    modify_frame_after_inset_state,
    modify_index
} from "./utils/other";
import { v4 } from "uuid";
import {
    is_exist_invalid_shape2,
    is_part_of_symbol,
    is_part_of_symbolref,
    is_state,
    modify_variable_with_api,
    shape4border,
    shape4cornerRadius,
    shape4fill,
    shape4shadow,
    shape4contextSettings,
    shape4blur,
    RefUnbind,
    _ov,
    shape4Autolayout
} from "./symbol";
import { is_circular_ref2 } from "./utils/ref_check";
import {
    AutoLayout,
    BorderSideSetting,
    BorderStyle,
    ExportFormat,
    OverlayBackgroundAppearance,
    OverlayBackgroundInteraction,
    OverlayPositionType,
    PrototypeActions,
    PrototypeConnectionType,
    PrototypeEasingBezier,
    PrototypeEasingType,
    PrototypeEvent,
    PrototypeEvents,
    PrototypeInteraction,
    PrototypeNavigationType,
    PrototypeStartingPoint,
    PrototypeTransitionType,
    ScrollBehavior,
    ScrollDirection,
    Shadow
} from "../data/baseclasses";
import {
    calculateInnerAnglePosition,
    getPolygonPoints,
    getPolygonVertices,
    update_frame_by_points
} from "./utils/path";
import { adapt_for_artboard, modify_shapes_height, modify_shapes_width } from "./utils/common";
import { CoopRepository, ISave4Restore, LocalCmd, SelectionState } from "../coop";
import { Operator, PaddingDir, TextShapeLike } from "../coop/recordop";
import { unable_to_migrate } from "./utils/migrate";
import {
    adapt2Shape,
    ArtboardView,
    BoolShapeView, ContactLineView,
    CutoutShapeView, FrameCpt,
    GroupShapeView,
    PageView,
    PathShapeView,
    render2path,
    ShapeView,
    SymbolRefView,
    SymbolView,
    TableCellView,
    TableView,
    TextShapeView
} from "../dataview";
import { FMT_VER_latest } from "../data/fmtver";
import { ColVector3D } from "../basic/matrix2";
import { TidyUpAlign, tidyUpLayout } from "./utils/auto_layout";

import { getFormatFromBase64 } from "../basic/utils";
import { modifyRadius, modifyStartingAngle, modifySweep, uniformScale, UniformScaleUnit, assign } from "./asyncapi";
import { Path } from "@kcdesign/path";
import { prepareVar } from "./symbol_utils";
import { layoutShapesOrder2, layoutSpacing } from "./utils/auto_layout2";
import { stroke } from "../render/stroke";

export interface BatchAction { // target,index,value
    target: ShapeView
    index: number
    value: any
}

export interface BatchAction2 { // targer、value
    target: ShapeView
    value: any
}

export interface BatchAction5 { // targer、value、type
    target: ShapeView
    index: number
    value: any
    type: 'fills' | 'borders'
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

export interface ExportFormatPrefixAction {
    target: Shape
    index: number
    value: ExportFormatNameingScheme
}

export interface ExportFormatFileFormatAction {
    target: Shape
    index: number
    value: ExportFileFormat
}

export interface ImagePack {
    size: {
        width: number;
        height: number;
    },
    buff: Uint8Array;
    base64: string;
    name: string;
}

export interface SVGParseResult {
    shape: Shape,
    mediaResourceMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>
}

export interface UploadAssets {
    ref: string,
    buff: Uint8Array;
    base64: string;
}

export function getHorizontalRadians(A: {
    x: number,
    y: number
}, B: {
    x: number,
    y: number
}) {
    return Math.atan2(B.y - A.y, B.x - A.x)
}

function findUsableFillStyle(shape: Shape | ShapeView): Style {
    if (shape.style.fills.length > 0) return shape.style;
    if ((shape instanceof BoolShape || shape instanceof GroupShape) && shape.childs.length > 0) return findUsableFillStyle(shape.childs[0]);
    return shape.style;
}

function findUsableBorderStyle(shape: Shape | ShapeView): Style {
    if (shape.style.borders && shape.style.borders.strokePaints.length) return shape.style;
    if ((shape instanceof BoolShape || shape instanceof GroupShape) && shape.childs.length > 0) return findUsableBorderStyle(shape.childs[0]);
    return shape.style;
}

export class PageEditor {
    private __repo: CoopRepository;
    private __page: PageView;
    private __document: Document;

    get page() {
        return this.__page.data;
    }

    get view() {
        return this.__page;
    }

    constructor(repo: CoopRepository, page: PageView, document: Document) {
        // check
        if (!(page instanceof PageView)) {
            console.error("page wrong", page ? JSON.stringify(page, (k, v) => k.startsWith('__')) : page)
            throw new Error("page wrong");
        }
        if (!(repo instanceof CoopRepository)) throw new Error("repo wrong");
        if (!(document instanceof Document)) throw new Error("document wrong");

        this.__repo = repo;
        this.__page = page;
        this.__document = document;
    }

    group(shapes: ShapeView[], groupname: string): false | GroupShape { // shapes中元素index越小层级越高，即在图形列表的位置最高
        if (shapes.length === 0) return false;
        if (shapes.find((v) => !v.parent)) return false;
        const fshape = adapt2Shape(shapes[0]);
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
            const saveidx = savep.indexOfChild(adapt2Shape(shapes[0]));

            gshape = group(this.__document, this.page, shapes.map(s => adapt2Shape(s)), gshape, savep, saveidx, api);
            this.__repo.commit();
            return gshape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    ungroup(shapes: GroupShapeView[]): false | Shape[] {
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
                const childs = ungroup(this.__document, this.page, adapt2Shape(shape) as GroupShape, api);
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
    createArtboard(shapes: ShapeView[], artboardname: string): Artboard {
        try {
            const api = this.__repo.start("createArtboard", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = [artboard.id];
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });
            const fshape = adapt2Shape(shapes[0]);
            const savep = fshape.parent as GroupShape;
            let artboard = newArtboard(artboardname, new ShapeFrame(0, 0, 100, 100), this.__document.stylesMgr);
            const saveidx = savep.indexOfChild(adapt2Shape(shapes[0]));
            artboard = group(this.__document, this.page, shapes.map(s => adapt2Shape(s)), artboard, savep, saveidx, api) as Artboard;
            this.__repo.commit();
            return artboard;
        } catch (e) {
            this.__repo.rollback();
            throw e;
        }
    }

    dissolution_artboard(shapes: ArtboardView[]): Shape[] {
        try {
            const children: Shape[] = [];
            const api = this.__repo.start("dissolution_artboard", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = children.map(c => c.id);
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                if (shape.isVirtualShape) continue;
                if (!shape.parent) continue;
                const childs = ungroup(this.__document, this.page, adapt2Shape(shape) as Artboard, api);
                children.push(...childs);
            }
            this.__repo.commit();
            return children;
        } catch (e) {
            this.__repo.rollback();
            throw e;
        }
    }

    create_autolayout_artboard(shapes: ShapeView[], artboardname: string): Artboard | void {
        if (shapes.length === 0) return;
        if (shapes.find((v) => !v.parent)) return;
        const fshape = adapt2Shape(shapes[0]);
        const savep = fshape.parent as GroupShape;
        const shapes_rows = layoutShapesOrder2(shapes, false);
        const { hor, ver } = layoutSpacing(shapes_rows);
        const ver_auto = shapes_rows.length === 1 || shapes_rows.every(s => s.length === 1) ? types.StackSizing.Auto : types.StackSizing.Fixed;
        const layoutInfo = new AutoLayout(hor, ver, 10, 10, 10, 10, ver_auto);
        if (shapes_rows.length === 1) {
            layoutInfo.stackWrap = types.StackWrap.NoWrap;
            layoutInfo.stackMode = types.StackMode.Horizontal;
            layoutInfo.stackCounterSpacing = hor;
        } else if (shapes_rows.every(s => s.length === 1)) {
            layoutInfo.stackWrap = types.StackWrap.NoWrap;
            layoutInfo.stackMode = types.StackMode.Vertical;
            layoutInfo.stackSpacing = ver;
        }
        let artboard = newAutoLayoutArtboard(artboardname, new ShapeFrame(0, 0, 100, 100), layoutInfo);

        const api = this.__repo.start("create_autolayout_artboard", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = [artboard.id];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            const saveidx = savep.indexOfChild(adapt2Shape(shapes[0]));
            const childs = shapes_rows.flat();
            if (shapes.length !== childs.length) {
                const hiddenChilds = shapes.filter(c => !c.isVisible);
                childs.push(...hiddenChilds);
            }
            artboard = group(this.__document, this.page, childs.map(s => adapt2Shape(s)), artboard, savep, saveidx, api) as Artboard;
            this.__repo.commit();
            return artboard;
        } catch (e) {
            this.__repo.rollback();
            throw e;
        }
    }

    modifyShapesContextSettingOpacity(shapes: ShapeView[], value: number) {
        if (!shapes.length) return false;
        try {
            const api = this.__repo.start("modifyShapesContextSettingOpacity");
            const page = this.page;
            for (const view of shapes) {
                const shape = shape4contextSettings(api, view, this.view);
                api.shapeModifyContextSettingsOpacity(page, shape, value);
            }
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
            return false;
        }
    }

    modifyShapesContextSettingBlendMode(shapes: Shape[], blendMode: types.BlendMode) {
        try {
            const api = this.__repo.start("modifyShapesContextSettingBlendMode");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const item = shapes[i];
                api.shapeModifyContextSettingsBlendMode(this.page, item, blendMode);
            }
            this.__repo.commit();
            return true;
        } catch (e) {
            this.__repo.rollback();
            throw e;
        }
    }

    hasFill(shape: Shape | ShapeView) {
        const fills = shape.getFills();
        if (fills.length === 0) return false;
        for (let i = 0, len = fills.length; i < len; ++i) {
            if (fills[i].isEnabled) return true;
        }
        return false;
    }

    boolgroup(shapes: Shape[], groupname: string, op: BoolOp) {
        if (shapes.length === 0) throw new Error();
        if (shapes.find((v) => !v.parent)) throw new Error();
        const fshape = shapes[0];
        const savep = fshape.parent as GroupShape;
        // copy fill and borders
        const endShape = shapes[shapes.length - 1];
        const copyStyle = findUsableFillStyle(endShape);
        const style: Style = this.cloneStyle(copyStyle);
        if (!style.fills.length) {
            if (style.borders && style.borders.strokePaints.length) {
                style.borders.strokePaints.forEach(border => {
                    const color = new Color(border.color.alpha, border.color.red, border.color.green, border.color.blue);
                    style.fills.push(newSolidColorFill(color));
                })
            } else {
                style.fills.push(newSolidColorFill()); // 自动添加个填充
            }
        }
        const borderStyle = findUsableBorderStyle(endShape);
        if (endShape instanceof PathShape && (!endShape.isClosed || !this.hasFill(endShape))) {
            const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
            const strokePaints = new BasicArray<Fill>();
            const border = new Border(types.BorderPosition.Center, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
            style.borders = border;
        }
        if (borderStyle !== copyStyle && !(endShape instanceof PathShape && (!endShape.isClosed || !this.hasFill(endShape)))) {
            style.borders = importBorder(style.borders as Border);
        }
        // 1、新建一个GroupShape
        let gshape = newBoolShape(groupname, style);
        try {
            const api = this.__repo.start("boolgroup", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = [gshape.id];
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });
            // 0、save shapes[0].parent？最外层shape？位置？  层级最高图形的parent
            const saveidx = savep.indexOfChild(shapes[0]);
            gshape.boolOp = savep.childs[0]?.boolOp;
            gshape = group(this.__document, this.page, shapes, gshape, savep, saveidx, api);
            shapes.forEach((shape) => api.shapeModifyBoolOp(this.page, shape, op))
            this.__repo.commit();
            return gshape;
        } catch (e) {
            this.__repo.rollback();
            throw e;
        }
    }

    boolgroup2(savep: GroupShape, groupname: string, op: BoolOp): false | BoolShape {
        try {
            if (savep.childs.length === 0) return false;
            const shapes = savep.childs.slice(0).reverse(); // group内部是反过来的
            const pp = savep.parent;
            if (!(pp instanceof GroupShape)) return false;
            const style: Style = this.cloneStyle(savep.style);
            if (style.fills.length === 0) {
                style.fills.push(newSolidColorFill()); // 自动添加个填充
            }

            let gshape = newBoolShape(groupname, style);
            gshape.transform = ((savep.matrix2Root()));

            const api = this.__repo.start("boolgroup2", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = [gshape.id];
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });

            // 0、save shapes[0].parent？最外层shape？位置？  层级最高图形的parent
            let saveidx = pp.indexOfChild(savep);
            // gshape.isBoolOpShape = true;
            gshape = group(this.__document, this.page, shapes, gshape, pp, saveidx, api);
            // 上面group会删除空的编组对象，需要再判断下对象是否还在
            saveidx = pp.indexOfChild(savep);
            if (saveidx >= 0) api.shapeDelete(this.__document, this.page, pp, saveidx);
            shapes.forEach((shape) => api.shapeModifyBoolOp(this.page, shape, op))

            this.__repo.commit();
            return gshape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * 创建组件
     */
    makeSymbol(document: Document, views: ShapeView[], name?: string) {
        try {
            const shapes = views.map(i => adapt2Shape(i));
            const shape0 = shapes[0];
            const __f = FrameCpt.frame2Parent(views[0]);
            const frame = new ShapeFrame(__f.x, __f.y, __f.width, __f.height);

            const replace = shapes.length === 1
                && ((shape0 instanceof GroupShape && !(shape0 instanceof BoolShape)) || shape0 instanceof Artboard);

            const style = replace ? importStyle((shape0.style)) : undefined;
            style?.setStylesMgr(document.stylesMgr);
            const __name = replace ? shape0.name : (name ?? shape0.name);

            const symbolShape = newSymbolShape(__name, frame, document.stylesMgr, style);

            if (replace && shape0 instanceof Artboard) {
                if (shape0.cornerRadius) symbolShape.cornerRadius = importCornerRadius(shape0.cornerRadius);
                if (shape0.prototypeInteractions) {
                    symbolShape.prototypeInteractions = new BasicArray();
                    shape0.prototypeInteractions.forEach(v => {
                        symbolShape.prototypeInteractions?.push(importPrototypeInteraction(v));
                    })
                }
                if (shape0.prototypeStartingPoint) symbolShape.prototypeStartingPoint = importPrototypeStartingPoint(shape0.prototypeStartingPoint);
                if (shape0.overlayPosition) symbolShape.overlayPosition = importOverlayPosition(shape0.overlayPosition);
                if (shape0.overlayBackgroundInteraction) symbolShape.overlayBackgroundInteraction = (shape0.overlayBackgroundInteraction);
                if (shape0.overlayBackgroundAppearance) symbolShape.overlayBackgroundAppearance = importOverlayBackgroundAppearance(shape0.overlayBackgroundAppearance);
                if (shape0.scrollDirection) symbolShape.scrollDirection = (shape0.scrollDirection);
                if (shape0.scrollBehavior) symbolShape.scrollBehavior = (shape0.scrollBehavior);
                if (shape0.autoLayout) symbolShape.autoLayout = importAutoLayout(shape0.autoLayout);
                if (shape0.frameMaskDisabled) symbolShape.frameMaskDisabled = shape0.frameMaskDisabled;
            }

            const page = this.page;
            const api = this.__repo.start("makeSymbol", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = [symbolShape.id];
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });

            let sym: SymbolShape;
            if (replace) {
                const index = (shape0.parent as GroupShape).indexOfChild(shape0);
                sym = api.shapeInsert(document, page, shape0.parent as GroupShape, symbolShape, index + 1) as SymbolShape;
                const children = shape0.childs;
                for (let i = 0, len = children.length; i < len; ++i) {
                    api.shapeMove(page, shape0, 0, symbolShape, i);
                }
                api.shapeDelete(document, page, shape0.parent as GroupShape, index);
            } else {
                const index = (shape0.parent as GroupShape).indexOfChild(shape0);
                symbolShape.frameMaskDisabled = true;
                sym = group(document, page, shapes, symbolShape, shape0.parent as GroupShape, index, api);
                const groupFrame = FrameCpt.frames2RootBound(views);
                api.shapeModifyWH(page, sym, groupFrame.width, groupFrame.height);
                for (const shape of shapes) {
                    const old_rc = shape.resizingConstraint === undefined
                        ? ResizingConstraints2.Mask
                        : shape.resizingConstraint;
                    const new_rc = ResizingConstraints2.setToScaleByHeight(ResizingConstraints2.setToScaleByWidth(old_rc));
                    api.shapeModifyResizingConstraint(page, shape, new_rc);
                }
            }

            const result = sym;
            document.symbolsMgr.add(result.id, result);

            const innerSymbols: Shape[] = [];

            function find(group: GroupShape) {
                for (const child of group.childs) {
                    if (child instanceof SymbolShape || child instanceof SymbolUnionShape) {
                        innerSymbols.push(child);
                        continue;
                    }
                    if (child instanceof GroupShape) find(child);
                }
            }

            find(sym);

            if (innerSymbols.length) { // replace
                const offset = sym.boundingBox().width + 24;
                const matrixToPage = (page.matrix2Root().inverse);
                for (const symbol of innerSymbols) {
                    const frame = new ShapeFrame(symbol.transform.m02, symbol.transform.m12, symbol.size.width, symbol.size.height);
                    let refId = symbol.id;
                    if (symbol instanceof SymbolUnionShape) {
                        const dlt = symbol.childs[0];
                        if (!dlt) continue;
                        refId = dlt.id;
                        frame.width = dlt.size.width;
                        frame.height = dlt.size.height;
                    }
                    const ref = newSymbolRefShape(symbol.name, frame, refId, document.symbolsMgr, document.stylesMgr);
                    if (ref) {
                        const rt = ref.transform;
                        const st = symbol.transform;
                        rt.m00 = st.m00;
                        rt.m01 = st.m01;
                        rt.m10 = st.m10;
                        rt.m11 = st.m11;
                    }
                    const parent = symbol.parent as GroupShape;
                    api.shapeInsert(document, page, parent, ref, parent.indexOfChild(symbol));
                    const om = symbol.matrix2Root();
                    om.trans(offset, 0);
                    om.multiAtLeft(matrixToPage);

                    api.shapeMove(page, parent, parent.indexOfChild(symbol), page, page.childs.length);
                    api.shapeModifyTransform(page, symbol, ((om)));

                    if ([ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef].includes(parent.type)) {
                        const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                        const sortedArr = [...parent.childs].sort((a, b) => {
                            if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                                return -1;
                            } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                                return 1;
                            }
                            return 0;
                        });
                        for (let j = 0; j < sortedArr.length; j++) {
                            const s = sortedArr[j];
                            const currentIndex = parent.childs.indexOf(s);
                            if (currentIndex !== j) {
                                api.shapeMove(this.page, parent, currentIndex, parent, j);
                            }
                        }
                    }
                }
            }

            this.__repo.commit();
            return result;
        } catch (e) {
            this.__repo.rollback();
            throw e;
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
                api.shapeAddVariable(this.page, symbol, _var);
            } else {
                const u = make_union(api, this.__document, this.page, symbol, attri_name);
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
            api.shapeAddVariable(this.page, symbol, _var);
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
                source.transform.m12 = space.y + 20;
            } else {
                source.transform.m02 = hor_align || source.transform.m02 + 20;
            }
            const _this = this;
            const ctx: IImportContext = new class implements IImportContext {
                document: Document = _this.__document;
                curPage: string = _this.__page.id;
                fmtVer: string = FMT_VER_latest
            };
            const api = this.__repo.start("makeStateAt");
            // api.registSymbol(this.__document, source.id, this.__page.id); // 先设置上, import好加入symmgr
            const copy = importSymbolShape(source, ctx); // 需要设置ctx
            const new_state = api.shapeInsert(this.__document, this.page, union, copy, idx + 1);
            modify_frame_after_inset_state(this.page, api, union);
            init_state(api, this.page, new_state as SymbolShape, dlt);

            const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
            if (_types.includes(union.type)) {
                const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                const sortedArr = [...union.childs].sort((a, b) => {
                    if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                        return -1;
                    } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                        return 1;
                    }
                    return 0;
                });
                for (let j = 0; j < sortedArr.length; j++) {
                    const s = sortedArr[j];
                    const currentIndex = union.childs.indexOf(s);
                    if (currentIndex !== j) {
                        api.shapeMove(this.page, union, currentIndex, union, j);
                    }
                }
            }
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
    extractSymbol(shapes: ShapeView[]) {
        const actions: {
            parent: Shape;
            self: Shape;
            insertIndex: number;
        }[] = []
        const _this = this;
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = _this.__document;
            curPage: string = _this.__page.id;
            fmtVer: string = FMT_VER_latest
        };
        const return_shapes: Shape[] = [];
        for (const view of shapes) {
            const shape: SymbolRefShape = adapt2Shape(view) as SymbolRefShape;
            const symbolData = RefUnbind.unbind(view as SymbolRefView);
            if (!symbolData) {
                return_shapes.push(shape);
                continue;
            }
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
                const ret = api.shapeInsert(this.__document, this.page, parent as GroupShape, self, insertIndex);
                api.shapeDelete(this.__document, this.page, parent as GroupShape, insertIndex + 1);

                if ([ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef].includes(parent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const sortedArr = [...(parent as GroupShape).childs].sort((a, b) => {
                        if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                            return -1;
                        } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                            return 1;
                        }
                        return 0;
                    });
                    for (let j = 0; j < sortedArr.length; j++) {
                        const s = sortedArr[j];
                        const currentIndex = (parent as GroupShape).childs.indexOf(s);
                        if (currentIndex !== j) {
                            api.shapeMove(this.page, parent as GroupShape, currentIndex, parent as GroupShape, j);
                        }
                    }
                }

                results.push(ret);
            }
            this.__repo.commit();
            return [...return_shapes, ...results];
        } catch (e) {
            this.__repo.rollback();
            throw e;
        }
    }

    refSymbol(document: Document, name: string, frame: ShapeFrame, refId: string) {
        const ref = newSymbolRefShape(name, frame, refId, document.symbolsMgr, document.stylesMgr);
        const sym = document.symbolsMgr.get(refId);
        if (sym) {
            ref.transform.m00 = sym.transform.m00;
            ref.transform.m01 = sym.transform.m01;
            ref.transform.m10 = sym.transform.m10;
            ref.transform.m11 = sym.transform.m11;
            // ref.frameMaskDisabled = sym.frameMaskDisabled;
        }
        return ref;
    }

    recallSymbol(refs: SymbolRefView[]) {
        try {
            const refMap: Map<string, SymbolRefView> = new Map();
            for (const ref of refs) if (!refMap.has(ref.refId)) refMap.set(ref.refId, ref);
            refs = Array.from(refMap.values());
        } catch (e) {
            this.__repo.rollback();
            throw e;
        }
    }

    private cloneStyle(style: Style): Style {
        const _this = this;
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = _this.__document;
            curPage: string = _this.__page.id;
            fmtVer: string = FMT_VER_latest
        };
        return importStyle(style, ctx);
    }

    _flattenShapes(shapes: ShapeView[]): ShapeView[] {
        return shapes.reduce((result: ShapeView[], item: ShapeView) => {
            if (item instanceof ArtboardView) {
                const childs = (item).childs as ShapeView[];
                if (Array.isArray(childs)) result = result.concat(this._flattenShapes(childs));
            } else {
                if (item instanceof TextShapeView
                    || item instanceof PathShapeView
                    || item instanceof ArtboardView
                    || item instanceof BoolShapeView
                ) result = result.concat(item);
            }
            return result;
        }, []);
    }

    flattenShapes(shapes: ShapeView[], name?: string) {
        const _shapes = this._flattenShapes(shapes);
        if (_shapes.length === 0) throw new Error();
        if (_shapes.find((v) => !v.parent)) throw new Error();
        const fshape = adapt2Shape(shapes[0]);
        const savep = fshape.parent as GroupShape;
        const saveidx = savep.indexOfChild(fshape);
        if (!name) name = fshape.name;

        // copy fill and borders
        const firstShape = _shapes[0];
        const copyStyle = findUsableFillStyle(firstShape);
        const style: Style = this.cloneStyle(copyStyle);

        // if (style.fills.length === 0) {
        //     const fills = _shapes.find(s => this.hasFill(s))?.style.getFills();
        //     fills ? style.fills.push(...fills) : style.fills.push(newSolidColorFill());
        // }
        // const borderStyle = findUsableBorderStyle(endShape);
        // if (endShape instanceof PathShapeView && (!endShape.data.isClosed || !this.hasFill(endShape))) {
        //     style.borders = new BasicArray<Border>();
        // }
        // if (borderStyle !== copyStyle && !(endShape instanceof PathShapeView && (!endShape.data.isClosed || !this.hasFill(endShape)))) {
        //     style.borders = new BasicArray<Border>(...borderStyle.borders.map((b) => importBorder(b)))
        // }

        // bounds
        // 计算frame
        //   计算每个shape的绝对坐标
        const boundsArr = _shapes.map((s) => {
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

        const m = (savep.matrix2Root().inverse)
        const xy = m.computeCoord(bounds.left, bounds.top)

        const frame = new ShapeFrame(xy.x, xy.y, bounds.right - bounds.left, bounds.bottom - bounds.top);
        let path: Path | undefined;
        _shapes.forEach((shape) => {
            const shapem = shape.matrix2Root();
            // const shapepath = render2path(shape);
            // const shapepath = shape.getPath().clone();

            let shapepath: Path;
            if (shape instanceof TextShapeView) {
                shapepath = shape.getTextPath().clone();
            } else {
                shapepath = shape.getPath().clone();
            }

            shapem.multiAtLeft(m);
            shapepath.transform(shapem);

            if (path) {
                path.union(shapepath)
            } else {
                path = shapepath
            }
        })
        // const path = Path.fromSVGString(pathstr);
        if (path === undefined) throw new Error()
        path.translate(-frame.x, -frame.y);

        let pathShape = newPathShape(name, frame, path, this.__document.stylesMgr, style);

        try {
            const api = this.__repo.start("flattenShapes", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = [pathShape.id];
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });
            pathShape = api.shapeInsert(this.__document, this.page, savep, pathShape, saveidx) as PathShape | PathShape2;
            for (let i = 0, len = shapes.length; i < len; i++) {
                const s = adapt2Shape(shapes[i]);
                const p = s.parent as GroupShape;
                const idx = p.indexOfChild(s);
                api.shapeDelete(this.__document, this.page, p, idx);
                if (p.childs.length <= 0) {
                    deleteEmptyGroupShape(this.__document, this.page, p, api)
                }
            }
            update_frame_by_points(api, this.page, pathShape);
            const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
            if (_types.includes(savep.type)) {
                const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                const sortedArr = [...savep.childs].sort((a, b) => {
                    if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                        return -1;
                    } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                        return 1;
                    }
                    return 0;
                });
                for (let j = 0; j < sortedArr.length; j++) {
                    const s = sortedArr[j];
                    const currentIndex = savep.childs.indexOf(s);
                    if (currentIndex !== j) {
                        api.shapeMove(this.page, savep, currentIndex, savep, j);
                    }
                }
            }
            this.__repo.commit();
            return pathShape;
        } catch (e) {
            this.__repo.rollback();
            throw e;
        }
    }

    flattenBoolShape(shape: BoolShapeView): PathShape | false {
        try {
            const parent = adapt2Shape(shape).parent as GroupShape;
            if (!parent) return false;

            const path = render2path(shape);

            const copyStyle = findUsableFillStyle(shape);
            const style: Style = this.cloneStyle(copyStyle);
            const borderStyle = findUsableBorderStyle(shape);
            if (borderStyle !== copyStyle) {
                style.borders = importBorder(style.borders as Border);
            }

            const gframe = shape.frame;
            const boundingBox = path.bbox();
            const x = boundingBox.x;
            const y = boundingBox.y;
            const w = boundingBox.w;
            const h = boundingBox.h;
            const frame = new ShapeFrame(gframe.x, gframe.y, w, h);
            path.translate(-boundingBox.x, -boundingBox.y);
            let pathShape = newPathShape(shape.name, frame, path, this.__document.stylesMgr, style);
            pathShape.fixedRadius = shape.fixedRadius;
            pathShape.transform = new Transform() // shape图层坐标系
                .translate(x, y) // pathShape图层坐标系
                .addTransform((shape.transform)) // pathShape在父级坐标系下的transform;

            const index = parent.indexOfChild(adapt2Shape(shape));
            const api = this.__repo.start("flattenBoolShape", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = [pathShape.id];
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });

            api.shapeDelete(this.__document, this.page, parent, index);
            pathShape = api.shapeInsert(this.__document, this.page, parent, pathShape, index) as PathShape;
            const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
            if (_types.includes(parent.type)) {
                const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                const sortedArr = [...parent.childs].sort((a, b) => {
                    if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                        return -1;
                    } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                        return 1;
                    }
                    return 0;
                });
                for (let j = 0; j < sortedArr.length; j++) {
                    const s = sortedArr[j];
                    const currentIndex = parent.childs.indexOf(s);
                    if (currentIndex !== j) {
                        api.shapeMove(this.page, parent, currentIndex, parent, j);
                    }
                }
            }
            this.__repo.commit();
            return pathShape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
            return false;
        }
    }

    flattenGroup(shape: ShapeView, groupname: string): PathShape | false {
        // step1
        if (shape.childs.length === 0) return false;
        const _shape = adapt2Shape(shape);
        const _parent = _shape.parent as GroupShape;
        // const shapes = shape.childs.slice(0).reverse();
        // const pp = shape.parent;
        const saveidx = _parent?.indexOfChild(_shape) ?? -1;
        if (saveidx < 0) return false;
        // if (!(pp instanceof GroupShape)) return false;
        const style: Style = this.cloneStyle(shape.style);
        if (style.fills.length === 0) {
            style.fills.push(newSolidColorFill());
        }

        const path = render2path(shape, BoolOp.Union);

        const copyStyle = findUsableFillStyle(shape);
        const style2: Style = this.cloneStyle(copyStyle);
        const borderStyle = findUsableBorderStyle(shape);
        if (borderStyle !== copyStyle) {
            style.borders = importBorder(style.borders as Border);
        }

        let pathShape = newPathShape(shape.name, shape.frame, path, this.__document.stylesMgr, style2);
        pathShape.fixedRadius = shape.fixedRadius;
        pathShape.transform = importTransform(shape.transform);
        pathShape.style = style;

        try {
            const api = this.__repo.start("flattenGroup", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = [shape.id];
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });

            api.shapeDelete(this.__document, this.page, _parent, saveidx);
            pathShape = api.shapeInsert(this.__document, this.page, _parent, pathShape, saveidx) as PathShape;
            update_frame_by_points(api, this.page, pathShape);
            const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
            if (_types.includes(_parent.type)) {
                const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                const sortedArr = [..._parent.childs].sort((a, b) => {
                    if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                        return -1;
                    } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                        return 1;
                    }
                    return 0;
                });
                for (let j = 0; j < sortedArr.length; j++) {
                    const s = sortedArr[j];
                    const currentIndex = _parent.childs.indexOf(s);
                    if (currentIndex !== j) {
                        api.shapeMove(this.page, _parent, currentIndex, _parent, j);
                    }
                }
            }
            this.__repo.commit();
            return pathShape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
            return false;
        }
    }

    private removeContactSides(api: Operator, page: Page, shape: types.ContactShape) {
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

    private removeContact(api: Operator, page: Page, shape: Shape) {
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

    private delete_inner(page: Page, _shape: ShapeView | Shape, api: Operator): boolean {
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
                if (modify_variable_with_api(api, this.view, shape, VariableType.Visible, OverrideType.Visible, isVisible)) return true;
                api.shapeModifyVisible(this.page, shape.data, isVisible);
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
                    if (modify_variable_with_api(api, this.view, shape, VariableType.Visible, OverrideType.Visible, isVisible)) continue;
                    api.shapeModifyVisible(this.page, shape.data, isVisible);
                    continue;
                }
                const symbol = get_symbol_by_layer(shape);
                if (symbol) {
                    clear_binds_effect(this.page, shape, symbol, api);
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
        this.__repo.commit();
        return true;
    }

    // 插入成功，返回插入的shape
    insert(parent: GroupShape, index: number, shape: Shape, adjusted = false): Shape | false {
        // adjust shape frame refer to parent
        if (!adjusted) {
            const xy = parent.frame2Root();
            const transform2 = (shape.transform);
            transform2.translate(-xy.x, -xy.y)
        }
        shape.id = uuid(); // 凡插入对象，不管是复制剪切的，都需要新id。要保持同一id，使用move!
        const api = this.__repo.start("insertshape", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = [shape.id];
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            api.shapeInsert(this.__document, this.page, parent, shape, index);
            shape = parent.childs[index];
            const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
            if (_types.includes(parent.type)) {
                const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                const sortedArr = [...parent.childs].sort((a, b) => {
                    if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                        return -1;
                    } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                        return 1;
                    }
                    return 0;
                });
                for (let j = 0; j < sortedArr.length; j++) {
                    const s = sortedArr[j];
                    const currentIndex = parent.childs.indexOf(s);
                    if (currentIndex !== j) {
                        api.shapeMove(this.page, parent, currentIndex, parent, j);
                    }
                }
            }
            this.__repo.commit();
            return shape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
            return false;
        }
    }

    insertShapes(actions: { parent: GroupShape; shape: Shape; index?: number }[], adjusted = true) {
        try {
            const ids: string[] = [];
            const api = this.__repo.start("insertShapes", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = ids;
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });
            const page = this.page;
            const document = this.__document;
            for (const action of actions) {
                const { parent, shape, } = action;
                if (!adjusted) {
                    const xy = parent.frame2Root();
                    const transform2 = (shape.transform);
                    transform2.translate(new ColVector3D([-xy.x, -xy.y, 0]));
                    // updateShapeTransform1By2(shape.transform, transform2);
                }
                const s = api.shapeInsert(document, page, parent, shape, action.index ?? parent.childs.length);
                const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                if (_types.includes(parent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const sortedArr = [...parent.childs].sort((a, b) => {
                        if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                            return -1;
                        } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                            return 1;
                        }
                        return 0;
                    });
                    for (let j = 0; j < sortedArr.length; j++) {
                        const s = sortedArr[j];
                        const currentIndex = parent.childs.indexOf(s);
                        if (currentIndex !== j) {
                            api.shapeMove(this.page, parent, currentIndex, parent, j);
                        }
                    }
                }
                ids.push(s.id);
                const name = assign(s);
                if (name !== shape.name) api.shapeModifyName(page, s, name);
            }
            this.__repo.commit();
            return true;
        } catch (e) {
            console.error(e)
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * @description 同一容器下批量粘贴shape
     */
    pasteShapes1(parent: GroupShape, shapes: Shape[]): {
        shapes: Shape[]
    } | false {
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
                const __shape = api.shapeInsert(this.__document, this.page, parent, shape, index);
                const name = assign(__shape);
                api.shapeModifyName(this.page, __shape, name);
                result.push(parent.childs[index]);
                index++;
            }
            const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
            if (_types.includes(parent.type)) {
                const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                const sortedArr = [...parent.childs].sort((a, b) => {
                    if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                        return -1;
                    } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                        return 1;
                    }
                    return 0;
                });
                for (let j = 0; j < sortedArr.length; j++) {
                    const s = sortedArr[j];
                    const currentIndex = parent.childs.indexOf(s);
                    if (currentIndex !== j) {
                        api.shapeMove(this.page, parent, currentIndex, parent, j);
                    }
                }
            }
            // modify_frame_after_insert(api, this.__page, result);
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
     */
    pasteShapes2(shapes: Shape[], actions: {
        parent: GroupShape,
        index: number
    }[]): Shape[] | false {
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
                const __shape = api.shapeInsert(this.__document, this.page, parent, shape, index);
                const name = assign(__shape);
                api.shapeModifyName(this.page, __shape, name);
                result.push(parent.childs[index]);

                const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                if (_types.includes(parent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const sortedArr = [...parent.childs].sort((a, b) => {
                        if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                            return -1;
                        } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                            return 1;
                        }
                        return 0;
                    });
                    for (let j = 0; j < sortedArr.length; j++) {
                        const s = sortedArr[j];
                        const currentIndex = parent.childs.indexOf(s);
                        if (currentIndex !== j) {
                            api.shapeMove(this.page, parent, currentIndex, parent, j);
                        }
                    }
                }
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
    pasteShapes3(actions: {
        env: GroupShape,
        shapes: Shape[]
    }[]): Shape[] | false {
        try {
            const api = this.__repo.start("pasteShapes3", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = actions.reduce((p, c) => {
                    return [...p, ...c.shapes.map(s => s.id)]
                }, [] as string[]);
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });

            const result: Shape[] = [];

            for (let i = 0, len = actions.length; i < len; i++) {
                const { env, shapes } = actions[i];
                for (let j = 0; j < shapes.length; j++) {
                    let index = env.childs.length;
                    const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                    if (_types.includes(env.type)) {
                        const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                        const fixed_index = env.childs.findIndex(s => s.scrollBehavior === Fixed);
                        index = fixed_index === -1 ? env.childs.length : fixed_index;
                    }
                    const __shape = api.shapeInsert(this.__document, this.page, env, shapes[j], index);
                    const name = assign(__shape);
                    api.shapeModifyName(this.page, __shape, name);
                    result.push(env.childs[index]);
                }
            }
            this.__repo.commit();
            return result;
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
            return false;
        }
    }

    shapesModifyRadius(shapes: ShapeView[], values: number[]) {
        try {
            const api = this.__repo.start("shapesModifyRadius");
            const page = this.page;
            const pageView = this.__page;

            for (const view of shapes) {
                const shape = adapt2Shape(view);
                let needUpdateFrame = false;

                if (view.radiusMask) {
                    const variable = getRadiusMaskVariable(api, pageView, view, undefined);
                    if (variable) {
                        api.shapeModifyVariable(page, variable, undefined);
                    } else {
                        api.modifyRadiusMask(shape, undefined);
                    }
                }

                if (shape.radiusType === RadiusType.Rect) {
                    if (values.length !== 4) values = [values[0], values[0], values[0], values[0]];

                    const [lt, rt, rb, lb] = values;

                    if (shape instanceof SymbolRefShape) {
                        const _shape = shape4cornerRadius(api, this.view, view as SymbolRefView);
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
                    if (shape instanceof ContactShape) {
                        api.shapeModifyFixedRadius(page, shape as ContactShape, values[0]);
                    } else if (shape instanceof PathShape || shape instanceof PathShape2) {
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

                if (needUpdateFrame) update_frame_by_points(api, this.page, shape as PathShape);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
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
                api.shapeMove(this.page, parent, index, target, to)
                this.__repo.commit();
                return true;
            } catch (error) {
                console.log(error)
                this.__repo.rollback();
            }
        }
        return false;
    }

    upperLayer(shapes: ShapeView[], step?: number) {
        const fixUpStep = (parent: GroupShape, set: Set<string>, targetIndex: number, currentIndex: number) => {
            const max = parent.childs.length - 1;
            if (targetIndex > max) {
                targetIndex = max;
            }
            const children = parent.childs;

            let result = targetIndex;

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
                const __target = step ? (currentIndex + step) : parent.childs.length - 1;
                const targetIndex = fixUpStep(parent, set, __target, currentIndex)

                if (targetIndex !== currentIndex) {
                    adjusted = true;
                    api.shapeMove(this.page, parent, currentIndex, parent, targetIndex);
                }

                const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                if (_types.includes(parent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const sortedArr = [...parent.childs].sort((a, b) => {
                        if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                            return -1;
                        } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                            return 1;
                        }
                        return 0;
                    });
                    for (let j = 0; j < sortedArr.length; j++) {
                        const s = sortedArr[j];
                        const currentIndex = parent.childs.indexOf(s);
                        if (currentIndex !== j) {
                            api.shapeMove(this.page, parent, currentIndex, parent, j);
                        }
                    }
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

    lowerLayer(shapes: ShapeView[], step?: number) {
        const fixLowStep = (parent: GroupShape, set: Set<string>, targetIndex: number, currentIndex: number) => {
            if (targetIndex < 0) {
                targetIndex = 0;
            }
            const children = parent.childs;

            let result = targetIndex;

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
                const __target = step ? (currentIndex - step) : 0;
                const targetIndex = fixLowStep(parent, set, __target, currentIndex)

                if (targetIndex !== currentIndex) {
                    adjusted = true;
                    api.shapeMove(this.page, parent, currentIndex, parent, targetIndex);
                }

                const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                if (_types.includes(parent.type)) {
                    const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                    const sortedArr = [...parent.childs].sort((a, b) => {
                        if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                            return -1;
                        } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                            return 1;
                        }
                        return 0;
                    });
                    for (let j = 0; j < sortedArr.length; j++) {
                        const s = sortedArr[j];
                        const currentIndex = parent.childs.indexOf(s);
                        if (currentIndex !== j) {
                            api.shapeMove(this.page, parent, currentIndex, parent, j);
                        }
                    }
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
    replace(document: Document, replacement: Shape[], src: Shape[]): Shape[] {
        try {
            // 收集被替换上去的元素
            const src_replacement: Shape[] = [];

            const api = this.__repo.start("replace", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = src_replacement.map(s => s.id);
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });

            const len = replacement.length;
            // 寻找replacement的左上角(lt_point)，该点将和src中每个图形的左上角重合
            const any_r_f = replacement[0].transform;
            const lt_point = { x: any_r_f.translateX, y: any_r_f.translateY };
            for (let i = 1; i < len; i++) {
                const frame = replacement[i].transform;
                if (frame.translateX < lt_point.x) lt_point.x = frame.translateX;
                if (frame.translateY < lt_point.y) lt_point.y = frame.translateY;
            }

            // 记录每个图形相对lt_point的位置
            const delta_xys: { x: number, y: number }[] = [];
            for (let i = 0; i < len; i++) {
                const r = replacement[i];
                const rf = r.transform;
                const dt = { x: rf.translateX - lt_point.x, y: rf.translateY - lt_point.y };
                delta_xys.push(dt);
            }

            // 开始替换
            for (let i = 0; i < src.length; i++) {
                const s = src[i];

                if (is_state(s)) continue;

                const p = s.parent as GroupShape;
                if (!p) throw new Error('invalid root');
                let save_index = p.indexOfChild(s);
                if (save_index < 0) throw new Error('invalid childs data');

                // 记录被替换掉的图形原先所在的位置
                const fr = s.transform;
                const save_frame = { x: fr.translateX, y: fr.translateY };
                // 先删除将被替换的图形
                const del_res = this.delete_inner(this.page, s, api);
                if (!del_res) throw new Error('delete failed');

                // replacement的原版数据只能使用一次，使用一次之后的替换应该使用replacement的副本数据，并确保每一份副本数据中不存在共同对象引用
                const copy: Shape[] = i < 1 ? replacement : transform_data(document, replacement);
                for (let r_i = 0; r_i < len; r_i++) { // 逐个插入replacement中的图形
                    let r = copy[r_i];
                    r.id = uuid();
                    // lt_point与s.frame的xy重合后，用delta_xys中的相对位置计算replacement中每个图形的偏移
                    const transform2 = (r.transform);
                    transform2.setTranslate(new ColVector3D([
                        save_frame.x + delta_xys[r_i].x,
                        save_frame.y + delta_xys[r_i].y,
                        0,
                    ]))
                    // updateShapeTransform1By2(r.transform, transform2);
                    api.shapeInsert(this.__document, this.page, p, r, save_index);
                    src_replacement.push(p.childs[save_index]);
                    save_index++;
                }
            }
            this.__repo.commit();
            return src_replacement;
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    arrange(actions: { target: Shape, transX: number; transY: number }[]) {
        try {
            const api = this.__repo.start('arrange');
            const page = this.page;
            for (const action of actions) {
                const { target, transX, transY } = action;
                api.shapeModifyXY(page, target, target.transform.translateX + transX, target.transform.translateY + transY);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    modifyShapesX(actions: {
        target: ShapeView,
        x: number
    }[]) {
        try {
            const api = this.__repo.start('modifyShapesX');
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                const shape = adapt2Shape(action.target)
                api.shapeModifyXY(page, shape, action.x, shape.transform.translateY);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    modifyShapesY(actions: {
        target: ShapeView,
        y: number
    }[]) {
        try {
            const api = this.__repo.start('modifyShapesY');
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                const shape = adapt2Shape(action.target)
                api.shapeModifyXY(page, shape, shape.transform.translateX, action.y);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    modifyShapesAngleCount(actions: {
        target: (PolygonShape | StarShape),
        count: number
    }[]) {
        const api = this.__repo.start('modifyShapesAngleCount');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, count } = actions[i];
                if (target.haveEdit) continue;
                const offset = target.type === ShapeType.Star ? (target as StarShape).innerAngle : undefined;
                const counts = getPolygonVertices(target.type === ShapeType.Star ? count * 2 : count, offset);
                const points = getPolygonPoints(counts, target.pathsegs[0]?.points[0]?.radius ?? 0);
                api.deletePoints(this.page, target, 0, target.type === ShapeType.Star ? target.counts * 2 : target.counts, 0);
                api.addPoints(this.page, target, points, 0);
                api.shapeModifyCounts(this.page, target, count);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    modifyShapesInnerAngle(actions: {
        target: StarShape,
        offset: number
    }[]) {
        const api = this.__repo.start('modifyShapesInnerAngle');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, offset } = actions[i];
                if (target.haveEdit) continue;
                const segment = target?.pathsegs[0];
                if (!segment) continue;
                const points = segment?.points;
                if (!points?.length) continue;
                for (let index = 0; index < points.length; index++) {
                    if (index % 2 === 0) continue;
                    const angle = ((2 * Math.PI) / points.length) * index;
                    const p = calculateInnerAnglePosition(offset, angle);
                    api.shapeModifyCurvPoint(this.page, target, index, p, 0);
                }
                api.shapeModifyInnerAngle(this.page, target, offset);
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
                api.shapeModifyConstrainerProportions(this.page, adapt2Shape(target), value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    modifyShapesWidth(shapes: ShapeView[], val: number) {
        try {
            const api = this.__repo.start('modifyShapesWidth');
            modify_shapes_width(api, this.__document, this.page, shapes, val)
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    modifyShapesHeight(shapes: ShapeView[], val: number) {
        try {
            const api = this.__repo.start('modifyShapesHeight');
            modify_shapes_height(api, this.__document, this.page, shapes, val)
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    /**
     * @description 旋转图层
     */
    setShapesRotate(actions: {
        shape: ShapeView,
        transform: Transform
    }[]) {
        try {
            const api = this.__repo.start('setShapesRotate');
            for (const action of actions) {
                const { shape: shapeView, transform } = action;
                const s = adapt2Shape(shapeView);
                api.shapeModifyRotate(this.page, s, transform);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    shapesFlip(params: {
        shape: ShapeView,
        transform2: Transform
    }[]) {
        try {
            const api = this.__repo.start('shapesFlip');
            const page = this.page;
            for (let i = 0; i < params.length; i++) {
                const { shape, transform2 } = params[i];
                api.shapeModifyTransform(page, adapt2Shape(shape), (transform2.clone()));
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    makeMask(shapes: ShapeView[], maskName?: string) {
        try {
            const page = this.page;
            const doc = this.__document;
            let resultShapes: string[] = [];
            const api = this.__repo.start('modify-mask-status', (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = resultShapes;
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });

            const len = shapes.length;
            if (!len)
                throw new Error('no shapes');
            else if (len === 1) {
                const bottom = adapt2Shape(shapes[0]);
                if (bottom.parent!.id === page.id) {
                    if (bottom.mask) {
                        api.shapeModifyMask(page, bottom, false);
                        resultShapes = [bottom.id];
                    } else {
                        const gshape = newGroupShape(maskName!);
                        const saveidx = page.indexOfChild(bottom);
                        resultShapes = [group(doc, page, [bottom], gshape, page, saveidx, api).id];
                        api.shapeModifyMask(page, bottom, true);
                    }
                } else {
                    const __target_mask = !bottom.mask;
                    api.shapeModifyMask(page, bottom, __target_mask);
                    resultShapes = [bottom.id];
                }
            } else {
                const bottom = adapt2Shape(shapes[0]);
                const savep = bottom.parent as GroupShape;
                const gshape = newGroupShape(maskName!);
                const saveidx = savep.indexOfChild(bottom);
                const __mg = group(doc, page, shapes.map(shape => adapt2Shape(shape)), gshape, savep, saveidx, api);
                resultShapes = [__mg.id];
                if (!__mg.childs[0].mask) api.shapeModifyMask(page, __mg.childs[0], true);
            }
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log('makeMask', e);
            this.__repo.rollback();
            return false;
        }
    }

    // 添加节点
    addShapesGradientStop(actions: { fill: Fill, stop: Stop }[]) {
        try {
            const api = this.__repo.start('addShapesGradientStop');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { fill, stop } = actions[i];
                const gradient = fill.gradient;
                if (!gradient) continue;
                const new_gradient = importGradient(gradient);
                new_gradient.stops.push(importStop(stop));
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
                api.setFillGradient(fill, new_gradient);
            }
            this.__repo.commit();
        } catch (error) {
            console.error('addShapesGradientStop:', error);
            this.__repo.rollback();
        }
    }

    deleteShapesGradientStop(actions: BatchAction5[]) {
        try {
            const api = this.__repo.start('deleteShapesGradientStop');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type, value } = actions[i];
                const grad_type = type === 'fills' ? target.getFills() : target.getBorder()?.strokePaints;
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
                const shape = shape4fill(api, this.view, target);
                // f(this.page, shape, index, new_gradient); // todo setFillGradient
            }
            this.__repo.commit();
        } catch (error) {
            console.error(error);
            this.__repo.rollback();
        }
    }

    setGradientOpacity(actions: { fill: Fill, opacity: number }[]) {
        try {
            const api = this.__repo.start('setGradientOpacity');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { fill, opacity } = actions[i];
                const gradient = fill.gradient;
                if (!gradient) continue;
                api.setGradientOpacity(gradient, opacity);
            }
            this.__repo.commit();
        } catch (error) {
            console.log('setGradientOpacity:', error);
            this.__repo.rollback();
        }
    }

    setShapesFillAsImage(actions: {
        shape: ShapeView,
        ref: string,
        width: number,
        height: number,
        media: { buff: Uint8Array, base64: string }
    }[]) {
        try {
            const api = this.__repo.start('setShapesFillAsImage');
            const document = this.__document;
            for (const action of actions) {
                const { shape, ref, media, width, height } = action;
                const target = shape4fill(api, this.view, shape);
                const fills = target instanceof Shape ? target.style.fills : target;
                if (fills instanceof Variable) {
                    const index = fills.value.length - 1;
                    if (index < 0) continue;
                    if (!fills.value[index].imageScaleMode) {
                        api.setFillScaleMode(fills.value[index], types.ImageScaleMode.Fill);
                    }
                    if (fills.value[index].fillType !== FillType.Pattern) {
                        api.setFillType(fills.value[index], FillType.Pattern);
                    }
                    api.setFillImageRef(document, fills.value[index], ref, media);
                    api.setFillImageOriginWidth(fills.value[index], width);
                    api.setFillImageOriginHeight(fills.value[index], height);
                } else {
                    const index = fills.length - 1;
                    if (index < 0) {
                        const fill = new Fill([0] as BasicArray<number>, uuid(), true, FillType.Pattern, new Color(1, 217, 217, 217));
                        fill.imageRef = ref;
                        fill.setImageMgr(document.mediasMgr);
                        fill.imageScaleMode = types.ImageScaleMode.Fill;
                        api.addFillAt(fills, fill, 0);
                    } else {
                        if (fills[index].fillType !== FillType.Pattern) {
                            api.setFillType(fills[index], FillType.Pattern);
                        }
                        api.setFillImageRef(document, fills[index], ref, media);
                        api.setFillImageOriginWidth(fills[index], width);
                        api.setFillImageOriginHeight(fills[index], height);
                    }
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    //borders
    setShapeBorderFillExchange(shapes: ShapeView[]) {
        try {
            const api = this.__repo.start('setShapeBorderFillExchange');
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const fillMask = shape.fillsMask;
                const borderFillMask = shape.borderFillsMask;

                const fillShape = shape4fill(api, this.view, shape);
                const borderShape = shape4border(api, this.view, shape);

                const fills = fillShape instanceof Shape ? fillShape.style.fills : fillShape.value as BasicArray<Fill>;
                const borderFills = borderShape instanceof Shape ? borderShape.style.borders.strokePaints : borderShape.value.strokePaints as BasicArray<Fill>;
                const variableFill = getFillMaskVariable(api, this.view, shape, fillMask);
                const variableBorder = getBorderMaskVariable(api, this.view, shape, borderFillMask);

                if (borderFillMask) {
                    if (variableFill) {
                        api.shapeModifyVariable(this.page, variableFill, borderFillMask);
                        if (!fillMask && variableBorder) api.shapeModifyVariable(this.page, variableBorder, undefined);
                    } else {
                        api.modifyFillsMask(this.page, adapt2Shape(shape), borderFillMask);
                        if (!fillMask) api.setBorderFillMask(adapt2Shape(shape).style, undefined);
                    }
                } else {
                    api.deleteFills(fills, 0, fills.length);
                    api.addFills(fills, borderFills.map(i => importFill(i)));
                }
                if (fillMask) {
                    if (variableBorder) {
                        api.shapeModifyVariable(this.page, variableBorder, fillMask);
                        if (!borderFillMask && variableFill) api.shapeModifyVariable(this.page, variableFill, undefined);
                    } else {
                        api.setBorderFillMask(adapt2Shape(shape).style, fillMask);
                        if (!borderFillMask) api.modifyFillsMask(this.page, adapt2Shape(shape), undefined);
                    }
                } else {
                    api.deleteFills(borderFills, 0, borderFills.length);
                    api.addFills(borderFills, fills.map(i => importFill(i)));
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.log(error, 'error');
            this.__repo.rollback();
        }
    }

    setShapesMarkerType(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapesMarkerType');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                if (modify_variable_with_api(api, this.view, target, VariableType.MarkerType, value.isEnd ? OverrideType.EndMarkerType : OverrideType.StartMarkerType, value.mt)) continue;
                if (value.isEnd) {
                    api.shapeModifyEndMarkerType(this.page, adapt2Shape(target), value.mt);
                } else {
                    api.shapeModifyStartMarkerType(this.page, adapt2Shape(target), value.mt);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setShapesEndpoint(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapesEndpoint');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                if (modify_variable_with_api(api, this.view, target, VariableType.MarkerType, OverrideType.StartMarkerType, value.mt)) {
                    modify_variable_with_api(api, this.view, target, VariableType.MarkerType, OverrideType.EndMarkerType, value.mt)
                    continue;
                }
                api.shapeModifyEndMarkerType(this.page, adapt2Shape(target), value);
                api.shapeModifyStartMarkerType(this.page, adapt2Shape(target), value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
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
                if (modify_variable_with_api(api, this.view, target, VariableType.MarkerType, OverrideType.EndMarkerType, startMarkerType || MarkerType.Line)) {
                    modify_variable_with_api(api, this.view, target, VariableType.MarkerType, OverrideType.StartMarkerType, endMarkerType || MarkerType.Line)
                    continue;
                }
                api.shapeModifyEndMarkerType(this.page, adapt2Shape(target), startMarkerType || MarkerType.Line);
                api.shapeModifyStartMarkerType(this.page, adapt2Shape(target), endMarkerType || MarkerType.Line);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    //export cutout
    shapesExportFormatUnify(actions: ExportFormatReplaceAction[]) {
        try {
            const api = this.__repo.start('shapesExportFormatUnify');
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                if (target.exportOptions) {
                    api.deleteExportFormats(this.page, target, 0, target.exportOptions.exportFormats.length);
                }
                api.addExportFormats(this.page, target, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
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
                    api.addExportFormat(this.page, target, format, length);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    pageAddExportFormat(formats: ExportFormat[]) {
        try {
            const api = this.__repo.start('pageAddExportFormat');
            for (let i = 0; i < formats.length; i++) {
                const format = formats[i];
                const length = this.page.exportOptions ? this.page.exportOptions.exportFormats.length : 0;
                api.addPageExportFormat(this.page, format, length);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPageExportPreviewUnfold(unfold: boolean) {
        try {
            const api = this.__repo.start('setPageExportPreviewUnfold');
            api.setPageExportPreviewUnfold(this.__document, this.page.id, unfold);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    shapesDeleteExportFormat(actions: ExportFormatDeleteAction[]) {
        try {
            const api = this.__repo.start('shapesDeleteExportFormat');
            for (let i = 0; i < actions.length; i++) {
                const { target, index } = actions[i];
                api.deleteExportFormatAt(this.page, target, index);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    pageDeleteExportFormat(idx: number) {
        try {
            const format = this.page.exportOptions?.exportFormats[idx];
            if (format) {
                const api = this.__repo.start('pageDeleteExportFormat');
                api.deletePageExportFormatAt(this.page, idx);
                this.__repo.commit();
            }
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setShapesExportFormatScale(actions: ExportFormatScaleAction[]) {
        try {
            const api = this.__repo.start('setShapesExportFormatScale');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setExportFormatScale(this.page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPageExportFormatScale(idx: number, scale: number) {
        try {
            const api = this.__repo.start('setPageExportFormatScale');
            api.setPageExportFormatScale(this.page, idx, scale);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setShapesExportFormatName(actions: ExportFormatNameAction[]) {
        try {
            const api = this.__repo.start('setShapesExportFormatName');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setExportFormatName(this.page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPageExportFormatName(idx: number, name: string) {
        try {
            const api = this.__repo.start('setPageExportFormatName');
            api.setPageExportFormatName(this.page, idx, name);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setShapesExportFormatPrefix(actions: ExportFormatPrefixAction[]) {
        try {
            const api = this.__repo.start('setShapesExportFormatPerfix');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setExportFormatPerfix(this.page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPageExportFormatPrefix(idx: number, name: ExportFormatNameingScheme) {
        try {
            const api = this.__repo.start('setPageExportFormatPerfix');
            api.setPageExportFormatPerfix(this.page, idx, name);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setShapesExportFormatFileFormat(actions: ExportFormatFileFormatAction[]) {
        try {
            const api = this.__repo.start('setShapesExportFormatFileFormat');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setExportFormatFileFormat(this.page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPageExportFormatFileFormat(idx: number, name: ExportFileFormat) {
        try {
            const api = this.__repo.start('setPageExportFormatFileFormat');
            api.setPageExportFormatFileFormat(this.page, idx, name);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeStart(shape: ShapeView, startpoint: PrototypeStartingPoint) {
        try {
            const api = this.__repo.start('setPrototypeStart');
            const __shape = adapt2Shape(shape);
            api.setShapeProtoStart(this.page, __shape, startpoint);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    delPrototypeStart(shape: ShapeView) {
        try {
            const api = this.__repo.start('delPrototypeStart');
            const __shape = adapt2Shape(shape);
            api.setShapeProtoStart(this.page, __shape, undefined);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    private shape4protoActions(api: Operator, shape: ShapeView, id: string | undefined) {
        const _var = prepareVar(api, this.view, shape, OverrideType.ProtoInteractions, VariableType.ProtoInteractions, (_var) => {
            const ret = new BasicArray();
            if (id) {
                const actions = shape.prototypeInteractions;
                const a = ((actions || []) as PrototypeInteraction[]).find(v => v.id === id);
                if (a) ret.push(importPrototypeInteraction(a));
            }
            return ret;
        })
        if (_var && id && !(_var.var.value as PrototypeInteraction[]).find(v => v.id === id)) {
            const inherit = shape.prototypeInteractions;
            const i = inherit && inherit.find(v => v.id === id);
            if (i) {
                const a = new PrototypeInteraction(new BasicArray(), id, new PrototypeEvent(i.event.interactionType), new PrototypeActions(i.actions.connectionType, true))
                api.insertShapeprototypeInteractions(this.page, _var.var, a);
            }
        }
        return _var?.var || shape.data;
    }

    insertPrototypeAction(shape: ShapeView, action: PrototypeInteraction) {
        try {
            const api = this.__repo.start('insertPrototypeAction');
            const _shape = this.shape4protoActions(api, shape, undefined);
            api.insertShapeprototypeInteractions(this.page, _shape, action);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    deletePrototypeAction(shape: ShapeView, id: string) {
        try {
            const api = this.__repo.start('deletePrototypeAction');
            const _shape = this.shape4protoActions(api, shape, id);
            if (_shape instanceof Variable) {
                api.shapeModifyPrototypeActionDeleted(this.page, _shape, id, true);
            } else {
                api.deleteShapePrototypeInteractions(this.page, _shape, id);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeActionEvent(shape: ShapeView, id: string, value: PrototypeEvents) {
        try {
            const api = this.__repo.start('setPrototypeActionEvent');
            const _shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeActionEvent(this.page, _shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeActionEventTime(shape: ShapeView, id: string, value: number) {
        try {
            const api = this.__repo.start('setPrototypeActionEventTime');
            const _shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeActionEventTime(this.page, _shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeActionConnNav(shape: ShapeView, id: string, conn: PrototypeConnectionType | undefined, nav: PrototypeNavigationType | undefined) {
        try {
            const api = this.__repo.start('setPrototypeActionConnectionType');
            const __shape = this.shape4protoActions(api, shape, id);
            const transitionType = shape.prototypeInteractions?.find(i => i.id === id)?.actions.transitionType
            const old_nav = shape.prototypeInteractions?.find(i => i.id === id)?.actions.navigationType
            api.shapeModifyPrototypeActionConnNav(this.page, __shape, id, conn, nav);

            if (nav === PrototypeNavigationType.SCROLLTO && old_nav !== PrototypeNavigationType.SCROLLTO) {
                const arr = [PrototypeTransitionType.INSTANTTRANSITION, PrototypeTransitionType.SCROLLANIMATE]
                if (!transitionType) return
                if (!arr.includes(transitionType)) {
                    api.shapeModifyPrototypeActionTransitionType(this.page, __shape, id, PrototypeTransitionType.INSTANTTRANSITION)
                }
                api.shapeModifyPrototypeActionTargetNodeID(this.page, __shape, id, undefined)
            }
            if (nav === PrototypeNavigationType.SWAPSTATE && old_nav !== PrototypeNavigationType.SWAPSTATE) {
                const arr = [PrototypeTransitionType.INSTANTTRANSITION, PrototypeTransitionType.DISSOLVE]
                if (!transitionType) return
                if (!arr.includes(transitionType)) {
                    api.shapeModifyPrototypeActionTransitionType(this.page, __shape, id, PrototypeTransitionType.INSTANTTRANSITION)
                }
                api.shapeModifyPrototypeActionTargetNodeID(this.page, __shape, id, undefined)
            }
            if (nav === PrototypeNavigationType.OVERLAY || nav === PrototypeNavigationType.SWAP || nav === PrototypeNavigationType.NAVIGATE) {
                const arr = [
                    PrototypeTransitionType.INSTANTTRANSITION,
                    PrototypeTransitionType.DISSOLVE,
                    PrototypeTransitionType.MOVEFROMLEFT,
                    PrototypeTransitionType.MOVEFROMRIGHT,
                    PrototypeTransitionType.MOVEFROMTOP,
                    PrototypeTransitionType.MOVEFROMBOTTOM
                ]
                if (!transitionType) return
                if (!arr.includes(transitionType)) {
                    api.shapeModifyPrototypeActionTransitionType(this.page, __shape, id, PrototypeTransitionType.INSTANTTRANSITION)
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeActionTargetNodeID(shape: ShapeView, id: string, value: string) {
        try {
            const api = this.__repo.start('setPrototypeActionTargetNodeID');
            const __shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeActionTargetNodeID(this.page, __shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeActionTransitionType(shape: ShapeView, id: string, value: PrototypeTransitionType) {
        try {
            const api = this.__repo.start('setPrototypeActionTransitionType');
            const __shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeActionTransitionType(this.page, __shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeActionTransitionDuration(shape: ShapeView, id: string, value: number) {
        try {
            const api = this.__repo.start('setPrototypeActionTransitionDuration');
            const __shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeActionTransitionDuration(this.page, __shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeActionEasingType(shape: ShapeView, id: string, value: PrototypeEasingType, esfn: PrototypeEasingBezier) {
        try {
            const api = this.__repo.start('setPrototypeActionEasingType');
            const __shape = this.shape4protoActions(api, shape, id);
            const prototypeInteractions: BasicArray<PrototypeInteraction> | undefined = shape.prototypeInteractions;
            if (!prototypeInteractions) return;
            const action = prototypeInteractions?.find(i => i.id === id)?.actions;
            if (!action) return;
            api.shapeModifyPrototypeActionEasingType(this.page, __shape, id, value);
            let val = action.easingFunction
            if (value === PrototypeEasingType.CUSTOMCUBIC) {
                if (val) {
                    api.shapeModifyPrototypeActionEasingFunction(this.page, __shape, id, val)
                } else {
                    api.shapeModifyPrototypeActionEasingFunction(this.page, __shape, id, esfn)
                }
            } else {
                api.shapeModifyPrototypeActionEasingFunction(this.page, __shape, id, esfn)
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeActionConnectionURL(shape: ShapeView, id: string, value: string) {
        try {
            const api = this.__repo.start('setPrototypeActionConnectionURL');
            const __shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeActionConnectionURL(this.page, __shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeIsOpenNewTab(shape: ShapeView, id: string, value: boolean) {
        try {
            const api = this.__repo.start('setPrototypeIsOpenNewTab');
            const __shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeIsOpenNewTab(this.page, __shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeActionOpenUrlInNewTab(shape: ShapeView, id: string, value: boolean) {
        try {
            const api = this.__repo.start('setPrototypeActionOpenUrlInNewTab');
            const __shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeActionOpenUrlInNewTab(this.page, __shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeActionEasingFunction(shape: ShapeView, id: string, value: PrototypeEasingBezier) {
        try {
            const api = this.__repo.start('setPrototypeActionEasingFunction');
            const __shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeActionEasingFunction(this.page, __shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeExtraScrollOffsetX(shape: ShapeView, id: string, value: number) {
        try {
            const api = this.__repo.start('setPrototypeExtraScrollOffsetX');
            const __shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeExtraScrollOffsetX(this.page, __shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setPrototypeExtraScrollOffsetY(shape: ShapeView, id: string, value: number) {
        try {
            const api = this.__repo.start('setPrototypeExtraScrollOffsetY');
            const __shape = this.shape4protoActions(api, shape, id);
            api.shapeModifyPrototypeExtraScrollOffsetY(this.page, __shape, id, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setOverlayPositionType(shape: ShapeView, value: OverlayPositionType) {
        try {
            const api = this.__repo.start('setOverlayPositionType');
            const __shape = adapt2Shape(shape);
            api.shapeModifyOverlayPositionType(this.page, __shape, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setOverlayPositionTypeMarginTop(shape: ShapeView, value: number) {
        try {
            const api = this.__repo.start('setOverlayPositionTypeMarginTop');
            const __shape = adapt2Shape(shape);
            api.shapeModifyOverlayPositionTypeMarginTop(this.page, __shape, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setOverlayPositionTypeMarginBottom(shape: ShapeView, value: number) {
        try {
            const api = this.__repo.start('setOverlayPositionTypeMarginBottom');
            const __shape = adapt2Shape(shape);
            api.shapeModifyOverlayPositionTypeMarginBottom(this.page, __shape, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setOverlayPositionTypeMarginLeft(shape: ShapeView, value: number) {
        try {
            const api = this.__repo.start('setOverlayPositionTypeMarginLeft');
            const __shape = adapt2Shape(shape);
            api.shapeModifyOverlayPositionTypeMarginLeft(this.page, __shape, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setOverlayPositionTypeMarginRight(shape: ShapeView, value: number) {
        try {
            const api = this.__repo.start('setOverlayPositionTypeMarginRight');
            const __shape = adapt2Shape(shape);
            api.shapeModifyOverlayPositionTypeMarginRight(this.page, __shape, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setOverlayBackgroundInteraction(shape: ShapeView, value: OverlayBackgroundInteraction) {
        try {
            const api = this.__repo.start('setOverlayBackgroundInteraction');
            const __shape = adapt2Shape(shape);
            api.shapeModifyOverlayBackgroundInteraction(this.page, __shape, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setOverlayBackgroundAppearance(shape: ShapeView, value?: OverlayBackgroundAppearance) {
        try {
            const api = this.__repo.start('setOverlayBackgroundAppearance');
            const __shape = adapt2Shape(shape);
            api.shapeModifyOverlayBackgroundAppearance(this.page, __shape, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setScrollDirection(shape: ShapeView, value: ScrollDirection) {
        try {
            const api = this.__repo.start('setScrollDirection');
            const __shape = adapt2Shape(shape);
            api.shapeModifyscrollDirection(this.page, __shape, value);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setScrollBehavior(shapes: ShapeView[], value: ScrollBehavior) {
        const api = this.__repo.start('setScrollBehavior');
        try {
            const parent = shapes[0].data.parent! as GroupShape;
            const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
            const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
            const targetIndex = fixed_index === -1 ? parent.childs.length - 1 : fixed_index - 1;
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const __shape = adapt2Shape(shape);
                const types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                if (!types.includes(__shape.parent!.type)) continue;
                // 找到固定位置
                const currentIndex = parent.indexOfChild(__shape);

                if (value === Fixed && __shape.scrollBehavior !== Fixed) {
                    api.shapeMove(this.page, parent, currentIndex, parent, targetIndex);
                } else if (value !== Fixed && __shape.scrollBehavior === Fixed) {
                    api.shapeMove(this.page, parent, currentIndex, parent, fixed_index);
                }

                api.shapeModifyScrollBehavior(this.page, __shape, value);
            }
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
                if (modify_variable_with_api(api, this.view, shape, VariableType.Visible, OverrideType.Visible, isVisible)) {
                    continue;
                }
                api.shapeModifyVisible(this.page, shape.data, isVisible);
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
                if (modify_variable_with_api(api, this.view, shape, VariableType.Lock, OverrideType.Lock, isLocked)) {
                    continue;
                }
                // ?
                // if (shape.type === ShapeType.Group) {
                //     shape = this.page.shapes.get(shape.id)
                // }
                // if (!shape) continue;
                api.shapeModifyLock(this.page, shape.data, isLocked);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setBackground(color: Color) {
        const api = this.__repo.start('setBackground');
        try {
            api.pageModifyBackground(this.__document, this.page.id, color);
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
                api.shapeModifyRadius(this.page, s as RectShape, lt, rt, rb, lb);
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
                    } else {
                        if (host instanceof BoolShape) {
                            const op = host.getBoolOp().op;
                            api.shapeModifyBoolOp(this.page, item, op);
                        }
                    }

                    api.shapeMove(this.page, parent, parent.indexOfChild(item), host as GroupShape, last);

                    translateTo(api, this.page, item, beforeXY.x, beforeXY.y);

                    if (after_remove(parent)) {
                        this.delete_inner(this.page, parent, api);
                    }
                    const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                    if (_types.includes(host.type)) {
                        const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                        const sortedArr = [...(host as GroupShape).childs].sort((a, b) => {
                            if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                                return -1;
                            } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                                return 1;
                            }
                            return 0;
                        });
                        for (let j = 0; j < sortedArr.length; j++) {
                            const s = sortedArr[j];
                            const currentIndex = (host as GroupShape).childs.indexOf(s);
                            if (currentIndex !== j) {
                                api.shapeMove(this.page, host as GroupShape, currentIndex, host as GroupShape, j);
                            }
                        }
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
                    } else {
                        if (host_parent instanceof BoolShape) {
                            const op = host_parent.getBoolOp().op;
                            api.shapeModifyBoolOp(this.page, item, op);
                        }
                    }

                    if (position === "upper") {
                        index++;
                    }

                    api.shapeMove(this.page, parent, parent.indexOfChild(item), host_parent, index);

                    const _temp_index = host_parent.indexOfChild(item);
                    if (_temp_index >= 0) {
                        previous_index = _temp_index;
                    }

                    translateTo(api, this.page, item, beforeXY.x, beforeXY.y);

                    if (after_remove(parent)) {
                        this.delete_inner(this.page, parent, api);
                    }
                    const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                    if (_types.includes(host_parent.type)) {
                        const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                        const sortedArr = [...host_parent.childs].sort((a, b) => {
                            if (a.scrollBehavior !== Fixed && b.scrollBehavior === Fixed) {
                                return -1;
                            } else if (a.scrollBehavior === Fixed && b.scrollBehavior !== Fixed) {
                                return 1;
                            }
                            return 0;
                        });
                        for (let j = 0; j < sortedArr.length; j++) {
                            const s = sortedArr[j];
                            const currentIndex = host_parent.childs.indexOf(s);
                            if (currentIndex !== j) {
                                api.shapeMove(this.page, host_parent, currentIndex, host_parent, j);
                            }
                        }
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
                const f = s.size, r = getHorizontalRadians({ x: 0, y: 0 }, { x: f.width, y: f.height });
                api.shapeModifyWH(this.page, s, v * Math.cos(r), v * Math.sin(r));
                const o2 = s.matrix2Root().computeCoord2(0, 0);
                translate(api, this.page, s, o1.x - o2.x, o1.y - o2.y);
            }
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    /**
     * @description 通过快捷取色器EyeDropper为多个图层按规则给定给一个颜色；
     * 规则：如果图层只存在填充，则将颜色给第一个填充，如果只存在边框，则将颜色给第一个边框，
     * 若同时有填充和边框，则将颜色给第一个填充，若填充和边框都没有，则创建一个填充，然后将颜色给第一个填充；
     * 另外如果是文字图层，则给文字颜色
     */
    modifyStyleByEyeDropper(shapes: ShapeView[], color: Color) {
        try {
            const api = this.__repo.start('modifyStyleByEyeDropper');
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) continue;
                const _color = new Color(color.alpha, color.red, color.green, color.blue);
                if (shape.type === ShapeType.Text) {
                    const __textShape = shapes[i] as any as TextShapeLike;
                    api.textModifyColor(page, __textShape, 0, __textShape.text.length, _color);
                    continue;
                }
                const style = shape.style;
                if (style.fills.length) {
                    const s = shape4fill(api, this.view, shapes[i]);
                    const fills = s instanceof Variable ? s.value : s.getFills();
                    api.setFillColor(fills[fills.length - 1], _color);
                    continue;
                }
                if (style.borders && style.borders.strokePaints.length) {
                    const s = shape4border(api, this.view, shapes[i]);
                    const fills = s instanceof Variable ? s.value.strokePaints : s.getFills();
                    api.setFillColor(fills[fills.length - 1], _color);
                    continue;
                }
                const s = shape4fill(api, this.view, shapes[i]);
                const fill = new Fill(new BasicArray(), uuid(), true, FillType.SolidColor, _color);
                const fills = s instanceof Variable ? s.value : s.getFills();
                api.addFillAt(fills, fill, 0);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    // 粘贴属性
    pasteProperties(shapes: ShapeView[], source: any) {
        try {
            const api = this.__repo.start('pasteProperties');
            const page = this.page;
            const fills = source.fills as Fill[];
            const fillsMask = source.fillsMask;
            const borders = source.borders as Border;
            const bordersMask = source.bordersMask;
            const borderFillsMask = source.borderFillsMask;
            const shadows = source.shadows as Shadow[];
            const shadowsMask = source.shadowsMask;
            const blur = source.blur;
            const blurMask = source.blurMask;
            const radiusMask = source.radiusMask;
            const radius = source.radius;
            const contextSetting = source.contextSetting;
            const mark = source.mark;
            const text = source.text;

            const document = this.__document;
            const ctx = new class {
                document = document;
                curPage = page.id;
                fmtVer = FMT_VER_latest;
            }

            const flatten = flattenShapes(shapes);
            for (const view of flatten) {
                const fillShape = shape4fill(api, this.view, view);
                const borderShape = shape4border(api, this.view, view);
                const v_fills = fillShape instanceof Shape ? fillShape.style.fills : fillShape.value as BasicArray<Fill>;
                const v_border = borderShape instanceof Shape ? borderShape.style.borders : borderShape.value as Border;
                api.deleteFills(v_fills, 0, v_fills.length);
                api.addFills(v_fills, fills.map(i => importFill(i, ctx)));
                api.deleteFills(v_border.strokePaints, 0, v_border.strokePaints.length);
                api.addFills(v_border.strokePaints, borders.strokePaints.map(i => importFill(i, ctx)));
                api.setBorderSide(v_border, borders.sideSetting);
                api.setBorderPosition(v_border, borders.position);

                const variableFill = getFillMaskVariable(api, this.view, view, fillsMask);
                const variableBorder = getBorderMaskVariable(api, this.view, view, bordersMask);
                const variableBorderFill = getBorderFillMaskVariable(api, this.view, view, borderFillsMask);
                if (variableFill) {
                    api.shapeModifyVariable(this.page, variableFill, fillsMask);
                } else {
                    api.modifyFillsMask(this.page, adapt2Shape(view), fillsMask);
                }
                if (variableBorder) {
                    api.shapeModifyVariable(this.page, variableBorder, bordersMask);
                } else {
                    api.modifyBorderMask(adapt2Shape(view).style, bordersMask);
                }
                if (variableBorderFill) {
                    api.shapeModifyVariable(this.page, variableBorderFill, borderFillsMask);
                } else {
                    api.setBorderFillMask(adapt2Shape(view).style, borderFillsMask);
                }
            }
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const shape = adapt2Shape(view);
                if (shape.isVirtualShape) continue;
                // shadows
                const shadowShadow = shape4shadow(api, this.view, view);
                const v_shadows = shadowShadow instanceof Shape ? shadowShadow.style.shadows : shadowShadow.value as BasicArray<Shadow>;
                api.deleteShadows(v_shadows, 0, v_shadows.length);
                api.addShadows(v_shadows, shadows.map((i) => importShadow(i)));
                const variableShadow = getShadowMaskVariable(api, this.view, view, shadowsMask);
                if (variableShadow) {
                    api.shapeModifyVariable(this.page, variableShadow, shadowsMask);
                } else {
                    api.modifyShadowsMask(this.page, adapt2Shape(view), shadowsMask);
                }
                // blur
                const blurShape = shape4blur(api, view, this.view);
                api.deleteBlur(shape.style);
                if (blur) {
                    if (blurShape instanceof Shape) {
                        api.addBlur(shape.style, importBlur(blur));
                    } else {
                        api.shapeModifyVariable(this.page, blurShape, importBlur(blur));
                    }
                }
                const variableBlur = getBlurMaskVariable(api, this.view, view, blurMask);
                if (variableBlur) {
                    api.shapeModifyVariable(this.page, variableBlur, blurMask);
                } else {
                    api.modifyBlurMask(this.page, adapt2Shape(view), blurMask);
                }
                // radius
                const variableRadius = getRadiusMaskVariable(api, this.__page, shapes[i], radiusMask);
                if (variableRadius) {
                    api.shapeModifyVariable(page, variableRadius, radiusMask);
                } else {
                    api.modifyRadiusMask(shape, radiusMask);
                }
                let needUpdateFrame = false;
                if (shape instanceof SymbolRefShape) {
                    const _shape = shape4cornerRadius(api, this.view, shapes[i] as SymbolRefView);
                    api.shapeModifyRadius2(page, _shape, radius[0], radius[1], radius[2], radius[3]);
                } else if (shape instanceof Artboard || shape instanceof SymbolShape) {
                    api.shapeModifyRadius2(page, shape, radius[0], radius[1], radius[2], radius[3]);
                } else if (shape instanceof PathShape || shape instanceof PathShape2) {
                    const isRect = shape.radiusType === RadiusType.Rect;
                    if (isRect) {
                        const points = shape.pathsegs[0].points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = radius[_i];
                            if (points[_i].radius === val || val < 0) continue;
                            api.modifyPointCornerRadius(page, shape, _i, val, 0);
                            needUpdateFrame = true;
                        }
                    } else {
                        shape.pathsegs.forEach((seg, index) => {
                            for (let _i = 0; _i < seg.points.length; _i++) {
                                if ((seg.points[_i].radius ?? 0) === radius[0]) continue;
                                api.modifyPointCornerRadius(page, shape, _i, radius[0], index);
                                needUpdateFrame = true;
                            }
                        });
                    }
                } else {
                    api.shapeModifyFixedRadius(page, shape as GroupShape | TextShape, radius[0]);
                }

                if (needUpdateFrame && !((shape instanceof StarShape || shape instanceof PolygonShape) && !shape.haveEdit)) {
                    update_frame_by_points(api, this.page, shape as PathShape);
                }

                // contextSetting
                const csShape = shape4contextSettings(api, view, this.view);
                api.shapeModifyContextSettingsOpacity(page, csShape, contextSetting?.opacity ?? 1);
                api.shapeModifyContextSettingsBlendMode(page, csShape, contextSetting?.blenMode ?? types.BlendMode.Normal);
                // mark
                if (mark?.start) {
                    const __start = importMarkerType(mark.start);
                    api.shapeModifyStartMarkerType(page, shape, __start);
                }
                if (mark?.end) {
                    const __end = importMarkerType(mark.end);
                    api.shapeModifyEndMarkerType(page, shape, __end);
                }
                // text
                if (text && shape instanceof TextShape) {
                    const __text = importText(text);
                    const alpha = __text.paras[0]?.spans[0];
                    const len = shape.text.length;
                    const __view = view as TextShapeView;
                    let needFixFrame = false;
                    const attr = __text.attr;
                    if (attr) {
                        api.shapeModifyTextVerAlign(page, __view, attr.verAlign!); // 垂直位置
                        api.shapeModifyTextBehaviour(page, __view.text, attr.textBehaviour!); // 宽高表现
                    }
                    if (alpha) {
                        api.textModifyColor(page, __view, 0, len, alpha.color); // 字体颜色
                        api.textModifyFontName(page, __view, 0, len, alpha.fontName!); // 字体
                        api.textModifyFontSize(page, __view, 0, len, alpha.fontSize!); // 字号
                        api.textModifyItalic(page, __view, !!alpha.italic, 0, len); // 斜体
                        api.textModifyKerning(page, __view, alpha.kerning || 0, 0, len); // 字间距
                        api.textModifyUnderline(page, __view, alpha.underline, 0, len); // 下划线
                        api.textModifyStrikethrough(page, __view, alpha.strikethrough, 0, len); // 删除线
                        api.textModifyWeight(page, __view, alpha.weight!, 0, len); // 字重
                        api.textModifyHighlightColor(page, __view, 0, len, alpha.highlight); // 高亮底色
                        needFixFrame = true;
                    }

                    const alphaAttr = __text.paras[0]?.attr;
                    if (alphaAttr) {
                        api.textModifyParaSpacing(page, __view, alphaAttr.paraSpacing || 0, 0, len); // 段落间距
                        api.textModifyAutoLineHeight(page, __view, alphaAttr.autoLineHeight ?? true, 0, len)
                        api.textModifyMinLineHeight(page, __view, alphaAttr.minimumLineHeight!, 0, len); // 行高
                        api.textModifyMaxLineHeight(page, __view, alphaAttr.maximumLineHeight!, 0, len); // 行高
                        api.textModifyHorAlign(page, __view, alphaAttr.alignment!, 0, len); // 水平位置
                        needFixFrame = true;
                    }

                    needFixFrame && fixTextShapeFrameByLayout(api, page, __view);
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.error('pasteProperties:', error);
            this.__repo.rollback();
        }

        function flattenShapes(shapes: ShapeView[]): ShapeView[] {
            return shapes.reduce((result: any, item: ShapeView) => {
                if (item.type === ShapeType.Group) {
                    const childs = (item).childs as ShapeView[];
                    if (Array.isArray(childs)) {
                        return result.concat(flattenShapes(childs));
                    }
                } else {
                    return result.concat(item);
                }
            }, []);
        }
    }

    /**
     * @description 轮廓化图层
     */
    outlineShapes(shapes: ShapeView[], suffix?: string) {
        try {
            const document = this.__document;
            const page = this.page;
            const ids: string[] = [];
            const api = this.__repo.start('outlineShapes', (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = ids;
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });
            const __flatten = (shapes: ShapeView[]) => {
                const res: ShapeView[] = [];
                for (const view of shapes) {
                    if (view instanceof TableView) continue;
                    if (view instanceof CutoutShapeView) continue;
                    if (view.type === ShapeType.Group || view instanceof ArtboardView || view instanceof SymbolView) {
                        res.push(...__flatten((view as GroupShapeView).childs));
                        continue;
                    }
                    res.push(view)
                }
                return res;
            }
            const __shapes = __flatten(shapes);

            for (const view of __shapes) {
                if (view instanceof ContactLineView) continue;
                if (view instanceof TextShapeView) {
                    const shape = adapt2Shape(view) as TextShape;
                    const path = view.getTextPath();
                    const copyStyle = findUsableFillStyle(view);
                    const style: Style = this.cloneStyle(copyStyle);
                    const mainColor = shape.text.paras[0]?.spans[0]?.color;
                    if (mainColor) {
                        const len = style.fills.length;
                        style.fills.push(new Fill([len] as BasicArray<number>, uuid(), true, FillType.SolidColor, mainColor));
                    }
                    let pathShape = newPathShape(view.name, view.frame, path, this.__document.stylesMgr, style);
                    pathShape.transform = shape.transform.clone();
                    pathShape.mask = shape.mask;
                    pathShape.resizingConstraint = shape.resizingConstraint;
                    pathShape.constrainerProportions = shape.constrainerProportions;
                    pathShape.scrollBehavior = shape.scrollBehavior;
                    const parent = shape.parent as GroupShape;
                    const index = parent.indexOfChild(shape);
                    api.shapeDelete(document, page, parent, index);
                    pathShape = api.shapeInsert(document, page, parent, pathShape, index) as PathShape;
                    update_frame_by_points(api, page, pathShape);
                    ids.push(pathShape.id);
                } else {
                    const borders = view.getBorder();
                    const shape = adapt2Shape(view);
                    if (!borders || !borders.strokePaints.length) {
                        if ((shape instanceof StarShape || shape instanceof PolygonShape) && !shape.haveEdit) {
                            update_frame_by_points(api, page, shape);
                            api.shapeEditPoints(page, shape, true);
                            ids.push(shape.id);
                        }
                        continue;
                    }

                    const parent = shape.parent as GroupShape;
                    const border2shape = (border: Border) => {
                        const copyStyle = findUsableFillStyle(view);
                        const style: Style = this.cloneStyle(copyStyle);
                        for (let i = 0; i < border.strokePaints.length; i++) {
                            const strokePaint = border.strokePaints[i];
                            const fill = new Fill([0] as BasicArray<number>, uuid(), true, strokePaint.fillType, strokePaint.color);
                            fill.gradient = strokePaint.gradient;
                            if (fill.fillType === FillType.Pattern) fill.fillType = FillType.SolidColor;
                            style.fills = new BasicArray<Fill>(fill);
                        }
                        const path = stroke(view);
                        let pathshape = newPathShape(view.name + suffix, view.frame, path, this.__document.stylesMgr, style);
                        pathshape.transform = shape.transform.clone();
                        pathshape.mask = shape.mask;
                        pathshape.resizingConstraint = shape.resizingConstraint;
                        pathshape.scrollBehavior = shape.scrollBehavior;
                        const index = parent.indexOfChild(shape);
                        pathshape = api.shapeInsert(document, page, parent, pathshape, index + 1) as PathShape;
                        update_frame_by_points(api, page, pathshape);
                        ids.push(pathshape.id);
                    }
                    border2shape(borders);
                    if (shape.style.fills.length) {
                        api.deleteStrokePaints(page, shape, 0, borders.strokePaints.length);
                        ids.push(shape.id);
                        if (shape instanceof PathShape) update_frame_by_points(api, page, shape);
                    } else {
                        api.shapeDelete(document, page, parent, parent.indexOfChild(shape));
                    }
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    insertImages(images: {
        pack: ImagePack | SVGParseResult;
        transform: Transform;
        targetEnv: GroupShapeView;
    }[], fixed: boolean) {
        try {
            const ids: string[] = [];
            const imageShapes: { shape: Shape, upload: UploadAssets[] }[] = [];
            const api = this.__repo.start('insertImagesToPage', (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = ids;
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });
            const document = this.__document;
            const page = this.page;
            for (const item of images) {
                const parent = adapt2Shape(item.targetEnv) as GroupShape;
                if ((item.pack as ImagePack).size) {
                    const { size, name, buff, base64 } = item.pack as ImagePack;
                    const format = getFormatFromBase64(base64);
                    const ref = `${v4()}.${format}`;
                    document.mediasMgr.add(ref, { buff, base64 });
                    const reg = new RegExp(`.${format}|.jpg$`, 'img');
                    const frame = new ShapeFrame(0, 0, size.width, size.height);
                    const shape = newImageFillShape(name.replace(reg, '') || 'image', frame, document.mediasMgr, size, document.stylesMgr, ref);
                    shape.transform = item.transform;
                    if (fixed) shape.constrainerProportions = true;
                    const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                    let targetIndex = parent.childs.length;
                    if (_types.includes(parent.type)) {
                        const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                        const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
                        targetIndex = fixed_index === -1 ? parent.childs.length : fixed_index;
                    }
                    const __s = api.shapeInsert(document, page, parent, shape, targetIndex);
                    if (__s) {
                        ids.push(__s.id);
                        imageShapes.push({ shape: __s, upload: [{ ref, buff, base64 }] });
                    }
                } else {
                    const shape = (item.pack as SVGParseResult).shape;
                    shape.transform = item.transform;
                    if (fixed) shape.constrainerProportions = true;
                    const _types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                    let targetIndex = parent.childs.length;
                    if (_types.includes(parent.type)) {
                        const Fixed = ScrollBehavior.FIXEDWHENCHILDOFSCROLLINGFRAME;
                        const fixed_index = parent.childs.findIndex(s => s.scrollBehavior === Fixed);
                        targetIndex = fixed_index === -1 ? parent.childs.length : fixed_index;
                    }
                    const __s = api.shapeInsert(document, page, parent, shape, targetIndex);
                    if (__s) {
                        ids.push(__s.id);
                        const upload: UploadAssets[] = [];
                        (item.pack as SVGParseResult).mediaResourceMgr.forEach((v, k) => {
                            upload.push({ ref: k, buff: v.buff, base64: v.base64 });
                        })
                        imageShapes.push({ shape: __s, upload });
                    }
                }
            }
            this.__repo.commit();
            return imageShapes;
        } catch (e) {
            this.__repo.rollback();
            console.error('insertImagesToPage:', e);
            return false;
        }
    }

    uniformScale(units: UniformScaleUnit[], ratio: number) {
        try {
            const api = this.__repo.start('uniformScale');
            uniformScale(api, this.page, units, ratio);
            this.__repo.commit();
        } catch (e) {
            this.__repo.rollback();
            console.error(e);
        }
    }

    modifyShapesStartingAngle(shapes: ShapeView[], value: number) {
        try {
            const api = this.__repo.start('modifyShapesStartAngle');
            modifyStartingAngle(api, this.page, shapes, value);
            this.__repo.commit();
        } catch (e) {
            this.__repo.rollback();
            console.error(e);
        }
    }

    modifyShapesSweep(shapes: ShapeView[], value: number) {
        try {
            const api = this.__repo.start('modifyShapesSweep');
            modifySweep(api, this.page, shapes, value);
            this.__repo.commit();
        } catch (e) {
            this.__repo.rollback();
            console.error(e);
        }
    }

    modifyShapesRadius(shapes: ShapeView[], value: number) {
        try {
            const api = this.__repo.start('modifyShapesRadius');
            modifyRadius(api, this.page, shapes, value);
            this.__repo.commit();
        } catch (e) {
            this.__repo.rollback();
            console.error(e);
        }
    }

    modifyContainersFrameMaskStatus(shapes: ShapeView[], value: boolean) {
        try {
            const api = this.__repo.start('modifyContainersFrameMaskStatus');
            const page = this.page;
            for (const view of shapes) {
                if (modify_variable_with_api(api, this.__page, view, VariableType.FrameMaskDisabled, OverrideType.FrameMaskDisabled, value)) {
                    continue;
                }
                if (view.isVirtualShape) continue;
                if (view instanceof ArtboardView || view instanceof SymbolView || view instanceof SymbolRefView) {
                    const shape = adapt2Shape(view);
                    api.modifyContainersFrameMaskStatus(page, shape, value);
                }
            }
            this.__repo.commit();
        } catch (e) {
            this.__repo.rollback();
            throw e;
        }
    }

    editor4Shape(shape: ShapeView): ShapeEditor {
        return new ShapeEditor(shape, this.view, this.__repo, this.__document);
    }

    editor4TextShape(shape: TextShapeView | TableCellView): TextShapeEditor {
        return new TextShapeEditor(shape, this.view, this.__repo, this.__document);
    }

    editor4Table(shape: TableView): TableEditor {
        return new TableEditor(shape, this.view, this.__repo, this.__document);
    }

    tidyUpShapesLayout(shape_rows: ShapeView[][], hor: number, ver: number, dir: boolean, algin: TidyUpAlign) {
        const api = this.__repo.start('tidyUpShapesLayout');
        try {
            tidyUpLayout(this.page, api, shape_rows, hor, ver, dir, algin);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    deleteAutoLayout(shapes: ShapeView[]) {
        const api = this.__repo.start("deleteAutoLayout");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const childs = shapes[i].childs;
                const view = shapes[i];
                for (let i = 0; i < childs.length; i++) {
                    const child = childs[i];
                    api.shapeModifyXY(this.page, adapt2Shape(child), child.transform.translateX, child.transform.translateY);
                }
                const w = view.frame.width;
                const h = view.frame.height;
                expandTo(api, this.__document, this.page, adapt2Shape(view), w, h);
                const shape = shape4Autolayout(api, shapes[i], this.view);
                api.shapeAutoLayout(this.page, shape, undefined);
            }
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    modifyAutoLayoutPadding(shapes: ShapeView[], padding: number, direction: PaddingDir) {
        const api = this.__repo.start("modifyAutoLayoutPadding");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shape4Autolayout(api, shapes[i], this.view);
                api.shapeModifyAutoLayoutPadding(this.page, shape, Math.max(padding, 0), direction);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    modifyAutoLayoutHorPadding(shapes: ShapeView[], hor: number, right: number) {
        const api = this.__repo.start("modifyAutoLayoutHorPadding");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shape4Autolayout(api, shapes[i], this.view);
                api.shapeModifyAutoLayoutHorPadding(this.page, shape, Math.max(hor, 0), Math.max(right, 0));
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    modifyAutoLayoutVerPadding(shapes: ShapeView[], ver: number, bottom: number) {
        const api = this.__repo.start("modifyAutoLayoutVerPadding");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shape4Autolayout(api, shapes[i], this.view);
                api.shapeModifyAutoLayoutVerPadding(this.page, shape, Math.max(ver, 0), Math.max(bottom, 0));
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    modifyAutoLayoutDispersed(shapes: ShapeView[], wrap: types.StackWrap, mode: types.StackMode) {
        const api = this.__repo.start("modifyAutoLayoutDispersed");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shape4Autolayout(api, shapes[i], this.view);
                api.shapeModifyAutoLayoutWrap(this.page, shape, wrap);
                api.shapeModifyAutoLayoutMode(this.page, shape, mode);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    modifyAutoLayoutSpace(shapes: ShapeView[], space: number, direction: PaddingDir) {
        const api = this.__repo.start("modifyAutoLayoutSpace");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shape4Autolayout(api, shapes[i], this.view);
                api.shapeModifyAutoLayoutSpace(this.page, shape, space, direction);
                api.shapeModifyAutoLayoutGapSizing(this.page, shape, types.StackSizing.Fixed, direction);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    modifyAutoLayoutAlignItems(shapes: ShapeView[], primary: types.StackAlign, counter: types.StackAlign) {
        const api = this.__repo.start("modifyAutoLayoutAlignItems");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shape4Autolayout(api, shapes[i], this.view);
                api.shapeModifyAutoLayoutAlignItems(this.page, shape, primary, counter);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    modifyAutoLayoutSizing(shapes: ShapeView[], sizing: types.StackSizing, direction: PaddingDir) {
        const api = this.__repo.start("modifyAutoLayoutSizing");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const view = shapes[i];
                const shape = shape4Autolayout(api, view, this.view);
                api.shapeModifyAutoLayoutSizing(this.page, shape, sizing, direction);
                api.shapeModifyAutoLayoutGapSizing(this.page, shape, types.StackSizing.Fixed, direction);
                if (sizing === types.StackSizing.Fixed) {
                    const w = view.frame.width;
                    const h = view.frame.height;
                    expandTo(api, this.__document, this.page, adapt2Shape(view), w, h);
                }
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    modifyAutoLayoutGapSizing(shapes: ShapeView[], sizing: types.StackSizing, direction: PaddingDir) {
        const api = this.__repo.start("modifyAutoLayoutGapSizing");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const view = shapes[i];
                const shape = shape4Autolayout(api, view, this.view);
                const w = view.frame.width;
                const h = view.frame.height;
                expandTo(api, this.__document, this.page, adapt2Shape(view), w, h);
                api.shapeModifyAutoLayoutGapSizing(this.page, shape, sizing, direction);
                api.shapeModifyAutoLayoutSizing(this.page, shape, types.StackSizing.Fixed, direction);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    modifyAutoLayoutZIndex(shapes: ShapeView[], stack: boolean) {
        const api = this.__repo.start("modifyAutoLayoutZIndex");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shape4Autolayout(api, shapes[i], this.view);
                api.shapeModifyAutoLayoutStackZIndex(this.page, shape, stack);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    modifyAutoLayoutStroke(shapes: ShapeView[], included: boolean) {
        const api = this.__repo.start("modifyAutoLayoutStroke");
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shape4Autolayout(api, shapes[i], this.view);
                api.shapeModifyAutoLayoutStroke(this.page, shape, included);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    // 容器自适应大小
    adapt(views: ShapeView[]) {
        try {
            const api = this.__repo.start('adapt');
            for (const view of views) {
                if (!(view instanceof ArtboardView)) continue;
                adapt_for_artboard(api, this.page, view);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }
}

function getFillMaskVariable(api: Operator, page: PageView, view: ShapeView, value: any) {
    return _ov(VariableType.FillsMask, OverrideType.FillsMask, () => value, view, page, api);
}

function getBorderFillMaskVariable(api: Operator, page: PageView, view: ShapeView, value: any) {
    return _ov(VariableType.BorderFillsMask, OverrideType.BorderFillsMask, () => value, view, page, api);
}

function getBorderMaskVariable(api: Operator, page: PageView, view: ShapeView, value: any) {
    return _ov(VariableType.BordersMask, OverrideType.BordersMask, () => value, view, page, api);
}

function getRadiusMaskVariable(api: Operator, page: PageView, view: ShapeView, value: any) {
    return _ov(VariableType.RadiusMask, OverrideType.RadiusMask, () => value, view, page, api);
}

function getShadowMaskVariable(api: Operator, page: PageView, view: ShapeView, value: any) {
    return _ov(VariableType.ShadowsMask, OverrideType.ShadowsMask, () => value, view, page, api);
}

function getBlurMaskVariable(api: Operator, page: PageView, view: ShapeView, value: any) {
    return _ov(VariableType.BlursMask, OverrideType.BlursMask, () => value, view, page, api);
}