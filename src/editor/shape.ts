import { GroupShape, RectShape, Shape, TextShape } from "../data/shape";
import { Color, MarkerType } from "../data/style";
import { expand, expandTo, translate, translateTo } from "./frame";
import { Border, BorderPosition, BorderStyle, Fill } from "../data/style";
import { RectRadius, ShapeType } from "../data/baseclasses";
import { Artboard } from "../data/artboard";
import { createHorizontalBox } from "../basic/utils";
import { SpanAttr } from "../data/text";
import { Page } from "../data/page";
import { CoopRepository } from "./cooprepo";
export class ShapeEditor {
    private __shape: Shape;
    private __repo: CoopRepository;
    private __page: Page;
    constructor(shape: Shape, page: Page, repo: CoopRepository) {
        this.__shape = shape;
        this.__repo = repo;
        this.__page = page;
    }

    public setName(name: string) {
        const api = this.__repo.start('setName', {});
        api.shapeModifyName(this.__page, this.__shape, name)
        // const origin = this.__shape.name;
        // this.__shape.setName(name);
        this.__repo.commit();
    }
    public toggleVisible() {
        const api = this.__repo.start('toggleVisible', {});
        // const origin = this.__shape.isVisible;
        // this.__shape.toggleVisible();
        api.shapeModifyVisible(this.__page, this.__shape, !this.__shape.isVisible)
        this.__repo.commit();
    }
    public toggleLock() {
        const api = this.__repo.start('toggleLock', {});
        // const origin = this.__shape.isLocked;
        // this.__shape.toggleLock();
        api.shapeModifyLock(this.__page, this.__shape, !this.__shape.isLocked);
        this.__repo.commit();
    }
    public translate(dx: number, dy: number, round: boolean = true) {
        const api = this.__repo.start("translate", {});
        // const frame = this.__shape.frame2Page();
        // const origin = { x: frame.x, y: frame.y }
        translate(api, this.__page, this.__shape, dx, dy, round);
        // const frame2 = this.__shape.frame2Page();
        this.__repo.commit();
    }
    public translateTo(x: number, y: number) {
        const api = this.__repo.start("translateTo", {});
        // const frame = this.__shape.frame2Page();
        // const origin = { x: frame.x, y: frame.y }
        translateTo(api, this.__page, this.__shape, x, y);
        // const frame2 = this.__shape.frame2Page();
        this.__repo.commit();
    }
    public expand(dw: number, dh: number) {
        const api = this.__repo.start("expand", {});
        // const frame = this.__shape.frame;
        // const origin = { w: frame.width, h: frame.height }
        expand(api, this.__page, this.__shape, dw, dh);
        this.__repo.commit();
    }
    public expandTo(w: number, h: number) {
        const api = this.__repo.start("expandTo", {});
        // const frame = this.__shape.frame;
        // const origin = { w: frame.width, h: frame.height }
        expandTo(api, this.__page, this.__shape, w, h);
        this.__repo.commit();
    }

    // flip
    public flipH() {
        const api = this.__repo.start("flipHorizontal", {});
        // const origin = this.__shape.isFlippedHorizontal;
        // this.__shape.flipHorizontal();
        api.shapeModifyHFlip(this.__page, this.__shape, !this.__shape.isFlippedHorizontal)
        // updateFrame(this.__shape);
        this.__repo.commit();
    }
    public flipV() {
        const api = this.__repo.start("flipVertical", {});
        // const origin = this.__shape.isFlippedVertical;
        // this.__shape.flipVertical();
        // updateFrame(this.__shape);
        api.shapeModifyVFlip(this.__page, this.__shape, !this.__shape.isFlippedVertical)
        this.__repo.commit();
    }
    // resizingConstraint
    public setResizingConstraint(value: number) {
        const api = this.__repo.start("setResizingConstraint", {});
        // const origin = this.__shape.resizingConstraint;
        api.shapeModifyResizingConstraint(this.__page, this.__shape, value);
        this.__repo.commit();
    }
    // rotation
    public rotate(deg: number) {
        const api = this.__repo.start("rotate", {});
        deg = deg % 360;
        // const origin = this.__shape.rotation;
        // this.__shape.rotate(deg);
        api.shapeModifyRotate(this.__page, this.__shape, deg)
        // updateFrame(this.__shape);
        this.__repo.commit();
    }
    // radius
    public setRadius(radius: RectRadius) {
        if (!(this.__shape instanceof RectShape)) return;
        const api = this.__repo.start("setRadius", {});
        // if (!(this.__shape.type === ShapeType.Rectangle)) {
        //     radius.rlb = radius.rrt = radius.rrb = 0;
        // }
        // const origin = this.__shape.fixedRadius;
        api.shapeModifyRadius(this.__page, this.__shape ,radius);
        // updateFrame(this.__shape);
        this.__repo.commit();
    }

