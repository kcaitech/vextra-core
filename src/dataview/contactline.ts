import { EL, elh } from "./el";
import { render as renderBorders } from "../render/contact_borders"
import { ContactForm, ContactShape, Page, Shape, ShapeFrame, ShapeType } from "../data/classes";
import { DViewCtx, PropsType } from "./viewctx";
import { PathShapeView } from "./pathshape";
import { updateFrame } from "./shape";

export class ContactLineView extends PathShapeView {

    private from: undefined | Shape;
    private to: undefined | Shape;
    private fromparents: Shape[] = [];
    private toparents: Shape[] = [];
    private page: Page | undefined = undefined;

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.watcher_sides = this.watcher_sides.bind(this);

        this.updateApex();

        // this.afterInit();
    }

    get data(): ContactShape {
        return this.m_data as ContactShape;
    }

    get apexes(): { from: Shape | undefined, to: Shape | undefined } {
        return { from: this.from, to: this.to }
    }

    private watcher_sides(...args: any) {
        // todo 可以再精细点
        this.updateApex();
        this.m_path = undefined;
        this.m_pathstr = undefined;
        this.m_ctx.setDirty(this);
        this.updateFrames();
    }

    private unwatchApex(shape: Shape, parents: Shape[]) {
        shape.unwatch(this.watcher_sides);
        parents.forEach(p => {
            p.unwatch(this.watcher_sides);
        });
        parents.length = 0;
    }

    private watchApex(shape: Shape, parents: Shape[]) {
        shape.watch(this.watcher_sides);
        let p = shape.parent;
        while (p && p.type !== ShapeType.Page) {
            p.watch(this.watcher_sides);
            parents.push(p);
            p = p.parent;
        }
    }

    private getPageShape() {
        if (!this.page) {
            this.page = this.m_data.getPage() as Page;
        }
        return this.page;
    }

    private modify_from_side_watch(f: ContactForm | undefined) {
        if (!f) {
            if (this.from) {
                this.unwatchApex(this.from, this.fromparents);
                this.from = undefined;
            }
            return;
        }

        const page = this.getPageShape();

        const nf = page.getShape(f.shapeId);

        if (nf) {
            if (this.from) {
                this.unwatchApex(this.from, this.fromparents);

                this.from = nf;

                this.watchApex(this.from, this.fromparents);
            } else {
                this.from = nf;
                this.watchApex(this.from, this.fromparents);
            }

            return;
        }

        if (this.from) {
            this.unwatchApex(this.from, this.fromparents);
            this.from = undefined;
        }
    }

    private modify_to_side_watch(t: ContactForm | undefined) {
        if (!t) {
            if (this.to) {
                this.unwatchApex(this.to, this.toparents);
                this.to = undefined;
            }

            return;
        }

        const page = this.getPageShape();

        const nt = page.getShape(t.shapeId);

        if (nt) {
            if (this.to) {
                this.unwatchApex(this.to, this.toparents);

                this.to = nt;

                this.watchApex(this.to, this.toparents);
            } else {
                this.to = nt;
                this.watchApex(this.to, this.toparents);
            }

            return;
        }

        if (this.to) {
            this.unwatchApex(this.to, this.toparents);
            this.to = undefined;
        }
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

        const path = this.getPath().clone();
        const bounds = path.bbox();

        // update visible
        if (updateFrame(this.m_visibleFrame, bounds.x, bounds.y, bounds.w, bounds.h)) changed = true;

        // update outer
        if (updateFrame(this.m_outerFrame, this.m_visibleFrame.x, this.m_visibleFrame.y, this.m_visibleFrame.width, this.m_visibleFrame.height)) changed = true;

        // to parent frame
        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.transform;
            if (this.isNoTransform()) {
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
            this.m_ctx.addNotifyLayout(this);
            this.m_client_x = this.m_client_y = undefined;
        }

        return changed;
    }

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);

        if (args.includes('points') || args.includes('shape-frame')) {
            return;
        }

        this.updateApex();
    }

    private updateApex() {
        const self: ContactShape = this.m_data as ContactShape;

        this.modify_from_side_watch(self.from);
        this.modify_to_side_watch(self.to)

    }

    onDestroy(): void {
        super.onDestroy();
        if (this.from) {
            this.unwatchApex(this.from, this.fromparents);
            this.from = undefined;
        }
        if (this.to) {
            this.unwatchApex(this.to, this.toparents);
            this.to = undefined;
        }
    }

    protected renderFills(): EL[] {
        return [];
    }

    protected renderBorders(): EL[] {
        return renderBorders(elh, this.m_data.style, this.getPathStr(), this.m_data);
    }

    getPoints() {
        return this.data.getPoints(); // todo 缓存
    }
}