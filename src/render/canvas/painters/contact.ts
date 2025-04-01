import { ShapeView } from "../../../dataview";
import { ViewCanvasRenderer } from "./view";

export class ContactCanvasRenderer extends ViewCanvasRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const ctx = this.view.canvasRenderingContext2D;
        ctx.save();
        if (this.props.opacity) ctx.globalAlpha = this.props.opacity;
        if (this.props.globalCompositeOperation) {
            ctx.globalCompositeOperation = this.props.globalCompositeOperation;
        }
        this.renderBorder();
        ctx.restore();
        return ++this.m_render_version;
    }
}