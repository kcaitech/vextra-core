import { Shape, GroupShape, ShapeFrame, PathShape2, RectShape } from "../data/shape";
import { ShapeEditor } from "./shape";
import { BoolOp, BorderPosition, ShapeType } from "../data/typesdefine";
import { Page } from "../data/page";
import { newArtboard, newSolidColorFill, newGroupShape, newLineShape, newOvalShape, newPathShape, newRectShape } from "./creator";
import { Document } from "../data/document";
import { translateTo, translate, expand } from "./frame";
import { uuid } from "../basic/uuid";
import { CoopRepository } from "./command/cooprepo";
import { Api } from "./command/recordapi";
import { Border, BorderStyle, Color, Fill, Artboard, Path, PathShape, Style, TableShape, Text } from "../data/classes";
import { TextShapeEditor } from "./textshape";
import { transform_data } from "../io/cilpboard";
import { deleteEmptyGroupShape, expandBounds, group, ungroup } from "./group";
import { render2path } from "../render";
import { Matrix } from "../basic/matrix";
import { IImportContext, importBorder, importStyle } from "../io/baseimport";
import { gPal } from "../basic/pal";
import { findUsableBorderStyle, findUsableFillStyle } from "../render/boolgroup";
import { BasicArray } from "../data/basic";
import { TableEditor } from "./table";

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
        }
        catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    ungroup(shape: GroupShape): false | Shape[] {
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
        }
        catch (e) {
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
        }
        catch (e) {
            console.log(e)
            this.__repo.rollback();
        }
        return false;
    }

    private cloneStyle(style: Style): Style {
        const _this = this;
        const ctx: IImportContext = new class implements IImportContext { document: Document = _this.__document };
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
                }
                else {
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

        const path = render2path(shape);

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

    private delete_inner(page: Page, shape: Shape, api: Api): boolean {
        const p = shape.parent as GroupShape;
        if (!p) return false;
        api.shapeDelete(page, p, p.indexOfChild(shape))
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
            if (this.delete_inner(page, shape, api)) {
                if (!savep.childs.length && savep.type === ShapeType.Group) {
                    this.delete_inner(page, savep, api);
                }
                this.__repo.commit()
                return true;
            }
            else {
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
        for (let i = 0; i < shapes.length; i++) {
            try {
                const shape = shapes[i];
                const page = shape.getPage() as Page;
                if (!page) return false;
                const savep = shape.parent as GroupShape;
                if (!savep) return false;
                this.delete_inner(page, shape, api);
                if (!savep.childs.length && savep.type === ShapeType.Group) {
                    this.delete_inner(page, savep, api);
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
    // 创建一个shape
    create(type: ShapeType, name: string, frame: ShapeFrame): Shape {
        switch (type) {
            case ShapeType.Artboard: return newArtboard(name, frame);
            case ShapeType.Rectangle: return newRectShape(name, frame);
            case ShapeType.Oval: return newOvalShape(name, frame);
            case ShapeType.Line: return newLineShape(name, frame);
            default: return newRectShape(name, frame);
        }
    }
    createGroup() {
        return newGroupShape('tool-group');
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
            }
            catch (error) {
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
                const save_frame = { x: fr.x, y: fr.y };
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
        api.pageModifyName(this.__document, this.__page.id, name);
        this.__repo.commit();
    }

    /**
     * wanderer 被拖动的shape item
     * host 处于目的地的shape item
     * offsetOverhalf 鼠标光标在目的地的位置是否超过目的地DOM范围的一半，此参数将影响wanderer插入的位置在host的上下位置
     * @returns 
     */
    shapeListDrag(wanderer: Shape, host: Shape, offsetOverhalf: boolean) {
        if (!wanderer || !host) return;
        try {
            const beforeXY = wanderer.frame2Root();
            const api = this.__repo.start('shapeLayerMove', {});
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
        try {
            const api = this.__repo.start('arrange', {});
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
        try {
            const api = this.__repo.start('setShapesConstrainerProportions', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.shapeModifyConstrainerProportions(this.__page, target, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesFrame(actions: FrameAdjust[]) {
        try {
            const api = this.__repo.start('setShapesFrame', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, widthExtend, heightExtend } = actions[i];
                expand(api, this.__page, target, widthExtend, heightExtend);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesRotate(actions: RotateAdjust[]) {
        try {
            const api = this.__repo.start('RotateAdjust', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.shapeModifyRotate(this.__page, target, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    shapesFlip(actions: FlipAction[]) {
        try {
            const api = this.__repo.start('shapesFlip', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, direction } = actions[i];
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
        try {
            const api = this.__repo.start('setShapesFillColor', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setFillColor(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesFillEnabled(actions: FillEnableAction[]) {
        try {
            const api = this.__repo.start('setShapesFillEnabled', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setFillEnable(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    shapesAddFill(actions: FillAddAction[]) {
        try {
            const api = this.__repo.start('shapesAddFill', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.addFillAt(this.__page, target, value, target.style.fills.length);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    shapesDeleteFill(actions: FillDeleteAction[]) {
        try {
            const api = this.__repo.start('shapesDeleteFill', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, index } = actions[i];
                api.deleteFillAt(this.__page, target, index);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    shapesFillsUnify(actions: FillsReplaceAction[]) {
        try {
            const api = this.__repo.start('shapesFillsUnify', {}); // 统一多个shape的填充设置。eg:[red, red], [green], [blue, blue, blue] => [red, red], [red, red], [red, red];
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
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
        try {
            const api = this.__repo.start('setShapesBorderColor', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setBorderColor(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesBorderEnabled(actions: BorderEnableAction[]) {
        try {
            const api = this.__repo.start('setShapesBorderEnabled', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, index, value } = actions[i];
                api.setBorderEnable(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    shapesAddBorder(actions: BorderAddAction[]) {
        try {
            const api = this.__repo.start('shapesAddBorder', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.addBorderAt(this.__page, target, value, target.style.borders.length);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    shapesDeleteBorder(actions: BorderDeleteAction[]) {
        try {
            const api = this.__repo.start('shapesDeleteBorder', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, index } = actions[i];
                api.deleteBorderAt(this.__page, target, index);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    shapesBordersUnify(actions: BordersReplaceAction[]) {
        try {
            const api = this.__repo.start('shapesBordersUnify', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, value } = actions[i];
                api.deleteBorders(this.__page, target, 0, target.style.borders.length);
                api.addBorders(this.__page, target, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesBorderPosition(actions: BorderPositionAction[]) {
        try {
            const api = this.__repo.start('setShapesBorderPosition', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                api.setBorderPosition(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesBorderThickness(actions: BorderThicknessAction[]) {
        try {
            const api = this.__repo.start('setShapesBorderThickness', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                api.setBorderThickness(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    setShapesBorderStyle(actions: BorderStyleAction[]) {
        try {
            const api = this.__repo.start('setShapesBorderStyle', {});
            for (let i = 0; i < actions.length; i++) {
                const { target, value, index } = actions[i];
                api.setBorderStyle(this.__page, target, index, value);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    toggleShapesVisible(shapes: Shape[]) {
        try {
            const api = this.__repo.start('setShapesVisible', {});
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
        try {
            const api = this.__repo.start('setShapesLocked', {});
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
        try {
            const api = this.__repo.start('setBackground', {});
            api.pageModifyBackground(this.__document, this.__page.id, color);
            this.__repo.commit();
        } catch (error) {
            console.log(error);
            this.__repo.rollback();
        }
    }
    setShapesRadius(shapes: Shape[], lt: number, rt: number, rb: number, lb: number) {
        try {
            const api = this.__repo.start('setShapesRadius', {});
            for (let i = 0; i < shapes.length; i++) {
                const s = shapes[i];
                if (s instanceof RectShape) api.shapeModifyRadius(this.__page, s, lt, rt, rb, lb);
            }
            this.__repo.commit();
        } catch (error) {
            this.__repo.rollback();
        }
    }
    editor4Shape(shape: Shape): ShapeEditor {
        return new ShapeEditor(shape, this.__page, this.__repo);
    }
    editor4TextShape(shape: Shape & { text: Text }): TextShapeEditor {
        return new TextShapeEditor(shape, this.__page, this.__repo);
    }
    editor4Table(shape: TableShape): TableEditor {
        return new TableEditor(shape, this.__page, this.__repo);
    }
}