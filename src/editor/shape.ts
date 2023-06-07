import { GroupShape, Shape, TextShape } from "../data/shape";
import { Color, MarkerType } from "../data/style";
import { Repository } from "../data/transact";
import { addFill, deleteFillAt, setFillColor, toggleFillEnabled } from "./fill";
import { deleteBorderAt, addBorder, setBorderThickness, setBorderPosition, setBorderStyle, setBorderApexStyle, setBorderEnable, setBorderColor } from "./border";
import { expand, expandTo, translate, translateTo } from "./frame";
import { Border, BorderPosition, BorderStyle, Fill } from "../data/style";
import { RectRadius, ShapeType } from "../data/baseclasses";
import { updateFrame } from "./utils";
import { Artboard } from "../data/artboard";
import { createHorizontalBox } from "../basic/utils";
import { SpanAttr } from "../data/text";
import { deleteText, insertText } from "./text";
import { Page } from "../data/page";
import { ShapeCmdRemove, ShapeCmdModify, ShapeArrayAttrRemove, ShapeArrayAttrInsert, TextCmdRemove, TextCmdInsert, ShapeCmdGroup, ShapeArrayAttrModify } from "../coop/data/classes";
import { BORDER_ATTR_ID, BORDER_ID, FILLS_ATTR_ID, FILLS_ID, SHAPE_ATTR_ID } from "./consts";
import { exportBorder, exportBorderPosition, exportBorderStyle, exportColor, exportFill } from "../io/baseexport";
export class ShapeEditor {
    private __shape: Shape;
    private __repo: Repository;
    private __page: Page;
    constructor(shape: Shape, page: Page, repo: Repository) {
        this.__shape = shape;
        this.__repo = repo;
        this.__page = page;
    }

