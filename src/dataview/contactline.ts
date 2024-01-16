import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { render as renderBorders } from "../render/contact_borders"
import { ContactForm, ContactShape, Page, Shape, ShapeType } from "../data/classes";
import { DViewCtx, PropsType } from "./viewctx";
import { PathShapeView } from "./pathshape";

export class ContactLineView extends PathShapeView {

    private from: undefined | Shape;
    private to: undefined | Shape;
    private fromparents: Shape[] = [];
    private toparents: Shape[] = [];
    private page: Page | undefined = undefined;

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props, false);
        this.wathcer_sides = this.wathcer_sides.bind(this);

        this.updateApex();

        this.afterInit();
    }

    get data(): ContactShape {
        return this.m_data as ContactShape;
    }

    private wathcer_sides(t: any) {
        // todo 可以再精细点
        this.updateApex();
        this.m_path = undefined;
        this.m_pathstr = undefined;
        this.m_ctx.setDirty(this);
    }

    private unwatchApex(shape: Shape, parents: Shape[]) {
        shape.unwatch(this.wathcer_sides);
        parents.forEach(p => {
            p.unwatch(this.wathcer_sides);
        });
        parents.length = 0;
    }

    private watchApex(shape: Shape, parents: Shape[]) {
        shape.watch(this.wathcer_sides);
        let p = shape.parent;
        while (p && p.type !== ShapeType.Page) {
            p.watch(this.wathcer_sides);
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
            if (this.from && this.from.id === nf.id) {
                // do nothing
            }
            else if (this.from) {
                this.unwatchApex(this.from, this.fromparents);

                this.from = nf;

                this.watchApex(this.from, this.fromparents);
            }
            else {
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
            if (this.to && this.to.id === nt.id) {
                // do nothing
            }
            else if (this.to) {
                this.unwatchApex(this.to, this.toparents);

                this.to = nt;

                this.watchApex(this.to, this.toparents);
            }
            else {
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

    onDestory(): void {
        super.onDestory();
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
        if (this.m_data.style.borders.length > 0) {
            return renderBorders(elh, this.m_data.style, this.getPathStr(), this.m_data);
        } else {
            // const props: any = {};
            // props.stroke = '#808080';
            // props['stroke-width'] = 2;
            // props.d = this.getPathStr();
            // props.fill = "none"
            // return [elh('path', props)];
            return [];
        }
    }

    getPoints() {
        return this.data.getPoints(); // todo 缓存
    }
}