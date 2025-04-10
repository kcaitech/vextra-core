import { ShapeView } from "../../../dataview";
import { ViewCanvasRenderer } from "./view";

export class ArtboardCanvasRenderer extends ViewCanvasRenderer {
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
        const blurEnd = this.renderBlur();
        const shadowEnd = this.renderShadows();
        this.renderFills();
        const clipEnd = this.clip();
        if (clipEnd) { // 裁剪容器中的边框需要在内容的上层
            this.renderContents();
            clipEnd();
            this.renderBorder();
        } else {
            this.renderBorder();
            this.renderContents();
        }
        shadowEnd && shadowEnd();
        blurEnd && blurEnd();
        ctx.restore();
        return ++this.m_render_version;
    }
}