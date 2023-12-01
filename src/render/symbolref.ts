import { Path, ShapeFrame, ShapeType, SymbolUnionShape, SymbolRefShape, SymbolShape, Variable } from "../data/classes";
import { renderGroupChilds2, renderGroupChilds3 } from "./group";
import { renderWithVars as fillR } from "./fill";
import { renderWithVars as borderR } from "./border"
import { RenderTransform, fixFrameByConstrain, isNoTransform, isVisible } from "./basic";
import { ResizingConstraints } from "../data/consts";
import { Matrix } from "../basic/matrix";

function renderSym(h: Function,
    ref: SymbolRefShape,
    refframe: ShapeFrame,
    sym: SymbolShape,
    comsMap: Map<ShapeType, any>,
    transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[]): any {

    varsContainer.push(sym);

    // const refframe = ref.frame;
    const symframe = sym.frame;
    const noTrans = isNoTransform(transform);
    if (noTrans && refframe.width === symframe.width && refframe.height === symframe.height) {
        const vchilds = sym.childs; //ref.virtualChilds;
        const childs: Array<any> = renderGroupChilds2(h, vchilds, comsMap, undefined, varsContainer);
        return childs;
    }

    if (noTrans) { // 第一个
        const scaleX = refframe.width / symframe.width;
        const scaleY = refframe.height / symframe.height;
        transform = {
            dx: 0,
            dy: 0,
            scaleX,
            scaleY,
            parentFrame: refframe,
            vflip: false,
            hflip: false,
            rotate: 0
        }

        const vchilds = sym.childs;
        const { nodes } = renderGroupChilds3(h, sym, vchilds, comsMap, transform, varsContainer);
        return nodes;
    }
    else {
        // 应该同groupshape
        const vchilds = sym.childs;
        const { nodes } = renderGroupChilds3(h, sym, vchilds, comsMap, transform, varsContainer);
        return nodes;
    }
}

export function render(h: Function,
    shape: SymbolRefShape,
    sym: SymbolShape | undefined,
    comsMap: Map<ShapeType, any>,
    transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    reflush?: number) {

    if (!isVisible(shape, varsContainer)) return;


    // const sym = shape.peekSymbol(true);
    if (!sym) {
        return;
    }

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

        else {

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

    }
    else {
        path0 = shape.getPath();
        notTrans = shape.isNoTransform()
    }

    const childs = [];
    // const path0 = shape.getPathOfFrame(frame);
    const path = path0.toString();

    const varsContainer2 = (varsContainer || []).concat(shape);
    if (sym.parent instanceof SymbolUnionShape) {
        varsContainer2.push(sym.parent);
    }
    // fill
    childs.push(...fillR(h, sym, frame, path, varsContainer2));
    // symbol
    childs.push(...renderSym(h, shape, frame, sym as SymbolShape, comsMap, undefined, varsContainer2));
    // border
    childs.push(...borderR(h, sym, frame, path, varsContainer2));

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
    }
    else {
        return h("g", props, childs);
    }
}