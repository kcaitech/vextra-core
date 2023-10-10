import { GroupShape, Shape, ShapeFrame, ShapeType, SymbolRefShape, SymbolShape, Variable } from "../data/classes";
import { render as fillR } from "./fill";
import { render as borderR } from "./border";
import { RenderTransform, fixFrameByConstrain, isNoTransform, isVisible } from "./basic";
import { Matrix } from "../basic/matrix";

export function renderGroupChilds2(h: Function, childs: Array<Shape>, comsMap: Map<ShapeType, any>,
    transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): Array<any> {
    const nodes: Array<any> = [];
    const cc = childs.length;

    for (let i = 0; i < cc; i++) {
        const child = childs[i];
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: child, key: child.id, transform, varsContainer });
        nodes.push(node);
    }

    return nodes;
}

export function renderGroupChilds3(h: Function, shape: Shape, childs: Array<Shape>, comsMap: Map<ShapeType, any>,
    transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    // const nodes: Array<any> = [];
    // const cc = childs.length;

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

    let nodes: Array<any>;
    if (!transform || notTrans) {
        nodes = renderGroupChilds2(h, childs, comsMap, transform, varsContainer);
        return { nodes, frame, notTrans, hflip, vflip, rotate };
    }

    x += transform.dx;
    y += transform.dy;

    // todo 先判断scale
    width *= transform.scaleX;
    height *= transform.scaleY;
    rotate += transform.rotate;
    hflip = transform.hflip ? !hflip : hflip;
    vflip = transform.vflip ? !vflip : vflip;

    if (!rotate) {
        frame = new ShapeFrame(x, y, width, height);
        fixFrameByConstrain(shape, transform.parentFrame, frame);
        nodes = [];
        for (let i = 0, len = shape.childs.length; i < len; i++) { // 将旋转、翻转放入到子对象
            const cc = shape.childs[i]

            const c_frame = cc.frame;
            const dx: number = c_frame.x * (transform.scaleX - 1);
            const dy: number = c_frame.y * (transform.scaleY - 1);

            transform = {
                dx,
                dy,
                scaleX: transform.scaleX,
                scaleY: transform.scaleY,
                parentFrame: frame,
                vflip: false,
                hflip: false,
                rotate: 0
            }

            const com = comsMap.get(cc.type) || comsMap.get(ShapeType.Rectangle);
            const node = h(com, { data: cc, key: cc.id, transform, varsContainer });
            nodes.push(node);
        }
        return { nodes, frame, notTrans, hflip, vflip, rotate };
    }

    // rotated
    // todo
    frame = new ShapeFrame(x, y, width, height);
    fixFrameByConstrain(shape, transform.parentFrame, frame);
    const scaleX = frame.width / _frame.width;
    const scaleY = frame.height / _frame.height;

    // 摆正并将 flip rotate往下传
    // 非等比缩放
    // matrix2parent
    const m = new Matrix();
    const cx = frame.width / 2;
    const cy = frame.height / 2;
    m.trans(-cx, -cy);
    if (rotate) m.rotate(rotate / 360 * 2 * Math.PI);
    if (hflip) m.flipHoriz();
    if (vflip) m.flipVert();
    m.trans(cx, cy);
    m.trans(frame.x, frame.y);
    // bounds
    const corners = [{ x: 0, y: 0 },
    { x: frame.width, y: 0 },
    { x: frame.width, y: frame.height },
    { x: 0, y: frame.height }]
        .map((p) => m.computeCoord(p));
    const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
    const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
    const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
    const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
    const boundingBox = new ShapeFrame(minx, miny, maxx - minx, maxy - miny);

    nodes = [];
    for (let i = 0, len = shape.childs.length; i < len; i++) { // 将旋转、翻转放入到子对象
        const cc = shape.childs[i]
        const m1 = cc.matrix2Parent();
        m1.multiAtLeft(m);
        const target = m1.computeCoord(0, 0);

        const c_rotate = rotate + (cc.rotation || 0);
        const c_hflip = hflip ? !!cc.isFlippedHorizontal : !cc.isFlippedHorizontal;
        const c_vflip = vflip ? !!cc.isFlippedVertical : !cc.isFlippedVertical;
        const c_frame = cc.frame;
        // cc matrix2Parent
        const m2 = new Matrix();
        const cx = c_frame.width / 2;
        const cy = c_frame.height / 2;
        m2.trans(-cx, -cy);
        if (c_rotate) m2.rotate(c_rotate / 360 * 2 * Math.PI);
        if (c_hflip) m2.flipHoriz();
        if (c_vflip) m2.flipVert();
        m2.trans(cx, cy);
        m2.trans(c_frame.x, c_frame.y);

        m2.trans(boundingBox.x, boundingBox.y);
        const cur = m2.computeCoord(0, 0);

        const dx = target.x - cur.x;
        const dy = target.y - cur.y;

        transform = {
            dx,
            dy,
            scaleX,
            scaleY,
            parentFrame: boundingBox,
            vflip,
            hflip,
            rotate
        }

        const com = comsMap.get(cc.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, { data: cc, key: cc.id, transform, varsContainer });
        nodes.push(node);
    }

    return { nodes, frame, notTrans, hflip, vflip, rotate };
}

export function renderGroupChilds(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>,
    transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): Array<any> {
    return renderGroupChilds2(h, shape.childs, comsMap, transform, varsContainer);
}

export function render(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>,
    transform: RenderTransform | undefined,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
    consumedVars: { slot: string, vars: Variable[] }[] | undefined,
    reflush?: number): any {
    if (!isVisible(shape, varsContainer, consumedVars)) return;

    const { nodes, frame, notTrans, hflip, vflip, rotate } = renderGroupChilds3(h, shape, shape.childs, comsMap, transform, varsContainer);

    const path0 = shape.getPathOfFrame(frame);
    const path = path0.toString();
    const childs: Array<any> = [];

    // fill
    childs.push(...fillR(h, shape.style.fills, frame, path));

    // childs
    childs.push(...nodes);
    // border
    childs.push(...borderR(h, shape.style.borders, frame, path));

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    if (shape.isNoTransform() && notTrans) {
        props.transform = `translate(${frame.x},${frame.y})`
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

    return h('g', props, childs);
}