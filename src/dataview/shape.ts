import { RenderTransform, innerShadowId, renderBorders, renderFills, renderShadows } from "../render";
import { VariableType, OverrideType, Variable, ShapeFrame, SymbolRefShape, SymbolShape, Shape, CurvePoint, Point2D, Path, PathShape } from "../data/classes";
import { findOverrideAndVar } from "./basic";
import { EL, elh } from "./el";
import { ResizingConstraints } from "../data/consts";
import { Matrix } from "../basic/matrix";
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";
import { objectId } from "../basic/objectid";

export function isDiffShapeFrame(lsh: ShapeFrame, rsh: ShapeFrame) {
    return (
        lsh.x !== rsh.x ||
        lsh.y !== rsh.y ||
        lsh.width !== rsh.width ||
        lsh.height !== rsh.height
    );
}

export function isDiffRenderTransform(lhs: RenderTransform | undefined, rhs: RenderTransform | undefined) {
    if (lhs === rhs) { // both undefined
        return false;
    }
    if (lhs === undefined || rhs === undefined) {
        return true;
    }
    return (
        lhs.dx !== rhs.dx ||
        lhs.dy !== rhs.dy ||
        lhs.scaleX !== rhs.scaleX ||
        lhs.scaleY !== rhs.scaleY ||
        lhs.rotate !== rhs.rotate ||
        lhs.scaleX !== rhs.scaleX ||
        lhs.scaleY !== rhs.scaleY ||
        isDiffShapeFrame(lhs.parentFrame, rhs.parentFrame)
    )
}

export function isDiffVarsContainer(lhs: (SymbolRefShape | SymbolShape)[] | undefined, rhs: (SymbolRefShape | SymbolShape)[] | undefined): boolean {
    if (lhs === rhs) { // both undefined
        return false;
    }
    if (lhs === undefined || rhs === undefined) {
        return true;
    }
    if (lhs.length !== rhs.length) {
        return true;
    }
    for (let i = 0; i < lhs.length; i++) {
        if (lhs[i].id !== rhs[i].id) {
            return true;
        }
    }
    return false;
}

export function isNoTransform(trans: RenderTransform | undefined): boolean {
    return !trans ||
        trans.dx === 0 &&
        trans.dy === 0 &&
        trans.scaleX === 1 &&
        trans.scaleY === 1 &&
        trans.rotate === 0 &&
        !trans.hflip &&
        !trans.vflip;
}

export function fixFrameByConstrain(shape: Shape, parentFrame: ShapeFrame, frame: ShapeFrame) {
    const originParentFrame = shape.parent?.frame; // 至少有page!
    if (!originParentFrame) return;

    const cFrame = shape.frame;
    const resizingConstraint = shape.resizingConstraint;
    if (!resizingConstraint || ResizingConstraints.isUnset(resizingConstraint)) {
        return;
    }

    // 水平
    const hasWidth = ResizingConstraints.hasWidth(resizingConstraint);
    const hasLeft = ResizingConstraints.hasLeft(resizingConstraint);
    const hasRight = ResizingConstraints.hasRight(resizingConstraint);
    // 计算width, x
    // 宽度与同时设置左右是互斥关系，万一数据出错，以哪个优先？先以左右吧
    let cw = frame.width;
    let cx = frame.x;
    if (hasLeft && hasRight) {
        if (!hasWidth) {

            cx = cFrame.x;
            const dis = originParentFrame.width - (cFrame.x + cFrame.width);
            cw = parentFrame.width - dis - cx;
        }
    }
    else if (hasLeft) {
        cx = cFrame.x;
    }
    else if (hasRight) {
        cx = frame.x;
        const dis = originParentFrame.width - (cFrame.x + cFrame.width);
        cw = parentFrame.width - dis - cx;
    }
    // else if (hasWidth) {
    //     // 居中
    //     cx += (frame.width - cFrame.width) / 2;
    // }

    // 垂直
    const hasHeight = ResizingConstraints.hasHeight(resizingConstraint);
    const hasTop = ResizingConstraints.hasTop(resizingConstraint);
    const hasBottom = ResizingConstraints.hasBottom(resizingConstraint);
    // 计算height, y
    let ch = frame.height;
    let cy = frame.y;
    if (hasTop && hasBottom) {
        if (!hasHeight) {

            cy = cFrame.y;
            const dis = originParentFrame.height - (cFrame.y + cFrame.height);
            ch = parentFrame.height - dis - cy;
        }
    }
    else if (hasTop) {
        cy = cFrame.y;
    }
    else if (hasBottom) {
        cy = frame.y;
        const dis = originParentFrame.height - (cFrame.y + cFrame.height);
        ch = parentFrame.height - dis - cy;
    }
    // else if (hasHeight) {
    //     // 居中
    //     cy += (frame.height - cFrame.height) / 2;
    // }

    frame.x = cx;
    frame.y = cy;
    frame.width = cw;
    frame.height = ch;
}

