import { ShapeView } from "../../../dataview";
import { ViewCanvasRenderer } from "./view";
import { painter } from "./h";

export class PageCanvasRenderer extends ViewCanvasRenderer {
    constructor(view: ShapeView) {
        super(view);
    }

    render(): number {
        const s = Date.now();
        const view = this.view;
        const dpr = view.m_ctx.dpr;
        this.ctx.save();
        this.ctx.scale(dpr, dpr);
        const ver = painter['base'](view, this);
        this.ctx.restore();
        const t = Date.now() - s;
        const fps = Math.floor(1000 / t);
        console.log(`单帧绘制用时${t}, fps: ${fps}`);
        return ver;
    }
}