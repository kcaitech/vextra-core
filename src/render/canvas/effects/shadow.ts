import { Shadow, ShadowPosition } from "../../../data";

export function render(ctx: CanvasRenderingContext2D, shadows: Shadow[]): Function | undefined {
    if (!shadows.length) return;
    const isComplex = shadows.length > 1 || shadows[0].spread || shadows[0].position === ShadowPosition.Inner;
    if (isComplex) complexShadow(ctx, shadows); else return frankShadow(ctx, shadows[0]);
}

function frankShadow(ctx: CanvasRenderingContext2D, shadow: Shadow): Function {
    ctx.save();
    const color = shadow.color;
    ctx.shadowColor = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
    ctx.shadowBlur = shadow.blurRadius;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    return ctx.restore.bind(ctx);
}

function complexShadow(ctx: CanvasRenderingContext2D, shadows: Shadow[]) {
    for (const shadow of shadows) {

    }
}