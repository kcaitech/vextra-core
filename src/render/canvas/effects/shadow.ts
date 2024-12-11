import { Shadow } from "../../../data";

export function render(ctx: CanvasRenderingContext2D, shadows: Shadow[]): Function | undefined {
    let tail: Function | undefined = undefined;
    for (const shadow of shadows) {
        ctx.save();
        const color = shadow.color;
        ctx.shadowColor = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
        ctx.shadowBlur = shadow.blurRadius;
        ctx.shadowOffsetX = shadow.offsetX;
        ctx.shadowOffsetY = shadow.offsetY;
        tail = ctx.restore.bind(ctx);
    }
    return tail;
}