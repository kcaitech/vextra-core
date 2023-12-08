import {GroupShape, Path, Shape, ShapeFrame, ShapeType, SymbolRefShape, SymbolShape} from "../data/classes";
import {renderWithVars as fillR} from "./fill";
import {renderWithVars as borderR} from "./border";
import {RenderTransform, boundingBox, fixFrameByConstrain, isNoTransform, isVisible, matrix2parent} from "./basic";
import {Matrix} from "../basic/matrix";
import {ResizingConstraints} from "../data/consts";
import {innerShadowId, renderWithVars as shadowR} from "./shadow";

export function renderGroupChilds2(h: Function, childs: Array<Shape>, comsMap: Map<ShapeType, any>,
                                   transform: RenderTransform | undefined,
                                   varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): Array<any> {
    const nodes: Array<any> = [];
    const cc = childs.length;

    for (let i = 0; i < cc; i++) {
        const child = childs[i];
        const com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, {data: child, key: child.id, transx: transform, varsContainer});
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

    let notTrans = isNoTransform(transform);

    let nodes: Array<any>;
    if (!transform || notTrans) {
        nodes = renderGroupChilds2(h, childs, comsMap, undefined, varsContainer);
        return {nodes, frame, notTrans: shape.isNoTransform(), hflip, vflip, rotate};
    }

    // 这些是parent的属性！
    x += transform.dx;
    y += transform.dy;
    rotate += transform.rotate;
    hflip = transform.hflip ? !hflip : hflip;
    vflip = transform.vflip ? !vflip : vflip;
    const scaleX = transform.scaleX;
    const scaleY = transform.scaleY;

    const resizingConstraint = shape.resizingConstraint;
    if (!rotate || resizingConstraint && (ResizingConstraints.hasWidth(resizingConstraint) || ResizingConstraints.hasHeight(resizingConstraint))) {

        const saveW = width;
        const saveH = height;
        if (resizingConstraint && (ResizingConstraints.hasWidth(resizingConstraint) || ResizingConstraints.hasHeight(resizingConstraint))) {
            const fixWidth = ResizingConstraints.hasWidth(resizingConstraint);
            const fixHeight = ResizingConstraints.hasHeight(resizingConstraint);

            if (fixWidth && fixHeight) {
                // 不需要缩放，但要调整位置
                x *= scaleX;
                y *= scaleY;
                // 居中
                x += (width * (scaleX - 1)) / 2;
                y += (height * (scaleY - 1)) / 2;
            } else if (rotate) {
                const m = new Matrix();
                m.rotate(rotate / 360 * 2 * Math.PI);
                m.scale(scaleX, scaleY);
                const _newscale = m.computeRef(1, 1);
                m.scale(1 / scaleX, 1 / scaleY);
                const newscale = m.inverseRef(_newscale.x, _newscale.y);
                x *= scaleX;
                y *= scaleY;

                if (fixWidth) {
                    x += (width * (newscale.x - 1)) / 2;
                    newscale.x = 1;
                } else {
                    y += (height * (newscale.y - 1)) / 2;
                    newscale.y = 1;
                }
                width *= newscale.x;
                height *= newscale.y;
            } else {
                const newscaleX = fixWidth ? 1 : scaleX;
                const newscaleY = fixHeight ? 1 : scaleY;
                x *= scaleX;
                y *= scaleY;
                if (fixWidth) x += (width * (scaleX - 1)) / 2;
                if (fixHeight) y += (height * (scaleY - 1)) / 2;
                width *= newscaleX;
                height *= newscaleY;
            }
        } else {
            x *= scaleX;
            y *= scaleY;
            width *= scaleX;
            height *= scaleY;
        }

        const parentFrame = new ShapeFrame(x, y, width, height);
        fixFrameByConstrain(shape, transform.parentFrame, parentFrame);

        const cscaleX = parentFrame.width / saveW;
        const cscaleY = parentFrame.height / saveH;

        nodes = [];
        for (let i = 0, len = shape.childs.length; i < len; i++) {
            const cc = shape.childs[i]

            transform = {
                dx: 0,
                dy: 0,
                scaleX: cscaleX,
                scaleY: cscaleY,
                parentFrame,
                vflip: false,
                hflip: false,
                rotate: 0
            }

            const com = comsMap.get(cc.type) || comsMap.get(ShapeType.Rectangle);
            const node = h(com, {data: cc, key: cc.id, transx: transform, varsContainer});
            nodes.push(node);
        }
        return {nodes, frame: parentFrame, notTrans, hflip, vflip, rotate};
    }

    // cur frame
    frame = new ShapeFrame(x, y, width, height);
    // matrix2parent
    const m = matrix2parent(x, y, width, height, rotate, hflip, vflip);
    // bounds
    const bbox = boundingBox(m, frame, new Path());
    // todo 要变换points

    const parentFrame = new ShapeFrame(bbox.x * scaleX, bbox.y * scaleY, bbox.width * scaleX, bbox.height * scaleY);
    fixFrameByConstrain(shape, transform.parentFrame, parentFrame); // 左上右下
    const cscaleX = parentFrame.width / bbox.width;
    const cscaleY = parentFrame.height / bbox.height;

    nodes = [];
    for (let i = 0, len = shape.childs.length; i < len; i++) { //摆正： 将旋转、翻转放入到子对象
        const cc = shape.childs[i]
        const m1 = cc.matrix2Parent();
        m1.multiAtLeft(m);
        const target = m1.computeCoord(0, 0);

        const c_rotate = rotate + (cc.rotation || 0);
        const c_hflip = hflip ? !cc.isFlippedHorizontal : !!cc.isFlippedHorizontal;
        const c_vflip = vflip ? !cc.isFlippedVertical : !!cc.isFlippedVertical;
        const c_frame = cc.frame;
        // cc matrix2Parent
        const m2 = matrix2parent(c_frame.x, c_frame.y, c_frame.width, c_frame.height, c_rotate, c_hflip, c_vflip);

        m2.trans(bbox.x, bbox.y); // todo 使用parentFrame.x y会与rect对不齐，待研究
        const cur = m2.computeCoord(0, 0);

        const dx = target.x - cur.x;
        const dy = target.y - cur.y;

        transform = {
            dx,
            dy,
            scaleX: cscaleX,
            scaleY: cscaleY,
            parentFrame: parentFrame,
            vflip,
            hflip,
            rotate
        }

        const com = comsMap.get(cc.type) || comsMap.get(ShapeType.Rectangle);
        const node = h(com, {data: cc, key: cc.id, transx: transform, varsContainer});
        nodes.push(node);
    }

    frame = parentFrame;
    rotate = 0;
    hflip = false;
    vflip = false;
    notTrans = true;

    return {nodes, frame, notTrans, hflip, vflip, rotate};
}

