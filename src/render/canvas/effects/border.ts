import { Border } from "../../../data";
import { Props } from "../painters/renderer";
import { ShapeView } from "../../../dataview";
import { border2path } from "../../../editor/utils/path";

export function render(view: ShapeView, props: Props, ctx: CanvasRenderingContext2D, borders: Border[]) {
    for (const border of borders) {
        if (border.isEnabled) {
            ctx.save();
            const path2D = new Path2D(border2path(view, border).toString());
            ctx.transform(...props.transform);
            ctx.fillStyle = `rgba(${border.color.red}, ${border.color.green}, ${border.color.blue}, ${border.color.alpha})`;
            ctx.fill(path2D, "evenodd");
            ctx.restore();
        }
    }
}