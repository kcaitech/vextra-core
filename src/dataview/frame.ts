import { XYsBounding } from "../io/cilpboard";
import { ShapeView } from "./shape";
import { BorderPosition, ShadowPosition, ShapeFrame, ShapeType } from "../data";
import { ArtboardView } from "./artboard";
import { ContactLineView } from "./contactline";
import { GroupShapeView } from "./groupshape";

export class FrameCpt {
    static frame2Root(view: ShapeView) {
        const m = view.matrix2Root();
        const frame = view.frame;
        const points = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height },
        ].map(p => m.computeCoord3(p));
        const box = XYsBounding(points);
        return { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top };
    }

    static frame2Parent(view: ShapeView) {
        const m = view.matrix2Parent();
        const frame = view.frame;
        const points = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height },
        ].map(p => m.computeCoord3(p));
        const box = XYsBounding(points);
        return { x: box.left, y: box.top, width: box.right - box.left, height: box.bottom - box.top };
    }
}

export function updateFrame(frame: ShapeFrame, x: number, y: number, w: number, h: number): boolean {
    if (frame.x !== x || frame.y !== y || frame.width !== w || frame.height !== h) {
        frame.x = x;
        frame.y = y;
        frame.width = w;
        frame.height = h;
        return true;
    }
    return false;
}

export class FrameProxy {
    constructor(protected view: ShapeView) {
    }

    _save_frame: ShapeFrame = new ShapeFrame(); // 对象内坐标系的大小 // 用于updateFrames判断frame是否变更
    m_frame: ShapeFrame = new ShapeFrame(); // 对象内坐标系的大小
    m_visibleFrame: ShapeFrame = new ShapeFrame(); // 对象内坐标系的大小
    m_outerFrame: ShapeFrame = new ShapeFrame(); // 对象内坐标系的大小

    _p_frame: ShapeFrame = new ShapeFrame(); // 父级坐标系的大小 // 用于优化updateFrames, hittest
    _p_visibleFrame: ShapeFrame = new ShapeFrame(); // 父级坐标系的大小 // 用于优化updateFrames, hittest
    _p_outerFrame: ShapeFrame = new ShapeFrame(); // 父级坐标系的大小 // 用于优化updateFrames, hittest

