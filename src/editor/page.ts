import { Shape, GroupShape, ShapeFrame, TextShape } from "../data/shape";
import { ShapeEditor } from "./shape";
import { BorderPosition, ShapeType } from "../data/typesdefine";
import { Page } from "../data/page";
import { Matrix } from "../basic/matrix";
import { newArtboard, newGroupShape, newLineShape, newOvalShape, newRectShape } from "./creator";
import { Document } from "../data/document";
import { translateTo, translate, expand } from "./frame";
import { uuid } from "../basic/uuid";
import { CoopRepository } from "./command/cooprepo";
import { Api } from "./command/recordapi";
import { Border, BorderStyle, Color, Fill } from "../data/classes";
import { TextShapeEditor } from "./textshape";

function expandBounds(bounds: { left: number, top: number, right: number, bottom: number }, x: number, y: number) {
    if (x < bounds.left) bounds.left = x;
    else if (x > bounds.right) bounds.right = x;
    if (y < bounds.top) bounds.top = y;
    else if (y > bounds.bottom) bounds.bottom = y;
}
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
            const gshape = newGroupShape(groupname);
            // 计算frame
            //   计算每个shape的绝对坐标
            const boundsArr = shapes.map((s) => {
                const box = s.boundingBox()
                const p = s.parent!;
                const m = p.matrix2Page();
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

            const realXY = shapes.map((s) => s.frame2Page())

            const m = new Matrix(savep.matrix2Page().inverse)
            const xy = m.computeCoord(bounds.left, bounds.top)

            gshape.frame.width = bounds.right - bounds.left;
            gshape.frame.height = bounds.bottom - bounds.top;
            gshape.frame.x = xy.x;
            gshape.frame.y = xy.y;

            // 4、将GroupShape加入到save parent(层级最高图形的parent)中
            api.shapeInsert(this.__page, savep, gshape, saveidx)

            // 2、将shapes里对象从parent中退出
            // 3、将shapes里的对象从原本parent下移入新建的GroupShape
            for (let i = 0, len = shapes.length; i < len; i++) {
                const s = shapes[i];
                const p = s.parent as GroupShape;
                const idx = p.indexOfChild(s);
                api.shapeMove(this.__page, p, idx, gshape, 0); // 层级低的放前面

                if (p.childs.length <= 0) {
                    this.delete_inner(this.__page, p, api)
                }
            }

            // 往上调整width & height
            // update childs frame
            for (let i = 0, len = shapes.length; i < len; i++) {
                const c = shapes[i]

                const r = realXY[i]
                const target = m.computeCoord(r.x, r.y);
                const cur = c.matrix2Parent().computeCoord(0, 0);

                api.shapeModifyX(this.__page, c, c.frame.x + target.x - cur.x - xy.x);
                api.shapeModifyY(this.__page, c, c.frame.y + target.y - cur.y - xy.y)
            }

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
            const savep = shape.parent as GroupShape;
            let idx = savep.indexOfChild(shape);
            const saveidx = idx;
            const m = shape.matrix2Parent();
            const childs: Shape[] = [];

            for (let i = 0, len = shape.childs.length; i < len; i++) {
                const c = shape.childs[i]
                const m1 = c.matrix2Parent();
                m1.multiAtLeft(m);
                const target = m1.computeCoord(0, 0);

                if (shape.rotation) {
                    api.shapeModifyRotate(this.__page, c, (c.rotation || 0) + shape.rotation)
                }
                if (shape.isFlippedHorizontal) {
                    api.shapeModifyHFlip(this.__page, c, !c.isFlippedHorizontal)
                }
                if (shape.isFlippedVertical) {
                    api.shapeModifyVFlip(this.__page, c, !c.isFlippedVertical)
                }
                const m2 = c.matrix2Parent();
                const cur = m2.computeCoord(0, 0);

                api.shapeModifyX(this.__page, c, c.frame.x + target.x - cur.x);
                api.shapeModifyY(this.__page, c, c.frame.y + target.y - cur.y);
            }
            for (let len = shape.childs.length; len > 0; len--) {
                const c = shape.childs[0];
                api.shapeMove(this.__page, shape, 0, savep, idx)
                idx++;
                childs.push(c);
            }
            api.shapeDelete(this.__page, savep, saveidx + childs.length)
            this.__repo.commit();
            return childs;
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
        if (p.childs.length <= 0) {
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
                if (!savep.childs.length) {
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
                this.delete_inner(page, shape, api)
                if (!savep.childs.length) {
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
            const xy = parent.frame2Page();
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
            const beforeXY = wanderer.frame2Page();
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
    editor4Shape(shape: Shape): ShapeEditor {
        return new ShapeEditor(shape, this.__page, this.__repo);
    }
    editor4TextShape(shape: TextShape): TextShapeEditor {
        return new TextShapeEditor(shape, this.__page, this.__repo);
    }
}