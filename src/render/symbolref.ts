import { ShapeFrame, ShapeType, SymbolRefShape, SymbolShape, Variable } from "../data/classes";
import { renderGroupChilds2, renderGroupChilds3 } from "./group";
import { render as fillR } from "./fill";
import { render as borderR } from "./border"
import { RenderTransform, fixFrameByConstrain, isNoTransform, isVisible } from "./basic";

function renderSym(h: Function,
    ref: SymbolRefShape,
    sym: SymbolShape,
    comsMap: Map<ShapeType, any>,
    transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): any {

    const refframe = ref.frame;
    const symframe = sym.frame;
    const noTrans = isNoTransform(transform);
    if (noTrans && refframe.width === symframe.width && refframe.height === symframe.height) {
        const vchilds = sym.childs; //ref.virtualChilds;
        const childs: Array<any> = renderGroupChilds2(h, vchilds, comsMap, undefined, (varsContainer ?? []).concat(ref, sym));
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
        const { nodes } = renderGroupChilds3(h, sym, vchilds, comsMap, transform, (varsContainer ?? []).concat(ref, sym));
        return nodes;
    }
    else {
        // 应该同groupshape
        const vchilds = sym.childs;
        const { nodes } = renderGroupChilds3(h, sym, vchilds, comsMap, transform, (varsContainer ?? []).concat(ref, sym));
        return nodes;
    }
}

export function render(h: Function,
    shape: SymbolRefShape,
    comsMap: Map<ShapeType, any>,
    transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    consumedVars: { slot: string, vars: Variable[] }[] | undefined,
    reflush?: number) {

    if (!isVisible(shape, varsContainer, consumedVars)) return;


    const sym = shape.peekSymbol(true);
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

        if (rotate) {
            // matrix2parent

        }
    }

    const childs = [];
    const path0 = shape.getPathOfFrame(frame);
    const path = path0.toString();
    // fill
    childs.push(...fillR(h, shape.style.fills, frame, path));
    // border
    childs.push(...borderR(h, shape.style.borders, frame, path));

    // symbol
    childs.push(...renderSym(h, shape, sym as SymbolShape, comsMap, transform, varsContainer));

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