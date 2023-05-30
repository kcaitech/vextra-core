import { GroupShape, Shape, TextShape } from "../data/shape";
import { Color, MarkerType } from "../data/style";
import { Repository } from "../data/transact";
import { addFill, deleteFillByIndex, setFillColor, setFillEnabled } from "./fill";
import { deleteBorder, addBorder, setBorderThickness, setBorderPosition, setBorderStyle, setBorderApexStyle, setBorderEnable, setBorderColor } from "./border";
import { expand, expandTo, translate, translateTo } from "./frame";
import { Border, BorderPosition, BorderStyle, Fill } from "../data/style";
import { RectRadius, ShapeType } from "../data/baseclasses";
import { updateFrame } from "./utils";
import { Artboard } from "../data/artboard";
import { createHorizontalBox } from "../basic/utils";
import { SpanAttr } from "../data/text";
import { deleteText, insertText } from "./text";
import { Page } from "../data/page";
import { ShapeDelete, ShapeModify, ShapeArrayAttrDelete, ShapeArrayAttrInsert, ShapeBatchModify, TextDelete, TextInsert, TextInsert2 } from "../coop/cmds";
import { BORDER_ATTR_ID, BORDER_ID, FILLS_ATTR_ID, FILLS_ID, SHAPE_ATTR_ID, TEXT_ID } from "./consts";
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
    // private repowrap(name: string, effect: () => void) {
    //     this.__repo.start(name, {});
    //     effect();
    //     this.__repo.commit({});
    // }
    public setName(name: string) {
        this.__repo.start('setName', {});
        this.__shape.setName(name);
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.name, name));
    }
    public toggleVisible() {
        this.__repo.start('toggleVisible', {});
        this.__shape.toggleVisible();
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.visible, JSON.stringify(this.__shape.isVisible)));
    }
    public toggleLock() {
        this.__repo.start('toggleLock', {});
        this.__shape.toggleLock();
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.lock, JSON.stringify(this.__shape.isLocked)));
    }
    public translate(dx: number, dy: number, round: boolean = true) {
        this.__repo.start("translate", {});
        // this.repowrap("translate", () => {
        translate(this.__shape, dx, dy, round);
        // })
        const frame = this.__shape.frame;
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.xy, JSON.stringify({ x: frame.x, y: frame.y })));
    }
    public translateTo(x: number, y: number) {
        this.__repo.start("translateTo", {});
        // this.repowrap("translateTo", () => {
        translateTo(this.__shape, x, y);
        // })
        const frame = this.__shape.frame;
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.xy, JSON.stringify({ x: frame.x, y: frame.y })));
    }
    public expand(dw: number, dh: number) {
        this.__repo.start("expand", {});
        // this.repowrap("expand", () => {
        expand(this.__shape, dw, dh);
        // })
        const frame = this.__shape.frame;
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.wh, JSON.stringify({ w: frame.width, h: frame.height })));
    }
    public expandTo(w: number, h: number) {
        this.__repo.start("expandTo", {});
        // this.repowrap("expandTo", () => {
        expandTo(this.__shape, w, h);
        // })
        const frame = this.__shape.frame;
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.wh, JSON.stringify({ w: frame.width, h: frame.height })));
    }

    // flip
    public flipH() {
        this.__repo.start("flipHorizontal", {});
        // this.repowrap("flipHorizontal", () => {
        this.__shape.flipHorizontal();
        updateFrame(this.__shape);
        // })
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.hflip, JSON.stringify(this.__shape.isFlippedHorizontal)));
    }
    public flipV() {
        this.__repo.start("flipVertical", {});
        // this.repowrap("flipVertical", () => {
        this.__shape.flipVertical();
        updateFrame(this.__shape);
        // })
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.vflip, JSON.stringify(this.__shape.isFlippedVertical)));
    }
    // resizingConstraint
    public setResizingConstraint(value: number) {
        this.__repo.start("setResizingConstraint", {});
        // this.repowrap("setResizingConstraint", () => {
        this.__shape.setResizingConstraint(value);
        // })
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.resizingConstraint, JSON.stringify(this.__shape.resizingConstraint)));
    }
    // rotation
    public rotate(deg: number) {
        this.__repo.start("rotate", {});
        // this.repowrap("rotate", () => {
        deg = deg % 360;
        this.__shape.rotate(deg);
        updateFrame(this.__shape);
        // })
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.rotate, JSON.stringify(this.__shape.rotation)));
    }
    // radius
    public setRadius(radius: RectRadius) {
        this.__repo.start("setRadius", {});
        // this.repowrap("setRadius", () => {
        if (!(this.__shape.type === ShapeType.Rectangle)) {
            radius.rlb = radius.rrt = radius.rrb = 0;
        }
        this.__shape.setRadius(radius);
        // updateFrame(this.__shape);
        // })
        this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.radius, JSON.stringify(radius)));
    }

    // fill
    public addFill(fill: Fill) {
        this.__repo.start("addFill", {});
        if (this.__shape.type !== ShapeType.Artboard) {
            addFill(this.__shape.style, fill);
        }
        this.__repo.commit(new ShapeArrayAttrInsert(this.__page.id, [this.__shape.id, FILLS_ID], this.__shape.style.fills.length - 1, FILLS_ATTR_ID.fill, JSON.stringify(exportFill(fill))));
    }
    public setFillColor(idx: number, color: Color) {
        this.__repo.start("setFillColor", {});
        if (this.__shape.type === ShapeType.Artboard) {
            (this.__shape as Artboard).setArtboardColor(color); // 画板的背景色不在shape的style中
            this.__repo.commit(new ShapeModify(this.__page.id, this.__shape.id, SHAPE_ATTR_ID.backgroundColor, JSON.stringify(exportColor(color))));
        } else {
            setFillColor(this.__shape.style, idx, color);
            this.__repo.commit(new ShapeModify(this.__page.id, [this.__shape.id, FILLS_ID, this.__shape.style.fills[idx].id], FILLS_ATTR_ID.color, JSON.stringify(exportColor(color))));
        }
    }

    public setFillEnable(idx: number) {
        this.__repo.start("setFillEnable", {});
        if (this.__shape.type !== ShapeType.Artboard) {
            setFillEnabled(this.__shape.style, idx);
        }
        this.__repo.commit(new ShapeModify(this.__page.id, [this.__shape.id, FILLS_ID, this.__shape.style.fills[idx].id], FILLS_ATTR_ID.enable, JSON.stringify(this.__shape.style.fills[idx].isEnabled)));
    }
    public deleteFill(idx: number) {
        if (this.__shape.type !== ShapeType.Artboard) {
            this.__repo.start("deleteFill", {});
            deleteFillByIndex(this.__shape.style, idx);
            this.__repo.commit(new ShapeArrayAttrDelete(this.__page.id, [this.__shape.id, FILLS_ID], idx, 1));
        }
    }

    // border
    public setBorderEnable(idx: number, isEnabled: boolean) {
        this.__repo.start("setBorderEnable", {});
        setBorderEnable(this.__shape.style, idx, isEnabled);
        this.__repo.commit(new ShapeModify(this.__page.id, [this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id],
            BORDER_ATTR_ID.enable, JSON.stringify(this.__shape.style.borders[idx].isEnabled)));
    }
    public setBorderColor(idx: number, color: Color) {
        this.__repo.start("setBorderColor", {});
        setBorderColor(this.__shape.style, idx, color);
        this.__repo.commit(new ShapeModify(this.__page.id, [this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id],
            BORDER_ATTR_ID.color, JSON.stringify(exportColor(color))));
    }
    public setBorderThickness(idx: number, thickness: number) {
        this.__repo.start("setBorderThickness", {});
        setBorderThickness(this.__shape.style, idx, thickness);
        this.__repo.commit(new ShapeModify(this.__page.id, [this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id],
            BORDER_ATTR_ID.thickness, JSON.stringify(thickness)));
    }
    public setBorderPosition(idx: number, position: BorderPosition) {
        this.__repo.start("setBorderPosition", {});
        setBorderPosition(this.__shape.style, idx, position);
        this.__repo.commit(new ShapeModify(this.__page.id, [this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id],
            BORDER_ATTR_ID.position, JSON.stringify(exportBorderPosition(position))));
    }
    public setBorderStyle(idx: number, borderStyle: BorderStyle) {
        this.__repo.start("setBorderStyle", {});
        setBorderStyle(this.__shape.style, idx, borderStyle);
        this.__repo.commit(new ShapeModify(this.__page.id, [this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id],
            BORDER_ATTR_ID.borderStyle, JSON.stringify(exportBorderStyle(borderStyle))));
    }
    public setBorderApexStyle(idx: number, apexStyle: MarkerType, isEnd: boolean) {
        this.__repo.start("setBorderApexStyle", {});
        setBorderApexStyle(this.__shape.style, idx, apexStyle, isEnd);
        this.__repo.commit(new ShapeModify(this.__page.id, [this.__shape.id, BORDER_ID, this.__shape.style.borders[idx].id],
            isEnd ? BORDER_ATTR_ID.endMarkerType : BORDER_ATTR_ID.startMarkerType, apexStyle));
    }
    public deleteBorder(idx: number) {
        this.__repo.start("deleteBorder", {});
        deleteBorder(this.__shape.style, idx)
        this.__repo.commit(new ShapeArrayAttrDelete(this.__page.id, [this.__shape.id, BORDER_ID], idx, 1));
    }
    public addBorder(border: Border) {
        this.__repo.start("addBorder", {});
        addBorder(this.__shape.style, border)
        this.__repo.commit(new ShapeArrayAttrInsert(this.__page.id, [this.__shape.id, BORDER_ID], this.__shape.style.borders.length - 1, JSON.stringify(exportBorder(border))));
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

                        const modifys = saveDatas.reduce((pre: { targetId: string, attrId: string, value?: string | number | boolean }[], cur) => {
                            const frame = cur.shape.frame;
                            if (frame.x !== cur.x || frame.y !== cur.y) {
                                const op = { targetId: cur.shape.id, attrId: SHAPE_ATTR_ID.xy, value: JSON.stringify({ x: frame.x, y: frame.y }) };
                                pre.push(op)
                            }
                            if (frame.width !== cur.w || frame.height !== cur.h) {
                                const op = { targetId: cur.shape.id, attrId: SHAPE_ATTR_ID.wh, value: JSON.stringify({ w: frame.width, h: frame.height }) };
                                pre.push(op)
                            }
                            if (cur.shape.isFlippedHorizontal !== cur.hflip) {
                                const op = { targetId: cur.shape.id, attrId: SHAPE_ATTR_ID.hflip, value: cur.shape.isFlippedHorizontal };
                                pre.push(op)
                            }
                            if (cur.shape.isFlippedVertical !== cur.vflip) {
                                const op = { targetId: cur.shape.id, attrId: SHAPE_ATTR_ID.vflip, value: cur.shape.isFlippedVertical };
                                pre.push(op)
                            }
                            if (cur.shape.rotation !== cur.rotate) {
                                const op = { targetId: cur.shape.id, attrId: SHAPE_ATTR_ID.rotate, value: cur.shape.rotation };
                                pre.push(op)
                            }
                            return pre;
                        }, []);
                        const page = saveDatas[0].shape.getPage();
                        if (!page) {
                            this.__repo.rollback();
                        }
                        else {
                            this.__repo.commit(new ShapeBatchModify(page.id, modifys));
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
                    this.__repo.commit(new ShapeDelete(this.__page.id, parent.id, index, 1));
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
            this.__repo.commit(new TextDelete(this.__page.id, [this.__shape.id, TEXT_ID], index, count));
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
            const cmd = del > 0 ? new TextInsert2(this.__page.id, [this.__shape.id, TEXT_ID], index, del, text) :
                new TextInsert(this.__page.id, [this.__shape.id, TEXT_ID], index, text);

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