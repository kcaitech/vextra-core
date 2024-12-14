import { ShapeView } from "../../../dataview";
import { BlurType, Border, Fill } from "../../../data";
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
    const borders = view.getBorders();
    const fills = view.getFills();
    const alphaBorder = opacity(borders);
    const alphaFill = opacity(fills);
    if (!alphaFill && !alphaBorder) return null;
    ctx.save();
    const blur = view.blur!;
    const offscreen = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
    const offCtx = offscreen.getContext('2d')!;
    offCtx.filter = `blur(${blur.saturation / 2}px)`;
    offCtx.drawImage(ctx.canvas, 0, 0);

    const path = new Path2D();
    if (fills.length && alphaFill) {
        path.addPath(new Path2D(view.getPath().toString()));
    }
    if (borders.length && alphaBorder) {
        const path2D = new Path2D(border2path(view, borders[0]).toString());
        const transform = new DOMMatrix();
        transform.translate(view.outerFrame.x, view.outerFrame.y);
        path.addPath(path2D, transform);
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

const opacity = (t: (Fill | Border)[]) => {
    for (let i = 0; i < t.length; i++) {
        const __t = t[i];
        if (__t.color.alpha > 0 && __t.color.alpha < 1 && __t.isEnabled) return true;
    }
    return false;
}
