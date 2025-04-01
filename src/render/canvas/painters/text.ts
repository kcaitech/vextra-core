import { ShapeView } from "../../../dataview";
import { ViewCanvasRenderer } from "./view";

export class TextCanvasRenderer extends ViewCanvasRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const view = this.view;
        const ctx = view.canvasRenderingContext2D;
        if (!view.isVisible) {
            return ++this.m_render_version;
        }
        ctx.save();
        if (this.props.opacity) ctx.globalAlpha = this.props.opacity;
        if (this.props.globalCompositeOperation) {
            ctx.globalCompositeOperation = this.props.globalCompositeOperation;
        }
        const blurEnd = this.renderBlur();
        const shadowEnd = this.renderShadows();
        this.renderTextLayout();
        this.renderBorder();
        shadowEnd && shadowEnd();
        blurEnd && blurEnd();
        ctx.restore();
        return ++this.m_render_version;
    }
}