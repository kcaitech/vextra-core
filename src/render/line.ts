import { Shape, ShapeFrame, SymbolRefShape, SymbolShape } from "../data/classes";
import { RenderTransform, fixFrameByConstrain, isNoTransform, isVisible } from "./basic";
import { render as renderB } from "./line_borders";

export function render(h: Function, shape: Shape, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, reflush?: number) {

    if (!isVisible(shape)) return;

    const _frame = shape.frame;
    let x = _frame.x;
    let y = _frame.y;
    let width = _frame.width;
    let height = _frame.height;
    let rotate = (shape.rotation ?? 0);
    let hflip = !!shape.isFlippedHorizontal;
    let vflip = !!shape.isFlippedVertical;
    let frame = _frame;

    const notTrans = isNoTransform(transform);

    if (!notTrans && transform) {
        x += transform.dx;
        y += transform.dy;
        width *= transform.scaleX;
        height *= transform.scaleY;
        rotate += transform.rotate;
        hflip = transform.hflip ? !hflip : hflip;
        vflip = transform.vflip ? !vflip : vflip;
        frame = new ShapeFrame(x, y, width, height);
        fixFrameByConstrain(shape, transform.parentFrame, frame);
    }

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    if (shape.isNoTransform() && notTrans) {
        props.transform = `translate(${frame.x},${frame.y})`;
    } else {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (hflip) style.transform += "rotateY(180deg) "
        if (vflip) style.transform += "rotateX(180deg) "
        if (rotate) style.transform += "rotate(" + shape.rotation + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
    }

    let childs = new Array();
    if (shape.style.borders.length) {
        const path = shape.getPathOfFrame(frame).toString();
        childs = childs.concat(renderB(h, shape.style, path, shape));
        return h('g', props, childs);
    } else {
        props.stroke = '#000000', props['stroke-width'] = 1, props.d = shape.getPathOfFrame(frame).toString();
        return h('path', props);
    }
}