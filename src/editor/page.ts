import { Shape, GroupShape } from "../data/shape";
import { Artboard } from "../data/artboard";
import { Repository } from "../data/transact";
import { ShapeEditor } from "./shape";
import { exportShape, updateFrame } from "./utils";
import { ShapeType } from "../data/typesdefine";
import { ShapeFrame } from "../data/shape";
import { Page } from "../data/page";
import { Matrix } from "../basic/matrix";
import { newArtboard, newGroupShape, newLineShape, newOvalShape, newRectShape } from "./creator";
import { Document } from "../data/document";
import { translateTo } from "./frame";
import { PageModify, ShapeGroupCmd, ShapeInsert, ShapeMove } from "../coop/cmds";
import { PAGE_ATTR_ID, SHAPE_ATTR_ID } from "./consts";
import { exportGroupShape, exportShapeFrame } from "../io/baseexport";

function expandBounds(bounds: { left: number, top: number, right: number, bottom: number }, x: number, y: number) {
    if (x < bounds.left) bounds.left = x;
    else if (x > bounds.right) bounds.right = x;
    if (y < bounds.top) bounds.top = y;
    else if (y > bounds.bottom) bounds.bottom = y;
}

export class PageEditor {
    private __repo: Repository;
    private __page: Page;
    private __document: Document;
    constructor(repo: Repository, page: Page, document: Document) {
        this.__repo = repo;
        this.__page = page;
        this.__document = document;
    }
    group(shapes: Shape[], groupname: string): false | GroupShape { // todo 传入的shape需要提前排好序
        if (shapes.length === 0) return false;
        if (shapes.find((v) => !v.parent)) return false;

        this.__repo.start("group", {});
        try {
            // 0、save shapes[0].parent？最外层shape？位置？
            const fshape = shapes[0];
            const savep = fshape.parent as GroupShape;

            const saveidx = savep.indexOfChild(fshape);
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

            boundsArr.reduce((pre, cur, idx, arr) => {
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

            // 往上调整width & height

            const cmd = new ShapeGroupCmd(this.__page.id);
            cmd.addInsert(this.__page.id, savep.id, saveidx, JSON.stringify(exportGroupShape(gshape)))

            // 4、将GroupShape加入到save parent中
            savep.addChildAt(gshape, saveidx);
            // 2、将shapes里对象从parent中退出
            // 3、将shapes里对象插入新建的GroupShape
            for (let i = 0, len = shapes.length; i < len; i++) {
                const s = shapes[i];
                const p = s.parent as GroupShape;
                const idx = p.indexOfChild(s);
                p.removeChild(s);
                // todo delete p if p is empty
                // todo update p's frame
                gshape.addChild(s);
                cmd.addMove(this.__page.id, p.id, gshape.id, idx, gshape.childs.length - 1)
                if (p.childs.length > 0) {
                    updateFrame(p.childs[0])
                }
                else {
                    this.delete_inner(p, cmd)
                }
            }

            // update childs frame
            for (let i = 0, len = shapes.length; i < len; i++) {
                const c = shapes[i]

                const r = realXY[i]
                const target = m.computeCoord(r.x, r.y);
                const cur = c.matrix2Parent().computeCoord(0, 0);
                c.frame.x += target.x - cur.x - xy.x; // 新建的group没有变换，可以直接减（xy）
                c.frame.y += target.y - cur.y - xy.y;
            }

            // 往上调整width,height
            updateFrame(gshape)
            this.__page.addShape(gshape);

            this.__repo.commit(cmd);
            return gshape;
        }
        catch (e) {
            this.__repo.rollback();
        }
        return false;
    }

    ungroup(shape: GroupShape): false | Shape[] {
        if (!shape.parent) return false;

        this.__repo.start("", {});
        try {
            const savep = shape.parent as GroupShape;
            let idx = savep.indexOfChild(shape);
            const saveidx = idx;
            const m = shape.matrix2Parent();
            const childs: Shape[] = [];
            // 设置到shape上的旋转、翻转会丢失
            // adjust frame
            const cmd = new ShapeGroupCmd(this.__page.id);

            for (let i = 0, len = shape.childs.length; i < len; i++) {
                const c = shape.childs[i]
                const m1 = c.matrix2Parent();
                m1.multiAtLeft(m);
                const target = m1.computeCoord(0, 0);

                if (shape.rotation) c.rotate((c.rotation || 0) + shape.rotation);
                if (shape.isFlippedHorizontal) c.flipHorizontal();
                if (shape.isFlippedVertical) c.flipVertical();
                const m2 = c.matrix2Parent();
                const cur = m2.computeCoord(0, 0);
                c.frame.x += target.x - cur.x;
                c.frame.y += target.y - cur.y;
            }
            for (let len = shape.childs.length; len > 0; len--) {
                const c = shape.childs[0];
                cmd.addMove(this.__page.id, shape.id, savep.id, 0, idx)
                shape.removeChildAt(0);
                savep.addChildAt(c, idx);
                childs.push(c);
                idx++;
            }
            cmd.addDelete(this.__page.id, savep.id, saveidx, 1)
            savep.removeChild(shape);
            this.__page.removeShape(shape);
            // todo: update frame
            this.__repo.commit(cmd);
            return childs;
        } catch (e) {
            this.__repo.rollback();
        }
        return false;
    }

    private delete_inner(shape: Shape, cmd?: ShapeGroupCmd): boolean {
        const p = shape.parent as GroupShape;
        if (!p) return false;
        if (cmd) cmd.addDelete(this.__page.id, p.id, p.childs.findIndex((v) => v.id === shape.id), 1)
        p.removeChild(shape);
        if (p.childs.length > 0) {
            updateFrame(p.childs[0])
        }
        else {
            this.delete_inner(p, cmd)
        }
        return true;
    }
    delete(shape: Shape): boolean {
        this.__repo.start("delete", {});
        const savep = shape.parent as GroupShape;
        if (!savep) return false;
        try {
            const cmd = new ShapeGroupCmd(this.__page.id)
            if (this.delete_inner(shape, cmd)) {
                this.__page.removeShape(shape);
                this.__repo.commit(cmd)
                return true;
            }
            else {
                this.__repo.rollback();
            }
        } catch (e) {
            this.__repo.rollback();
        }
        return false;
    }
    // 插入成功，返回插入的shape
    insert(parent: GroupShape, index: number, shape: Shape): Shape | false {
        // adjust shape frame refer to parent
        const xy = parent.frame2Page();
        shape.frame.x -= xy.x;
        shape.frame.y -= xy.y;

        this.__repo.start("insertshape", {});
        try {
            parent.addChildAt(shape, index);
            this.__page.addShape(shape);
            updateFrame(shape);
            shape = parent.childs[index];
            this.__repo.commit(new ShapeInsert(this.__page.id, parent.id, index, JSON.stringify(exportShape(shape))));
            return shape;
        } catch (e) {
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
        // const ids = (parent as GroupShape).childs.map((s: Shape) => s.id);
        // const index = ids.reverse().findIndex(i => i === shape.id);
        const index = parent.childs.length - parent.indexOfChild(shape) - 1;
        if (index < 0) return false;

        if (target.id === parent.id) {
            // 同一个group内，从index移动到index等于无操作
            if (to !== index && (to + 1) !== index) { // 还是在原来位置
                this.__repo.start("move", {});
                try {
                    this.delete_inner(shape);
                    to = index > to ? to : to + 1;
                    this.insert(target, to, shape);
                    this.__repo.commit(new ShapeMove(this.__page.id, parent.id, target.id, index, to));
                    return true;
                }
                catch (error) {
                    this.__repo.rollback();
                }
            }
        } else {
            this.__repo.start("move", {});
            try {

                this.delete_inner(shape);
                this.insert(target, to, shape);
                this.__repo.commit(new ShapeMove(this.__page.id, parent.id, target.id, index, to));
                return true;
            }
            catch (error) {
                this.__repo.rollback();
            }
        }
        return false;
    }
    setName(name: string) {
        this.__repo.start("setName", {});
        this.__page.name = name;
        const pageListItem = this.__document.pagesList.find(p => p.id === this.__page.id);
        if (pageListItem) {
            pageListItem.name = name;
        }
        this.__repo.commit(new PageModify(this.__document.id, this.__page.id, PAGE_ATTR_ID.name, name));
    }

    /**
     * wanderer 被拖动的shape item
     * host 处于目的地的shape item
     * offsetOverhalf 鼠标光标在目的地的位置是否超过目的地DOM范围的一半，此参数将影响wanderer插入的位置在host的上下位置
     * @returns 
     */
    shapeListDrag(wanderer: Shape, host: Shape, offsetOverhalf: boolean) {
        if (wanderer && host) {
            try {
                const cmd = new ShapeGroupCmd(this.__page.id)
                const beforeXY = wanderer.frame2Page();
                this.__repo.start('shapeLayerMove', {});
                if (wanderer.id !== host.parent?.id) {
                    if (host.type === ShapeType.Artboard) {
                        if (offsetOverhalf) {
                            const wandererParent = wanderer.parent;
                            if (wandererParent && wandererParent.id !== host.id) {
                                cmd.addMove(this.__page.id, wandererParent.id, host.id, (wandererParent as GroupShape).indexOfChild(wanderer), (host as GroupShape).childs.length);
                                (wandererParent as GroupShape).removeChild(wanderer);
                                (host as Artboard).addChildAt(wanderer);
                            }
                        } else {
                            const hostParent = host.parent;
                            const wandererParent = wanderer.parent;
                            if (hostParent && wandererParent) {
                                const saveidx = (wandererParent as GroupShape).indexOfChild(wanderer);
                                (wandererParent as GroupShape).removeChild(wanderer);
                                const childs = (hostParent as GroupShape).childs;
                                const idx = childs.findIndex(i => i.id === host.id) + 1; // 列表是倒序!!!
                                (hostParent as GroupShape).addChildAt(wanderer, idx);
                                cmd.addMove(this.__page.id, wandererParent.id, hostParent.id, saveidx, idx);
                            }
                        }
                    } else {
                        const hostParent = host.parent;
                        const wandererParent = wanderer.parent;
                        if (hostParent && wandererParent) {
                            const saveidx = (wandererParent as GroupShape).indexOfChild(wanderer);

                            (wandererParent as GroupShape).removeChild(wanderer);
                            const childs = (hostParent as GroupShape).childs;
                            let idx = childs.findIndex(i => i.id === host.id);
                            idx = offsetOverhalf ? idx : idx + 1; // 列表是倒序!!!
                            (hostParent as GroupShape).addChildAt(wanderer, idx);

                            cmd.addMove(this.__page.id, wandererParent.id, hostParent.id, saveidx, idx);

                        }
                    }
                }
                const saveFrame = exportShapeFrame(wanderer.frame);
                translateTo(wanderer, beforeXY.x, beforeXY.y);
                const frame = wanderer.frame;
                if (saveFrame.x !== frame.x || saveFrame.y !== frame.y) {
                    cmd.addModify(this.__page.id, wanderer.id, SHAPE_ATTR_ID.xy, JSON.stringify({ x: frame.x, y: frame.y }))
                }
                if (saveFrame.width !== frame.width || saveFrame.height !== frame.height) {
                    cmd.addModify(this.__page.id, wanderer.id, SHAPE_ATTR_ID.wh, JSON.stringify({ w: frame.width, h: frame.height }))
                }
                this.__repo.commit(cmd);
            } catch (error) {
                this.__repo.rollback();
            }
        }
    }
    editor4Shape(shape: Shape): ShapeEditor {
        return new ShapeEditor(shape, this.__page, this.__repo);
    }
}