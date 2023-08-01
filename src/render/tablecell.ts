import { ShapeType, TableCell } from "../data/classes";

export function render(h: Function, shape: TableCell, comsMap: Map<ShapeType, any>): any {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;
    const child = shape.child;
    if (!child) return;

    const frame = shape.frame;
    const childs = [];

    const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
    const node = h(com, { data: child });
    childs.push(node);

    const props: any = {}
    props.transform = `translate(${frame.x},${frame.y})`

    return h('g', props, childs);
}