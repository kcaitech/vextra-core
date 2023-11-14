import {
    GroupShape,
    OverrideType,
    PathShape2,
    RectShape,
    Shape,
    ShapeFrame,
    ShapeType,
    SymbolShape,
    Variable,
    VariableType
} from "../data/shape";
import {ShapeEditor} from "./shape";
import * as types from "../data/typesdefine";
import {BoolOp, BorderPosition} from "../data/typesdefine";
import {Page} from "../data/page";
import {
    initFrame,
    newArrowShape,
    newArtboard,
    newGroupShape,
    newLineShape,
    newOvalShape,
    newPathShape,
    newRectShape,
    newSolidColorFill,
    newSymbolRefShape,
    newSymbolShape
} from "./creator";
import {Document} from "../data/document";
import {expand, translate, translateTo} from "./frame";
import {uuid} from "../basic/uuid";
import {CoopRepository} from "./command/cooprepo";
import {Api} from "./command/recordapi";
import {
    Artboard,
    Border,
    BorderStyle,
    Color,
    Fill,
    Path,
    PathShape,
    Style,
    SymbolRefShape,
    TableShape,
    Text
} from "../data/classes";
import {TextShapeEditor} from "./textshape";
import {get_frame, modify_frame_after_insert, set_childs_id, transform_data} from "../io/cilpboard";
import {deleteEmptyGroupShape, expandBounds, group, ungroup} from "./group";
import {render2path} from "../render";
import {Matrix} from "../basic/matrix";
import {IImportContext, importBorder, importGroupShape, importStyle, importSymbolShape} from "../data/baseimport";
import {gPal} from "../basic/pal";
import {findUsableBorderStyle, findUsableFillStyle} from "../render/boolgroup";
import {BasicArray} from "../data/basic";
import {TableEditor} from "./table";
import {exportGroupShape, exportSymbolShape} from "../data/baseexport";
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
import {v4} from "uuid";
import {is_part_of_symbolref, modify_variable_with_api, shape4border, shape4fill} from "./utils/symbol";
import {is_circular_ref2} from "./utils/ref_check";

// 用于批量操作的单个操作类型
export interface PositonAdjust { // 涉及属性：frame.x、frame.y
    target: Shape
    transX: number
    transY: number
}

export interface ConstrainerProportionsAction { // constrainerProportions
    target: Shape
    value: boolean
}

export interface FrameAdjust { // frame.width、frame.height
    target: Shape
    widthExtend: number
    heightExtend: number
}

export interface RotateAdjust { // rotation
    target: Shape
    value: number
}

export interface FlipAction { // isFlippedHorizontal、isFlippedVertical
    target: Shape
    direction: 'horizontal' | 'vertical'
}

export interface FillColorAction { // fill.color
    target: Shape
    index: number
    value: Color
}

export interface FillEnableAction { // fill.Enabled
    target: Shape
    index: number
    value: boolean
}

export interface FillAddAction { // style.fills
    target: Shape
    value: Fill
}

export interface FillDeleteAction { // style.fills
    target: Shape
    index: number
}

export interface FillsReplaceAction { // style.fills
    target: Shape
    value: Fill[]
}

export interface BorderColorAction { // border.color
    target: Shape
    index: number
    value: Color
}

export interface BorderEnableAction { // border.Enabled
    target: Shape
    index: number
    value: boolean
}

export interface BorderAddAction { // style.borders
    target: Shape
    value: Border
}

export interface BorderDeleteAction { // style.borders
    target: Shape
    index: number
}

export interface BordersReplaceAction { // style.borders
    target: Shape
    value: Border[]
}

export interface BorderPositionAction {
    target: Shape
    index: number
    value: BorderPosition
}

export interface BorderThicknessAction {
    target: Shape
    index: number
    value: number
}

export interface BorderStyleAction {
    target: Shape
    index: number
    value: BorderStyle
}

