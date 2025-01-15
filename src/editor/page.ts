import {
    Artboard,
    BasicArray,
    BoolOp,
    BoolShape,
    Border,
    BorderMaskType,
    BorderPosition,
    Color, ContactShape,
    Document,
    ExportFileFormat,
    ExportFormatNameingScheme,
    Fill,
    FillMask,
    FillType,
    Gradient,
    GradientType,
    GroupShape,
    makeShapeTransform1By2,
    makeShapeTransform2By1,
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
    ShadowPosition,
    Shape,
    ShapeFrame,
    ShapeType,
    SideType,
    StarShape,
    Stop,
    StrokePaint,
    Style,
    SymbolRefShape,
    SymbolShape,
    SymbolUnionShape,
    Text,
    TextShape,
    Transform,
    updateShapeTransform1By2,
    Variable,
    VariableType
} from "../data";
import { ShapeEditor } from "./shape";
import * as types from "../data/typesdefine";
import {
    newArrowShape,
    newArtboard,
    newAutoLayoutArtboard,
    newBoolShape,
    newGroupShape,
    newImageFillShape,
    newLineShape,
    newOvalShape,
    newPathShape,
    newRectShape,
    newSolidColorFill,
    newSymbolRefShape,
    newSymbolShape
} from "./creator";
import { expand, translate, translateTo } from "./frame";
import { uuid } from "../basic/uuid";
import { TextShapeEditor } from "./textshape";
import { set_childs_id, transform_data } from "../io/cilpboard";
import { deleteEmptyGroupShape, expandBounds, group, ungroup } from "./group";
import { Matrix } from "../basic/matrix";
import {
    IImportContext,
    importArtboard,
    importAutoLayout,
    importBlur,
    importBorder,
    importContextSettings,
    importCornerRadius,
    importFill,
    importGradient,
    importMarkerType,
    importOverlayBackgroundAppearance,
    importOverlayPosition,
    importPrototypeInterAction,
    importPrototypeStartingPoint,
    importShadow,
    importStop,
    importStyle,
    importSymbolShape,
    importText,
    importTransform
} from "../data/baseimport";
import { gPal } from "../basic/pal";
import { TableEditor } from "./table";
import { exportArtboard, exportGradient, exportStop, exportSymbolShape, exportVariable } from "../data/baseexport";
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
    shape4shadow, shape4contextSettings, shape4blur, RefUnbind
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
    Point2D,
    PrototypeActions,
    PrototypeConnectionType,
    PrototypeEasingBezier,
    PrototypeEasingType,
    PrototypeEvent,
    PrototypeEvents,
    PrototypeInterAction,
    PrototypeNavigationType,
    PrototypeStartingPoint,
    PrototypeTransitionType,
    ScrollBehavior,
    ScrollDirection,
    Shadow
} from "../data/baseclasses";
import {
    border2path,
    calculateInnerAnglePosition,
    getPolygonPoints,
    getPolygonVertices,
    update_frame_by_points
} from "./utils/path";
import { modify_shapes_height, modify_shapes_width } from "./utils/common";
import { CoopRepository, ISave4Restore, LocalCmd, SelectionState } from "../coop";
import { Api, TextShapeLike } from "../coop/recordapi";
import { unable_to_migrate } from "./utils/migrate";
import {
    adapt2Shape,
    ArtboardView,
    BoolShapeView,
    CutoutShapeView,
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
import { Transform as Transform2 } from "../basic/transform";
import {
    getAutoLayoutShapes,
    initAutoLayout,
    layoutShapesOrder,
    layoutSpacing,
    modifyAutoLayout,
    TidyUpAlgin,
    tidyUpLayout
} from "./utils/auto_layout";

import { getFormatFromBase64 } from "../basic/utils";
import { modifyRadius, modifyStartingAngle, modifySweep, uniformScale, UniformScaleUnit } from "./asyncapi";
import { Path } from "@kcdesign/path";
import { assign } from "./asyncapi";
import { prepareVar } from "./symbol_utils";

// 用于批量操作的单个操作类型
export interface PositionAdjust { // 涉及属性：frame.x、frame.y
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
    buff: Uint8Array
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

export function getHorizontalAngle(A: {
    x: number,
    y: number
}, B: {
    x: number,
    y: number
}) {
    const deltaX = B.x - A.x;
    const deltaY = B.y - A.y;
    const angleInDegrees = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    const angle = (angleInDegrees + 360) % 360;
    return angle;
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
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(this.page, api, parent);
            }
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
        const parents = getAutoLayoutShapes(shapes);
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
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(this.page, api, parent);
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
    create_artboard(shapes: ShapeView[], artboardname: string): false | Artboard {
        if (shapes.length === 0) return false;
        if (shapes.find((v) => !v.parent)) return false;
        const fshape = adapt2Shape(shapes[0]);
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
            const saveidx = savep.indexOfChild(adapt2Shape(shapes[0]));
            // 1、新建一个GroupShape
            artboard = group(this.__document, this.page, shapes.map(s => adapt2Shape(s)), artboard, savep, saveidx, api) as Artboard;
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(this.page, api, parent);
            }
            this.__repo.commit();
            return artboard;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    dissolution_artboard(shapes: ArtboardView[]): false | Shape[] {
        const childrens: Shape[] = [];
        const api = this.__repo.start("dissolution_artboard", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
            const state = {} as SelectionState;
            if (!isUndo) state.shapes = childrens.map(c => c.id);
            else state.shapes = cmd.saveselection?.shapes || [];
            selection.restore(state);
        });
        try {
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                if (shape.isVirtualShape) continue;
                if (!shape.parent) continue;
                const childs = ungroup(this.__document, this.page, adapt2Shape(shape) as Artboard, api);
                childrens.push(...childs);
            }
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(this.page, api, parent);
            }
            this.__repo.commit();
            return childrens.length > 0 ? childrens : false;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    create_autolayout_artboard(shapes: ShapeView[], artboardname: string): false | Artboard {
        if (shapes.length === 0) return false;
        if (shapes.find((v) => !v.parent)) return false;
        const fshape = adapt2Shape(shapes[0]);
        const savep = fshape.parent as GroupShape;
        const shapes_rows = layoutShapesOrder(shapes.map(s => adapt2Shape(s)), false);
        const { hor, ver } = layoutSpacing(shapes_rows);
        const ver_auto = shapes_rows.length === 1 || shapes_rows.every(s => s.length === 1) ? types.StackSizing.Auto : types.StackSizing.Fixed;
        const layoutInfo = new AutoLayout(hor, ver, 0, 0, 0, 0, ver_auto);
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
            artboard = group(this.__document, this.page, shapes.map(s => adapt2Shape(s)), artboard, savep, saveidx, api) as Artboard;
            const frame = initAutoLayout(this.page, api, artboard, shapes_rows);
            if (frame) {
                api.shapeModifyWH(this.page, artboard, frame.width, frame.height);
            }
            this.__repo.commit();
            return artboard;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
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
        if (!shapes.length) return console.log('invalid data');
        try {
            const api = this.__repo.start("modifyShapesContextSettingBlendMode");
            for (let i = 0, l = shapes.length; i < l; i++) {
                const item = shapes[i];
                api.shapeModifyContextSettingsBlendMode(this.page, item, blendMode);
            }
            this.__repo.commit();
            return true;
        } catch (e) {
            console.log(e);
            this.__repo.rollback();
            return false;
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
            const strokePaints = new BasicArray<StrokePaint>();
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
            gshape.transform = makeShapeTransform1By2(makeShapeTransform2By1(savep.matrix2Root()));

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
    makeSymbol(document: Document, shapes: Shape[], name?: string) {
        try {
            if (!shapes.length) return;

            const shape0 = shapes[0];
            const frame = shape0.frame2Parent();

            const replace = shapes.length === 1
                && ((shape0 instanceof GroupShape && !(shape0 instanceof BoolShape)) || shape0 instanceof Artboard);

            const style = replace ? importStyle((shape0.style)) : undefined;

            const symbolShape = newSymbolShape(replace ? shape0.name : (name ?? shape0.name), frame, style);

            if (replace && shape0 instanceof Artboard) {
                if (shape0.cornerRadius) symbolShape.cornerRadius = importCornerRadius(shape0.cornerRadius);
                if (shape0.prototypeInteractions) {
                    symbolShape.prototypeInteractions = new BasicArray();
                    shape0.prototypeInteractions.forEach(v => {
                        symbolShape.prototypeInteractions?.push(importPrototypeInterAction(v));
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

                for (let i = 0; i < shapes.length; i++) {
                    const __shape = shapes[i];

                    const old_rc = __shape.resizingConstraint === undefined
                        ? ResizingConstraints2.Mask
                        : __shape.resizingConstraint;

                    const new_rc = ResizingConstraints2.setToScaleByHeight(ResizingConstraints2.setToScaleByWidth(old_rc));

                    api.shapeModifyResizingConstraint(page, __shape, new_rc);
                }
            }

            if (!sym) throw new Error('failed');

            const result = sym;
            document.symbolsMgr.add(result.id, result);

            const innerSymbols: Shape[] = [];

            function _find(group: GroupShape) {
                for (const child of group.childs) {
                    if (child instanceof SymbolShape || child instanceof SymbolUnionShape) {
                        innerSymbols.push(child);
                        continue;
                    }
                    if (child instanceof GroupShape) _find(child);
                }
            }

            _find(sym);

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
                    const ref = newSymbolRefShape(symbol.name, frame, refId, document.symbolsMgr);
                    if (ref) {
                        const rt = ref.transform;
                        const st = symbol.transform;
                        rt.m00 = st.m00;
                        rt.m01 = st.m01;
                        rt.m10 = st.m10;
                        rt.m11 = st.m11;
                        // ref.frameMaskDisabled = (symbol as SymbolShape).frameMaskDisabled;
                    }
                    const parent = symbol.parent as GroupShape;
                    api.shapeInsert(document, page, parent, ref, parent.indexOfChild(symbol));
                    const om = symbol.matrix2Root();
                    om.trans(offset, 0);
                    om.multiAtLeft(matrixToPage);

                    api.shapeMove(page, parent, parent.indexOfChild(symbol), page, page.childs.length);
                    api.shapeModifyTransform(page, symbol, makeShapeTransform1By2(makeShapeTransform2By1(om)));
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
            parent: Shape,
            self: Shape,
            insertIndex: number
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
            ref.transform.m00 = sym.transform.m00;
            ref.transform.m01 = sym.transform.m01;
            ref.transform.m10 = sym.transform.m10;
            ref.transform.m11 = sym.transform.m11;
            // ref.frameMaskDisabled = sym.frameMaskDisabled;
        }
        return ref;
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
        let pathstr = "";
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

            if (pathstr.length > 0) {
                pathstr = gPal.boolop.union(pathstr, shapepath.toString())
            } else {
                pathstr = shapepath.toString();
            }
        })
        const path = Path.fromSVGString(pathstr);
        path.translate(-frame.x, -frame.y);

        let pathShape = newPathShape(name, frame, path, style);

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
            let pathShape = newPathShape(shape.name, frame, path, style);
            pathShape.fixedRadius = shape.fixedRadius;
            pathShape.transform = makeShapeTransform1By2(new Transform2() // shape图层坐标系
                .setTranslate(ColVector3D.FromXY(x, y)) // pathShape图层坐标系
                .addTransform(makeShapeTransform2By1(shape.transform))) // pathShape在父级坐标系下的transform;

            const index = parent.indexOfChild(adapt2Shape(shape));
            const api = this.__repo.start("flattenBoolShape", (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => {
                const state = {} as SelectionState;
                if (!isUndo) state.shapes = [pathShape.id];
                else state.shapes = cmd.saveselection?.shapes || [];
                selection.restore(state);
            });

            api.shapeDelete(this.__document, this.page, parent, index);
            pathShape = api.shapeInsert(this.__document, this.page, parent, pathShape, index) as PathShape;

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

        let pathShape = newPathShape(shape.name, shape.frame, path, style2);
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
            this.__repo.commit();
            return pathShape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
            return false;
        }
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
        const parents = getAutoLayoutShapes(shapes);
        for (let i = 0; i < parents.length; i++) {
            const parent = parents[i];
            modifyAutoLayout(this.page, api, parent);
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
            const transform2 = makeShapeTransform2By1(shape.transform);
            transform2.translate(new ColVector3D([-xy.x, -xy.y, 0]))
            updateShapeTransform1By2(shape.transform, transform2);
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
                    const transform2 = makeShapeTransform2By1(shape.transform);
                    transform2.translate(new ColVector3D([-xy.x, -xy.y, 0]));
                    updateShapeTransform1By2(shape.transform, transform2);
                }
                const s = api.shapeInsert(document, page, parent, shape, action.index ?? parent.childs.length);
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

    shapesModifyRadius(shapes: ShapeView[], values: number[]) {
        try {
            const api = this.__repo.start("shapesModifyRadius");
            const page = this.page;

            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                const isRect = shape.radiusType === RadiusType.Rect;

                let needUpdateFrame = false;

                if (isRect) {
                    if (values.length !== 4) {
                        values = [values[0], values[0], values[0], values[0]];
                    }

                    const [lt, rt, rb, lb] = values;

                    if (shape instanceof SymbolRefShape) {
                        const _shape = shape4cornerRadius(api, this.view, shapes[i] as SymbolRefView);
                        api.shapeModifyRadius2(page, _shape, lt, rt, rb, lb);
                    }

                    if (shape.isVirtualShape) continue;

                    if (shape instanceof PathShape) {
                        const points = shape.pathsegs[0].points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) continue;

                            api.modifyPointCornerRadius(page, shape, _i, val, 0);
                        }
                        needUpdateFrame = true;
                    } else if (shape instanceof PathShape2) {
                        const points = shape.pathsegs[0].points;
                        for (let _i = 0; _i < 4; _i++) {
                            const val = values[_i];
                            if (points[_i].radius === val || val < 0) {
                                continue;
                            }

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
                    } else if (shape instanceof PathShape) {
                        shape.pathsegs.forEach((seg, index) => {
                            for (let _i = 0; _i < seg.points.length; _i++) {
                                if (seg.points[_i].radius === values[0]) {
                                    continue;
                                }

                                api.modifyPointCornerRadius(page, shape, _i, values[0], index);
                            }
                        });
                        needUpdateFrame = true;
                    } else if (shape instanceof PathShape2) {
                        shape.pathsegs.forEach((seg, index) => {
                            for (let _i = 0; _i < seg.points.length; _i++) {
                                if (seg.points[_i].radius === values[0]) {
                                    continue;
                                }

                                api.modifyPointCornerRadius(page, shape, _i, values[0], index);
                            }
                        });
                        needUpdateFrame = true;
                    } else {
                        api.shapeModifyFixedRadius(page, shape as GroupShape | TextShape, values[0]);
                    }
                }

                if (needUpdateFrame) {
                    update_frame_by_points(api, this.page, shape);
                }
            }
            this.__repo.commit();
        } catch (error) {
            console.error('shapesModifyRadius', error);
            this.__repo.rollback();
        }
    }

    /**
     * @description 参数可选的创建并插入图形
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
            const transform2 = makeShapeTransform2By1(new_s.transform);
            transform2.translate(new ColVector3D([-xy.x, -xy.y, 0]))
            updateShapeTransform1By2(new_s.transform, transform2);
            if (rotation) {
                const transform2 = makeShapeTransform2By1(new_s.transform);
                transform2.setRotateZ((rotation % 360) / 180 * Math.PI);
                updateShapeTransform1By2(new_s.transform, transform2);
            }
            new_s = api.shapeInsert(this.__document, this.page, parent, new_s, index);
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
                const copy: Shape[] = i < 1 ? replacement : transform_data(document, this.page, replacement);
                for (let r_i = 0; r_i < len; r_i++) { // 逐个插入replacement中的图形
                    let r = copy[r_i];
                    r.id = uuid();
                    // lt_point与s.frame的xy重合后，用delta_xys中的相对位置计算replacement中每个图形的偏移
                    const transform2 = makeShapeTransform2By1(r.transform);
                    transform2.setTranslate(new ColVector3D([
                        save_frame.x + delta_xys[r_i].x,
                        save_frame.y + delta_xys[r_i].y,
                        0,
                    ]))
                    updateShapeTransform1By2(r.transform, transform2);
                    api.shapeInsert(this.__document, this.page, p, r, save_index);
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

    arrange(actions: PositionAdjust[]) {
        try {
            const api = this.__repo.start('arrange');
            const page = this.page;
            for (const action of actions) {
                const { target, transX, transY } = action;
                api.shapeModifyX(page, target, target.transform.translateX + transX);
                api.shapeModifyY(page, target, target.transform.translateY + transY);
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
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                shapes.push(action.target);
                api.shapeModifyX(page, adapt2Shape(action.target), action.x);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(page, api, parent);
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
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const action = actions[i];
                shapes.push(action.target);
                api.shapeModifyY(page, adapt2Shape(action.target), action.y);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(page, api, parent);
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
                const points = getPolygonPoints(counts, target.radius[0]);
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

    setShapesFrame(actions: FrameAdjust[]) {
        const api = this.__repo.start('setShapesFrame');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, widthExtend, heightExtend } = actions[i];
                expand(api, this.__document, this.page, target, widthExtend, heightExtend);
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
            const shapes: ShapeView[] = [];
            const api = this.__repo.start('setShapesRotate');
            for (const action of actions) {
                const { shape: shapeView, transform } = action;
                shapes.push(shapeView);
                const s = adapt2Shape(shapeView);
                api.shapeModifyRotate(this.page, s, transform);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(this.page, api, parent);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    shapesFlip(params: {
        shape: ShapeView,
        transform2: Transform2
    }[]) {
        try {
            const api = this.__repo.start('shapesFlip');
            const page = this.page;
            for (let i = 0; i < params.length; i++) {
                const { shape, transform2 } = params[i];
                api.shapeModifyTransform(page, adapt2Shape(shape), makeShapeTransform1By2(transform2 as Transform2));
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

    // 渐变
    //翻转
    reverseShapesGradient(actions: BatchAction4[]) {
        try {
            const api = this.__repo.start('reverseShapesGradient');
            for (let i = 0, l = actions.length; i < l; i++) {
                const { target, index, type } = actions[i];
                const arr = type === 'fills' ? target.getFills() : target.getBorders()?.strokePaints;
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
                const s = shape4fill(api, this.view, target);
                if (type === 'fills') {
                    api.setFillColor(this.page, s, index, new_stops[0].color as Color);
                } else {
                    api.setBorderColor(this.page, s, index, new_stops[0].color as Color);
                }
                const ng = importGradient(exportGradient(gradient));
                ng.stops = new_stops;
                const f = type === 'fills' ? api.setFillGradient.bind(api) : api.setBorderGradient.bind(api);
                f(this.page, s, index, ng);
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
                const arr = type === 'fills' ? target.getFills() : target.getBorders()?.strokePaints;
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
                const shape = shape4fill(api, this.view, target);
                f(this.page, shape, index, gradient);
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
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders()?.strokePaints;
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
                const shape = shape4fill(api, this.view, target);
                f(this.page, shape, index, new_gradient);
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
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders()?.strokePaints;
                if (!grad_type?.length) {
                    continue;
                }
                const gradient_container = grad_type[index];
                if (!gradient_container) {
                    continue;
                }
                const gradient = gradient_container.gradient;
                const s = shape4fill(api, this.view, target);
                if (gradient_container.fillType !== FillType.Gradient) {
                    type === 'fills' ? api.setFillType(this.page, s, index, FillType.Gradient) : api.setBorderFillType(this.page, s, index, FillType.Gradient);
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
                    f(this.page, s, index, new_gradient);
                } else {
                    const stops = new BasicArray<Stop>();
                    // const frame = target.frame;
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
                    f(this.page, s, index, new_gradient);
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
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders()?.strokePaints;
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
                const shape = shape4fill(api, this.view, target);
                if (type === 'fills') {
                    api.setFillColor(this.page, shape, index, new_gradient.stops[0].color as Color);
                } else {
                    api.setBorderColor(this.page, shape, index, new_gradient.stops[0].color as Color);
                }
                f(this.page, shape, index, new_gradient);
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
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders()?.strokePaints;
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
                f(this.page, shape, index, new_gradient);
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
                const grad_type = type === 'fills' ? target.getFills() : target.getBorders()?.strokePaints;
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
                const shape = shape4fill(api, this.view, target);
                f(this.page, shape, index, new_gradient);
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
                const s = shape4fill(api, this.view, target);
                api.setFillColor(this.page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesFillOpacity(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesFillOpacity');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4fill(api, this.view, target);
                api.setFillOpacity(this.page, s, index, value);
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
                const s = shape4fill(api, this.view, target);
                api.setFillEnable(this.page, s, index, value);
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
                const s = shape4fill(api, this.view, target);
                const fills = s instanceof Shape ? s.style.fills : s.value;
                api.setFillType(this.page, s, index, value);
                if (!fills[index].imageScaleMode) {
                    api.setFillScaleMode(this.page, s, index, types.ImageScaleMode.Fill);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesFillImageScaleMode(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesFillImageScaleMode');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4fill(api, this.view, target);
                api.setFillScaleMode(this.page, s, index, value);
                if (value === types.ImageScaleMode.Tile) {
                    const fills = s instanceof Shape ? s.style.fills : s.value;
                    if (!fills[index].scale) {
                        api.setFillImageScale(this.page, s, index, 0.5);
                    }
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesFillImageRef(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesFillImageRef');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4fill(api, this.view, target);
                api.setFillImageRef(this.__document, this.page, s, index, value.urlRef, value.imageMgr);
                api.setFillImageOriginWidth(this.page, s, index, value.origin.width);
                api.setFillImageOriginHeight(this.page, s, index, value.origin.height);
            }
            this.__repo.commit();
        } catch (error) {
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
            const page = this.page;
            const document = this.__document;
            for (const action of actions) {
                const { shape, ref, media, width, height } = action;
                const target = shape4fill(api, this.view, shape);
                const fills = target instanceof Shape ? target.style.fills : target;
                if (fills instanceof Variable) {
                    const index = fills.value.length - 1;
                    if (index < 0) continue;
                    if (!fills.value[index].imageScaleMode) {
                        api.setFillScaleMode(page, target, index, types.ImageScaleMode.Fill);
                    }
                    if (fills.value[index].fillType !== FillType.Pattern) {
                        api.setFillType(page, target, index, FillType.Pattern);
                    }
                    api.setFillImageRef(document, page, target, index, ref, media);
                    api.setFillImageOriginWidth(page, target, index, width);
                    api.setFillImageOriginHeight(page, target, index, height);
                } else {
                    const index = fills.length - 1;
                    if (index < 0) {
                        const fill = new Fill([0] as BasicArray<number>, uuid(), true, FillType.Pattern, new Color(1, 217, 217, 217));
                        fill.imageRef = ref;
                        fill.setImageMgr(document.mediasMgr);
                        fill.imageScaleMode = types.ImageScaleMode.Fill;
                        api.addFillAt(page, target, fill, 0);
                    } else {
                        if (fills[index].fillType !== FillType.Pattern) {
                            api.setFillType(page, target, index, FillType.Pattern);
                        }
                        api.setFillImageRef(document, page, target, index, ref, media);
                        api.setFillImageOriginWidth(page, target, index, width);
                        api.setFillImageOriginHeight(page, target, index, height);
                    }
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setShapesFillImageRotate(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesFillImageRotate');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4fill(api, this.view, target);
                api.setFillImageRotate(this.page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesFillImageScale(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesFillImageScale');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4fill(api, this.view, target);
                api.setFillImageScale(this.page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesFillEdit(shape: ShapeView, idx: number, edit: boolean) {
        const api = this.__repo.start('setShapesFillEdit');
        try {
            const s = shape4fill(api, this.view, shape);
            api.setFillEdit(this.page, s, idx, edit);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesFillFilter(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesFillFilter');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4fill(api, this.view, target);
                api.setFillImageFilter(this.page, s, index, value.key, value.value);
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
                const s = shape4fill(api, this.view, target);
                const l = s instanceof Shape ? s.style.fills.length : s.value.length;
                api.addFillAt(this.page, s, value, l);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesSetFillMask(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesSetFillMask");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.addfillmask(this.__document, this.page, adapt2Shape(target), value);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesDelFillMask(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesDelFillMask");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.deleteFills(this.page, adapt2Shape(target), 0, target.style.fills.length);
                api.addFills(this.page, adapt2Shape(target), value);
                api.delfillmask(this.__document, this.page, adapt2Shape(target));
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesDeleteFill(actions: BatchAction3[]) {
        const api = this.__repo.start('shapesDeleteFill');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index } = actions[i];
                const s = shape4fill(api, this.view, target);
                api.deleteFillAt(this.page, s, index);
                api.delfillmask(this.__document, this.page, adapt2Shape(target));
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesDelStyleFill(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesDelStyleFill");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.deleteFills(this.page, adapt2Shape(target), 0, target.style.fills.length);
                api.delfillmask(this.__document, this.page, adapt2Shape(target));
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesSetShadowMask(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesSetShadowMask");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.addshadowmask(this.__document, this.page, adapt2Shape(target), value);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesDelShadowMask(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesDelShadowMask");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.deleteShadows(this.page, adapt2Shape(target), 0, target.style.shadows.length);
                api.addShadows(this.page, adapt2Shape(target), value);
                api.delshadowmask(this.__document, this.page, adapt2Shape(target));
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesSetBlurMask(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesSetBlurMask");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.addblurmask(this.__document, this.page, adapt2Shape(target), value);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesDelBlurMask(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesDelBlurMask");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.deleteBlur(this.page, adapt2Shape(target));
                api.addBlur(this.page, adapt2Shape(target), value);
                api.delblurmask(this.__document, this.page, adapt2Shape(target));
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesDelStyleShadow(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesDelStyleShadow");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target } = actions[i];
                api.deleteShadows(this.page, adapt2Shape(target), 0, target.style.shadows.length);
                api.delshadowmask(this.__document, this.page, adapt2Shape(target));
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesDelStyleBlur(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesDelStyleBlur");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target } = actions[i];
                api.deleteBlur(this.page, adapt2Shape(target));
                api.delblurmask(this.__document, this.page, adapt2Shape(target));
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesSetBorderMask(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesSetBorderMask");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.addbordermask(this.__document, this.page, adapt2Shape(target), value);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesDelBorderMask(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesDelBorderMask");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const { position, sideSetting } = value as BorderMaskType
                const side = new BorderSideSetting(sideSetting.sideType, sideSetting.thicknessTop, sideSetting.thicknessLeft, sideSetting.thicknessBottom, sideSetting.thicknessRight);
                const s = shape4border(api, this.view, target);
                if (s.type !== ShapeType.Rectangle) {
                    side.sideType = SideType.Normal;
                    let number = Math.min(sideSetting.thicknessTop, sideSetting.thicknessLeft, sideSetting.thicknessBottom, sideSetting.thicknessRight)
                    number = number > 0 ? number : 1;
                    side.thicknessTop = number;
                    side.thicknessRight = number;
                    side.thicknessBottom = number;
                    side.thicknessLeft = number;
                }
                if (target.type === ShapeType.Line) {
                    api.setBorderPosition(this.page, s, BorderPosition.Center);
                } else {
                    api.setBorderPosition(this.page, s, position);
                }
                api.setBorderSide(this.page, s, side);
                api.delbordermask(this.__document, this.page, adapt2Shape(target));
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesDelStyleBorder(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesDelStyleBorder");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target } = actions[i];
                api.deleteBlur(this.page, adapt2Shape(target));
                api.delblurmask(this.__document, this.page, adapt2Shape(target));
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesSetBorderFillMask(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesSetBorderFillMask");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.setBorderFillMask(this.__document, this.page, adapt2Shape(target), value);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesDelBorderFillMask(actions: BatchAction2[]) {
        const api = this.__repo.start("shapesDelBorderFillMask");
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.deleteStrokePaints(this.page, adapt2Shape(target), 0, target.style.borders.strokePaints.length)
                for (let i = 0; i < value.length; i++) {
                    api.addStrokePaint(this.page, adapt2Shape(target), value[i], i)
                }
                api.delBorderFillMask(this.__document, this.page, adapt2Shape(target), undefined);
            }
            this.__repo.commit();
        } catch (e) {
            console.error(e);
            this.__repo.rollback();
        }
    }

    shapesFillsUnify(actions: BatchAction2[]) {
        const api = this.__repo.start('shapesFillsUnify'); // 统一多个shape的填充设置。eg:[red, red], [green], [blue, blue, blue] => [red, red], [red, red], [red, red];
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const s = shape4fill(api, this.view, target);
                // 先清空再填入
                api.deleteFills(this.page, s, 0, target.style.fills.length); // 清空
                api.addFills(this.page, s, value); // 填入新的值
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            // throw new Error(`${error}`);
        }
    }

    //borders
    setShapesBorderColor(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesBorderColor');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                const s = shape4border(api, this.view, target);
                api.setBorderColor(this.page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderEnabled(actions: BatchAction[]) {
        const api = this.__repo.start('setShapesBorderEnabled');
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                shapes.push(target);
                const s = shape4border(api, this.view, target);
                api.setBorderEnable(this.page, s, index, value);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
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
                const s = shape4border(api, this.view, target);
                api.setBorderFillType(this.page, s, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesAddBorder(actions: BatchAction2[]) {
        const api = this.__repo.start('shapesAddBorder');
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                shapes.push(target);
                const s = shape4border(api, this.__page, target);
                const l = s instanceof Shape ? s.style.borders?.strokePaints.length : s.value.length;
                if (l > 0) {
                    api.addStrokePaint(this.page, s, value, l);
                } else {
                    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
                    const strokePaints = new BasicArray<StrokePaint>(value);
                    const border = new Border(types.BorderPosition.Center, new BorderStyle(0, 0), types.CornerType.Miter, side, strokePaints);
                    api.addBorder(this.page, s, border);
                }
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
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
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const { target, index } = actions[i];
                shapes.push(target);
                const s = shape4border(api, this.view, target);
                api.deleteStrokePaintAt(this.page, s, index);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    shapesDeleteAllBorder(shapes: ShapeView[]) {
        const api = this.__repo.start('shapesDeleteAllBorder');
        try {
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const s = shape4border(api, this.view, shape);
                api.delbordermask(this.__document, this.page, s);
                api.delBorderFillMask(this.__document, this.page, adapt2Shape(shape), undefined);
                api.deleteStrokePaints(this.page, s, 0, shape.style.borders.strokePaints.length);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesBordersUnify(actions: BatchAction2[]) {
        const api = this.__repo.start('shapesBordersUnify');
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                shapes.push(target);
                const s = shape4border(api, this.view, target);
                api.deleteStrokePaints(this.page, s, 0, target.style.borders.strokePaints.length);
                api.addStrokePaints(this.page, s, value);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderPosition(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapesBorderPosition');
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                shapes.push(target);
                if (target.type === ShapeType.Table) continue;
                const s = shape4border(api, this.view, target);
                api.setBorderPosition(this.page, s, value);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderThickness(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapesBorderThickness');
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                shapes.push(target);
                const s = shape4border(api, this.view, target);
                const borders = target.getBorders();
                if (!borders) continue;
                const sideType = borders.sideSetting.sideType;
                switch (sideType) {
                    case SideType.Normal:
                        api.setBorderSide(this.page, s, new BorderSideSetting(sideType, value, value, value, value));
                        break;
                    case SideType.Top:
                        api.setBorderThicknessTop(this.page, s, value);
                        break
                    case SideType.Right:
                        api.setBorderThicknessRight(this.page, s, value);
                        break
                    case SideType.Bottom:
                        api.setBorderThicknessBottom(this.page, s, value);
                        break
                    case SideType.Left:
                        api.setBorderThicknessLeft(this.page, s, value);
                        break
                    default:
                        api.setBorderSide(this.page, s, new BorderSideSetting(sideType, value, value, value, value));
                        break;
                }

            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderStyle(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapesBorderStyle');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const s = shape4border(api, this.view, target);
                api.setBorderStyle(this.page, s, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapeBorderFillExchange(shapes: ShapeView[]) {
        try {
            const api = this.__repo.start('setShapeBorderFillExchange');
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const b = shape.getBorders();
                const f = shape.getFills();
                let strokePaints: BasicArray<StrokePaint> = new BasicArray<StrokePaint>();
                let fills: BasicArray<Fill> = new BasicArray<Fill>();
                const _strokePaints = b?.strokePaints || [];

                for (let b_i = 0; b_i < _strokePaints.length; b_i++) {
                    const {
                        isEnabled,
                        color,
                        fillType,
                        gradient,
                        imageRef,
                        transform,
                        paintFilter,
                        imageScaleMode,
                        scale,
                        rotation,
                        originalImageHeight,
                        originalImageWidth
                    } = _strokePaints[b_i];
                    const fill = new Fill([i] as BasicArray<number>, uuid(), isEnabled, fillType, color);
                    fill.gradient = gradient;
                    if (f.length > b_i) {
                        fill.fillRule = f[b_i].fillRule;
                    }
                    fill.imageRef = imageRef;
                    fill.transform = transform;
                    fill.paintFilter = paintFilter;
                    fill.imageScaleMode = imageScaleMode;
                    fill.scale = scale;
                    fill.rotation = rotation;
                    fill.originalImageHeight = originalImageHeight;
                    fill.originalImageWidth = originalImageWidth;
                    const imageMgr = _strokePaints[b_i].getImageMgr();
                    imageMgr && fill.setImageMgr(imageMgr);
                    fills.unshift(fill);
                }
                for (let f_i = 0; f_i < f.length; f_i++) {
                    const {
                        isEnabled,
                        color,
                        fillType,
                        gradient,
                        imageRef,
                        transform,
                        paintFilter,
                        imageScaleMode,
                        scale,
                        rotation,
                        originalImageHeight,
                        originalImageWidth
                    } = f[f_i];
                    let fill_type = fillType;
                    let strokePaint: StrokePaint;
                    if (fillType === FillType.Pattern) {
                        fill_type = FillType.SolidColor
                    }
                    strokePaint = new StrokePaint([i] as BasicArray<number>, uuid(), isEnabled, fill_type, color);
                    strokePaint.gradient = gradient;
                    strokePaint.imageRef = imageRef;
                    strokePaint.transform = transform;
                    strokePaint.paintFilter = paintFilter;
                    strokePaint.imageScaleMode = imageScaleMode;
                    strokePaint.scale = scale;
                    strokePaint.rotation = rotation;
                    strokePaint.originalImageHeight = originalImageHeight;
                    strokePaint.originalImageWidth = originalImageWidth;
                    const imageMgr = f[f_i].getImageMgr();
                    imageMgr && strokePaint.setImageMgr(imageMgr);
                    strokePaints.unshift(strokePaint);
                }
                const f_s = shape4fill(api, this.view, shape);
                api.deleteFills(this.page, f_s, 0, shape.style.fills.length);
                api.addFills(this.page, f_s, fills);
                const b_s = shape4border(api, this.view, shape);
                api.deleteStrokePaints(this.page, b_s, 0, b.strokePaints.length);
                api.addStrokePaints(this.page, b_s, strokePaints);
            }
            this.__repo.commit();
        } catch (error) {
            console.log(error, 'error');
            this.__repo.rollback();
        }
    }

    setShapesBorderCornerType(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapesBorderCornerType');
        try {
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const s = shape4border(api, this.view, target);
                api.setBorderCornerType(this.page, s, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderSide(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapesBorderSide');
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                shapes.push(target);
                const s = shape4border(api, this.view, target);
                api.setBorderSide(this.page, s, value);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapeBorderThicknessTop(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapeBorderThicknessTop');
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                shapes.push(target);
                const s = shape4border(api, this.view, target);
                api.setBorderThicknessTop(this.page, s, value);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapeBorderThicknessRight(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapeBorderThicknessRight');
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                shapes.push(target);
                const s = shape4border(api, this.view, target);
                api.setBorderThicknessRight(this.page, s, value);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapeBorderThicknessBottom(actions: BatchAction2[]) {
        const api = this.__repo.start('setShapeBorderThicknessBottom');
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                shapes.push(target);
                const s = shape4border(api, this.view, target);
                api.setBorderThicknessBottom(this.page, s, value);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapeBorderThicknessLeft(action: BatchAction2[]) {
        const api = this.__repo.start('setShapeBorderThicknessLeft');
        try {
            const shapes: ShapeView[] = [];
            for (let i = 0; i < action.length; i++) {
                const { target, value } = action[i];
                shapes.push(target);
                const s = shape4border(api, this.view, target);
                api.setBorderThicknessLeft(this.page, s, value);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                if (parent.autoLayout?.bordersTakeSpace) {
                    modifyAutoLayout(this.page, api, parent);
                }
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
        }
    }

    // shadow
    setShapesShadowOffsetY(actions: BatchAction[]) {
        try {
            const api = this.__repo.start('setShapesShadowOffsetY');
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                api.setShadowOffsetY(this.page, adapt2Shape(target), index, value);
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
                api.setShadowOffsetX(this.page, adapt2Shape(target), index, value);
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
                api.setShadowSpread(this.page, adapt2Shape(target), index, value);
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
                api.setShadowBlur(this.page, adapt2Shape(target), index, value);
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
                api.setShadowColor(this.page, adapt2Shape(target), index, value);
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
                api.setShadowPosition(this.page, adapt2Shape(target), index, value);
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
                api.setShadowEnable(this.page, adapt2Shape(target), index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesDeleteShadow(actions: BatchAction3[]) {
        try {
            const api = this.__repo.start('shapesDeleteShadow');
            for (let i = 0; i < actions.length; i++) {
                const { target, index } = actions[i];
                api.deleteShadowAt(this.page, adapt2Shape(target), index);
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
                api.addShadow(this.page, adapt2Shape(target), value, target.style.shadows.length);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    shapesShadowsUnify(actions: BatchAction2[]) {
        try {
            const api = this.__repo.start('shapesShadowsUnify');
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.deleteShadows(this.page, adapt2Shape(target), 0, target.style.shadows.length);
                api.addShadows(this.page, adapt2Shape(target), value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    // shape blur
    shapesAddBlur(actions: BatchAction2[]) {
        try {
            const api = this.__repo.start('shapesAddBlur');
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const shape = shape4blur(api, target, this.view);
                api.addBlur(page, shape, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    shapesBlurUnify(actions: BatchAction2[]) {
        try {
            const api = this.__repo.start('shapesBlurUnify');
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const shape = shape4blur(api, target, this.view);
                api.deleteBlur(page, shape);
                api.addBlur(page, shape, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    shapeDeleteBlur(shapes: ShapeView[]) {
        try {
            const api = this.__repo.start('shapeDeleteBlur');
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = shape4blur(api, shapes[i], this.view);
                api.deleteBlur(page, shape);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setShapeBlurEnabled(actions: BatchAction2[]) {
        try {
            const api = this.__repo.start('setShapeBlurEnabled');
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const shape = shape4blur(api, target, this.view);
                api.shapeModifyBlurEdabled(page, shape, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setShapeBlurSaturation(actions: BatchAction2[]) {
        try {
            const api = this.__repo.start('setShapeBlurSaturation');
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const shape = shape4blur(api, target, this.view);
                api.shapeModifyBlurSaturation(page, shape, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            throw error;
        }
    }

    setShapeBlurType(actions: BatchAction2[]) {
        try {
            const api = this.__repo.start('setShapeBlurType');
            const page = this.page;
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                const shape = shape4blur(api, target, this.view);
                api.shapeModifyBlurType(page, shape, value);
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
        }
    }

    setPageExportPreviewUnfold(unfold: boolean) {
        try {
            const api = this.__repo.start('setPageExportPreviewUnfold');
            api.setPageExportPreviewUnfold(this.__document, this.page.id, unfold);
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
                api.deleteExportFormatAt(this.page, target, index);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
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
        }
    }

    setPageExportFormatScale(idx: number, scale: number) {
        try {
            const api = this.__repo.start('setPageExportFormatScale');
            api.setPageExportFormatScale(this.page, idx, scale);
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
                api.setExportFormatName(this.page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setPageExportFormatName(idx: number, name: string) {
        try {
            const api = this.__repo.start('setPageExportFormatName');
            api.setPageExportFormatName(this.page, idx, name);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesExportFormatPerfix(actions: ExportFormatPrefixAction[]) {
        try {
            const api = this.__repo.start('setShapesExportFormatPerfix');
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setExportFormatPerfix(this.page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setPageExportFormatPerfix(idx: number, name: ExportFormatNameingScheme) {
        try {
            const api = this.__repo.start('setPageExportFormatPerfix');
            api.setPageExportFormatPerfix(this.page, idx, name);
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
                api.setExportFormatFileFormat(this.page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setPageExportFormatFileFormat(idx: number, name: ExportFileFormat) {
        try {
            const api = this.__repo.start('setPageExportFormatFileFormat');
            api.setPageExportFormatFileFormat(this.page, idx, name);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
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
        }
    }

    private shape4protoActions(api: Api, shape: ShapeView, id: string | undefined) {
        const _var = prepareVar(api, this.view, shape, OverrideType.ProtoInteractions, VariableType.ProtoInteractions, (_var) => {
            const ret = new BasicArray();
            if (id) {
                const actions = shape.prototypeInterActions;
                const a = ((actions || []) as PrototypeInterAction[]).find(v => v.id === id);
                if (a) ret.push(importPrototypeInterAction(a));
            }
            return ret;
        })
        if (_var && id && !(_var.var.value as PrototypeInterAction[]).find(v => v.id === id)) {
            const inherit = shape.prototypeInterActions;
            const i = inherit && inherit.find(v => v.id === id);
            if (i) {
                const a = new PrototypeInterAction(new BasicArray(), id, new PrototypeEvent(i.event.interactionType), new PrototypeActions(i.actions.connectionType, true))
                api.insertShapeprototypeInteractions(this.page, _var.var, a);
            }
        }
        return _var?.var || shape.data;
    }

    insertPrototypeAction(shape: ShapeView, action: PrototypeInterAction) {
        try {
            const api = this.__repo.start('insertPrototypeAction');
            const _shape = this.shape4protoActions(api, shape, undefined);
            api.insertShapeprototypeInteractions(this.page, _shape, action);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
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
        }
    }

    setPrototypeActionConnNav(shape: ShapeView, id: string, conn: PrototypeConnectionType | undefined, nav: PrototypeNavigationType | undefined) {
        try {
            const api = this.__repo.start('setPrototypeActionConnectionType');
            const __shape = this.shape4protoActions(api, shape, id);
            const transitionType = shape.prototypeInterActions?.find(i => i.id === id)?.actions.transitionType
            const old_nav = shape.prototypeInterActions?.find(i => i.id === id)?.actions.navigationType
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
        }
    }

    setPrototypeActionEasingType(shape: ShapeView, id: string, value: PrototypeEasingType, esfn: PrototypeEasingBezier) {
        try {
            const api = this.__repo.start('setPrototypeActionEasingType');
            const __shape = this.shape4protoActions(api, shape, id);
            const prototypeInteractions: BasicArray<PrototypeInterAction> | undefined = shape.prototypeInterActions;
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
            for (let i = 0; i < shapes.length; i++) {
                const shape = shapes[i];
                const __shape = adapt2Shape(shape);
                const types = [ShapeType.Artboard, ShapeType.Symbol, ShapeType.SymbolRef];
                if (!types.includes(__shape.parent!.type)) continue;
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
                // ?
                // if (shape.type === ShapeType.Group) {
                //     shape = this.page.shapes.get(shape.id)!;
                //     if (!shape) continue;
                // }
                api.shapeModifyVisible(this.page, shape.data, isVisible);
            }
            const parents = getAutoLayoutShapes(shapes);
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i];
                modifyAutoLayout(this.page, api, parent);
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
        let autoLayoutShape: Artboard | undefined;
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
                        if (host instanceof Artboard) {
                            autoLayoutShape = host;
                        }
                    }

                    api.shapeMove(this.page, parent, parent.indexOfChild(item), host as GroupShape, last);

                    translateTo(api, this.page, item, beforeXY.x, beforeXY.y);

                    if (after_remove(parent)) {
                        this.delete_inner(this.page, parent, api);
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
                        if (host_parent instanceof Artboard) {
                            autoLayoutShape = host_parent;
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
                }
            }
            if (autoLayoutShape) {
                modifyAutoLayout(this.page, api, autoLayoutShape);
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
            const api = this.__repo.start('setLinesLength');
            const page = this.page;
            for (let i = 0; i < shapes.length; i++) {
                const shape = adapt2Shape(shapes[i]);
                if (shape.isVirtualShape) {
                    continue;
                }
                const _color = new Color(color.alpha, color.red, color.green, color.blue);
                if (shape.type === ShapeType.Text) {
                    const __textShape = shapes[i] as any as TextShapeLike;
                    api.textModifyColor(page, __textShape, 0, __textShape.text.length, _color);
                    continue;
                }
                const style = shape.style;
                if (style.fills.length) {
                    const s = shape4fill(api, this.view, shapes[i]);
                    api.setFillColor(page, s, style.fills.length - 1, _color);
                    continue;
                }
                if (style.borders && style.borders.strokePaints.length) {
                    const s = shape4border(api, this.view, shapes[i]);
                    api.setBorderColor(page, s, style.borders.strokePaints.length - 1, _color);
                    continue;
                }
                const s = shape4fill(api, this.view, shapes[i]);
                const fill = new Fill(new BasicArray(), uuid(), true, FillType.SolidColor, _color)
                api.addFillAt(page, s, fill, 0);
            }
            this.__repo.commit();
        } catch (error) {
            console.error('modifyStyleByEyeDropper:', error);
            this.__repo.rollback();
        }
    }

    pasteProperties(shapes: ShapeView[], source: any) {
        try {
            const api = this.__repo.start('pasteProperties');
            const page = this.page;
            const fills = source.fills;
            const borders = source.borders;
            const shadows = source.shadows;
            const blur = source.blur;
            const radius = source.radius;
            const contextSetting = source.contextSetting;
            const mark = source.mark;
            const text = source.text;
            if (fills.length || borders.length) {
                const document = this.__document;
                const ctx = new class {
                    document = document;
                    curPage = page.id;
                    fmtVer = FMT_VER_latest;
                };

                const flatten = flattenShapes(shapes);
                for (const view of flatten) {
                    // fills
                    {
                        const s = shape4fill(api, this.view, view);
                        api.deleteFills(page, s, 0, view.style.fills.length);
                        if (fills?.length) {
                            const __fills = fills.map((i: Fill) => importFill(i, ctx));
                            api.addFills(page, s, __fills);
                        }
                    }
                    // borders
                    {
                        const s = shape4border(api, this.view, view);
                        api.deleteStrokePaints(page, s, 0, view.style.borders.strokePaints.length);
                        if (borders) {
                            const __borders = importBorder(borders);
                            api.addStrokePaints(page, s, __borders.strokePaints);
                        }
                    }
                }
            }
            for (let i = 0; i < shapes.length; i++) {
                const view = shapes[i];
                const shape = adapt2Shape(view);

                if (shape.isVirtualShape) continue;
                // shadows
                {
                    const s = shape4shadow(api, this.view, view);
                    api.deleteShadows(page, s, 0, view.style.shadows.length);
                    if (shadows?.length) {
                        const __shadows = shadows.map((i: Shadow) => importShadow(i));
                        api.addShadows(page, s, __shadows);
                    }
                }
                // blur
                {
                    api.deleteBlur(this.page, shape);
                    if (blur) {
                        api.addBlur(this.page, shape, importBlur(blur));
                    }
                }
                // radius
                {
                    if (radius) {
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
                            update_frame_by_points(api, this.page, shape);
                        }
                    }
                }
                // contextSetting
                {
                    if (contextSetting) {
                        const __cs = importContextSettings(contextSetting);
                        api.shapeModifyContextSettingsOpacity(page, shape, __cs.opacity ?? 1);
                        api.shapeModifyContextSettingsBlendMode(page, shape, __cs.blenMode);
                    }
                }
                // mark
                {
                    if (mark?.start) {
                        const __start = importMarkerType(mark.start);
                        api.shapeModifyStartMarkerType(page, shape, __start);
                    }
                    if (mark?.end) {
                        const __end = importMarkerType(mark.end);
                        api.shapeModifyEndMarkerType(page, shape, __end);
                    }
                }
                // text
                {
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
                    let pathShape = newPathShape(view.name, view.frame, path, style);
                    pathShape.transform = shape.transform.clone();
                    pathShape.mask = shape.mask;
                    pathShape.resizingConstraint = shape.resizingConstraint;
                    pathShape.constrainerProportions = shape.constrainerProportions;
                    const parent = shape.parent as GroupShape;
                    const index = parent.indexOfChild(shape);
                    api.shapeDelete(document, page, parent, index);
                    pathShape = api.shapeInsert(document, page, parent, pathShape, index) as PathShape;
                    update_frame_by_points(api, page, pathShape);
                    ids.push(pathShape.id);
                } else {
                    const borders = view.getBorders();
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
                        const path = border2path(view, border);
                        let pathshape = newPathShape(view.name + suffix, view.frame, path, style);
                        pathshape.transform = shape.transform.clone();
                        pathshape.mask = shape.mask;
                        pathshape.resizingConstraint = shape.resizingConstraint;
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

    insertImages(images: { pack: ImagePack | SVGParseResult; transform: Transform; targetEnv: GroupShapeView; }[], fixed: boolean) {
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
                    const shape = newImageFillShape(name.replace(reg, '') || 'image', new ShapeFrame(0, 0, size.width, size.height), document.mediasMgr, size, ref);
                    shape.transform = item.transform;
                    if (fixed) shape.constrainerProportions = true;
                    const index = parent.childs.length;
                    const __s = api.shapeInsert(document, page, parent, shape, index);
                    if (__s) {
                        ids.push(__s.id);
                        imageShapes.push({ shape: __s, upload: [{ ref, buff }] });
                    }
                } else {
                    const shape = (item.pack as SVGParseResult).shape;
                    shape.transform = item.transform;
                    if (fixed) shape.constrainerProportions = true;
                    const index = parent.childs.length;
                    const __s = api.shapeInsert(document, page, parent, shape, index);
                    if (__s) {
                        ids.push(__s.id);
                        const upload: UploadAssets[] = [];
                        (item.pack as SVGParseResult).mediaResourceMgr.forEach((v, k) => {
                            upload.push({ ref: k, buff: v.buff });
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

    flattenSelection(shapes: ShapeView[], name?: string) {
        // 先把所有可以参与拼合的图层整理出来
        // 确定一组属性，包括边框、填充、蒙版、约束等
        try {
            if (!shapes.length) return;
            let virtualSelection = false;
            const __shapes = (function deep(shapes: ShapeView[]) {
                const result: ShapeView[] = [];
                for (const view of shapes) {
                    if (view.isVirtualShape) {
                        virtualSelection = true;
                        break;
                    }
                    if (view instanceof ArtboardView || view instanceof SymbolView || view.type === ShapeType.Group) {
                        result.push(...deep(view.childs));
                        continue;
                    }
                    result.push(view);
                }
                return result;
            })(shapes);
            if (virtualSelection || !__shapes.length) return;

            for (const view of __shapes) {

            }
            // if (shapes.length > 1) {
            //     return this.flattenShapes(shapes);
            // } else if (shapes.length === 1) {
            //     const __flatten = (view: ShapeView) => {
            //         const res: ShapeView[] = [];
            //         if (view instanceof PathShapeView) {
            //             res.push(view);
            //         } else {
            //             if (view.type === ShapeType.Group || view instanceof ArtboradView) {
            //                 res.push(...__flatten(view));
            //             }
            //         }
            //         return res;
            //     }
            //     const __shapes = __flatten(shapes[0]);
            //     if (__shapes.length > 1) {
            //         return this.flattenShapes(shapes);
            //     }
            //     const view = __shapes[0];
            //     const shape = adapt2Shape(view);
            //     if (!(view instanceof PathShapeView)) return;
            //     const api = this.__repo.start('flattenSelection');
            //     update_frame_by_points(api, this.page, shape);
            //     api.shapeEditPoints(this.page, shape, true);
            //     this.__repo.commit();
            // }
        } catch (e) {
            this.__repo.rollback()
            console.error(e)
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

    tidyUpShapesLayout(shape_rows: ShapeView[][], hor: number, ver: number, dir: boolean, algin: TidyUpAlgin) {
        const api = this.__repo.start('tidyUpShapesLayout');
        try {
            tidyUpLayout(this.page, api, shape_rows, hor, ver, dir, algin);
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
}