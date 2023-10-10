import { Path, Shape, ShapeFrame, SymbolRefShape, SymbolShape, Variable } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { RenderTransform, boundingBox, fixFrameByConstrain, isNoTransform, isVisible, matrix2parent, transformPoints } from "./basic";
import { parsePath } from "../data/pathparser";

export function render(h: Function, shape: Shape, transform: RenderTransform | undefined,
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

    let notTrans = isNoTransform(transform);

    let path0: Path;
    if (!notTrans && transform) {
        x += transform.dx;
        y += transform.dy;
        rotate += transform.rotate;
        hflip = transform.hflip ? !hflip : hflip;
        vflip = transform.vflip ? !vflip : vflip;

        if (rotate) {
            // matrix2parent
            const matrix = matrix2parent(x, y, width, height, rotate, hflip, vflip);
            const f = new ShapeFrame(x, y, width, height);
            const p = shape.getPathOfFrame(f);
            // boundingbox
            const bbox = boundingBox(matrix, f, p);

            matrix.preScale(f.width, f.height);

            rotate = 0;
            hflip = false;
            vflip = false;
            notTrans = true;

            const matrix2 = matrix2parent(bbox.x, bbox.y, bbox.width, bbox.height, 0, false, false);
            matrix2.preScale(bbox.width, bbox.height); // 当对象太小时，求逆矩阵会infinity
            matrix.multiAtLeft(matrix2.inverse);

            bbox.width *= transform.scaleX;
            bbox.height *= transform.scaleY;

            fixFrameByConstrain(shape, transform.parentFrame, bbox); // 这个好象不太对


            // transform points （旋转、翻转、缩放、移动）
            // 再get path

            const points = transformPoints(shape.points, matrix);
            
            frame = bbox;

            // path0 = shape.getPathOfFrame(bbox);
            path0 = new Path(parsePath(points, shape.isClosed, 0, 0, bbox.width, bbox.height, shape.fixedRadius))
            // path0.transform(matrix);
        }
        else {

            // 
            width *= transform.scaleX;
            height *= transform.scaleY;
            frame = new ShapeFrame(x, y, width, height);
            fixFrameByConstrain(shape, transform.parentFrame, frame);
    
            path0 = shape.getPathOfFrame(frame);
        }
    }
    else {
        path0 = shape.getPath();
        notTrans = shape.isNoTransform()
    }


    const childs = [];
    // const path0 = shape.getPathOfFrame(frame);
    const path = path0.toString();

    // fill
    childs.push(...fillR(h, shape.style.fills, frame, path));
    // border
    childs.push(...borderR(h, shape.style.borders, frame, path));

    const props: any = {}
    if (reflush) {
        props.reflush = reflush;
    }

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
    }
    else {
        return h("g", props, childs);
    }
}