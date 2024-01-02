import { ShapeType, SymbolRefShape, SymbolShape } from "../data/classes";
import { renderGroupChilds2 } from "./group";
import { render as fillR } from "./fill";
import { render as borderR } from "./border"
import { isVisible, randomId } from "./basic";
import { innerShadowId, render as shadowR } from "./shadow";
import { isAdaptedShape } from "../dataview";
// function renderSym(h: Function,
//     ref: SymbolRefShape,
//     refframe: ShapeFrame,
//     sym: SymbolShape,
//     comsMap: Map<ShapeType, any>,
//     varsContainer?: (SymbolRefShape | SymbolShape)[]): any {
//     // varsContainer.push(sym);
//     // 转成view
//     if (ref.isVirtualShape || isAdaptedShape(ref)) {
//         const childs: Array<any> = renderGroupChilds2(h, ref.naviChilds || [], comsMap, varsContainer);
//         return childs;
//     }
//     const ctx = new DViewCtx();
//     // todo
//     const view = new SymbolRefView(ctx, {
//         data: ref,
//         varsContainer,
//         isVirtual: false
//     });
//     const adapt = adapt2Shape(view);

//     return renderGroupChilds2(h, adapt.naviChilds || [], comsMap, undefined);
// }

export function render(h: Function,
    shape: SymbolRefShape,
    sym: SymbolShape,
    comsMap: Map<ShapeType, any>,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    reflush?: number) {

    if (!isVisible(shape, varsContainer)) return;
    if (!isAdaptedShape(shape)) throw new Error("not adapted shape");

    const frame = shape.frame;
    let rotate = (shape.rotation ?? 0);
    let hflip = !!shape.isFlippedHorizontal;
    let vflip = !!shape.isFlippedVertical;

    const path = shape.getPathStr();
    const notTrans = shape.isNoTransform()

    const childs = [];

    // fill
    childs.push(...fillR(h, shape.getFills(), frame, path));
    // symbol
    // childs.push(...renderSym(h, shape, frame, sym as SymbolShape, comsMap, varsContainer));
    childs.push(...renderGroupChilds2(h, shape.naviChilds || [], comsMap, undefined));
    // border
    childs.push(...borderR(h, shape.getBorders(), frame, path));

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }
    {
        const contextSettings = sym.style.contextSettings;
        if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
            if (props.opacity !== undefined) {
                props.opacity = props.opacity * contextSettings.opacity;
            }
            else {
                props.opacity = contextSettings.opacity;
            }
        }
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
        const shadows = shape.style.shadows;
        const ex_props = Object.assign({}, props);
        const shape_id = shape.id.slice(0, 4) + randomId();
        const shadow = shadowR(h, shape_id, shape.getShadows(), path, frame, shape.getFills(), shape.getBorders(), shape.type);
        if (shadow.length) {
            delete props.style;
            delete props.transform;
            const inner_url = innerShadowId(shape_id, shadows);
            if (shadows.length) props.filter = `url(#pd_outer-${shape_id}) ${inner_url}`;
            const body = h("g", props, childs);
            return h("g", ex_props, [...shadow, body]);
        } else {
            return h("g", props, childs);
        }
    }
}