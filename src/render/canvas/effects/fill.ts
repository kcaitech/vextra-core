import { Fill, FillType, ShapeSize } from "../../../data";
import { Props } from "../painters/renderer";

export function render(props: Props, ctx: CanvasRenderingContext2D, fills: Fill[], path2D: Path2D, frame: ShapeSize) {
    for (const fill of fills) {
        painter[fill.fillType](props, ctx, fill, path2D, frame);
    }
}

const painter: { [key: string]: (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D, frame?: ShapeSize) => void } = {};

painter[FillType.SolidColor] = function (props: Props, ctx: CanvasRenderingContext2D, fill: Fill, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.fillStyle = `rgba(${fill.color.red}, ${fill.color.green}, ${fill.color.blue}, ${fill.color.alpha})`;
    ctx.fill(path2D);
    ctx.restore();
}