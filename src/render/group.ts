import { BoolOp, GroupShape, Shape, ShapeType } from "@/data/data/shape";

export function renderGroupChilds(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>): Array<any> {
    const childs: Array<any> = [];
    const cc = shape.childsCount;

    for (let i = 0; i < cc; i++) {
        const child = shape.getChildByIndex(i);
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: child });
        childs.push(node);
    }

    return childs;
}

export function render(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>, reflush?: number): any {
    const childs:Array<any> = renderGroupChilds(h, shape, comsMap);
    const frame = shape.frame;
    return h('g', { transform: 'translate(' + frame.x + ',' + frame.y + ')', reflush }, childs);
}