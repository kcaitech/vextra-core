import {renderGroupChilds as gR} from "./group";
import {render as borderR} from "./border";
import {Artboard, ShapeType, Color, SymbolShape, SymbolRefShape, Variable} from '../data/classes';
import {isVisible, RenderTransform} from "./basic";
import {innerShadowId, renderWithVars as shadowR} from "./shadow";

const defaultColor = Color.DefaultColor;

// artboard单独一个svg节点，需要设置overflow
export function render(h: Function,
                       shape: Artboard,
                       comsMap: Map<ShapeType, any>,
                       transform: RenderTransform | undefined, // todo
                       varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
                       reflush?: number) {
    if (!isVisible(shape, varsContainer)) return;

    const ab_props: any = {
        version: "1.1",
        xmlns: "http://www.w3.org/2000/svg",
        "xmlns:xlink": "http://www.w3.org/1999/xlink",
        "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
        preserveAspectRatio: "xMinYMin meet",
        reflush,
        overflow: "hidden"
    }

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        ab_props.opacity = contextSettings.opacity;
    }

    const childs = [];
    const frame = shape.frame;
    ab_props.width = frame.width, ab_props.height = frame.height;
    ab_props.viewBox = `0 0 ${frame.width} ${frame.height}`;
    // 
    // background 背景色垫底
    const fills = shape.style.fills;
    if (fills && fills.length) {
        for (let i = 0; i < fills.length; i++) {
            const color = fills[i].color || defaultColor;
            childs.push(h("rect", {
                x: 0, y: 0, width: frame.width, height: frame.height,
                fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")"
            }))
        }
    }

    childs.push(...gR(h, shape, comsMap, undefined, varsContainer)); // 后代元素放中间

    const path = shape.getPath().toString();
    if (shape.isNoTransform()) {
        const shadows = shape.style.shadows;
        const shape_id = shape.id.slice(0, 4);
        const shadow = shadowR(h, shape_id, shape, path, varsContainer, comsMap);
        const b_len = shape.style.borders.length;
        if (b_len) {
            const props: any = {}
            if (reflush) props.reflush = reflush;
            props.transform = `translate(${frame.x},${frame.y})`;
            const path = shape.getPath().toString();
            ab_props.x = 0, ab_props.y = 0;
            const ex_props = Object.assign({}, props);
            if (shadow.length) {
                delete props.style;
                delete props.transform;
                const inner_url = innerShadowId(shape_id, shadows);
                if (shadows.length) props.filter = `${inner_url} url(#dorp-shadow-${shape_id})`;
                const body = h("g", props, [h('svg', ab_props, childs), ...borderR(h, shape.style.borders, frame, path)]);
                return h("g", ex_props, [...shadow, body]);
            } else {
                return h("g", props, [h('svg', ab_props, childs), ...borderR(h, shape.style.borders, frame, path)]);
            }
        } else {
            ab_props.x = frame.x, ab_props.y = frame.y;
            const ex_props = Object.assign({});
            if (shadow.length) {
                ab_props.x = 0, ab_props.y = 0;
                const props: any = {}
                ex_props.transform = `translate(${frame.x},${frame.y})`;
                const inner_url = innerShadowId(shape_id, shadows);
                if (shadows.length) props.filter = `${inner_url} url(#dorp-shadow-${shape_id})`;
                const body = h("g", props, [h('svg', ab_props, childs)]);
                return h("g", ex_props, [...shadow, body]);
            } else {
                return h('svg', ab_props, childs);
            }
        }
    } else {
        const props: any = {}
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (shape.isFlippedHorizontal) style.transform += "rotateY(180deg) "
        if (shape.isFlippedVertical) style.transform += "rotateX(180deg) "
        if (shape.rotation) style.transform += "rotate(" + shape.rotation + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
        if (reflush) props.reflush = reflush;
        ab_props.x = 0, ab_props.y = 0;

        // shadow
        const shadows = shape.style.shadows;
        const shape_id = shape.id.slice(0, 4);
        const shadow = shadowR(h, shape_id, shape, path, varsContainer, comsMap); // todo 
        const b_len = shape.style.borders.length;
        if (b_len) {
            const path = shape.getPath().toString();
            if (shadow.length) {
                const ex_props = Object.assign({}, props);
                delete props.style;
                delete props.transform;
                const inner_url = innerShadowId(shape_id, shadows);
                if (shadows.length) props.filter = `${inner_url} url(#dorp-shadow-${shape_id})`;
                const body = h("g", props, [h('svg', ab_props, childs), ...borderR(h, shape.style.borders, frame, path)]);
                return h("g", ex_props, [...shadow, body]);
            } else {
                return h("g", props, [h('svg', ab_props, childs), ...borderR(h, shape.style.borders, frame, path)]);
            }
        } else {
            if (shadow.length) {
                const ex_props = Object.assign({}, props);
                delete props.style;
                delete props.transform;
                const inner_url = innerShadowId(shape_id, shadows);
                if (shadows.length) props.filter = `${inner_url} url(#dorp-shadow-${shape_id})`;
                const body = h("g", props, [h('svg', ab_props, childs)]);
                return h("g", ex_props, [...shadow, body]);
            } else {
                return h("g", props, [h('svg', ab_props, childs)]);
            }
        }
    }
}