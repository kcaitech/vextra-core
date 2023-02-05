import { BoolOp, GroupShape, Shape, ShapeType } from "@/data/shape";

export function renderGroupChilds(h: Function, shape: GroupShape, bop: BoolOp, comsMap: Map<ShapeType, any>, consumed?: Array<Shape>): Array<any> {
    const childs: Array<any> = [];
    const cc = shape.childsCount;

    for (let i = 0; i < cc; i++) {
        const child = shape.getChildByIndex(i);
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: child, boolop: bop });
        childs.push(node);
    }

    return childs;
}

export function render(h: Function, shape: GroupShape, bop: BoolOp, comsMap: Map<ShapeType, any>, reflush?: number, consumed?: Array<Shape>): any {
    const childs:Array<any> = renderGroupChilds(h, shape, bop, comsMap, consumed);
    const frame = shape.frame;
    return h('g', { transform: 'translate(' + frame.x + ',' + frame.y + ')', reflush: reflush || 0 }, childs);
}