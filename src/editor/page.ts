import { Shape, GroupShape } from "../data/shape";
import { ShapeEditor } from "./shape";
import { ShapeType } from "../data/typesdefine";
import { ShapeFrame } from "../data/shape";
import { Page } from "../data/page";
import { Matrix } from "../basic/matrix";
import { newArtboard, newGroupShape, newLineShape, newOvalShape, newRectShape } from "./creator";
import { Document } from "../data/document";
import { translateTo } from "./frame";
import { uuid } from "../basic/uuid";
import { CoopRepository } from "./cooprepo";
import { Api } from "./api";

function expandBounds(bounds: { left: number, top: number, right: number, bottom: number }, x: number, y: number) {
    if (x < bounds.left) bounds.left = x;
    else if (x > bounds.right) bounds.right = x;
    if (y < bounds.top) bounds.top = y;
    else if (y > bounds.bottom) bounds.bottom = y;
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
    group(shapes: Shape[], groupname: string): false | GroupShape { // todo 传入的shape需要提前排好序
        if (shapes.length === 0) return false;
        if (shapes.find((v) => !v.parent)) return false;
        const fshape = shapes[0];
        const savep = fshape.parent as GroupShape;

        const api = this.__repo.start("group", {});
        try {
            // 0、save shapes[0].parent？最外层shape？位置？

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

            // 4、将GroupShape加入到save parent中
            // savep.addChildAt(gshape, saveidx);
            api.shapeInsert(this.__page, savep, gshape, saveidx)
            // 2、将shapes里对象从parent中退出
            // 3、将shapes里对象插入新建的GroupShape
            for (let i = 0, len = shapes.length; i < len; i++) {
                const s = shapes[i];
                const p = s.parent as GroupShape;
                const idx = p.indexOfChild(s);
                // p.removeChild(s);
                // todo delete p if p is empty
                // todo update p's frame
                // gshape.addChild(s);
                api.shapeMove(this.__page, p, idx, gshape, gshape.childs.length);
                // cmd.addMove(p.id, gshape.id, idx, gshape.childs.length - 1, s.id)
                if (p.childs.length > 0) {
                    // updateFrame(p.childs[0])
                }
                else {
                    this.delete_inner(this.__page, p, api)
                }
            }

            // update childs frame
            for (let i = 0, len = shapes.length; i < len; i++) {
                const c = shapes[i]

                const r = realXY[i]
                const target = m.computeCoord(r.x, r.y);
                const cur = c.matrix2Parent().computeCoord(0, 0);

                // const frame = c.frame2Page();
                // const origin = { x: frame.x, y: frame.y }
                // c.frame.x += target.x - cur.x - xy.x; // 新建的group没有变换，可以直接减（xy）
                // c.frame.y += target.y - cur.y - xy.y;
                api.shapeModifyX(this.__page, c, c.frame.x + target.x - cur.x - xy.x);
                api.shapeModifyY(this.__page, c, c.frame.y + target.y - cur.y - xy.y)
                // const frame2 = c.frame2Page();
                // cmd.addModify(c.id, SHAPE_ATTR_ID.position, { x: frame2.x, y: frame2.y }, { x: frame2.x, y: frame2.y })
            }

            // 往上调整width,height
            // updateFrame(gshape)
            // this.__page.onAddShape(gshape, false);

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
            // 设置到shape上的旋转、翻转会丢失
            // adjust frame
            // const cmd = ShapeCmdGroup.Make(this.__page.id);

            for (let i = 0, len = shape.childs.length; i < len; i++) {
                const c = shape.childs[i]
                const m1 = c.matrix2Parent();
                m1.multiAtLeft(m);
                const target = m1.computeCoord(0, 0);

                if (shape.rotation) {
                    // const origin = c.rotation;
                    api.shapeModifyRotate(this.__page, c, (c.rotation || 0) + shape.rotation)
                    // c.rotate((c.rotation || 0) + shape.rotation);
                    // cmd.addModify(c.id, SHAPE_ATTR_ID.rotate, c.rotation, origin)
                }
                if (shape.isFlippedHorizontal) {
                    api.shapeModifyHFlip(this.__page, c, !c.isFlippedHorizontal)
                    // const origin = c.isFlippedHorizontal;
                    // c.flipHorizontal();
                    // cmd.addModify(c.id, SHAPE_ATTR_ID.hflip, c.isFlippedHorizontal, origin)
                }
                if (shape.isFlippedVertical) {
                    api.shapeModifyVFlip(this.__page, c, !c.isFlippedVertical)
                    // const origin = c.isFlippedVertical;
                    // c.flipVertical();
                    // cmd.addModify(c.id, SHAPE_ATTR_ID.vflip, c.isFlippedVertical, origin)
                }
                const m2 = c.matrix2Parent();
                const cur = m2.computeCoord(0, 0);

                // const frame = c.frame2Page();
                // const origin = { x: frame.x, y: frame.y }

                api.shapeModifyX(this.__page, c, c.frame.x + target.x - cur.x);
                api.shapeModifyY(this.__page, c, c.frame.y + target.y - cur.y);
                // c.frame.x += target.x - cur.x;
                // c.frame.y += target.y - cur.y;
                // const frame2 = c.frame2Page();
                // cmd.addModify(c.id, SHAPE_ATTR_ID.position, { x: frame2.x, y: frame2.y }, { x: frame2.x, y: frame2.y })
            }
            for (let len = shape.childs.length; len > 0; len--) {
                const c = shape.childs[0];
                api.shapeMove(this.__page, shape, 0, savep, idx)
                // cmd.addMove(shape.id, savep.id, 0, idx, c.id)
                // shape.removeChildAt(0);
                // savep.addChildAt(c, idx);
                idx++;
                childs.push(c);
            }
            // cmd.addDelete(savep.id, shape.id, saveidx)
            // savep.removeChild(shape);
            // this.__page.onRemoveShape(shape);
            api.shapeDelete(this.__page, savep, saveidx + childs.length)
            // todo: update frame
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
        // if (cmd) cmd.addDelete(p.id, shape.id, p.childs.findIndex((v) => v.id === shape.id))
        api.shapeDelete(page, p, p.indexOfChild(shape))
        // p.removeChild(shape);
        // this.__page.onRemoveShape(shape);
        if (p.childs.length > 0) {
            // updateFrame(p.childs[0])
        }
        else {
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
    // 插入成功，返回插入的shape
    insert(parent: GroupShape, index: number, shape: Shape): Shape | false {
        // adjust shape frame refer to parent
        const xy = parent.frame2Page();
        shape.frame.x -= xy.x;
        shape.frame.y -= xy.y;
        shape.id = uuid(); // 凡插入对象，不管是复制剪切的，都需要新id。要保持同一id，使用move!

        const api = this.__repo.start("insertshape", {});
        try {
            api.shapeInsert(this.__page, parent, shape, index);
            // parent.addChildAt(shape, index);
            // this.__page.onAddShape(shape);
            // updateFrame(shape);
            // shape = parent.childs[index];
            // const cmd = ShapeCmdGroup.Make(this.__page.id);
            // cmd.addInsert(parent.id, shape.id, index, exportShape(shape)!);
            // const frame = shape.frame2Page();
            // cmd.addModify(shape.id, SHAPE_ATTR_ID.position, { x: frame.x, y: frame.y }, { x: frame.x, y: frame.y })
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
        // const ids = (parent as GroupShape).childs.map((s: Shape) => s.id);
        // const index = ids.reverse().findIndex(i => i === shape.id);
        const index = parent.childs.length - parent.indexOfChild(shape) - 1;
        if (index < 0) return false;

        // 同一个group内，从index移动到index等于无操作
        if (target.id !== parent.id || to !== index && (to + 1) !== index) { // 还是在原来位置
            const api = this.__repo.start("move", {});
            try {
                if (target.id === parent.id) to = index >= to ? to : to + 1;
                api.shapeMove(this.__page, parent, index, target, to)
                // this.delete_inner(shape);
                // this.insert(target, to, shape);
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
        api.pageModifyName(this.__document, this.__page.id, name)
        // const origin = this.__page.name;
        // this.__page.name = name;
        // const pageListItem = this.__document.pagesList.find(p => p.id === this.__page.id);
        // if (pageListItem) {
        //     pageListItem.name = name;
        // }
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
            // const cmd = ShapeCmdGroup.Make(this.__page.id)
            const beforeXY = wanderer.frame2Page();
            const api = this.__repo.start('shapeLayerMove', {});
            if (wanderer.id !== host.parent?.id) {
                if (host.type === ShapeType.Artboard) {
                    if (offsetOverhalf) {
                        const wandererParent = wanderer.parent as GroupShape;
                        if (wandererParent && wandererParent.id !== host.id) {
                            // cmd.addMove(wandererParent.id, host.id, (wandererParent as GroupShape).indexOfChild(wanderer), (host as GroupShape).childs.length, wanderer.id);
                            api.shapeMove(this.__page, wandererParent, wandererParent.indexOfChild(wanderer), host as GroupShape, (host as GroupShape).childs.length);
                            // (wandererParent as GroupShape).removeChild(wanderer);
                            // (host as Artboard).addChildAt(wanderer);
                        }
                    } else {
                        const hostParent = host.parent as GroupShape;
                        const wandererParent = wanderer.parent as GroupShape;
                        if (hostParent && wandererParent) {
                            const saveidx = (wandererParent).indexOfChild(wanderer);
                            // (wandererParent as GroupShape).removeChild(wanderer);
                            const childs = (hostParent).childs;
                            const idx = childs.findIndex(i => i.id === host.id) + 1; // 列表是倒序!!!
                            // (hostParent as GroupShape).addChildAt(wanderer, idx);
                            // cmd.addMove(wandererParent.id, hostParent.id, saveidx, idx, wanderer.id);
                            api.shapeMove(this.__page, wandererParent, saveidx, hostParent, idx);
                        }
                    }
                } else {
                    const hostParent = host.parent as GroupShape;
                    const wandererParent = wanderer.parent as GroupShape;
                    if (hostParent && wandererParent) {
                        const saveidx = (wandererParent).indexOfChild(wanderer);

                        // (wandererParent).removeChild(wanderer);
                        const childs = (hostParent).childs;
                        let idx = childs.findIndex(i => i.id === host.id);
                        idx = offsetOverhalf ? idx : idx + 1; // 列表是倒序!!!
                        // (hostParent as GroupShape).addChildAt(wanderer, idx);

                        // cmd.addMove(wandererParent.id, hostParent.id, saveidx, idx, wanderer.id);
                        api.shapeMove(this.__page, wandererParent, saveidx, hostParent, idx);
                    }
                }
            }
            // const saveFrame = wanderer.frame2Page();
            // saveFrame.width = wanderer.frame.width;
            // saveFrame.height = wanderer.frame.height;

            translateTo(api, this.__page, wanderer, beforeXY.x, beforeXY.y);
            // const frame = wanderer.frame2Page();
            // if (saveFrame.x !== frame.x || saveFrame.y !== frame.y) {
            //     cmd.addModify(wanderer.id, SHAPE_ATTR_ID.position, { x: frame.x, y: frame.y }, { x: saveFrame.x, y: saveFrame.y })
            // }
            // const frame2 = wanderer.frame;
            // if (saveFrame.width !== frame2.width || saveFrame.height !== frame2.height) {
            //     cmd.addModify(wanderer.id, SHAPE_ATTR_ID.size, { w: frame2.width, h: frame2.height }, { w: saveFrame.width, h: saveFrame.height })
            // }
            this.__repo.commit();
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }

    }
    editor4Shape(shape: Shape): ShapeEditor {
        return new ShapeEditor(shape, this.__page, this.__repo);
    }
}