    // fill
    public addFill(fill: Fill) {
        if (this.__shape.type !== ShapeType.Artboard) {
            const api = this.__repo.start("addFill", {});
            api.addFillAt(this.__page, this.__shape, fill, this.__shape.style.fills.length)
            // addFill(this.__shape.style, fill);
            this.__repo.commit();
        }
    }
    public setFillColor(idx: number, color: Color) {
        if (this.__shape.type === ShapeType.Artboard) {
            const api = this.__repo.start("setFillColor", {});
            // const origin = (this.__shape as Artboard).backgroundColor;
            // (this.__shape as Artboard).setArtboardColor(color); // 画板的背景色不在shape的style中
            api.artboardModifyBackgroundColor(this.__page, this.__shape as Artboard, color);
            this.__repo.commit();
        } else {
            const fill: Fill = this.__shape.fills[idx];
            if (fill) {
                const api = this.__repo.start("setFillColor", {});
                api.setFillColor(this.__page, this.__shape, idx, color)
                // const origin = exportColor(fill.color)
                // setFillColor(this.__shape.style, idx, color);
                // const cmd = ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, FILLS_ID, fill.id, FILLS_ATTR_ID.color, exportColor(color), origin)
                this.__repo.commit();
            }
        }
    }

    public toggleFillEnable(idx: number) {
        const fill = this.__shape.style.fills[idx];
        if (this.__shape.type !== ShapeType.Artboard && fill) {
            const api = this.__repo.start("setFillEnable", {});
            api.setFillEnable(this.__page, this.__shape, idx, !fill.isEnabled)
            // const origin = fill.isEnabled;
            // toggleFillEnabled(this.__shape.style, idx);
            // const cmd = ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, FILLS_ID, fill.id, FILLS_ATTR_ID.enable, fill.isEnabled, origin)
            this.__repo.commit();
        }
    }
    public deleteFill(idx: number) {
        const fill = this.__shape.style.fills[idx];
        if (this.__shape.type !== ShapeType.Artboard && fill) {
            const api = this.__repo.start("deleteFill", {});
            api.deleteFillAt(this.__page, this.__shape, idx);
            // deleteFillAt(this.__shape.style, idx);
            // const cmd = ShapeArrayAttrRemove.Make(this.__page.id, this.__shape.id, FILLS_ID, fill.id, idx, exportFill(fill));
            this.__repo.commit();
        }
    }