    updateFrames() {
        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;

        if (changed) {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }

        const border = this.view.getBorder();
        let maxtopborder = 0;
        let maxleftborder = 0;
        let maxrightborder = 0;
        let maxbottomborder = 0;
        if (border) {
            const isEnabled = border.strokePaints.some(p => p.isEnabled);
            if (isEnabled) {
                const outer = border.position === BorderPosition.Outer;
                maxtopborder = outer ? border.sideSetting.thicknessTop : border.sideSetting.thicknessTop / 2;
                maxleftborder = outer ? border.sideSetting.thicknessLeft : border.sideSetting.thicknessLeft / 2;
                maxrightborder = outer ? border.sideSetting.thicknessRight : border.sideSetting.thicknessRight / 2;
                maxbottomborder = outer ? border.sideSetting.thicknessBottom : border.sideSetting.thicknessBottom / 2;
            }
        }
        // 阴影
        const shadows = this.view.getShadows();
        let st = 0, sb = 0, sl = 0, sr = 0;
        shadows.forEach(s => {
            if (!s.isEnabled) return;
            if (s.position !== ShadowPosition.Outer) return;
            const w = s.blurRadius + s.spread;
            sl = Math.max(-s.offsetX + w, sl);
            sr = Math.max(s.offsetX + w, sr);
            st = Math.max(-s.offsetY + w, st);
            sb = Math.max(s.offsetY + w, sb);
        })

        const el = Math.max(maxleftborder, sl);
        const et = Math.max(maxtopborder, st);
        const er = Math.max(maxrightborder, sr);
        const eb = Math.max(maxbottomborder, sb);

        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - el, this.frame.y - et, this.frame.width + el + er, this.frame.height + et + eb)) changed = true;

        // update outer
        if (updateFrame(this.m_outerFrame, this.m_visibleFrame.x, this.m_visibleFrame.y, this.m_visibleFrame.width, this.m_visibleFrame.height)) changed = true;

        // to parent frame
        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.view.transform;
            if (this.view.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.computeCoord(p));
            const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
            const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
            const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
            const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
            return updateFrame(out, minx, miny, maxx - minx, maxy - miny);
        }
        if (mapframe(this.m_frame, this._p_frame)) changed = true;
        if (mapframe(this.m_visibleFrame, this._p_visibleFrame)) changed = true;
        if (mapframe(this.m_outerFrame, this._p_outerFrame)) changed = true;

        if (changed) {
            this.view.m_ctx.addNotifyLayout(this.view);
        }

        return changed;
    }

    get frame() {
        return this.m_frame;
    }

    get visibleFrame() {
        return this.m_visibleFrame;
    }

    get outerFrame() {
        return this.m_outerFrame;
    }

    get clientX() {
        let offset = 0;
        const parent = this.view.parent;
        if (parent?.type !== ShapeType.Page) {
            offset = parent?.frame.x ?? 0;
        }
        return this._p_frame.x - offset;
    }

    get clientY() {
        let offset = 0;
        const parent = this.view.parent;
        if (parent?.type !== ShapeType.Page) {
            offset = parent?.frame.y ?? 0;
        }
        return this._p_frame.y - offset;
    }

    boundingBox(): ShapeFrame {
        if (this.view.isNoTransform()) {
            const tx = this.view.transform.translateX;
            const ty = this.view.transform.translateY;
            return new ShapeFrame(tx + this.frame.x, ty + this.frame.y, this.frame.width, this.frame.height);
        }
        const path = this.view.getPath().clone();
        if (path.length > 0) {
            const m = this.view.matrix2Parent();
            path.transform(m);
            const bounds = path.bbox();
            return new ShapeFrame(bounds.x, bounds.y, bounds.w, bounds.h);
        }

        const frame = this.frame;
        const m = this.view.transform;
        const corners = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height }]
            .map((p) => m.computeCoord(p));
        const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
        const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
        const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
        const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);

        return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
    }

    updateWHBySize(size: ShapeFrame) {
        if (size.width !== this.m_frame.width || size.height !== this.m_frame.height || size.x !== this.m_frame.x || size.y !== this.m_frame.y) {
            this.m_frame.x = size.x;
            this.m_frame.y = size.y;
            this.m_frame.width = size.width;
            this.m_frame.height = size.height;
            return true;
        } else return false;
    }
}

export class GroupFrameProxy extends FrameProxy {
    constructor(protected view: GroupShapeView) {
        super(view);
    }

    updateFrames() {
        let children = this.view.m_children;
        if (this.view.maskMap.size && (this.view.type === ShapeType.Group || this.view.type === ShapeType.BoolShape)) {
            children = this.view.m_children.filter(i => !this.view.maskMap.has(i.id));
        }

        children = children.filter(i => i.type !== ShapeType.Contact);

        const childcontentbounds = children.map(c => (c as ShapeView).relativeFrame);

        const childvisiblebounds = children.map(c => (c as ShapeView).m_frame_proxy._p_visibleFrame);

        const childouterbounds = children.map(c => (c as ShapeView).m_frame_proxy._p_outerFrame);

        const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
            if (i === 0) {
                p.minx = c.x;
                p.maxx = c.x + c.width;
                p.miny = c.y;
                p.maxy = c.y + c.height;
            } else {
                p.minx = Math.min(p.minx, c.x);
                p.maxx = Math.max(p.maxx, c.x + c.width);
                p.miny = Math.min(p.miny, c.y);
                p.maxy = Math.max(p.maxy, c.y + c.height);
            }
            return p;
        }

