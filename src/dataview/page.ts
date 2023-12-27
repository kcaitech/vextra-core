import { Page } from "../data/page";
import { GroupShapeView } from "./groupshape";
import { ShapeView, isDiffShapeFrame } from "./shape";
import { DataView, RootView } from "./view";

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

    onAddView(view: ShapeView | ShapeView[]): void {
        if (Array.isArray(view)) view.forEach((v) => this.m_views.set(v.id, v));
        else this.m_views.set(view.id, view);
    }
    onRemoveView(view: ShapeView | ShapeView[]): void {
        if (Array.isArray(view)) view.forEach((v) => this.m_views.delete(v.id));
        else this.m_views.delete(view.id);
    }

    get data(): Page {
        return this.m_data as Page;
    }

    get shapes() {
        return this.m_views;
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