function getHorizontalRadians(A: { x: number, y: number }, B: { x: number, y: number }) {
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
        this.__repo = repo;
        this.__page = page;
        this.__document = document;
    }

    group(shapes: Shape[], groupname: string): false | GroupShape { // shapes中元素index越小层级越高，即在图形列表的位置最高
        if (shapes.length === 0) return false;
        if (shapes.find((v) => !v.parent)) return false;
        const fshape = shapes[0];
        const savep = fshape.parent as GroupShape;

        const api = this.__repo.start("group", {});
        try {
            // 0、save shapes[0].parent？最外层shape？位置？  层级最高图形的parent
            const saveidx = savep.indexOfChild(shapes[0]);
            // 1、新建一个GroupShape
            let gshape = newGroupShape(groupname);

            gshape = group(this.__page, shapes, gshape, savep, saveidx, api);

            this.__repo.commit();
            return gshape;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    ungroup(shape: GroupShape): false | Shape[] {
        if (shape.isVirtualShape) return false;
        if (!shape.parent) return false;
        const api = this.__repo.start("", {});
        try {
            const childs = ungroup(this.__page, shape, api);
            this.__repo.commit();
            return childs;
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

        const api = this.__repo.start("create_artboard", {});
        try {
            // 0、save shapes[0].parent？最外层shape？位置？  层级最高图形的parent
            const saveidx = savep.indexOfChild(shapes[0]);
            // 1、新建一个GroupShape
            let artboard = newArtboard(artboardname, new ShapeFrame(0, 0, 100, 100));
            artboard = group(this.__page, shapes, artboard, savep, saveidx, api) as Artboard;

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
    dissolution_artboard(shape: Artboard): false | Shape[] {
        if (shape.isVirtualShape) return false;
        if (!shape.parent) return false;
        const api = this.__repo.start("dissolution_artboard", {});
        try {
            const childs = ungroup(this.__page, shape, api);
            this.__repo.commit();
            return childs;
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    boolgroup(shapes: Shape[], groupname: string, op: BoolOp): false | GroupShape {
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

        const api = this.__repo.start("boolgroup", {});
        try {
            // 0、save shapes[0].parent？最外层shape？位置？  层级最高图形的parent
            const saveidx = savep.indexOfChild(shapes[0]);
            // 1、新建一个GroupShape
            let gshape = newGroupShape(groupname, style);
            gshape.isBoolOpShape = true;
            gshape = group(this.__page, shapes, gshape, savep, saveidx, api);
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
     *
     * @param shape
     */
    makeSymbol(document: Document, shapes: Shape[], name?: string) {
        if (shapes.length === 0) return;
        const api = this.__repo.start("makeSymbol", {});
        try {
            const need_trans_data: Shape[] = [];
            adjust_selection_before_group(document, this.__page, shapes, api, need_trans_data);
            let sym: Shape;
            const shape0 = shapes[0];
            if (shapes.length === 1 && shape0 instanceof GroupShape && !shape0.fixedRadius
                && shape0.style.fills.length === 0 && shape0.style.borders.length === 0) {
                const frame = shape0.frame;
                const symbolShape = newSymbolShape(name ?? shape0.name, new ShapeFrame(frame.x, frame.y, frame.width, frame.height));
                const index = (shape0.parent as GroupShape).indexOfChild(shape0);
                sym = api.shapeInsert(this.__page, shape0.parent as GroupShape, symbolShape, index + 1);
                const childs = shape0.childs;
                for (let i = 0, len = childs.length; i < len; ++i) {
                    api.shapeMove(this.__page, shape0, 0, symbolShape, i);
                }
                api.shapeDelete(this.__page, shape0.parent as GroupShape, index);
            } else {
                const frame = shape0.frame;
                const symbolShape = newSymbolShape(name ?? shape0.name, new ShapeFrame(frame.x, frame.y, frame.width, frame.height));
                const index = (shape0.parent as GroupShape).indexOfChild(shape0);
                sym = group(this.__page, shapes, symbolShape, shape0.parent as GroupShape, index, api);
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
    makeStatus(symbol: SymbolShape, attri_name: string, dlt: string, isDefault: boolean) {
        const api = this.__repo.start("makeStatus", {});
        try {
            if (!symbol.isUnionSymbolShape) {
                const u = make_union(api, this.__document, this.__page, symbol, dlt, attri_name);
                if (!u) throw new Error('make union failed!');
                symbol = u;
            } else {
                const _var = new Variable(uuid(), VariableType.Status, attri_name, isDefault ? SymbolShape.Default_State : dlt);
                api.shapeAddVariable(this.__page, symbol, _var);
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
        const api = this.__repo.start("makeVar", {});
        try {
            if (symbol.type !== ShapeType.Symbol || (symbol.parent && symbol.parent.isUnionSymbolShape)) throw new Error('wrong role!');
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
        if (!union.isUnionSymbolShape || !union.childs.length) return;
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
                document: Document = _this.__document
            };
            const copy = importSymbolShape(source, ctx); // 需要设置ctx
            const api = this.__repo.start("makeStateAt", {});
            const new_state = api.shapeInsert(this.__page, union, copy, idx + 1);
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
     * @description 将引用的组件解引用
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
        const returnshapes: Shape[] = [];
        for (let i = 0, len = shapes.length; i < len; i++) {
            const shape = shapes[i];
            if (shape.type !== ShapeType.SymbolRef) {
                returnshapes.push(shape);
                continue;
            }
            if (shape.parent && shape.parent.type === ShapeType.SymbolRef) { // 实例内引用组件
                returnshapes.push(shape);
                continue;
            }
            const symmgr = shape.getSymbolMgr();
            const symbol = symmgr?.getSync(shape.refId);
            if (!symbol) {
                returnshapes.push(shape);
                continue;
            }
            const tmpGroup = newGroupShape(shape.name, shape.style);
            initFrame(tmpGroup, shape.frame);
            tmpGroup.childs = shape.virtualChilds! as BasicArray<Shape>;
            tmpGroup.varbinds = shape.varbinds;
            const symbolData = exportGroupShape(tmpGroup); // todo 如果symbol只有一个child时
            replaceId(symbolData);
            const parent = shape.parent;
            if (!parent) {
                returnshapes.push(shape);
                continue;
            }
            const insertIndex = (parent as GroupShape).indexOfChild(shape);
            if (insertIndex < 0) {
                returnshapes.push(shape);
                continue;
            }
            const _this = this;
            const ctx: IImportContext = new class implements IImportContext {
                document: Document = _this.__document
            };
            const newShape = importGroupShape(symbolData, ctx);
            actions.push({parent, self: newShape, insertIndex});
        }
        if (!actions.length) return shapes;
        const api = this.__repo.start("extractSymbol", {});
        try {
            const results: Shape[] = [];
            for (let i = 0, len = actions.length; i < len; i++) {
                const {parent, self, insertIndex} = actions[i];
                const ret = api.shapeInsert(this.__page, parent as GroupShape, self, insertIndex);
                api.shapeDelete(this.__page, parent as GroupShape, insertIndex + 1);
                results.push(ret);
            }
            this.__repo.commit();
            return [...returnshapes, ...results];
        } catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
    }

    refSymbol(document: Document, name: string, frame: ShapeFrame, refId: string) {
        return newSymbolRefShape(name, frame, refId, document.symbolsMgr);
    }

    private cloneStyle(style: Style): Style {
        const _this = this;
        const ctx: IImportContext = new class implements IImportContext {
            document: Document = _this.__document
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

        const api = this.__repo.start("flattenShapes", {});
        try {
            // bounds
            // 计算frame
            //   计算每个shape的绝对坐标
            const boundsArr = shapes.map((s) => {
                const box = s.boundingBox()
                const p = s.parent!;
                const m = p.matrix2Root();
                const lt = m.computeCoord(box.x, box.y);
                const rb = m.computeCoord(box.x + box.width, box.y + box.height);
                return {x: lt.x, y: lt.y, width: rb.x - lt.x, height: rb.y - lt.y}
            })
            const firstXY = boundsArr[0]
            const bounds = {left: firstXY.x, top: firstXY.y, right: firstXY.x, bottom: firstXY.y};

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
                const shapepath = render2path(shape, undefined);
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
            pathShape = api.shapeInsert(this.__page, savep, pathShape, saveidx) as PathShape | PathShape2;

            for (let i = 0, len = shapes.length; i < len; i++) {
                const s = shapes[i];
                const p = s.parent as GroupShape;
                const idx = p.indexOfChild(s);
                api.shapeDelete(this.__page, p, idx);
                if (p.childs.length <= 0) {
                    deleteEmptyGroupShape(this.__page, p, api)
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

    flattenBoolShape(shape: GroupShape): PathShape | false {
        if (!shape.isBoolOpShape) return false;
        const parent = shape.parent as GroupShape;
        if (!parent) return false;

        const path = render2path(shape, undefined);

        // copy fill and borders
        const copyStyle = findUsableFillStyle(shape);
        const style: Style = this.cloneStyle(copyStyle);
        const borderStyle = findUsableBorderStyle(shape);
        if (borderStyle !== copyStyle) {
            style.borders = new BasicArray<Border>(...borderStyle.borders.map((b) => importBorder(b)))
        }

        const api = this.__repo.start("flattenBoolShape", {});
        try {
            const gframe = shape.frame;
            const boundingBox = path.calcBounds();
            const w = boundingBox.maxX - boundingBox.minX;
            const h = boundingBox.maxY - boundingBox.minY;
            const frame = new ShapeFrame(gframe.x + boundingBox.minX, gframe.y + boundingBox.minY, w, h); // clone
            path.translate(-boundingBox.minX, -boundingBox.minY);

            let pathShape = newPathShape(shape.name, frame, path, style);
            pathShape.fixedRadius = shape.fixedRadius;
            const index = parent.indexOfChild(shape);
            api.shapeDelete(this.__page, parent, index);
            pathShape = api.shapeInsert(this.__page, parent, pathShape, index) as PathShape;

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
                const p = shape.parent;
                if (!p) continue;
                let idx = -1;
                for (let j = 0, len = p.childs.length; j < len; j++) {
                    if (p.childs[j].id === shape.id) {
                        idx = j;
                        break;
                    }
                }
                if (idx > -1) api.shapeDelete(page, p as GroupShape, idx);
            }
        }
    }

    private delete_inner(page: Page, shape: Shape, api: Api): boolean {
        const p = shape.parent as GroupShape;
        if (!p) return false;
        if (shape.type === ShapeType.Contact) { // 连接线删除之后需要删除两边的连接关系
            this.removeContactSides(api, page, shape as unknown as types.ContactShape);
        } else {
            this.removeContact(api, page, shape);
        }
        api.shapeDelete(page, p, p.indexOfChild(shape));
        if (p.childs.length <= 0 && p.type === ShapeType.Group) {
            this.delete_inner(page, p, api)
        }
        return true;
    }

    delete(shape: Shape): boolean {
        const page = shape.getPage() as Page;
        if (!page) return false;
        const savep = shape.parent as GroupShape;
        if (!savep) return false;
        const api = this.__repo.start("delete", {});
        try {
            if (is_part_of_symbolref(shape)) {
                if (modify_variable_with_api(api, this.__page, shape, VariableType.Visible, OverrideType.Visible, (_var) => {
                    return _var ? !_var.value : !shape.isVisible;
                })) return true;
                api.shapeModifyVisible(this.__page, shape, !shape.isVisible);
                return true;
            }
            const symbol = get_symbol_by_layer(shape);
            if (symbol) {
                clear_binds_effect(this.__page, shape, symbol, api);
            }
            if (this.delete_inner(page, shape, api)) {
                if (after_remove(savep)) {
                    this.delete_inner(page, savep, api);
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
    delete_batch(shapes: Shape[]) {
        const api = this.__repo.start("deleteBatch", {});
        let need_special_notify = false;
        for (let i = 0; i < shapes.length; i++) {
            try {
                const shape = shapes[i];
                if (is_part_of_symbolref(shape)) {
                    if (modify_variable_with_api(api, this.__page, shape, VariableType.Visible, OverrideType.Visible, (_var) => {
                        return _var ? !_var.value : !shape.isVisible;
                    })) continue;
                    api.shapeModifyVisible(this.__page, shape, !shape.isVisible);
                    continue;
                }
                const symbol = get_symbol_by_layer(shape);
                if (symbol) {
                    clear_binds_effect(this.__page, shape, symbol, api);
                }
                if (shape.type === ShapeType.Symbol) need_special_notify = true;
                const page = shape.getPage() as Page;
                if (!page) return false;
                const savep = shape.parent as GroupShape;
                if (!savep) return false;
                this.delete_inner(page, shape, api);
                if (after_remove(savep)) {
                    this.delete_inner(page, savep, api);
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
        const api = this.__repo.start("insertshape", {});
        try {
            api.shapeInsert(this.__page, parent, shape, index);
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
    pasteShapes1(parent: GroupShape, shapes: Shape[]): { shapes: Shape[], frame: { x: number, y: number }[] } | false {
        const api = this.__repo.start("insertShapes1", {});
        try {
            const result: Shape[] = [];
            let index = parent.childs.length;
            for (let i = 0, len = shapes.length; i < len; i++) {
                const shape = shapes[i];
                shape.id = uuid();
                api.shapeInsert(this.__page, parent, shape, index);
                result.push(parent.childs[index]);
                index++;
            }
            modify_frame_after_insert(api, this.__page, result);
            const frame = get_frame(result);
            this.__repo.commit();
            return {shapes: result, frame};
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
        const api = this.__repo.start("insertShapes2", {});
        try {
            const result: Shape[] = [];
            for (let i = 0, len = actions.length; i < len; i++) {
                const shape = shapes[i];
                const {parent, index} = actions[i];
                shape.id = uuid();
                api.shapeInsert(this.__page, parent, shape, index);
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
        const {is_arrow, rotation, target_xy} = ex_params;
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
        const api = this.__repo.start("create2", {});
        try {
            const index = parent.childs.length;
            const xy = m_p2r.computeCoord2(0, 0);
            new_s.frame.x -= xy.x, new_s.frame.y -= xy.y;
            if (rotation) {
                new_s.rotation = rotation;
            }
            new_s = api.shapeInsert(this.__page, parent, new_s, index);
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
            const api = this.__repo.start("move", {});
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
     * @description 提高图形shape的z-index层级
     * @param step 层级数，不传则提高到顶部
     * @returns { boolean }
     */
    uppper_layer(shape: Shape, step?: number) {
        if (shape.isVirtualShape) return true; // 组件实例内部图形不可以移动图层
        const parent = shape.parent as GroupShape | undefined;
        if (!parent) return false;
        const index = parent.indexOfChild(shape);
        const len = parent.childs.length;
        if (index < 0 || index >= len - 1) return false;
        const api = this.__repo.start("move", {});
        try {
            if (!step) { // 如果没有步值，则上移到最上层(index => parent.childs.length -1);
                api.shapeMove(this.__page, parent, index, parent, len - 1);
            } else {
                if (step + index >= len) { // 如果没有步值已经迈出分组，则上移到最上层(index => parent.childs.length -1);
                    api.shapeMove(this.__page, parent, index, parent, len - 1);
                } else {
                    api.shapeMove(this.__page, parent, index, parent, index + step);
                }
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * @description 调低图形shape的z-index层级
     * @param step 层级数，不传则降低到底部
     * @returns { boolean }
     */
    lower_layer(shape: Shape, step?: number) {
        if (shape.isVirtualShape) return true; // 组件实例内部图形不可以移动图层
        const parent = shape.parent as GroupShape | undefined;
        if (!parent) return false;
        const index = parent.indexOfChild(shape);
        if (index < 1) return false;
        const api = this.__repo.start("move", {});
        try {
            if (!step) { // 如果没有步值，则下移到最底层(index => 0);
                api.shapeMove(this.__page, parent, index, parent, 0);
            } else {
                if (index - step <= 0) { // 如果没有步值已经迈出分组，则下移到最底层(index => 0);
                    api.shapeMove(this.__page, parent, index, parent, 0);
                } else {
                    api.shapeMove(this.__page, parent, index, parent, index - step);
                }
            }
            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
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
        const api = this.__repo.start("replace", {});
        try {
            const len = replacement.length;
            // 寻找replacement的左上角(lt_point)，该点将和src中每个图形的左上角重合
            const any_r_f = replacement[0].frame;
            const lt_point = {x: any_r_f.x, y: any_r_f.y};
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
                const dt = {x: rf.x - lt_point.x, y: rf.y - lt_point.y};
                delta_xys.push(dt);
            }
            // 收集被替换上去的元素
            const src_replacement: Shape[] = [];

            // 开始替换
            for (let i = 0; i < src.length; i++) {
                const s = src[i];
                const p = s.parent as GroupShape;
                if (!p) throw new Error('invalid root');
                let save_index = p.indexOfChild(s);
                if (save_index < 0) throw new Error('invalid childs data');

                // 记录被替换掉的图形原先所在的位置
                const fr = s.frame;
                const save_frame = {x: fr.x, y: fr.y};
                // 先删除将被替换的图形
                const del_res = this.delete_inner(this.__page, s, api);
                if (!del_res) throw new Error('delete failed');

                // replacement的原版数据只能使用一次，使用一次之后的替换应该使用replacement的副本数据，并确保每一份副本数据中不存在共同对象引用
                const copy: Shape[] = i < 1 ? replacement : transform_data(document, replacement);
                for (let r_i = 0; r_i < len; r_i++) { // 逐个插入replacement中的图形
                    let r = copy[r_i];
                    r.id = uuid();
                    r.frame.x = save_frame.x + delta_xys[r_i].x; // lt_point与s.frame的xy重合后，用delta_xys中的相对位置计算replacement中每个图形的偏移
                    r.frame.y = save_frame.y + delta_xys[r_i].y;
                    api.shapeInsert(this.__page, p, r, save_index);
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

    setName(name: string) {
        const api = this.__repo.start("setName", {});
        try {
            api.pageModifyName(this.__document, this.__page.id, name);
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
            return false;
        }
    }

    /**
     * wanderer 被拖动的shape item
     * host 处于目的地的shape item
     * offsetOverhalf 鼠标光标在目的地的位置是否超过目的地DOM范围的一半，此参数将影响wanderer插入的位置在host的上下位置
     * @returns
     */
    shapeListDrag(wanderer: Shape, host: Shape, offsetOverhalf: boolean) {
        if (!wanderer || !host) return;
        const beforeXY = wanderer.frame2Root();
        const api = this.__repo.start('shapeLayerMove', {});
        try {
            if (wanderer.id !== host.parent?.id) {
                if (host.type === ShapeType.Artboard) {
                    if (offsetOverhalf) {
                        const wandererParent = wanderer.parent as GroupShape;
                        if (wandererParent && wandererParent.id !== host.id) {
                            api.shapeMove(this.__page, wandererParent, wandererParent.indexOfChild(wanderer), host as GroupShape, (host as GroupShape).childs.length);
                        }
                    } else {
                        const hostParent = host.parent as GroupShape;
                        const wandererParent = wanderer.parent as GroupShape;
                        if (hostParent && wandererParent) {
                            const saveidx = (wandererParent).indexOfChild(wanderer);
                            const childs = (hostParent).childs;
                            const idx = childs.findIndex(i => i.id === host.id) + 1; // 列表是倒序!!!
                            api.shapeMove(this.__page, wandererParent, saveidx, hostParent, idx);
                        }
                    }
                } else {
                    const hostParent = host.parent as GroupShape;
                    const wandererParent = wanderer.parent as GroupShape;
                    if (hostParent && wandererParent) {
                        const saveidx = (wandererParent).indexOfChild(wanderer);
                        const childs = (hostParent).childs;
                        let idx = childs.findIndex(i => i.id === host.id);
                        idx = offsetOverhalf ? idx : idx + 1; // 列表是倒序!!!
                        api.shapeMove(this.__page, wandererParent, saveidx, hostParent, idx);
                        // 当所删除元素为某一个编组的最后一个子元素时，需要把这个编组也删掉
                        if (!wandererParent.childs.length && wandererParent.type === ShapeType.Group) {
                            this.delete_inner(this.__page, wandererParent, api)
                        }
                    }
                }
            }
            translateTo(api, this.__page, wanderer, beforeXY.x, beforeXY.y);
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
    }

    arrange(actions: PositonAdjust[]) {
        const api = this.__repo.start('arrange', {});
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

    setShapesConstrainerProportions(actions: ConstrainerProportionsAction[]) {
        const api = this.__repo.start('setShapesConstrainerProportions', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, value} = actions[i];
                api.shapeModifyConstrainerProportions(this.__page, target, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesFrame(actions: FrameAdjust[]) {
        const api = this.__repo.start('setShapesFrame', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, widthExtend, heightExtend} = actions[i];
                expand(api, this.__page, target, widthExtend, heightExtend);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesRotate(shapes: Shape[], v: number) {
        const api = this.__repo.start('setShapesRotate', {});
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const s = shapes[i];
                if (s.type === ShapeType.Line) {
                    const f = s.frame, m2p = s.matrix2Parent(), lt = m2p.computeCoord2(0, 0),
                        rb = m2p.computeCoord2(f.width, f.height);
                    const real_r = Number(getHorizontalAngle(lt, rb).toFixed(2));
                    let dr = v - real_r;
                    if (s.isFlippedHorizontal) dr = -dr;
                    if (s.isFlippedVertical) dr = -dr;
                    api.shapeModifyRotate(this.__page, s, (s.rotation || 0) + dr);
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

    shapesFlip(actions: FlipAction[]) {
        const api = this.__repo.start('shapesFlip', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, direction} = actions[i];
                if (direction === 'horizontal') {
                    api.shapeModifyHFlip(this.__page, target, !target.isFlippedHorizontal);
                } else if (direction === 'vertical') {
                    api.shapeModifyVFlip(this.__page, target, !target.isFlippedVertical);
                }
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesFillColor(actions: FillColorAction[]) {
        const api = this.__repo.start('setShapesFillColor', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, index, value} = actions[i];
                api.setFillColor(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesFillEnabled(actions: FillEnableAction[]) {
        const api = this.__repo.start('setShapesFillEnabled', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, index, value} = actions[i];
                api.setFillEnable(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesAddFill(actions: FillAddAction[]) {
        const api = this.__repo.start('shapesAddFill', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, value} = actions[i];
                const s = shape4fill(api, this.__page, target);
                const l = s instanceof Shape ? s.style.fills.length : s.value.length
                api.addFillAt(this.__page, s, value, l);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesDeleteFill(actions: FillDeleteAction[]) {
        const api = this.__repo.start('shapesDeleteFill', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, index} = actions[i];
                api.deleteFillAt(this.__page, target, index);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesFillsUnify(actions: FillsReplaceAction[]) {
        const api = this.__repo.start('shapesFillsUnify', {}); // 统一多个shape的填充设置。eg:[red, red], [green], [blue, blue, blue] => [red, red], [red, red], [red, red];
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, value} = actions[i];
                // 先清空再填入
                api.deleteFills(this.__page, target, 0, target.style.fills.length); // 清空
                api.addFills(this.__page, target, value); // 填入新的值
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
            // throw new Error(`${error}`);
        }
    }

    //boders
    setShapesBorderColor(actions: BorderColorAction[]) {
        const api = this.__repo.start('setShapesBorderColor', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, index, value} = actions[i];
                api.setBorderColor(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderEnabled(actions: BorderEnableAction[]) {
        const api = this.__repo.start('setShapesBorderEnabled', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, index, value} = actions[i];
                api.setBorderEnable(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesAddBorder(actions: BorderAddAction[]) {
        const api = this.__repo.start('shapesAddBorder', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, value} = actions[i];
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

    shapesDeleteBorder(actions: BorderDeleteAction[]) {
        const api = this.__repo.start('shapesDeleteBorder', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, index} = actions[i];
                const s = shape4border(api, this.__page, target);
                api.deleteBorderAt(this.__page, s, index);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    shapesBordersUnify(actions: BordersReplaceAction[]) {
        const api = this.__repo.start('shapesBordersUnify', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, value} = actions[i];
                api.deleteBorders(this.__page, target, 0, target.style.borders.length);
                api.addBorders(this.__page, target, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderPosition(actions: BorderPositionAction[]) {
        const api = this.__repo.start('setShapesBorderPosition', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, value, index} = actions[i];
                api.setBorderPosition(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderThickness(actions: BorderThicknessAction[]) {
        const api = this.__repo.start('setShapesBorderThickness', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, value, index} = actions[i];
                api.setBorderThickness(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setShapesBorderStyle(actions: BorderStyleAction[]) {
        const api = this.__repo.start('setShapesBorderStyle', {});
        try {
            for (let i = 0; i < actions.length; i++) {
                const {target, value, index} = actions[i];
                api.setBorderStyle(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    toggleShapesVisible(shapes: Shape[]) {
        const api = this.__repo.start('setShapesVisible', {});
        try {
            for (let i = 0; i < shapes.length; i++) {
                let shape: Shape | undefined = shapes[i];
                if (shape.type === ShapeType.Group) {
                    shape = this.__page.shapes.get(shape.id)
                }
                if (!shape) continue;
                api.shapeModifyVisible(this.__page, shape, !shape.isVisible);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    toggleShapesLock(shapes: Shape[]) {
        const api = this.__repo.start('setShapesLocked', {});
        try {
            for (let i = 0; i < shapes.length; i++) {
                let shape: Shape | undefined = shapes[i];
                if (shape.type === ShapeType.Group) {
                    shape = this.__page.shapes.get(shape.id)
                }
                if (!shape) continue;
                api.shapeModifyLock(this.__page, shape, !shape.isLocked);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    setBackground(color: Color) {
        const api = this.__repo.start('setBackground', {});
        try {
            api.pageModifyBackground(this.__document, this.__page.id, color);
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }

    setShapesRadius(shapes: Shape[], lt: number, rt: number, rb: number, lb: number) {
        const api = this.__repo.start('setShapesRadius', {});
        try {
            for (let i = 0; i < shapes.length; i++) {
                const s = shapes[i];
                if (s instanceof RectShape) api.shapeModifyRadius(this.__page, s, lt, rt, rb, lb);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }

    afterShapeListDrag(shapes: Shape[], host: Shape, position: 'upper' | 'inner' | 'lower') {
        // 数据校验
        if (host.type === ShapeType.SymbolRef && position === 'inner') return false;
        if (is_part_of_symbolref(host)) return false;
        const host_parent: GroupShape | undefined = host.parent as GroupShape;
        if (!host_parent || host_parent.isVirtualShape) return false;
        const pre: Shape[] = [];
        for (let i = 0, l = shapes.length; i < l; i++) {
            const item = shapes[i];
            if (item.type === ShapeType.Contact) continue;
            let next = false;
            let p: Shape | undefined = host;
            while (p) {
                if (p.id === item.id) {
                    next = true;
                    break;
                }
                p = p.parent;
            }
            if (next) continue;
            pre.push(item);
        }
        if (!pre.length) return false;

        const api = this.__repo.start('afterShapeListDrag', {});
        try {
            if (position === "inner") {
                for (let i = 0, l = pre.length; i < l; i++) {
                    const item = pre[i];
                    const parent: GroupShape | undefined = item.parent as GroupShape;
                    if (!parent) continue;
                    if (host.type === ShapeType.SymbolRef) continue;
                    const children = item.naviChilds || item.childs;
                    if (children?.length) {
                        const tree = item instanceof SymbolRefShape ? item.getRootData() : item;
                        if (!tree) continue;
                        if (is_circular_ref2(tree, parent.id)) continue;
                    }
                    const beforeXY = item.frame2Root();
                    let last = (host as GroupShape).childs.length;
                    if (parent.id === host.id) { // 同一父级
                        last--;
                    }
                    api.shapeMove(this.__page, parent, parent.indexOfChild(item), host as GroupShape, last);
                    translateTo(api, this.__page, item, beforeXY.x, beforeXY.y);
                    if (after_remove(parent)) this.delete_inner(this.__page, parent, api);
                }
            } else {
                for (let i = 0, l = pre.length; i < l; i++) {
                    const item = pre[i];
                    const parent: GroupShape | undefined = item.parent as GroupShape;
                    if (!parent) continue;
                    if (host_parent.type === ShapeType.SymbolRef) continue;
                    const children = item.naviChilds || item.childs;
                    if (children?.length) {
                        const tree = item instanceof SymbolRefShape ? item.getRootData() : item;
                        if (!tree) continue;
                        if (is_circular_ref2(tree, host_parent.id)) continue;
                    }
                    const beforeXY = item.frame2Root();
                    let index = host_parent.indexOfChild(host);
                    if (parent.id === host_parent.id) { // 同一父级
                        index = modify_index((parent) as GroupShape, item, host, index);
                    }
                    if (position === "upper") {
                        index++;
                    }
                    api.shapeMove(this.__page, parent, parent.indexOfChild(item), host_parent as GroupShape, index);
                    translateTo(api, this.__page, item, beforeXY.x, beforeXY.y);
                    if (after_remove(parent)) this.delete_inner(this.__page, parent, api);
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
        const api = this.__repo.start('setLinesLength', {});
        try {
            for (let i = 0, len = shapes.length; i < len; i++) {
                const s = shapes[i];
                if (s.type !== ShapeType.Line) continue;
                const o1 = s.matrix2Root().computeCoord2(0, 0);
                const f = s.frame, r = getHorizontalRadians({x: 0, y: 0}, {x: f.width, y: f.height});
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

    editor4Shape(shape: Shape): ShapeEditor {
        return new ShapeEditor(shape, this.__page, this.__repo, this.__document);
    }

    editor4TextShape(shape: Shape & { text: Text }): TextShapeEditor {
        return new TextShapeEditor(shape, this.__page, this.__repo, this.__document);
    }

    editor4Table(shape: TableShape): TableEditor {
        return new TableEditor(shape, this.__page, this.__repo, this.__document);
    }
}