import { Artboard } from "@/data/artboard";
import { IPageShadow } from "@/data/ishadow";
import { GroupShape, Shape } from "@/data/shape";
import { Repository } from "@/data/transact";
import { PageSDisp } from "./sdispatcher";

function updateFrame(c: Shape, shadows: PageSDisp) {
    // 更新parent的frame
    let p = c.parent;
    while (p && !(p instanceof Artboard)) {
        const pg = p as GroupShape;
        const pf = p.frame;
        const cc = pg.childsCount;
        const cf = c.frame;
        let l = cf.x, t = cf.y, r = l + cf.width, b = t + cf.height;
        if (cc > 1) for (let i = 0; i < cc; i++) {
            const c = pg.getChildByIndex(i);
            const cf = c.frame;
            const cl = cf.x, ct = cf.y, cr = cl + cf.width, cb = ct + cf.height;
            l = Math.min(cl, l);
            t = Math.min(ct, t);
            r = Math.max(cr, r);
            b = Math.max(cb, b);
        }
        const changed = pf.set(pf.x + l, pf.y + t, r - l, b - t);
        if (changed) {
            for (let i = 0; i < cc; i++) {
                const c = pg.getChildByIndex(i);
                const cf = c.frame;
                cf.set(cf.x - l, cf.y - t, cf.width, cf.height);
            }
        }
        else {
            break;
        }

        shadows.modify(p, "frame", {});
        c = p;
        p = p.parent;
    }
}

function translateTo(shape: Shape, shadows: PageSDisp, x: number, y: number) {
    const rXY = shape.realXY();
    const dx = x - rXY.x, dy = y - rXY.y;
    const frame = shape.frame;
    const changed = frame.set(frame.x + dx, frame.y + dy, frame.width, frame.height);
    if (changed) updateFrame(shape, shadows);
}

function translate(shape: Shape, shadows: PageSDisp, dx: number, dy: number, round: boolean = true) {
    if (round) {
        const rXY = shape.realXY();
        const x = Math.round(rXY.x + dx), y = Math.round(rXY.y + dy);
        dx = x - rXY.x, dy = y - rXY.y;
    }
    const frame = shape.frame;
    const changed = frame.set(frame.x + dx, frame.y + dy, frame.width, frame.height);
    if (changed) updateFrame(shape, shadows);
}

function expandTo(shape: Shape, shadows: PageSDisp, w: number, h: number) {
    const frame = shape.frame;
    const changed = frame.set(frame.x, frame.y, w, h);
    if (changed) updateFrame(shape, shadows);
}

function expand(shape: Shape, shadows: PageSDisp, dw: number, dh: number, round: boolean = true) {
    const frame = shape.frame;
    if (round) {
        const rXY = shape.realXY();
        const r = Math.round(rXY.x + frame.width + dw), b = Math.round(rXY.y + frame.height + dh);
        dw = r - rXY.x - frame.width, dh = b - rXY.y - frame.height;
    }
    const changed = frame.set(frame.x, frame.y, frame.width + dw, frame.height + dh);
    if (changed) updateFrame(shape, shadows);
}

export class ShapeEditor {
    private __shape: Shape;
    private __repo: Repository;
    private __shadows: PageSDisp;
    constructor(shape: Shape, repo: Repository, shadows: PageSDisp) {
        this.__shape = shape;
        this.__repo = repo;
        this.__shadows = shadows;
    }
    public translate(dx: number, dy: number, round: boolean = true) {
        this.__repo.start("", {});
        translate(this.__shape, this.__shadows, dx, dy, round);
        this.__repo.commit({});
        this.__shadows.modify(this.__shape, "frame", {});
    }
    public translateTo(x: number, y: number) {
        this.__repo.start("", {});
        translateTo(this.__shape, this.__shadows, x, y);
        this.__repo.commit({});
        this.__shadows.modify(this.__shape, "frame", {});
    }
    public expand(dw: number, dh: number) {
        this.__repo.start("", {});
        expand(this.__shape, this.__shadows, dw, dh);
        this.__repo.commit({});
        this.__shadows.modify(this.__shape, "frame", {});
    }
    public expandTo(w: number, h: number) {
        this.__repo.start("", {});
        expandTo(this.__shape, this.__shadows, w, h);
        this.__repo.commit({});
        this.__shadows.modify(this.__shape, "frame", {});
    }
}