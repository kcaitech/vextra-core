import { Border, BorderPosition, ShapeSize } from "../../../data";
import { Props } from "../painters/renderer";

export function render(props: Props, ctx: CanvasRenderingContext2D, borders: Border[], path2D: Path2D, frame: ShapeSize) {
    for (const border of borders) {
        painter[border.position](props, ctx, border, path2D, frame);
    }
}

const painter: { [key: string]: (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D, frame?: ShapeSize) => void } = {};

painter[BorderPosition.Inner] = function (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.strokeStyle = `rgba(${border.color.red}, ${border.color.green}, ${border.color.blue}, ${border.color.alpha})`;
    ctx.stroke(path2D);
    ctx.restore();
}
painter[BorderPosition.Center] = function (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.strokeStyle = `rgba(${border.color.red}, ${border.color.green}, ${border.color.blue}, ${border.color.alpha})`;
    ctx.stroke(path2D);
    ctx.restore();
}