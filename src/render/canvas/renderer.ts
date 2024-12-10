import { ShapeView } from "../../dataview";
import { IRenderer } from "../basic";

export class CanvasRenderer extends IRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    getProps() {
        return {};
    }

    renderFills() {
    }

    renderBorders() {
    }

    renderShadows() {
    }

    renderBlur() {
    }

    renderContents() {
    }

    checkAndResetDirty(): boolean {
        return this.view.m_ctx.removeDirty(this.view);
    }

    m_render_version: number = 0;

    render() {
        return ++this.m_render_version;
    }
}