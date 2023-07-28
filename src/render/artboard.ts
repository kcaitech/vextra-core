
import { renderGroupChilds as gR } from "./group";
import { render as borderR } from "./border";
import { Artboard, ShapeType, Color  } from '../data/classes';

const defaultColor = Color.DefaultColor;
// artboard单独一个svg节点，需要设置overflow
export function render(h: Function, shape: Artboard, comsMap: Map<ShapeType, any>, reflush?: number) {
    if (!shape.isVisible) return;
    const ab_props: any = {
        version: "1.1",
        xmlns: "http://www.w3.org/2000/svg",
        "xmlns:xlink": "http://www.w3.org/1999/xlink",
        "xmlns:xhtml": "http://www.w3.org/1999/xhtml",
        preserveAspectRatio: "xMinYMin meet",
        reflush,
        overflow: "hidden",
    }
    const childs = [];
    const frame = shape.frame;
    ab_props.x = frame.x, ab_props.y = frame.y, ab_props.width = frame.width, ab_props.height = frame.height;
    ab_props.viewBox = `0 0 ${frame.width} ${frame.height}`;
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
    childs.push(...gR(h, shape, comsMap)); // 后代元素放中间
    /**
     * <svg>
     *   <svg></svg>
     * </svg>
     * 当一个<svg />里面嵌套一个<svg />(如上结构)时，会无法给里面的<svg />设置旋转属性，这里利用foreignObject隔离这种嵌套(如下结构)
     * <svg>
     *   <foreignObject>
     *      <div>
     *          <svg></svg>   <----真实展示的元素
     *      </div>
     *   </foreignObject>
     * </svg>
     */
    if (shape.isNoTransform()) {
        if (shape.style.borders.length) {
            const props: any = {}
            if (reflush) props.reflush = reflush;
            props.transform = `translate(${frame.x},${frame.y})`;
            const path = shape.getPath(true).toString();
            ab_props.x = 0;
            ab_props.y = 0;
            return h("g", props, [h('svg', ab_props, childs), ...borderR(h, shape.style, frame, path)]);
        } else {
            return h('svg', ab_props, childs);
        }
    } else {
        const foreign_object_props = {
            x: frame.x,
            y: frame.y,
            width: frame.width,
            height: frame.height,
            overflow: "visible",
        }
        ab_props.x = 0, ab_props.y = 0;
        let transform = `transform:`;
        if (shape.isFlippedHorizontal) {
            transform += ' rotateX(180deg)'
        }
        if (shape.isFlippedVertical) {
            transform += ' rotateY(180deg)'
        }
        if (shape.rotation) {
            transform += ` rotate(${shape.rotation}deg)`
        }
        ab_props.style = `transform-origin: center center; ${transform}`;
        ab_props.style = transform;
        const div_props = {
            width: frame.width,
            height: frame.height,
            overflow: "visible",
        }
        return h('foreignObject', foreign_object_props, h('div', div_props, h('svg', ab_props, childs)));
    }
}