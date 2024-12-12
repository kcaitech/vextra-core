import { Fill, FillType, Gradient, ShapeSize } from "../../../data";
import { Props } from "../painters/renderer";
import { render as renderGradient } from "./gradient";

export function render(props: Props, ctx: CanvasRenderingContext2D, fills: Fill[], path2D: Path2D, frame: ShapeSize) {
    for (const fill of fills) {
        if (fill.isEnabled) painter[fill.fillType](props, ctx, fill, path2D, frame);
    }
}

const painter: { [key: string]: (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame: ShapeSize) => void } = {};

painter[FillType.SolidColor] = function (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.fillStyle = `rgba(${fill.color.red}, ${fill.color.green}, ${fill.color.blue}, ${fill.color.alpha})`;
    ctx.fill(path2D, "evenodd");
    ctx.restore();
}

painter[FillType.Gradient] = function (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame: ShapeSize) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.clip(path2D);
    const gradient = renderGradient(ctx, fill.gradient as Gradient, frame);
    if(gradient) {
        ctx.fillStyle = gradient;
    }
    ctx.fill(path2D);
    ctx.restore();
}

painter[FillType.Pattern] = function (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.fillStyle = `rgba(${fill.color.red}, ${fill.color.green}, ${fill.color.blue}, ${fill.color.alpha})`;
    ctx.fill(path2D);
    ctx.restore();
}