export function matrix2parent(x: number, y: number, width: number, height: number, rotate: number, hflip: boolean, vflip: boolean) {
    const m = new Matrix();
    if (rotate || hflip || vflip) {
        const cx = width / 2;
        const cy = height / 2;
        m.trans(-cx, -cy);
        if (rotate) m.rotate(rotate / 360 * 2 * Math.PI);
        if (hflip) m.flipHoriz();
        if (vflip) m.flipVert();
        m.trans(cx, cy);
    }
    m.trans(x, y);
    return m;
}

export function boundingBox(m: Matrix, frame: ShapeFrame, path: Path): ShapeFrame {
    // const path = this.getPath();
    if (path.length > 0) {
        path.transform(m);
        const bounds = path.calcBounds();
        return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    }

    // const frame = this.frame;
    const corners = [{ x: 0, y: 0 }, { x: frame.width, y: 0 }, { x: frame.width, y: frame.height }, { x: 0, y: frame.height }]
        .map((p) => m.computeCoord(p));
    const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
    const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
    const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
    const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
    return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
}


export function transformPoints(points: CurvePoint[], matrix: Matrix) {
    const ret: CurvePoint[] = [];
    for (let i = 0, len = points.length; i < len; i++) {
        const p = points[i];
        const point: Point2D = matrix.computeCoord(p.x, p.y) as Point2D;
        const transp = new CurvePoint("", point.x, point.y, p.mode);

        if (p.hasFrom) {
            transp.hasFrom = true;
            const fromp = matrix.computeCoord(p.fromX || 0, p.fromY || 0);
            transp.fromX = fromp.x;
            transp.fromY = fromp.y;
        }
        if (p.hasTo) {
            transp.hasTo = true;
            const top = matrix.computeCoord(p.toX || 0, p.toY || 0);
            transp.toX = top.x;
            transp.toY = top.y;
        }

        ret.push(transp);
    }
    return ret;
}

export class ShapeView extends DataView {
    // layout & render args
    m_frame: ShapeFrame;
    m_hflip?: boolean;
    m_vflip?: boolean;
    m_rotate?: number;
    m_fixedRadius?: number;

    // cache
    // m_fills?: EL[]; // 不缓存,可回收
    // m_borders?: EL[];
    m_path?: Path;
    m_pathstr?: string;

    get parent(): ShapeView | undefined {
        return this.m_parent as ShapeView;
    }
    get childs(): ShapeView[] {
        return this.m_children as ShapeView[];
    }
    get naviChilds(): ShapeView[] {
        return this.m_children as ShapeView[];
    }

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        const shape = props.data;
        const frame = shape.frame;
        this.m_frame = new ShapeFrame(frame.x, frame.y, frame.width, frame.height);
        this.m_hflip = shape.isFlippedHorizontal;
        this.m_vflip = shape.isFlippedVertical;
        this.m_rotate = shape.rotation;
        this.m_fixedRadius = (shape as PathShape).fixedRadius; // rectangle

