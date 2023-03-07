import { Shape } from "@/data/shape";
import { Color } from "@/data/style";
import { Repository } from "@/data/transact";
import { setFillColorAtIdx, setFillEnabled } from "./fill";
import { expand, expandTo, translate, translateTo } from "./frame";
import { PageShadowDisp } from "./shadow/disp";

export class ShapeEditor {
    private __shape: Shape;
    private __repo: Repository;
    private __shadows: PageShadowDisp;
    constructor(shape: Shape, repo: Repository, shadows: PageShadowDisp) {
        this.__shape = shape;
        this.__repo = repo;
        this.__shadows = shadows;
    }
    private _frameedit(name: string, f:()=>void) {
        this.__repo.start(name, {});
        f();
        this.__repo.commit({});
        this.__shadows.modify(this.__shape, "frame", {});
    }
    public translate(dx: number, dy: number, round: boolean = true) {
        this._frameedit("translate", () => {
            translate(this.__shape, this.__shadows, dx, dy, round);
        })
    }
    public translateTo(x: number, y: number) {
        this._frameedit("translateTo", () => {
            translateTo(this.__shape, this.__shadows, x, y);
        })
    }
    public expand(dw: number, dh: number) {
        this._frameedit("expand", () => {
            expand(this.__shape, this.__shadows, dw, dh);
        })
    }
    public expandTo(w: number, h: number) {
        this._frameedit("expandTo", () => {
            expandTo(this.__shape, this.__shadows, w, h);
        })
    }

    // fill
    public setFillColor(idx: number, color: Color) {
        this.__repo.start("fillcolor", {});
        setFillColorAtIdx(this.__shape.style, idx, color);
        this.__repo.commit({});
        this.__shadows.modify(this.__shape, "fillcolor", {});
    }

    public setFillEnable(idx: number, isEnabled: boolean) {
        this.__repo.start("fillcolor", {});
        setFillEnabled(this.__shape.style, idx, isEnabled);
        this.__repo.commit({});
        this.__shadows.modify(this.__shape, "fillcolor", {});
    }
}