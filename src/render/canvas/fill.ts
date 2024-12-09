import { Fill, FillType, ShapeSize } from "../../data";

export function render(ctx: CanvasRenderingContext2D, fills: Fill[], path2D: Path2D, frame: ShapeSize) {
    for (const fill of fills) {
        painter[fill.fillType](ctx, fill, path2D, frame);
    }
}

const painter: { [key: string]: (ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame?: ShapeSize) => void } = {};

painter[FillType.SolidColor] = function (ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D) {
    ctx.save();
    ctx.fillStyle = `rgba(${fill.color.red}, ${fill.color.green}, ${fill.color.blue}, ${fill.color.alpha})`;
    ctx.fill(path2D);
    ctx.restore();
}