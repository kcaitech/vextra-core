import { Border, FillType, Gradient, ShapeSize } from "../../../data";
import { Props } from "../painters/renderer";
import { ShapeView } from "../../../dataview";
import { border2path } from "../../../editor/utils/path";
import { render as renderGradient } from "./gradient";

export function render(view: ShapeView, props: Props, ctx: CanvasRenderingContext2D, borders: Border[], frame: ShapeSize) {
    /**
     * todo 1. 处理单边的圆角问题
     */
    for (const border of borders) {
        const path2D = new Path2D(border2path(view, border).toString());
        const fillPath = new Path2D(view.getPathStr());
        painter[border.fillType](props, ctx, border, path2D, frame, fillPath);
    }
}


const painter: { [key: string]: (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D, frame: ShapeSize, fillPath: Path2D) => void } = {};

painter[FillType.SolidColor] = function (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.fillStyle = `rgba(${border.color.red}, ${border.color.green}, ${border.color.blue}, ${border.color.alpha})`;
    ctx.fill(path2D, "evenodd");
    ctx.restore();
}

painter[FillType.Gradient] = function (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D, frame: ShapeSize, fillPath: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    const gradient = renderGradient(ctx, border.gradient as Gradient, frame);
    if (gradient) {
        ctx.fillStyle = gradient;
    }
    ctx.fill(path2D, "evenodd");
    ctx.restore();
}

painter[FillType.Pattern] = function (props: Props, ctx: CanvasRenderingContext2D, border: Border, path2D: Path2D) {
    ctx.save();
    ctx.transform(...props.transform);
    ctx.fillStyle = `rgba(${border.color.red}, ${border.color.green}, ${border.color.blue}, ${border.color.alpha})`;
    ctx.fill(path2D, "evenodd");
    ctx.restore();
}