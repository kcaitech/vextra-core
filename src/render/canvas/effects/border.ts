import { Border, FillType, Gradient, GradientType, ShapeFrame, ShapeSize } from "../../../data";
import { Props } from "../painters/renderer";
import { ShapeView } from "../../../dataview";
import { border2path } from "../../../editor/utils/path";
import { render as renderGradient } from "./gradient";
import { patternRender } from "./pattern";

export function render(view: ShapeView, props: Props, ctx: CanvasRenderingContext2D, borders: Border[], fillPath: Path2D) {
    for (const border of borders) {
        if (border.isEnabled) {
            const path2D = new Path2D(border2path(view, border).toString());
            painter[border.fillType](props, ctx, border, path2D, view.size, view._p_outerFrame, fillPath);
        }
    }
}


const painter: { [key: string]: (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D, frame: ShapeSize, outerFrame: ShapeFrame, fillPath: Path2D) => void } = {};

painter[FillType.SolidColor] = function (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.fillStyle = `rgba(${border.color.red}, ${border.color.green}, ${border.color.blue}, ${border.color.alpha})`;
    ctx.fill(path2D, "evenodd");
    ctx.restore();
}

painter[FillType.Gradient] = function (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D, frame: ShapeSize, outerFrame: ShapeFrame, fillPath: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    if (border.gradient!.gradientType === GradientType.Radial) {
        ctx.clip(path2D, "evenodd");  // clip 要在gradient之前，不然会被gradient中的transform影响
        ctx.fillStyle = renderGradient(ctx, border.gradient!, frame, outerFrame);
        ctx.fill(fillPath, "evenodd");
    } else {
        ctx.fillStyle = renderGradient(ctx, border.gradient!, frame, outerFrame);
        ctx.fill(path2D, "evenodd");
    }
    ctx.restore();
}

painter[FillType.Pattern] = function (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D, frame: ShapeSize, outerFrame: ShapeFrame) {
    ctx.save();
    ctx.transform(...props.transform);
    // patternRender(ctx, outerFrame, border);
    ctx.fill(path2D);
    ctx.restore();
}