        const contentbounds = childcontentbounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
        const visiblebounds = childvisiblebounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });
        const outerbounds = childouterbounds.reduce(reducer, { minx: 0, miny: 0, maxx: 0, maxy: 0 });

        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;

        if (updateFrame(this.m_frame, contentbounds.minx, contentbounds.miny, contentbounds.maxx - contentbounds.minx, contentbounds.maxy - contentbounds.miny)) {
            changed = true;
        }
        {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }
        if (updateFrame(this.m_visibleFrame, visiblebounds.minx, visiblebounds.miny, visiblebounds.maxx - visiblebounds.minx, visiblebounds.maxy - visiblebounds.miny)) changed = true;
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.view.transform;
            if (this.view.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.computeCoord(p));
            const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
            const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
            const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
            const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
            return updateFrame(out, minx, miny, maxx - minx, maxy - miny);
        }
        if (mapframe(this.m_frame, this._p_frame)) changed = true;
        if (mapframe(this.m_visibleFrame, this._p_visibleFrame)) changed = true;
        if (mapframe(this.m_outerFrame, this._p_outerFrame)) changed = true;

        return changed;
    }
}

export class ArtboardFrameProxy extends FrameProxy {
    constructor(protected view: ArtboardView) {
        super(view);
    }

    updateFrames() {
        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;
        if (changed) {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }

        const border = this.view.getBorder();
        let maxtopborder = 0;
        let maxleftborder = 0;
        let maxrightborder = 0;
        let maxbottomborder = 0;
        const isEnabled = border.strokePaints.some(p => p.isEnabled);
        if (isEnabled) {
            const outer = border.position === BorderPosition.Outer;
            maxtopborder = outer ? border.sideSetting.thicknessTop : border.sideSetting.thicknessTop / 2;
            maxleftborder = outer ? border.sideSetting.thicknessLeft : border.sideSetting.thicknessLeft / 2;
            maxrightborder = outer ? border.sideSetting.thicknessRight : border.sideSetting.thicknessRight / 2;
            maxbottomborder = outer ? border.sideSetting.thicknessBottom : border.sideSetting.thicknessBottom / 2;
        }
        // 阴影
        const shadows = this.view.getShadows();
        let st = 0, sb = 0, sl = 0, sr = 0;
        shadows.forEach(s => {
            if (!s.isEnabled) return;
            if (s.position !== ShadowPosition.Outer) return;
            const w = s.blurRadius + s.spread;
            sl = Math.max(-s.offsetX + w, sl);
            sr = Math.max(s.offsetX + w, sr);
            st = Math.max(-s.offsetY + w, st);
            sb = Math.max(s.offsetY + w, sb);
        })

        const el = Math.max(maxleftborder, sl);
        const et = Math.max(maxtopborder, st);
        const er = Math.max(maxrightborder, sr);
        const eb = Math.max(maxbottomborder, sb);

        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - el, this.frame.y - et, this.frame.width + el + er, this.frame.height + et + eb)) changed = true;

        const childouterbounds = this.view.m_children.map(c => (c as ShapeView).m_frame_proxy._p_outerFrame);
        const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
            p.minx = Math.min(p.minx, c.x);
            p.maxx = Math.max(p.maxx, c.x + c.width);
            p.miny = Math.min(p.miny, c.y);
            p.maxy = Math.max(p.maxy, c.y + c.height);
            return p;
        }
        const _f = this.m_visibleFrame;
        const outerbounds = childouterbounds.reduce(reducer, {
            minx: _f.x,
            miny: _f.y,
            maxx: _f.x + _f.width,
            maxy: _f.y + _f.height
        });
        // update outer
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

        // to parent frame
        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.view.transform;
            if (this.view.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.computeCoord(p));
            const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
            const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
            const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
            const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
            return updateFrame(out, minx, miny, maxx - minx, maxy - miny);
        }
        if (mapframe(this.m_frame, this._p_frame)) changed = true;
        if (mapframe(this.m_visibleFrame, this._p_visibleFrame)) changed = true;
        if (mapframe(this.m_outerFrame, this._p_outerFrame)) changed = true;
        return changed;
    }
}

export class ContactFrameProxy extends FrameProxy {
    constructor(protected view: ContactLineView) {
        super(view);
    }

