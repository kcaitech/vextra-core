import { Border, Fill, FillType, GradientType, ShapeFrame, ShapeSize } from "../../../data";
import { Props } from "../painters/renderer";
import { ShapeView } from "../../../dataview";
import { render as renderGradient } from "./gradient";
import { border2path } from "../../../dataview/border2path";

export function render(view: ShapeView, props: Props, ctx: CanvasRenderingContext2D, border: Border, fillPath: Path2D) {
    for (const stroke of border.strokePaints) {
        if (stroke.isEnabled) {
            const path2D = new Path2D(border2path(view, border).toString());
            painter[stroke.fillType](props, ctx, stroke, path2D, view.size, view._p_outerFrame, fillPath);
        }
    }
}


const painter: { [key: string]: (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame: ShapeSize, outerFrame: ShapeFrame, fillPath: Path2D) => void } = {};

painter[FillType.SolidColor] = function (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.fillStyle = `rgba(${fill.color.red}, ${fill.color.green}, ${fill.color.blue}, ${fill.color.alpha})`;
    ctx.fill(path2D, "evenodd");
    ctx.restore();
}

painter[FillType.Gradient] = function (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame: ShapeSize, outerFrame: ShapeFrame, fillPath: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    if (fill.gradient!.gradientType === GradientType.Radial) {
        const offscreen = new OffscreenCanvas(frame.width, frame.height);
        const offctx = offscreen.getContext("2d")!;
        offctx.clip(path2D, "evenodd");  // clip 要在gradient之前，不然会被gradient中的transform影响
        offctx.fillStyle = renderGradient(offctx, fill.gradient!, frame, outerFrame);
        offctx.fill(fillPath, "evenodd");
        ctx.drawImage(offscreen, 0, 0);
    } else {
        ctx.fillStyle = renderGradient(ctx, fill.gradient!, frame, outerFrame);
        ctx.fill(path2D, "evenodd");
    }
    ctx.restore();
}

painter[FillType.Pattern] = function (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame: ShapeSize, outerFrame: ShapeFrame) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.fill(path2D);
    ctx.restore();
}