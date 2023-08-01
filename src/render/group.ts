import { GroupShape, ShapeType } from "../data/classes";

export function renderGroupChilds(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>): Array<any> {
    const childs: Array<any> = [];
    const cc = shape.childs.length;

    for (let i = 0; i < cc; i++) {
        const child = shape.childs[i];
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: child });
        childs.push(node);
    }

    return childs;
}

export function render(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>, reflush?: number): any {
    const isVisible = shape.isVisible ?? true;
    if (!isVisible) return;

    const childs: Array<any> = renderGroupChilds(h, shape, comsMap);
    const frame = shape.frame;

    const props: any = {}
    if (reflush) props.reflush = reflush;

    if (shape.isFlippedHorizontal || shape.isFlippedVertical || shape.rotation) {
        const cx = frame.x + frame.width / 2;
        const cy = frame.y + frame.height / 2;
        const style: any = {}
        style.transform = "translate(" + cx + "px," + cy + "px) "
        if (shape.isFlippedHorizontal) style.transform += "rotateY(180deg) "
        if (shape.isFlippedVertical) style.transform += "rotateX(180deg) "
        if (shape.rotation) style.transform += "rotate(" + shape.rotation + "deg) "
        style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
        props.style = style;
    }
    else {
        props.transform = `translate(${frame.x},${frame.y})`
    }
    return h('g', props, childs);
}