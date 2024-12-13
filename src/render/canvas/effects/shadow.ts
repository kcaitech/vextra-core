import { Border, BorderPosition, Fill, FillType, Shadow, ShadowPosition } from "../../../data";
import { ArtboradView, BoolShapeView, ShapeView } from "../../../dataview";
import { gPal } from "../../../basic/pal";
import { border2path } from "../../../editor/utils/path";
import { Props } from "../painters/renderer";


export function render(view: ShapeView, props: Props, ctx: CanvasRenderingContext2D, shadows: Shadow[], borders: Border[], fills: Fill[]): Function | undefined {
    shadows = shadows.filter(i => i.isEnabled);
    if (!shadows.length) return;

    if (isFrankShadow()) return frankShadow(ctx, shadows[0]);
    const outer = shadows.filter(i => i.position === ShadowPosition.Outer);
    if (outer.length) {
        if (isBlurOutlineShadow()) blurOutlineShadow(view, props, ctx, outer);
    }

    function isFrankShadow() {
        return shadows.length === 1
            && shadows[0].position === ShadowPosition.Outer
            && !shadows[0].spread
            && (borders.length + fills.length) < 2
            && (borders[0]?.fillType !== FillType.Gradient && fills[0]?.fillType !== FillType.Gradient)
            && (view instanceof BoolShapeView || !view.childs.length)
    }

    function isBlurOutlineShadow() {
        return !view.childs.length
            || view instanceof BoolShapeView
            || !(view as ArtboradView).frameMaskDisabled;
    }
}

//外阴影·最简方案
function frankShadow(ctx: CanvasRenderingContext2D, shadow: Shadow): Function {
    ctx.save();
    const color = shadow.color;
    ctx.shadowColor = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
    ctx.shadowBlur = shadow.blurRadius;
    ctx.shadowOffsetX = shadow.offsetX;
    ctx.shadowOffsetY = shadow.offsetY;
    return ctx.restore.bind(ctx);
}

//外阴影·模糊方案
function blurOutlineShadow(view: ShapeView, props: Props, ctx: CanvasRenderingContext2D, outerShadows: Shadow[]) {
    let pathStr = view.getPath().toString();
    const border = view.getBorders()[0];
    if (border && border.position !== BorderPosition.Inner) {
        const gPath = gPal.makePalPath(pathStr);
        gPath.union(gPal.makePalPath(border2path(view, border).toString()));
        pathStr = gPath.toSVGString();
    }
    const path2D = new Path2D(pathStr);
    ctx.save();
    ctx.transform(...props.transform);
    for (const os of outerShadows) {
        const {offsetX, offsetY, blurRadius, color} = os;
        ctx.save();
        ctx.filter = `blur(${blurRadius}px)`;
        ctx.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha * 0.8})`;
        ctx.translate(offsetX, offsetY);
        ctx.fill(path2D, 'evenodd');
        ctx.restore();
    }
    ctx.restore();
}

/**
 * 外阴影
 *  最简方案：ctx.shadowColor
 *  模糊方案：将边框轮廓加本体Path取联级，模糊这个联集
 *  离屏方案：OffScreen
 *
 * 只有一条阴影 单一路径图层，例如直线、纯色填充、单文本、没有子元素的只有边框或者填充的容器 => 最简方案
 * PathShape、BoolShape、裁剪的容器、组件 => 模糊方案
 * 其他复杂场景
 *
 *
 */