export function renderGroupChilds(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>,
                                  transform: RenderTransform | undefined,
                                  varsContainer: (SymbolRefShape | SymbolShape)[] | undefined): Array<any> {
    return renderGroupChilds2(h, shape.childs, comsMap, transform, varsContainer);
}

export function render(h: Function, shape: GroupShape, comsMap: Map<ShapeType, any>,
                       transform: RenderTransform | undefined,
                       varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
                       reflush?: number): any {
    if (!isVisible(shape, varsContainer)) return;

    const {
        nodes,
        frame,
        notTrans,
        hflip,
        vflip,
        rotate
    } = renderGroupChilds3(h, shape, shape.childs, comsMap, transform, varsContainer);

    const path0 = shape.getPathOfFrame(frame);
    const path = path0.toString();
    const childs: Array<any> = [];

    // fill
    childs.push(...fillR(h, shape, frame, path, varsContainer));

    // childs
    childs.push(...nodes);
    // border
    childs.push(...borderR(h, shape, frame, path, varsContainer));

    const props: any = {}
    if (reflush) props.reflush = reflush;

    const contextSettings = shape.style.contextSettings;
    if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
        props.opacity = contextSettings.opacity;
    }

    if (notTrans) {
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
    const shadows = shape.style.shadows;
    const shape_id = shape.id.slice(0, 4);
    const shadow = shadowR(h, shape_id, shape, path, varsContainer, comsMap);
    if (shadow.length) {
        const ex_props = Object.assign({}, props);
        delete props.style;
        delete props.transform;
        const inner_url = innerShadowId(shape_id, shadows);
        if (shadows.length) props.filter = `${inner_url}`;
        const body = h("g", props, childs);
        return h("g", ex_props, [...shadow, body]);
    } else {
        return h("g", props, childs);
    }
}