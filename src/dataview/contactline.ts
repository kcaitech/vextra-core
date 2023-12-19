import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { render as renderBorders } from "../render/contact_borders"
import { ContactForm, ContactShape, Page, Shape, ShapeType } from "../data/classes";
import { DViewCtx, PropsType } from "./viewctx";

export class ContactLineView extends ShapeView {

    // private stop1: any;
    // private stop2: any;
    private from: undefined | Shape;
    private to: undefined | Shape;
    private fromparents: Shape[] = [];
    private toparents: Shape[] = [];

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.wathcer_sides = this.wathcer_sides.bind(this);

        this.updateApex();
        // if (this.from) {
        //     this.stop1 = this.from.watch(this.wathcer_sides);
        // }
        // if (this.to) {
        //     this.stop2 = this.to.watch(this.wathcer_sides);
        // }
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

    private updateApex() {
        const self: ContactShape = this.m_data as ContactShape;
        const page = self.getPage() as Page;
        if (self.from) {
            const nf = page.getShape((self.from as ContactForm).shapeId);
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
            }
            else if (this.from) {
                this.unwatchApex(this.from, this.fromparents);
                this.from = undefined;
            }
        } else {
            if (this.from) {
                this.unwatchApex(this.from, this.fromparents);
                this.from = undefined;
            }
        }
        if (self.to) {
            const nt = page.getShape((self.to as ContactForm).shapeId);
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
            }
            else if (this.to) {
                this.unwatchApex(this.to, this.toparents);
                this.to = undefined;
            }
        } else {
            if (this.to) {
                this.unwatchApex(this.to, this.toparents);
                this.to = undefined;
            }
        }
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
}