        this._layout(this.m_data, this.m_transx, this.m_varsContainer);
    }

    onDataChange(...args: any[]): void {
        if (args.includes('points') || (this.m_fixedRadius || 0) !== ((this.m_data as any).fixedRadius || 0)) {
            this.m_path = undefined;
            this.m_pathstr = undefined;
        }
        // if (args.includes('fills')) this.m_fills = undefined;
        // if (args.includes('borders')) this.m_borders = undefined;
        // this.updateRenderArgs(this.data.frame, this.data.isFlippedHorizontal, this.data.isFlippedVertical, this.data.rotation, this.data.fixedRadius)
    }

    protected _findOV(ot: OverrideType, vt: VariableType): Variable | undefined {
        if (!this.m_varsContainer) return;
        const _vars = findOverrideAndVar(this.m_data, ot, this.m_varsContainer);
        if (!_vars) return;
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === vt) {
            return _var;
        }
    }

    matrix2Parent(): Matrix {
        const frame = this.frame;
        return matrix2parent(frame.x, frame.y, frame.width, frame.height, this.m_rotate || 0, !!this.m_hflip, !!this.m_vflip);
    }

    get frame(): ShapeFrame {
        return this.m_frame;
    }

    isNoTransform() {
        return !this.m_hflip && !this.m_vflip && !this.m_rotate;
    }

    getFills() {
        const v = this._findOV(OverrideType.Fills, VariableType.Fills);
        return v ? v.value : this.m_data.style.fills;
    }

    getBorders() {
        const v = this._findOV(OverrideType.Borders, VariableType.Borders);
        return v ? v.value : this.m_data.style.borders;
    }

    getShadows() {
        const v = this._findOV(OverrideType.Shadows, VariableType.Shadows);
        return v ? v.value : this.m_data.style.shadows;
    }

    getPathStr() {
        if (this.m_pathstr) return this.m_pathstr;
        this.m_pathstr = this.getPath().toString(); // todo fixedRadius
        return this.m_pathstr;
    }
    getPath() {        
        if (this.m_path) return this.m_path;
        this.m_path = this.m_data.getPathOfFrame(this.frame, this.m_fixedRadius); // todo fixedRadius
        this.m_path.freeze();
        return this.m_path;
    }

    isVisible(): boolean {
        const v = this._findOV(OverrideType.Visible, VariableType.Visible);
        return v ? v.value : !!this.m_data.isVisible;
    }

    isLocked(): boolean {
        const v = this._findOV(OverrideType.Lock, VariableType.Lock);
        return v ? v.value : !!this.m_data.isLocked;
    }

    prepare() {
        // prepare path
        // prepare frame
    }

    // =================== update ========================
    updateLayoutArgs(frame: ShapeFrame, hflip: boolean | undefined, vflip: boolean | undefined, rotate: number | undefined, radius: number | undefined) {
        const _frame = this.frame;
        if (isDiffShapeFrame(_frame, frame)) {
            _frame.x = frame.x;
            _frame.y = frame.y;
            _frame.width = frame.width;
            _frame.height = frame.height;
            this.m_pathstr = undefined; // need update
            this.m_path = undefined;
            // if (this.m_borders) {
            //     // recycleELArr(this.m_borders);
            //     this.m_borders = undefined;
            // }
            // if (this.m_fills) {
            //     // recycleELArr(this.m_fills);
            //     this.m_fills = undefined;
            // }
        }
        this.m_hflip = hflip;
        this.m_vflip = vflip;
        this.m_rotate = rotate;
        if ((this.m_fixedRadius || 0) !== (radius || 0)) {
            this.m_fixedRadius = radius;
            this.m_pathstr = undefined; // need update
            this.m_path = undefined;
            // if (this.m_borders) {
            //     // recycleELArr(this.m_borders);
            //     this.m_borders = undefined;
            // }
            // if (this.m_fills) {
            //     // recycleELArr(this.m_fills);
            //     this.m_fills = undefined;
            // }
        }
    }

    protected layoutOnNormal(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    }

    protected layoutOnRectShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, parentFrame: ShapeFrame, scaleX: number, scaleY: number) {
    }

    protected layoutOnDiamondShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scaleX: number, scaleY: number, rotate: number, vflip: boolean, hflip: boolean, bbox: ShapeFrame, m: Matrix) {
    }

    protected isNoSupportDiamondScale(): boolean {
        return false;
    }

    protected _layout(shape: Shape, transform: RenderTransform | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
        // const shape = this.m_data;
        // const transform = this.m_transx;

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

        // case 1 不需要变形
        if (!transform || notTrans) {
            // update frame, hflip, vflip, rotate
            this.updateLayoutArgs(frame, hflip, vflip, rotate, (shape as PathShape).fixedRadius);
            // todo 需要继续update childs
            this.layoutOnNormal(varsContainer);
            return;
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
        const fixWidth = resizingConstraint && ResizingConstraints.hasWidth(resizingConstraint);
        const fixHeight = resizingConstraint && ResizingConstraints.hasHeight(resizingConstraint);
        // case 2 没有旋转，或者形状规则，不会出现菱形变形
        if (!rotate || fixWidth || fixHeight) {
            const saveW = width;
            const saveH = height;
            if (!(fixWidth || fixHeight)) { // no fixSize and no rotate
                // no rotate
                x *= scaleX;
                y *= scaleY;
                width *= scaleX;
                height *= scaleY;
            }
            else if (fixWidth && fixHeight) {
                // 不需要缩放，但要调整位置
                x *= scaleX;
                y *= scaleY;
                // 居中
                x += (width * (scaleX - 1)) / 2;
                y += (height * (scaleY - 1)) / 2;
            } else if (rotate) { // fixWidth || fixHeight
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
            } else { // no rotate && (fixWidth || fixHeight)
                const newscaleX = fixWidth ? 1 : scaleX;
                const newscaleY = fixHeight ? 1 : scaleY;
                x *= scaleX;
                y *= scaleY;
                if (fixWidth) x += (width * (scaleX - 1)) / 2;
                if (fixHeight) y += (height * (scaleY - 1)) / 2;
                width *= newscaleX;
                height *= newscaleY;
            }

            const parentFrame = new ShapeFrame(x, y, width, height);
            fixFrameByConstrain(shape, transform.parentFrame, parentFrame);

            const cscaleX = parentFrame.width / saveW;
            const cscaleY = parentFrame.height / saveH;

            // update frame, hflip, vflip, rotate
            this.updateLayoutArgs(parentFrame, hflip, vflip, rotate, (shape as PathShape).fixedRadius);
            this.layoutOnRectShape(varsContainer, parentFrame, cscaleX, cscaleY);

            return;
        }

        // case 3 不支持菱形变形
        if (this.isNoSupportDiamondScale()) {

            const m = new Matrix();
            m.rotate(rotate / 360 * 2 * Math.PI);
            m.scale(scaleX, scaleY);
            const _newscale = m.computeRef(1, 1);
            m.scale(1 / scaleX, 1 / scaleY);
            const newscale = m.inverseRef(_newscale.x, _newscale.y);
            x *= scaleX;
            y *= scaleY;
            width *= newscale.x;
            height *= newscale.y;

            const frame = new ShapeFrame(x, y, width, height);
            fixFrameByConstrain(shape, transform.parentFrame, frame);

            this.updateLayoutArgs(frame, hflip, vflip, rotate, (shape as PathShape).fixedRadius);
            this.layoutOnRectShape(varsContainer, frame, scaleX, scaleY);
            return;
        }

        // case 4 菱形变形
        // cur frame
        frame = new ShapeFrame(x, y, width, height);
        // matrix2parent
        const m = matrix2parent(x, y, width, height, rotate, hflip, vflip);
        // bounds
        const bbox = boundingBox(m, frame, shape.getPathOfFrame(frame));
        // todo 要变换points

        const parentFrame = new ShapeFrame(bbox.x * scaleX, bbox.y * scaleY, bbox.width * scaleX, bbox.height * scaleY);
        fixFrameByConstrain(shape, transform.parentFrame, parentFrame); // 左上右下
        const cscaleX = parentFrame.width / bbox.width;
        const cscaleY = parentFrame.height / bbox.height;

        // update frame, rotate, hflip...
        this.updateLayoutArgs(parentFrame, undefined, undefined, undefined, (shape as PathShape).fixedRadius);

        this.layoutOnDiamondShape(varsContainer, cscaleX, cscaleY, rotate, vflip, hflip, bbox, m);

    }

    // 更新frame, vflip, hflip, rotate, fixedRadius, 及对应的cache数据，如path
    // 更新childs, 及向下更新数据变更了的child(在datachangeset)
    // 父级向下更新时带props, 自身更新不带
    layout(props?: PropsType) {
        // todo props没更新时是否要update
        // 在frame、flip、rotate修改时需要update
        const tid = this.id;
        const needLayout = this.m_ctx.removeReLayout(this); // remove from changeset

        if (props) {
            // 
            if (props.data.id !== this.m_data.id) throw new Error('id not match');
            // check
            const diffTransform = isDiffRenderTransform(props.transx, this.m_transx);
            const diffVars = isDiffVarsContainer(props.varsContainer, this.m_varsContainer);
            if (!needLayout &&
                !diffTransform &&
                !diffVars) {
                return;
            }

            if (diffTransform) {
                // update transform
                this.m_transx = props.transx;
            }
            if (diffVars) {
                // update varscontainer
                this.m_ctx.removeDirty(this);
                this.m_varsContainer = props.varsContainer;
                const _id = this.id;
                // if (_id !== tid) {
                //     // tid = _id;
                // }
            }
        }

        this.m_ctx.setDirty(this);
        this._layout(this.m_data, this.m_transx, this.m_varsContainer);
        this.notify("layout");
        this.emit("layout");
    }

    // ================== render ===========================


    protected renderFills(): EL[] {
        // if (!this.m_fills) {
        //     this.m_fills = renderFills(elh, this.getFills(), this.frame, this.getPathStr());
        // }
        // return this.m_fills;
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr());
    }

    protected renderBorders(): EL[] {
        // if (!this.m_borders) {
        //     this.m_borders = renderBorders(elh, this.getBorders(), this.frame, this.getPathStr());
        // }
        // return this.m_borders;
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr());
    }

    protected renderShadows(filterId: string): EL[] {
        return renderShadows(elh, filterId, this.getShadows(), this.getPathStr(), this.m_data, this.frame);
    }

    protected renderProps(): { [key: string]: string } {
        const shape = this.m_data;
        const frame = this.frame;
        // const path = this.getPath(); // cache
        const props: any = {}

        const contextSettings = shape.style.contextSettings;
        if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
            props.opacity = contextSettings.opacity;
        }

        if (this.isNoTransform()) {
            props.transform = `translate(${frame.x},${frame.y})`
        } else {
            const cx = frame.x + frame.width / 2;
            const cy = frame.y + frame.height / 2;
            const style: any = {}
            style.transform = "translate(" + cx + "px," + cy + "px) "
            if (this.m_hflip) style.transform += "rotateY(180deg) "
            if (this.m_vflip) style.transform += "rotateX(180deg) "
            if (this.m_rotate) style.transform += "rotate(" + this.m_rotate + "deg) "
            style.transform += "translate(" + (-cx + frame.x) + "px," + (-cy + frame.y) + "px)"
            props.style = style;
        }
        return props;
    }

    protected renderContents(): EL[] {
        const childs = this.m_children;
        childs.forEach((c) => c.render())
        return childs;
    }

    // private m_save_render: EL | undefined;

    protected m_render_version: number = 0;

    protected checkAndResetDirty(): boolean {
        return this.m_ctx.removeDirty(this);
    }

    render(): number {

        // const tid = this.id;
        const isDirty = this.checkAndResetDirty();
        if (!isDirty) {
            return this.m_render_version;
        }

        if (!this.isVisible()) {
            this.reset("g"); // 还是要给个节点，不然后后面可见了挂不上dom
            return ++this.m_render_version;
        }

        // fill
        const fills = this.renderFills() || []; // cache
        // childs
        const childs = this.renderContents(); // VDomArray
        // border
        const borders = this.renderBorders() || []; // ELArray

        const props = this.renderProps();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);

        if (shadows.length > 0) { // 阴影
            const ex_props = Object.assign({}, props);
            delete props.style;
            delete props.transform;
            delete props.opacity;

            const inner_url = innerShadowId(filterId, this.getShadows());
            props.filter = `url(#pd_outer-${filterId}) ${inner_url}`;
            const body = elh("g", props, [...fills, ...childs, ...borders]);
            this.reset("g", ex_props, [...shadows, body])
        }
        else {
            this.reset("g", props, [...fills, ...childs, ...borders]);
        }
        return ++this.m_render_version;
    }
}