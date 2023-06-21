import { GroupShape, RectShape, Shape } from "../data/shape";
import { Color, MarkerType } from "../data/style";
import { expand, expandTo, translate, translateTo } from "./frame";
import { Border, BorderPosition, BorderStyle, Fill } from "../data/style";
import { RectRadius, ShapeType } from "../data/baseclasses";
import { Artboard } from "../data/artboard";
import { createHorizontalBox } from "../basic/utils";
import { Page } from "../data/page";
import { CoopRepository } from "./command/cooprepo";
export class ShapeEditor {
    protected __shape: Shape;
    protected __repo: CoopRepository;
    protected __page: Page;
    constructor(shape: Shape, page: Page, repo: CoopRepository) {
        this.__shape = shape;
        this.__repo = repo;
        this.__page = page;
    }

    public setName(name: string) {
        const api = this.__repo.start('setName', {});
        api.shapeModifyName(this.__page, this.__shape, name)
        this.__repo.commit();
    }
    public toggleVisible() {
        const api = this.__repo.start('toggleVisible', {});
        api.shapeModifyVisible(this.__page, this.__shape, !this.__shape.isVisible)
        this.__repo.commit();
    }
    public toggleLock() {
        const api = this.__repo.start('toggleLock', {});
        api.shapeModifyLock(this.__page, this.__shape, !this.__shape.isLocked);
        this.__repo.commit();
    }
    public translate(dx: number, dy: number, round: boolean = true) {
        const api = this.__repo.start("translate", {});
        translate(api, this.__page, this.__shape, dx, dy, round);
        this.__repo.commit();
    }
    public translateTo(x: number, y: number) {
        const api = this.__repo.start("translateTo", {});
        translateTo(api, this.__page, this.__shape, x, y);
        this.__repo.commit();
    }
    public expand(dw: number, dh: number) {
        const api = this.__repo.start("expand", {});
        expand(api, this.__page, this.__shape, dw, dh);
        this.__repo.commit();
    }
    public expandTo(w: number, h: number) {
        const api = this.__repo.start("expandTo", {});
        expandTo(api, this.__page, this.__shape, w, h);
        this.__repo.commit();
    }
    public setConstrainerProportions(val: boolean) {
        const api = this.__repo.start("setConstrainerProportions", {});
        api.shapeModifyConstrainerProportions(this.__page, this.__shape, val)
        this.__repo.commit();
    }
    // flip
    public flipH() {
        const api = this.__repo.start("flipHorizontal", {});
        api.shapeModifyHFlip(this.__page, this.__shape, !this.__shape.isFlippedHorizontal)
        this.__repo.commit();
    }
    public flipV() {
        const api = this.__repo.start("flipVertical", {});
        api.shapeModifyVFlip(this.__page, this.__shape, !this.__shape.isFlippedVertical)
        this.__repo.commit();
    }
    // resizingConstraint
    public setResizingConstraint(value: number) {
        const api = this.__repo.start("setResizingConstraint", {});
        api.shapeModifyResizingConstraint(this.__page, this.__shape, value);
        this.__repo.commit();
    }
    // rotation
    public rotate(deg: number) {
        const api = this.__repo.start("rotate", {});
        deg = deg % 360;
        api.shapeModifyRotate(this.__page, this.__shape, deg)
        this.__repo.commit();
    }
    // radius
    public setRadius(radius: RectRadius) {
        if (!(this.__shape instanceof RectShape)) return;
        const api = this.__repo.start("setRadius", {});
        api.shapeModifyRadius(this.__page, this.__shape, radius);
        this.__repo.commit();
    }

    // fill
    public addFill(fill: Fill) {
        if (this.__shape.type !== ShapeType.Artboard) {
            const api = this.__repo.start("addFill", {});
            api.addFillAt(this.__page, this.__shape, fill, this.__shape.style.fills.length);
            this.__repo.commit();
        }
    }
    public setFillColor(idx: number, color: Color) {
        if (this.__shape.type === ShapeType.Artboard) {
            const api = this.__repo.start("setFillColor", {});
            api.artboardModifyBackgroundColor(this.__page, this.__shape as Artboard, color);
            this.__repo.commit();
        } else {
            const fill: Fill = this.__shape.style.fills[idx];
            if (fill) {
                const api = this.__repo.start("setFillColor", {});
                api.setFillColor(this.__page, this.__shape, idx, color)
                this.__repo.commit();
            }
        }
    }

    public setFillEnable(idx: number, value: boolean) {
        if (this.__shape.type !== ShapeType.Artboard) {
            const api = this.__repo.start("setFillEnable", {});
            api.setFillEnable(this.__page, this.__shape, idx, value);
            this.__repo.commit();
        }
    }
    public deleteFill(idx: number) {
        const fill = this.__shape.style.fills[idx];
        if (this.__shape.type !== ShapeType.Artboard && fill) {
            const api = this.__repo.start("deleteFill", {});
            api.deleteFillAt(this.__page, this.__shape, idx);
            this.__repo.commit();
        }
    }

    // border
    public setBorderEnable(idx: number, isEnabled: boolean) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderEnable", {});
            api.setBorderEnable(this.__page, this.__shape, idx, isEnabled);
            this.__repo.commit();
        }
    }
    public setBorderColor(idx: number, color: Color) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderColor", {});
            api.setBorderColor(this.__page, this.__shape, idx, color);
            this.__repo.commit();
        }
    }
    public setBorderThickness(idx: number, thickness: number) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderThickness", {});
            api.setBorderThickness(this.__page, this.__shape, idx, thickness);
            this.__repo.commit();
        }
    }
    public setBorderPosition(idx: number, position: BorderPosition) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderPosition", {});
            api.setBorderPosition(this.__page, this.__shape, idx, position);
            this.__repo.commit();
        }
    }
    public setBorderStyle(idx: number, borderStyle: BorderStyle) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderStyle", {});
            api.setBorderStyle(this.__page, this.__shape, idx, borderStyle);
            this.__repo.commit();
        }
    }
    public setBorderApexStyle(idx: number, apexStyle: MarkerType, isEnd: boolean) {
        const border = this.__shape.style.borders[idx];
        if (border) {
            const api = this.__repo.start("setBorderApexStyle", {});
            if (isEnd) {
                api.setBorderEndMarkerType(this.__page, this.__shape, idx, apexStyle)
            } else {
                api.setBorderStartMarkerType(this.__page, this.__shape, idx, apexStyle)
            }
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
                    this.__repo.commit();
                } catch (error) {
                    this.__repo.rollback();
                    throw new Error(`${error}`);
                }
            }
        }
    }
}