    public setName(name: string) {
        this.__repo.start('setName', {});
        const origin = this.__shape.name;
        this.__shape.setName(name);
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.name, name, origin));
    }
    public toggleVisible() {
        this.__repo.start('toggleVisible', {});
        const origin = this.__shape.isVisible;
        this.__shape.toggleVisible();
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.visible, this.__shape.isVisible, origin));
    }
    public toggleLock() {
        this.__repo.start('toggleLock', {});
        const origin = this.__shape.isLocked;
        this.__shape.toggleLock();
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.lock, this.__shape.isLocked, origin));
    }
    public translate(dx: number, dy: number, round: boolean = true) {
        this.__repo.start("translate", {});
        const frame = this.__shape.frame;
        const origin = { x: frame.x, y: frame.y }
        translate(this.__shape, dx, dy, round);
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.frame_xy, { x: frame.x, y: frame.y }, origin));
    }
    public translateTo(x: number, y: number) {
        this.__repo.start("translateTo", {});
        const frame = this.__shape.frame;
        const origin = { x: frame.x, y: frame.y }
        translateTo(this.__shape, x, y);
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.frame_xy, { x: frame.x, y: frame.y }, origin));
    }
    public expand(dw: number, dh: number) {
        this.__repo.start("expand", {});
        const frame = this.__shape.frame;
        const origin = { w: frame.width, h: frame.height }
        expand(this.__shape, dw, dh);
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.frame_wh, { w: frame.width, h: frame.height }, origin));
    }
    public expandTo(w: number, h: number) {
        this.__repo.start("expandTo", {});
        const frame = this.__shape.frame;
        const origin = { w: frame.width, h: frame.height }
        expandTo(this.__shape, w, h);
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.frame_wh, { w: frame.width, h: frame.height }, origin));
    }

    // flip
    public flipH() {
        this.__repo.start("flipHorizontal", {});
        const origin = this.__shape.isFlippedHorizontal;
        this.__shape.flipHorizontal();
        updateFrame(this.__shape);
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.hflip, this.__shape.isFlippedHorizontal, origin));
    }
    public flipV() {
        this.__repo.start("flipVertical", {});
        const origin = this.__shape.isFlippedVertical;
        this.__shape.flipVertical();
        updateFrame(this.__shape);
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.vflip, this.__shape.isFlippedVertical, origin));
    }
    // resizingConstraint
    public setResizingConstraint(value: number) {
        this.__repo.start("setResizingConstraint", {});
        const origin = this.__shape.resizingConstraint;
        this.__shape.setResizingConstraint(value);
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.resizingConstraint, this.__shape.resizingConstraint, origin));
    }
    // rotation
    public rotate(deg: number) {
        this.__repo.start("rotate", {});
        deg = deg % 360;
        const origin = this.__shape.rotation;
        this.__shape.rotate(deg);
        updateFrame(this.__shape);
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.rotate, this.__shape.rotation, origin));
    }
    // radius
    public setRadius(radius: RectRadius) {
        this.__repo.start("setRadius", {});
        if (!(this.__shape.type === ShapeType.Rectangle)) {
            radius.rlb = radius.rrt = radius.rrb = 0;
        }
        const origin = this.__shape.fixedRadius;
        this.__shape.setRadius(radius);
        // updateFrame(this.__shape);
        this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.radius, radius, origin));
    }

    // fill
    public addFill(fill: Fill) {
        this.__repo.start("addFill", {});
        if (this.__shape.type !== ShapeType.Artboard) {
            addFill(this.__shape.style, fill);
        }
        this.__repo.commit(ShapeArrayAttrInsert.Make(this.__page.id, this.__shape.id, FILLS_ID, this.__shape.style.fills.length - 1, FILLS_ID, JSON.stringify(exportFill(fill))));
    }
    public setFillColor(idx: number, color: Color) {
        this.__repo.start("setFillColor", {});
        if (this.__shape.type === ShapeType.Artboard) {
            const origin = (this.__shape as Artboard).backgroundColor;
            (this.__shape as Artboard).setArtboardColor(color); // 画板的背景色不在shape的style中
            this.__repo.commit(ShapeCmdModify.Make(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.backgroundColor, exportColor(color), origin));
        } else {
            setFillColor(this.__shape.style, idx, color);
            this.__repo.commit(ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, FILLS_ID, this.__shape.style.fills[idx].id, FILLS_ATTR_ID.color, exportColor(color)));
        }
    }

    public toggleFillEnable(idx: number) {
        this.__repo.start("setFillEnable", {});
        if (this.__shape.type !== ShapeType.Artboard) {
            toggleFillEnabled(this.__shape.style, idx);
        }
        this.__repo.commit(ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, FILLS_ID, this.__shape.style.fills[idx].id, FILLS_ATTR_ID.enable, JSON.stringify(this.__shape.style.fills[idx].isEnabled)));
    }
    public deleteFill(idx: number) {
        if (this.__shape.type !== ShapeType.Artboard) {
            this.__repo.start("deleteFill", {});
            deleteFillAt(this.__shape.style, idx);
            this.__repo.commit(ShapeArrayAttrRemove.Make(this.__page.id, this.__shape.id, FILLS_ID, idx));
        }
    }

    // border
    public setBorderEnable(idx: number, isEnabled: boolean) {
        this.__repo.start("setBorderEnable", {});
        setBorderEnable(this.__shape.style, idx, isEnabled);
        this.__repo.commit(ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id,
            BORDER_ATTR_ID.enable, JSON.stringify(this.__shape.style.borders[idx].isEnabled)));
    }
    public setBorderColor(idx: number, color: Color) {
        this.__repo.start("setBorderColor", {});
        setBorderColor(this.__shape.style, idx, color);
        this.__repo.commit(ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id,
            BORDER_ATTR_ID.color, JSON.stringify(exportColor(color))));
    }
    public setBorderThickness(idx: number, thickness: number) {
        this.__repo.start("setBorderThickness", {});
        setBorderThickness(this.__shape.style, idx, thickness);
        this.__repo.commit(ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id,
            BORDER_ATTR_ID.thickness, JSON.stringify(thickness)));
    }
    public setBorderPosition(idx: number, position: BorderPosition) {
        this.__repo.start("setBorderPosition", {});
        setBorderPosition(this.__shape.style, idx, position);
        this.__repo.commit(ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id,
            BORDER_ATTR_ID.position, JSON.stringify(exportBorderPosition(position))));
    }
    public setBorderStyle(idx: number, borderStyle: BorderStyle) {
        this.__repo.start("setBorderStyle", {});
        setBorderStyle(this.__shape.style, idx, borderStyle);
        this.__repo.commit(ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id,
            BORDER_ATTR_ID.borderStyle, JSON.stringify(exportBorderStyle(borderStyle))));
    }
    public setBorderApexStyle(idx: number, apexStyle: MarkerType, isEnd: boolean) {
        this.__repo.start("setBorderApexStyle", {});
        setBorderApexStyle(this.__shape.style, idx, apexStyle, isEnd);
        this.__repo.commit(ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id,
            isEnd ? BORDER_ATTR_ID.endMarkerType : BORDER_ATTR_ID.startMarkerType, apexStyle));
    }
    public deleteBorder(idx: number) {
        this.__repo.start("deleteBorder", {});
        deleteBorderAt(this.__shape.style, idx)
        this.__repo.commit(ShapeArrayAttrRemove.Make(this.__page.id, this.__shape.id, BORDER_ID, idx));
    }
    public addBorder(border: Border) {
        this.__repo.start("addBorder", {});
        addBorder(this.__shape.style, border)
        this.__repo.commit(ShapeArrayAttrInsert.Make(this.__page.id, this.__shape.id, BORDER_ID, this.__shape.style.borders.length - 1, JSON.stringify(exportBorder(border))));
    }

    // 容器自适应大小
    public adapt() {
        if (this.__shape.type === ShapeType.Artboard) {
            const childs = (this.__shape as Artboard).childs;
            if (childs.length) {
                try {
                    // 保存可能修改到的属性
                    const saveDatas: {
                        shape: Shape,
                        x: number,
                        y: number,
                        w: number,
                        h: number,
                        rotate: number | undefined,
                        hflip: boolean | undefined,
                        vflip: boolean | undefined
                    }[] = childs.map((shape) => {
                        const frame = shape.frame;
                        return {
                            shape,
                            x: frame.x,
                            y: frame.y,
                            w: frame.width,
                            h: frame.height,
                            rotate: shape.rotation,
                            hflip: shape.isFlippedHorizontal,
                            vflip: shape.isFlippedVertical
                        }
                    })
                    this.__repo.start("adapt", {});
                    const __points: [number, number][] = [];
                    childs.forEach(p => {
                        const { x, y, width, height } = p.frame2Page();
                        const _ps: [number, number][] = [
                            [x, y],
                            [x + width, y],
                            [x + width, y + height],
                            [x, y + height]
                        ]
                        __points.push(..._ps);
                    })
                    const box = createHorizontalBox(__points);
                    if (box) {
                        const { x: ox, y: oy } = this.__shape.frame2Page();
                        const { dx, dy } = { dx: ox - box.left, dy: oy - box.top };
                        for (let i = 0; i < childs.length; i++) { translate(childs[i], dx, dy) };
                        expandTo(this.__shape, box.right - box.left, box.bottom - box.top);
                        translateTo(this.__shape, box.left, box.top);

                        const page = saveDatas[0].shape.getPage();
                        const cmd = ShapeCmdGroup.Make(page?.id || '');
                        saveDatas.forEach((cur) => {
                            const frame = cur.shape.frame;
                            if (frame.x !== cur.x || frame.y !== cur.y) {
                                cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.frame_xy, { x: frame.x, y: frame.y }, { x: cur.x, y: cur.y })
                            }
                            if (frame.width !== cur.w || frame.height !== cur.h) {
                                cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.frame_wh, { w: frame.width, h: frame.height }, { w: cur.w, h: cur.h })
                            }
                            if (cur.shape.isFlippedHorizontal !== cur.hflip) {
                                cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.hflip, cur.shape.isFlippedHorizontal, cur.hflip)
                            }
                            if (cur.shape.isFlippedVertical !== cur.vflip) {
                                cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.vflip, cur.shape.isFlippedVertical, cur.vflip)
                            }
                            if (cur.shape.rotation !== cur.rotate) {
                                cmd.addModify(cur.shape.id, SHAPE_ATTR_ID.rotate, cur.shape.rotation, cur.rotate)
                            }
                        });

                        if (!page) {
                            this.__repo.rollback();
                        }
                        else {
                            this.__repo.commit(cmd);
                        }

                    } else {
                        this.__repo.rollback();
                    }
                } catch (error) {
                    this.__repo.rollback();
                    throw new Error(`${error}`);
                }
            }
        }
    }
    // 删除图层
    public delete() {
        try {
            this.__repo.start("deleteShape", {});
            const parent = this.__shape.parent;
            if (parent) {
                const childs = (parent as GroupShape).childs;
                const index = childs.findIndex(s => s.id === this.__shape.id);
                if (index > -1) {
                    childs.splice(index, 1);
                    this.__page.onRemoveShape(this.__shape);
                    this.__repo.commit(ShapeCmdRemove.Make(this.__page.id, parent.id, this.__shape.id, index));
                } else {
                    this.__repo.rollback();
                }
            } else {
                this.__repo.rollback();
            }
        } catch (error) {
            this.__repo.rollback();
            throw new Error(`${error}`);
        }
    }
    // public insertText(text: string, index: number, attr?: SpanAttr) {
    //     if (!(this.__shape instanceof TextShape)) return;
    //     try {
    //         this.__repo.start("insertText", {});
    //         insertText(this.__shape, text, index, attr);
    //         this.__repo.commit({});
    //     } catch (error) {
    //         this.__repo.rollback();
    //     }
    // }
    public insertText(text: string, index: number, attr?: SpanAttr): boolean {
        return this.insertText2(text, index, 0, attr);
    }

    public deleteText(index: number, count: number): boolean {
        if (!(this.__shape instanceof TextShape)) return false;
        if (index < 0) {
            count += index;
            index = 0;
        }
        if (count <= 0) return false;
        try {
            this.__repo.start("deleteText", {});
            deleteText(this.__shape, index, count);
            this.__repo.commit(TextCmdRemove.Make(this.__page.id, this.__shape.id, index, count));
            return true;
        } catch (error) {
            this.__repo.rollback();
        }
        return false;
    }

    public insertText2(text: string, index: number, del: number, attr?: SpanAttr): boolean {
        if (!(this.__shape instanceof TextShape)) return false;
        try {
            this.__repo.start("insertText", {});
            if (del > 0) deleteText(this.__shape, index, del);
            insertText(this.__shape, text, index, attr);
            const cmd = TextCmdInsert.Make(this.__page.id, this.__shape.id, index, del, text)

            this.__repo.commit(cmd);
            return true;
        } catch (error) {
            this.__repo.rollback();
        }
        return false;
    }

    private __composingStarted: boolean = false;
    private __composingIndex: number = 0;
    private __composingDel: number = 0;
    private __composingAttr?: SpanAttr;
    public composingInputStart(index: number, del: number, attr?: SpanAttr) {
        if (!(this.__shape instanceof TextShape)) return false;

        this.__composingStarted = true;
        this.__composingIndex = index;
        this.__composingDel = del;
        this.__composingAttr = attr;

        this.__repo.start("composingInput", {});
        if (del > 0) deleteText(this.__shape, index, del);
    }
    public composingInputUpdate(text: string): boolean {
        if (!(this.__shape instanceof TextShape)) return false;
        this.__repo.rollback();
        this.__repo.start("composingInput", {});
        if (this.__composingDel > 0) deleteText(this.__shape, this.__composingIndex, this.__composingDel);
        if (text.length > 0) insertText(this.__shape, text, this.__composingIndex, this.__composingAttr);
        this.__repo.transactCtx.fireNotify(); // 会导致不断排版绘制
        return true;
    }
    public composingInputEnd(text: string): boolean {
        if (!(this.__shape instanceof TextShape)) return false;
        this.__repo.rollback();

        this.__composingStarted = false;
        return this.insertText2(text, this.__composingIndex, this.__composingDel, this.__composingAttr);
    }

    public isInComposingInput() {
        return this.__composingStarted;
    }
}