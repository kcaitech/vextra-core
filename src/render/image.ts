import { objectId } from "../basic/objectid";
import { ImageShape, ShapeFrame, SymbolRefShape, SymbolShape, Variable } from "../data/classes";
import { RenderTransform, fixFrameByConstrain, isNoTransform, isVisible } from "./basic";
import { render as borderR } from "./border";
import { render as clippathR } from "./clippath"

export function render(h: Function, shape: ImageShape, imgPH: string, transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    consumedVars: { slot: string, vars: Variable[] }[] | undefined,
    reflush?: number) {

    if (!isVisible(shape, varsContainer, consumedVars)) return;

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
        x *= transform.scaleX;
        y *= transform.scaleY;
        width *= transform.scaleX;
        height *= transform.scaleY;
        rotate += transform.rotate;
        hflip = transform.hflip ? !hflip : hflip;
        vflip = transform.vflip ? !vflip : vflip;
        frame = new ShapeFrame(x, y, width, height);
        fixFrameByConstrain(shape, transform.parentFrame, frame);
    }

    const path0 = shape.getPathOfFrame(frame);
    const path = path0.toString();

    const id = "clippath-image-" + objectId(shape);
    const cp = clippathR(h, id, path);
    const childs = [cp];

    const url = shape.peekImage(true);

    const img = h("image", {
        'xlink:href': url ?? imgPH,
        width: frame.width,
        height: frame.height,
        x: 0,
        y: 0,
        'preserveAspectRatio': 'none meet',
        "clip-path": "url(#" + id + ")"
    });
    childs.push(img);

    // border
    childs.push(...borderR(h, shape.style.borders, frame, path));

    const props: any = {}
    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    props.width = frame.width;
    props.height = frame.height;
    if (shape.isNoTransform() && notTrans) {
        props.transform = `translate(${frame.x},${frame.y})`
    }
    else {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (hflip) style.transform += "rotateY(180deg) "
        if (vflip) style.transform += "rotateX(180deg) "
        if (rotate) style.transform += "rotate(" + rotate + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
    }
    if (reflush) props.reflush = reflush;

    return h("g", props, childs);
}