    updateFrames() {
        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;

        if (changed) {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }

        const bounds = this.view.getPath().bbox();

        /* 对于连接线来讲，它的frame和可见frame，都为所有点共同组成的bbox */
        if (updateFrame(this.m_frame, bounds.x, bounds.y, bounds.w, bounds.h)) changed = true;

        if (updateFrame(this.m_visibleFrame, bounds.x, bounds.y, bounds.w, bounds.h)) changed = true;

        if (updateFrame(this.m_outerFrame, this.m_visibleFrame.x, this.m_visibleFrame.y, this.m_visibleFrame.width, this.m_visibleFrame.height)) changed = true;

        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.view.transform;
            if (this.view.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.computeCoord(p));
            const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
            const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
            const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
            const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
            return updateFrame(out, minx, miny, maxx - minx, maxy - miny);
        }
        if (mapframe(this.m_frame, this._p_frame)) changed = true;
        if (mapframe(this.m_visibleFrame, this._p_visibleFrame)) changed = true;
        if (mapframe(this.m_outerFrame, this._p_outerFrame)) changed = true;

        return changed;
    }
}


export class SymbolFrameProxy extends FrameProxy {
    constructor(protected view: ContactLineView) {
        super(view);
    }

    updateFrames() {
        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;
        if (changed) {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }

        const border = this.view.getBorder();
        let maxtopborder = 0;
        let maxleftborder = 0;
        let maxrightborder = 0;
        let maxbottomborder = 0;
        if (border) {
            const isEnabled = border.strokePaints.some(p => p.isEnabled);
            if (isEnabled) {
                const outer = border.position === BorderPosition.Outer;
                maxtopborder = outer ? border.sideSetting.thicknessTop : border.sideSetting.thicknessTop / 2;
                maxleftborder = outer ? border.sideSetting.thicknessLeft : border.sideSetting.thicknessLeft / 2;
                maxrightborder = outer ? border.sideSetting.thicknessRight : border.sideSetting.thicknessRight / 2;
                maxbottomborder = outer ? border.sideSetting.thicknessBottom : border.sideSetting.thicknessBottom / 2;
            }
        }

        // 阴影
        const shadows = this.view.getShadows();
        let st = 0, sb = 0, sl = 0, sr = 0;
        shadows.forEach(s => {
            if (!s.isEnabled) return;
            if (s.position !== ShadowPosition.Outer) return;
            const w = s.blurRadius + s.spread;
            sl = Math.max(-s.offsetX + w, sl);
            sr = Math.max(s.offsetX + w, sr);
            st = Math.max(-s.offsetY + w, st);
            sb = Math.max(s.offsetY + w, sb);
        })

        const el = Math.max(maxleftborder, sl);
        const et = Math.max(maxtopborder, st);
        const er = Math.max(maxrightborder, sr);
        const eb = Math.max(maxbottomborder, sb);

        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - el, this.frame.y - et, this.frame.width + el + er, this.frame.height + et + eb)) changed = true;

        const childouterbounds = this.view.m_children.map(c => (c as ShapeView).m_frame_proxy._p_outerFrame);
        const reducer = (p: { minx: number, miny: number, maxx: number, maxy: number }, c: ShapeFrame, i: number) => {
            p.minx = Math.min(p.minx, c.x);
            p.maxx = Math.max(p.maxx, c.x + c.width);
            p.miny = Math.min(p.miny, c.y);
            p.maxy = Math.max(p.maxy, c.y + c.height);
            return p;
        }
        const _f = this.m_visibleFrame;
        const outerbounds = childouterbounds.reduce(reducer, { minx: _f.x, miny: _f.y, maxx: _f.x + _f.width, maxy: _f.y + _f.height });
        // update outer
        if (updateFrame(this.m_outerFrame, outerbounds.minx, outerbounds.miny, outerbounds.maxx - outerbounds.minx, outerbounds.maxy - outerbounds.miny)) changed = true;

        // to parent frame
        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.view.transform;
            if (this.view.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.computeCoord(p));
            const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
            const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
            const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
            const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
            return updateFrame(out, minx, miny, maxx - minx, maxy - miny);
        }
        if (mapframe(this.m_frame, this._p_frame)) changed = true;
        if (mapframe(this.m_visibleFrame, this._p_visibleFrame)) changed = true;
        if (mapframe(this.m_outerFrame, this._p_outerFrame)) changed = true;

        return changed;
    }
}