    // border
    public setBorderEnable(idx: number, isEnabled: boolean) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderEnable", {});
            api.setBorderEnable(this.__page, this.__shape, idx, isEnabled);
            // const origin = border.isEnabled;
            // setBorderEnable(this.__shape.style, idx, isEnabled);
            // const cmd = ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, BORDER_ID, border.id, BORDER_ATTR_ID.enable, border.isEnabled, origin)
            this.__repo.commit();
        }
    }
    public setBorderColor(idx: number, color: Color) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderColor", {});
            api.setBorderColor(this.__page, this.__shape, idx, color);
            // const origin = exportColor(border.color);
            // setBorderColor(this.__shape.style, idx, color);
            // const cmd = ShapeArrayAttrModify.Make(this.__page.id, this.__shape.id, BORDER_ID, border.id,
            //     BORDER_ATTR_ID.color, exportColor(color), origin)
            this.__repo.commit();
        }
    }
    public setBorderThickness(idx: number, thickness: number) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderThickness", {});
            // const origin = border.thickness;
            // setBorderThickness(this.__shape.style, idx, thickness);
            api.setBorderThickness(this.__page, this.__shape, idx, thickness);
            this.__repo.commit();
        }
    }
    public setBorderPosition(idx: number, position: BorderPosition) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderPosition", {});
            // const origin = exportBorderPosition(border.position)
            api.setBorderPosition(this.__page, this.__shape, idx, position);
            this.__repo.commit();
        }
    }
    public setBorderStyle(idx: number, borderStyle: BorderStyle) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderStyle", {});
            // const origin = exportBorderStyle(border.borderStyle);
            api.setBorderStyle(this.__page, this.__shape, idx, borderStyle);
            this.__repo.commit();
        }
    }
    public setBorderApexStyle(idx: number, apexStyle: MarkerType, isEnd: boolean) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderApexStyle", {});
            // let origin;
            if (isEnd) {
                api.setBorderEndMarkerType(this.__page, this.__shape, idx, apexStyle)
                // origin = border.endMarkerType
            } else {
                api.setBorderStartMarkerType(this.__page, this.__shape, idx, apexStyle)
                // origin = border.startMarkerType
            }
            // setBorderApexStyle(this.__shape.style, idx, apexStyle, isEnd);
            this.__repo.commit();
        }
    }
    public deleteBorder(idx: number) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("deleteBorder", {});
            api.deleteBorderAt(this.__page, this.__shape, idx)
            this.__repo.commit();
        }
    }
    public addBorder(border: Border) {
        const api = this.__repo.start("addBorder", {});
        api.addBorderAt(this.__page, this.__shape, border, this.__shape.style.borders.length);
        // const cmd = ShapeArrayAttrInsert.Make(this.__page.id, this.__shape.id, BORDER_ID, border.id, this.__shape.style.borders.length - 1, exportBorder(border))
        this.__repo.commit();
    }

    // 容器自适应大小
    public adapt() {
        if (this.__shape.type === ShapeType.Artboard) {
            const childs = (this.__shape as Artboard).childs;
            if (childs.length) {
                try {
                    const api = this.__repo.start("adapt", {});
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
                        for (let i = 0; i < childs.length; i++) { translate(api, this.__page, childs[i], dx, dy) };
                        expandTo(api, this.__page, this.__shape, box.right - box.left, box.bottom - box.top);
                        translateTo(api, this.__page, this.__shape, box.left, box.top);


                        this.__repo.commit();


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
        const parent = this.__shape.parent as GroupShape;
        if (parent) {
            const childs = (parent as GroupShape).childs;
            const index = childs.findIndex(s => s.id === this.__shape.id);
            if (index >= 0) {
                try {
                    const api = this.__repo.start("deleteShape", {});
                    api.shapeDelete(this.__page, parent, index)
                    // childs.splice(index, 1);
                    // this.__page.onRemoveShape(this.__shape);
                    this.__repo.commit();
                } catch (error) {
                    this.__repo.rollback();
                    throw new Error(`${error}`);
                }
            }
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

    public deleteText(index: number, count: number): number {
        if (!(this.__shape instanceof TextShape)) return 0;
        if (index < 0) {
            count += index;
            index = 0;
        }
        if (count <= 0) return 0;
        try {
            const api = this.__repo.start("deleteText", {});
            const deleted = api.deleteText(this.__page, this.__shape, index, count);
            if (!deleted) {
                this.__repo.rollback();
                return 0;
            }
            else {
                count = deleted.text.length;
                this.__repo.commit();
                return count;
            }
        } catch (error) {
            console.log(error)
            this.__repo.rollback();
        }
        return 0;
    }

    public insertText2(text: string, index: number, del: number, attr?: SpanAttr): boolean {
        if (!(this.__shape instanceof TextShape)) return false;
        try {
            const api = this.__repo.start("insertText", {});
            // let cmd;
            if (del > 0) {
                // cmd = TextCmdGroup.Make(this.__page.id);
                const origin = api.deleteText(this.__page, this.__shape, index, del);
                // if (origin) cmd.addRemove(this.__shape.id, index, del, origin);
                api.insertText(this.__page, this.__shape, index, text, attr);
                // cmd.addInsert(this.__shape.id, index, text);
            }
            else {

                api.insertText(this.__page, this.__shape, index, text, attr);
                // cmd = TextCmdInsert.Make(this.__page.id, this.__shape.id, index, text)
            }

            this.__repo.commit();
            return true;
        } catch (error) {
            console.log(error)
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

        const api = this.__repo.start("composingInput", {});
        if (del > 0) api.deleteText(this.__page, this.__shape, index, del);
    }
    public composingInputUpdate(text: string): boolean {
        if (!(this.__shape instanceof TextShape)) return false;
        this.__repo.rollback();
        const api = this.__repo.start("composingInput", {});
        if (this.__composingDel > 0) api.deleteText(this.__page, this.__shape, this.__composingIndex, this.__composingDel);
        if (text.length > 0) api.insertText(this.__page, this.__shape, this.__composingIndex, text, this.__composingAttr);
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