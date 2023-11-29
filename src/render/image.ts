import {ResizingConstraints} from "../data/consts";
import {objectId} from "../basic/objectid";
import {ImageShape, Path, ShapeFrame, SymbolRefShape, SymbolShape, Variable} from "../data/classes";
import {RenderTransform, fixFrameByConstrain, isNoTransform, isVisible} from "./basic";
import {renderWithVars as borderR} from "./border";
import {render as clippathR} from "./clippath"
import {Matrix} from "../basic/matrix";
import {innerShadowId, renderWithVars as shadowR} from "./shadow";

export function render(h: Function, shape: ImageShape, imgPH: string, transform: RenderTransform | undefined,
                       varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
                       reflush?: number) {

    if (!isVisible(shape, varsContainer)) return;

    const _frame = shape.frame;
    let x = _frame.x;
    let y = _frame.y;
    let width = _frame.width;
    let height = _frame.height;
    let rotate = (shape.rotation ?? 0);
    let hflip = !!shape.isFlippedHorizontal;
    let vflip = !!shape.isFlippedVertical;
    let frame = _frame;


    let notTrans = isNoTransform(transform);
    let path0: Path;
    if (!notTrans && transform) {
        x += transform.dx;
        y += transform.dy;
        rotate += transform.rotate;
        hflip = transform.hflip ? !hflip : hflip;
        vflip = transform.vflip ? !vflip : vflip;
        const scaleX = transform.scaleX;
        const scaleY = transform.scaleY;
        const resizingConstraint = shape.resizingConstraint;
        if (!rotate || resizingConstraint && (ResizingConstraints.hasWidth(resizingConstraint) || ResizingConstraints.hasHeight(resizingConstraint))) {

            // const saveW = width;
            // const saveH = height;
            if (resizingConstraint && (ResizingConstraints.hasWidth(resizingConstraint) || ResizingConstraints.hasHeight(resizingConstraint))) {
                const fixWidth = ResizingConstraints.hasWidth(resizingConstraint);
                const fixHeight = ResizingConstraints.hasHeight(resizingConstraint);

                if (fixWidth && fixHeight) {
                    // 不需要缩放，但要调整位置
                    x *= scaleX;
                    y *= scaleY;
                    // 居中
                    x += (width * (scaleX - 1)) / 2;
                    y += (height * (scaleY - 1)) / 2;
                } else if (rotate) {
                    const m = new Matrix();
                    m.rotate(rotate / 360 * 2 * Math.PI);
                    m.scale(scaleX, scaleY);
                    const _newscale = m.computeRef(1, 1);
                    m.scale(1 / scaleX, 1 / scaleY);
                    const newscale = m.inverseRef(_newscale.x, _newscale.y);
                    x *= scaleX;
                    y *= scaleY;

                    if (fixWidth) {
                        x += (width * (newscale.x - 1)) / 2;
                        newscale.x = 1;
                    } else {
                        y += (height * (newscale.y - 1)) / 2;
                        newscale.y = 1;
                    }

                    width *= newscale.x;
                    height *= newscale.y;
                } else {
                    const newscaleX = fixWidth ? 1 : scaleX;
                    const newscaleY = fixHeight ? 1 : scaleY;
                    x *= scaleX;
                    y *= scaleY;
                    if (fixWidth) x += (width * (scaleX - 1)) / 2;
                    if (fixHeight) y += (height * (scaleY - 1)) / 2;
                    width *= newscaleX;
                    height *= newscaleY;
                }
            } else {
                x *= scaleX;
                y *= scaleY;
                width *= scaleX;
                height *= scaleY;
            }

            frame = new ShapeFrame(x, y, width, height);
            fixFrameByConstrain(shape, transform.parentFrame, frame);

            path0 = shape.getPathOfFrame(frame);

        } else {

            const m = new Matrix();
            m.rotate(rotate / 360 * 2 * Math.PI);
            m.scale(scaleX, scaleY);
            const _newscale = m.computeRef(1, 1);
            m.scale(1 / scaleX, 1 / scaleY);
            const newscale = m.inverseRef(_newscale.x, _newscale.y);
            x *= scaleX;
            y *= scaleY;
            width *= newscale.x;
            height *= newscale.y;

            frame = new ShapeFrame(x, y, width, height);
            fixFrameByConstrain(shape, transform.parentFrame, frame);

            path0 = shape.getPathOfFrame(frame);

        }

    } else {
        path0 = shape.getPath();
        notTrans = shape.isNoTransform()
    }

    // const path0 = shape.getPathOfFrame(frame);
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
    childs.push(...borderR(h, shape, frame, path, varsContainer));

    const props: any = {}
    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    props.width = frame.width;
    props.height = frame.height;
    if (notTrans) {
        props.transform = `translate(${frame.x},${frame.y})`
    } else {
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
    const shadows = shape.style.shadows;
    const ex_props = Object.assign({}, props);
    const shape_id = shape.id.slice(0, 4);
    const shadow = shadowR(h, shape_id, shape, path, varsContainer);
    if (shadow.length) {
        delete props.style;
        delete props.transform;
        const inner_url = innerShadowId(shape_id, shadows);
        if (shadows.length) props.filter = `${inner_url}`;
        const body = h("g", props, childs);
        return h("g", ex_props, [...shadow, body]);
    } else {
        return h("g", props, childs);
    }
}