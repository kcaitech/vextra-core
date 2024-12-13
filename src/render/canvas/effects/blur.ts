import { ShapeView } from "../../../dataview";
import { Blur, BlurType } from "../../../data";

export function render(view: ShapeView): Function | null {
    const blur = view.blur;
    if (!blur || !blur.isEnabled) return null;
    const ctx = view.m_ctx.m_canvas!;
    if (blur.type === BlurType.Gaussian) {
        ctx.save();
        ctx.filter = `blur(${blur.saturation / 2}px)`;
        return ctx.restore.bind(ctx);
    } else return backgroundBlur(blur);

}

function backgroundBlur(blur: Blur) {
    return null;
}