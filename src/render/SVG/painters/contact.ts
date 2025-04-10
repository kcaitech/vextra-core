import { ContactLineView, ShapeView } from "../../../dataview";
import { ViewSVGRenderer } from "./view";

export class ContactSVGRenderer extends ViewSVGRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const view = this.view as ContactLineView;
        if (!this.checkAndResetDirty()) return this.m_render_version;
        if (!view.isVisible) {
            view.reset("g");
            return ++this.m_render_version;
        }
        const borders = this.renderBorder();
        let props = this.getProps();
        let children = [...borders];
        view.reset("g", props, children);
        return ++this.m_render_version;
    }

    asyncRender() {
        return this.render();
    }
}