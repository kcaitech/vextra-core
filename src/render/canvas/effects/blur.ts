import { ShapeView } from "../../../dataview";
import { BlurType } from "../../../data";
import { Props } from "../painters/renderer";
import { border2path } from "../../../editor/utils/path";

export function render(view: ShapeView, props: Props): Function | null {
    const blur = view.blur;
    if (!blur || !blur.isEnabled) return null;
    const ctx = view.canvasRenderingContext2D!;
    if (blur.type === BlurType.Gaussian) {
        ctx.save();
        ctx.filter = `blur(${blur.saturation / 2}px)`;
        return ctx.restore.bind(ctx);
    } else return backgroundBlur(ctx, view, props);

}

function backgroundBlur(ctx: CanvasRenderingContext2D, view: ShapeView, props: Props) {
    ctx.save();
    const blur = view.blur!;
    const offscreen = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
    const offCtx = offscreen.getContext('2d')!;
    offCtx.filter = `blur(${blur.saturation / 2}px)`;
    offCtx.drawImage(ctx.canvas, 0, 0);

    // todo 边框未支持
    const path = new Path2D(view.getPath().toString());
    const borders = view.getBorders();
    if (borders.length) {
        // const path2D = new Path2D(border2path(view, borders[0]).toString());
    }
    ctx.save();
    ctx.transform(...props.transform);
    ctx.clip(path, "evenodd");
    ctx.resetTransform();
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();
    return ctx.restore.bind(ctx);
} 