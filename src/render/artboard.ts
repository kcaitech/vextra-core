import { Artboard } from "@/data/artboard";
import { BoolOp, ShapeType } from "@/data/shape";
import { renderGroupChilds as gR } from "@/render/group";

export function render(h: Function, shape: Artboard, bop: BoolOp, comsMap: Map<ShapeType, any>, reflush?: number) {
    // name
    // border
    // background

    const childs = [];
    // childs.push(h("text", {y: -5}, this.data.name));
    const frame = shape.frame;
    // background
    if (shape.hasBackgroundColor) {
        const color = shape.backgroundColor;
        childs.push(h("rect", {
            x: 0, y: 0, width: frame.width, height: frame.height,
            fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")",
            "fill-opacity": color ? color.alpha : 1,
            filter: "url(#artboard-shadow)"
        }))
    } else {
        childs.push(h("rect", { x: 0, y: 0, width: frame.width, height: frame.height, filter: "url(#artboard-shadow)" }))
    }
    childs.push(...gR(h, shape, bop, comsMap));
    return h('g', { transform: 'translate(' + frame.x + ',' + frame.y + ')', class: "artboard", reflush }, childs);
}