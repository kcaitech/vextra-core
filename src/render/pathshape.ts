import { Path, PathShape, ShapeFrame, SymbolRefShape, SymbolShape, Variable } from "../data/classes";
import { renderWithVars as fillR } from "./fill";
import { renderWithVars as borderR } from "./border"
import { RenderTransform, boundingBox, fixFrameByConstrain, isNoTransform, isVisible, matrix2parent, transformPoints } from "./basic";
import { parsePath } from "../data/pathparser";
import { ResizingConstraints } from "../data/consts";
import { Matrix } from "../basic/matrix";
import { innerShadowId, renderWithVars as shadowR } from "./shadow";

export function render(h: Function, shape: PathShape, transform: RenderTransform | undefined,
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
        const resizingConstraint = shape.resizingConstraint;
        if (!rotate || resizingConstraint && (ResizingConstraints.hasWidth(resizingConstraint) || ResizingConstraints.hasHeight(resizingConstraint))) {

            const scaleX = transform.scaleX;
            const scaleY = transform.scaleY;
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
                }

                else if (rotate) {
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
                    }
                    else {
                        y += (height * (newscale.y - 1)) / 2;
                        newscale.y = 1;
                    }

                    width *= newscale.x;
                    height *= newscale.y;
                }
                else {
                    const newscaleX = fixWidth ? 1 : scaleX;
                    const newscaleY = fixHeight ? 1 : scaleY;
                    x *= scaleX;
                    y *= scaleY;
                    if (fixWidth) x += (width * (scaleX - 1)) / 2;
                    if (fixHeight) y += (height * (scaleY - 1)) / 2;
                    width *= newscaleX;
                    height *= newscaleY;
                }
            }
            else {
                x *= scaleX;
                y *= scaleY;
                width *= scaleX;
                height *= scaleY;
            }

            frame = new ShapeFrame(x, y, width, height);
            fixFrameByConstrain(shape, transform.parentFrame, frame);

            path0 = shape.getPathOfFrame(frame);

        }

        else { // 先摆正再缩放
            // matrix2parent
            const matrix = matrix2parent(x, y, width, height, rotate, hflip, vflip);
            const f = new ShapeFrame(x, y, width, height);
            const p = shape.getPathOfFrame(f);
            // boundingbox
            const bbox = boundingBox(matrix, f, p);

            matrix.preScale(f.width, f.height); // points投影到parent坐标系的矩阵

            rotate = 0;
            hflip = false;
            vflip = false;
            notTrans = true;

            const matrix2 = matrix2parent(bbox.x, bbox.y, bbox.width, bbox.height, 0, false, false);
            matrix2.preScale(bbox.width, bbox.height); // 当对象太小时，求逆矩阵会infinity
            matrix.multiAtLeft(matrix2.inverse); // 反向投影到新的坐标系

            const points = transformPoints(shape.points, matrix); // 新的points

            bbox.width *= transform.scaleX;
            bbox.height *= transform.scaleY;
            bbox.x *= transform.scaleX;
            bbox.y *= transform.scaleY;

            fixFrameByConstrain(shape, transform.parentFrame, bbox); // 这个好象不太对


            // transform points （旋转、翻转、缩放、移动）
            // 再get path


            frame = bbox;

            // path0 = shape.getPathOfFrame(bbox);
            path0 = new Path(parsePath(points, shape.isClosed, 0, 0, bbox.width, bbox.height, shape.fixedRadius))
            // path0.transform(matrix);
        }

    }
    else {
        path0 = shape.getPath();
        notTrans = shape.isNoTransform()
    }

    const path = path0.toString();
    const childs = [];

    // fill
    childs.push(...fillR(h, shape, frame, path, varsContainer));
    // border
    childs.push(...borderR(h, shape, frame, path, varsContainer));

    // ----------------------------------------------------------
    // shadows todo

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    if (notTrans) {
        props.transform = `translate(${frame.x},${frame.y})`;
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
    if (childs.length == 0) {
        props["fill-opacity"] = 1;
        props.d = path;
        props.fill = 'none';
        props.stroke = 'none';
        props["stroke-width"] = 0;
        return h('path', props);
    } else {
        const shadows = shape.style.shadows;
        const shape_id = shape.id.slice(0, 4);
        const shadow = shadowR(h, shape_id, shape, path, varsContainer);
        if (shadow.length) {
            const ex_props = Object.assign({}, props);
            delete props.style;
            delete props.transform;
            const inner_url = innerShadowId(shape_id, shadows);
            if(shadows.length) props.filter = `${inner_url}`;
            const body = h("g", props, childs);
            return h("g", ex_props, [...shadow, body]);
        }  else {
            return h("g", props, childs);
        }
    }
}