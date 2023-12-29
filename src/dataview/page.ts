import { Page } from "../data/page";
import { ArtboradView } from "./artboard";
import { GroupShapeView } from "./groupshape";
import { ShapeView, isDiffShapeFrame } from "./shape";
import { DataView, RootView } from "./view";
import { DViewCtx, PropsType } from "./viewctx";

function checkFrame(v: ShapeView) {
    const lhs = v.frame;
    const rhs = v.m_data.frame;
    if (isDiffShapeFrame(lhs, rhs)) {
        console.error(`frame not match: ${lhs} vs ${rhs}`, v.name)
    }
    v.m_children.forEach((c) => checkFrame(c as ShapeView));
}

function checkPath(v: ShapeView) {
    const lhs = v.getPathStr();
    const rhs = v.m_data.getPath().toString();
    if (lhs !== rhs) {
        console.error(`path not match: ${lhs} vs ${rhs}`, v.name)
    }
    v.m_children.forEach((c) => checkPath(c as ShapeView));
}

export class PageView extends GroupShapeView implements RootView {

    private m_views: Map<string, ShapeView> = new Map();
    private m_artboards: Map<string, ArtboradView> = new Map();

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props, false);
        this.afterInit();
    }

    onAddView(view: ShapeView | ShapeView[]): void {
        const add = (v: ShapeView) => {
            this.m_views.set(v.id, v);
            if (v instanceof ArtboradView) this.m_artboards.set(v.id, v);
            v.m_children.forEach((c) => add(c as ShapeView));
        }
        if (Array.isArray(view)) view.forEach(add);
        else add(view);
    }
    onRemoveView(view: ShapeView | ShapeView[]): void {
        const remove = (v: ShapeView) => {
            this.m_views.delete(v.id);
            if (v instanceof ArtboradView) this.m_artboards.delete(v.id);
            v.m_children.forEach((c) => remove(c as ShapeView));
        }
        if (Array.isArray(view)) view.forEach(remove);
        else remove(view);
    }
    get isRootView() {
        return true;
    }

    get data(): Page {
        return this.m_data as Page;
    }

    get shapes() {
        return this.m_views;
    }

    get artboardList() {
        return Array.from(this.m_artboards.values());
    }

    getShape(id: string) {
        return this.m_views.get(id);
    }

    protected renderProps() {
        let width = Math.ceil(Math.max(100, this.m_data.frame.width));
        let height = Math.ceil(Math.max(100, this.m_data.frame.height));
        if (width % 2) width++;
        if (height % 2) height++;

        const prop: any = {
            version: "1.1",
            xmlns: "http://www.w3.org/2000/svg",
            "xmlns:xlink": "http://www.w3.org/1999/xlink",
            "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
            preserveAspectRatio: "xMinYMin meet",
            overflow: "visible"
        }
        prop.viewBox = `0 0 ${width} ${height}`;
        // todo
        // prop.style = { transform: matrixWithFrame.toString() };
        // prop['data-area'] = rootId.value;
        prop.width = width;
        prop.height = height;
        return prop;
    }

    render(): number {
        const r = super.render();
        if (r) {
            this.eltag = "svg";
        }
        return r;
    }

    // for debug
    dbgCheckFrame() {
        checkFrame(this);
    }
    dbgCheckPath() {
        checkPath(this);
    }
}