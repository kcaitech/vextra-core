import { innerShadowId, renderBorders, renderFills, renderShadows, renderBlur } from "../render";
import {
    VariableType,
    OverrideType,
    Variable,
    ShapeFrame,
    SymbolRefShape,
    SymbolShape,
    Shape,
    CurvePoint,
    Point2D,
    Path,
    PathShape,
    Fill,
    Border,
    Shadow,
    ShapeType,
    CornerRadius,
    Blur,
    ShapeSize,
    Transform
} from "../data/classes";
import { findOverrideAndVar } from "./basic";
import { EL, elh } from "./el";
import { Matrix } from "../basic/matrix";
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";
import { objectId } from "../basic/objectid";
import { BasicArray } from "../data/basic";
import { fixConstrainFrame } from "../data/constrain";
import { BlurType, BorderPosition, MarkerType } from "../data/typesdefine";
import { makeShapeTransform2By1, makeShapeTransform1By2 } from "../data/shape_transform_util";
import { Transform as Transform2 } from "../basic/transform";
import { float_accuracy } from "../basic/consts";

export function isDiffShapeFrame(lsh: ShapeFrame, rsh: ShapeFrame) {
    return (
        lsh.x !== rsh.x ||
        lsh.y !== rsh.y ||
        lsh.width !== rsh.width ||
        lsh.height !== rsh.height
    );
}

export function isDiffScale(lhs: { x: number, y: number } | undefined, rhs: {
    x: number,
    y: number
} | undefined) {
    if (lhs === rhs) { // both undefined
        return false;
    }
    if (lhs === undefined || rhs === undefined) {
        return true;
    }
    // return (!lhs.matrix.equals(rhs.matrix) ||
    //     isDiffShapeFrame(lhs.parentFrame, rhs.parentFrame)
    // )
    return lhs.x !== rhs.x || lhs.y !== rhs.y;
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
        if (lhs[i].id !== rhs[i].id || objectId(lhs[i]) !== objectId(rhs[i])) {
            return true;
        }
    }
    return false;
}

export function isNoScale(trans: { x: number, y: number } | undefined): boolean {
    // return !trans || trans.matrix.isIdentity()
    return !trans || trans.x === 1 && trans.y === 1;
}

export function fixFrameByConstrain(shape: Shape, parentFrame: ShapeSize, frame: ShapeFrame, scaleX: number, scaleY: number) {
    if (shape.parent?.type === ShapeType.Page) return; // page不会有constrain
    const originParentFrame = shape.parent?.size; // 至少有page!
    if (!originParentFrame) return;

    const isGroupChild = shape.parent?.type === ShapeType.Group;

    if (isGroupChild) { // 编组的子元素当忽略约束并跟随编组缩放
        frame.x *= scaleX;
        frame.y *= scaleY;
        frame.width *= scaleX;
        frame.height *= scaleY;
    } else {
        const resizingConstraint = shape.resizingConstraint ?? 0; // 默认值为靠左、靠顶、宽高固定
        // const recorder = (window as any).__size_recorder;
        const __f = fixConstrainFrame(resizingConstraint, frame.x, frame.y, frame.width, frame.height, scaleX, scaleY, parentFrame, originParentFrame);

        frame.x = __f.x;
        frame.y = __f.y;
        frame.width = __f.width;
        frame.height = __f.height;
    }
}

export function matrix2parent(t: Transform, matrix?: Matrix) {
    // const t = this.transform;
    const m = t.toMatrix();
    if (!matrix) return m;
    matrix.multiAtLeft(m);
    return matrix;
}

export function boundingBox(frame: ShapeSize, shape: Shape): ShapeFrame {
    let _minx = 0, _maxx = frame.width, _miny = 0, _maxy = frame.height;
    if (shape.isNoTransform()) {
        return new ShapeFrame(_minx, _miny, _maxx, _maxy);
    }

    const path = shape.getPathOfSize(frame);
    if (path.length > 0) {
        const bounds = path.calcBounds();
        _minx = bounds.minX;
        _maxx = bounds.maxX;
        _miny = bounds.minY;
        _maxy = bounds.maxY;
    }

    const m = shape.matrix2Parent();
    const corners = [{ x: _minx, y: _miny }, { x: _maxx, y: _miny }, { x: _maxx, y: _maxy }, { x: _minx, y: _maxy }]
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
        const transp = new CurvePoint(([i] as BasicArray<number>), "", point.x, point.y, p.mode);

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
        transp.radius = p.radius;

        ret.push(transp);
    }
    return ret;
}

export function frame2Parent(t: Transform, size: ShapeSize): ShapeFrame {
    if (t.m00 == 1 && t.m01 === 0 && t.m10 === 0 && t.m11 === 1) return new ShapeFrame(t.m02, t.m12, size.width, size.height)
    const lt = t.computeCoord(0, 0);
    const rb = t.computeCoord(size.width, size.height);
    return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
}

export function frame2Parent2(t: Transform, size: ShapeFrame): ShapeFrame {
    if (t.m00 == 1 && t.m01 === 0 && t.m10 === 0 && t.m11 === 1) return new ShapeFrame(t.m02, t.m12, size.width, size.height)
    const lt = t.computeCoord(size.x, size.y);
    const rb = t.computeCoord(size.x + size.width, size.y + size.height);
    return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
}

function frameContains(frame: ShapeFrame, x: number, y: number) {
    return x >= frame.x && x < (frame.x + frame.width) && y >= frame.y && y < (frame.y + frame.height);
}

function _hitTest(shape: ShapeView, x: number, y: number, type: '_p_frame' | '_p_visibleFrame' | '_p_outerFrame', depth: number, ret: { shape: ShapeView, x: number, y: number }[]) {
    for (let i = 0, len = shape.m_children.length; i < len; ++i) {
        const child = shape.m_children[i] as ShapeView;
        if (frameContains(child[type], x, y)) {
            const xy = child.m_transform.inverseCoord(x, y);
            ret.push({ shape: child, x: xy.x, y: xy.y })
            if (depth > 1) _hitTest(child, xy.x, xy.y, type, depth - 1, ret)
        }
    }
}

function hitTest(shape: ShapeView, x: number, y: number, type: { m: 'm_frame', p: '_p_frame' } | { m: 'm_visibleFrame', p: '_p_visibleFrame' } | { m: 'm_outerFrame', p: '_p_outerFrame' }, depth: number, ret: { shape: ShapeView, x: number, y: number }[]) {
    if (depth > 0 && frameContains(shape[type.m], x, y)) _hitTest(shape, x, y, type.p, depth, ret);
}

export function updateFrame(frame: ShapeFrame, x: number, y: number, w: number, h: number): boolean {
    if (frame.x !== x || frame.y !== y || frame.width !== w || frame.height !== h) {
        frame.x = x;
        frame.y = y;
        frame.width = w;
        frame.height = h;
        return true;
    }
    return false;
}

export class ShapeView extends DataView {

    m_transform: Transform;

    _save_frame: ShapeFrame = new ShapeFrame(); // 对象内坐标系的大小 // 用于updateFrames判断frame是否变更
    m_frame: ShapeFrame = new ShapeFrame(); // 对象内坐标系的大小
    m_visibleFrame: ShapeFrame = new ShapeFrame(); // 对象内坐标系的大小
    m_outerFrame: ShapeFrame = new ShapeFrame(); // 对象内坐标系的大小

    _p_frame: ShapeFrame = new ShapeFrame(); // 父级坐标系的大小 // 用于优化updateFrames, hittest
    _p_visibleFrame: ShapeFrame = new ShapeFrame(); // 父级坐标系的大小 // 用于优化updateFrames, hittest
    _p_outerFrame: ShapeFrame = new ShapeFrame(); // 父级坐标系的大小 // 用于优化updateFrames, hittest

    m_fixedRadius?: number;

    m_path?: Path;
    m_pathstr?: string;

    m_transform2: Transform2 | undefined;

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        const shape = props.data;
        const t = shape.transform;
        this.m_transform = new Transform(t.m00, t.m01, t.m02, t.m10, t.m11, t.m12)
        this.m_fixedRadius = (shape as PathShape).fixedRadius; // rectangle
    }

    hitContent(x: number, y: number, depth: number): { shape: ShapeView; x: number; y: number; }[] {
        const ret: { shape: ShapeView, x: number, y: number }[] = [];
        hitTest(this, x, y, { m: "m_frame", p: '_p_frame' }, depth, ret);
        return ret;
    }
    hitVisible(x: number, y: number, depth: number): { shape: ShapeView; x: number; y: number; }[] {
        const ret: { shape: ShapeView, x: number, y: number }[] = [];
        hitTest(this, x, y, { m: "m_visibleFrame", p: "_p_visibleFrame" }, depth, ret);
        return ret;
    }
    hitOuter(x: number, y: number, depth: number): { shape: ShapeView; x: number; y: number; }[] {
        const ret: { shape: ShapeView, x: number, y: number }[] = [];
        hitTest(this, x, y, { m: "m_outerFrame", p: "_p_outerFrame" }, depth, ret);
        return ret;
    }

    hasSize() {
        return this.m_data.hasSize();
    }

    onMounted() {
        const parent = this.parent;
        const parentFrame = parent?.hasSize() ? parent.frame : undefined;
        this._layout(this.m_data, parentFrame, this.varsContainer, this.m_scale);
        this.updateFrames();
    }

    get parent(): ShapeView | undefined {
        return this.m_parent as ShapeView;
    }

    get childs(): ShapeView[] {
        return this.m_children as ShapeView[];
    }

    get style() {
        return this.data.style;
    }

    get exportOptions() {
        const v = this._findOV(OverrideType.ExportOptions, VariableType.ExportOptions);
        return v ? v.value : this.data.exportOptions;
    }

    get contextSettings() {
        const v = this._findOV(OverrideType.ContextSettings, VariableType.ContextSettings);
        return v ? v.value : this.data.style.contextSettings;
    }

    get naviChilds(): ShapeView[] | undefined {
        return this.m_children as ShapeView[];
    }

    get transform() {
        return this.m_transform
    }

    get transform2() {
        if (!this.m_transform2) this.m_transform2 = makeShapeTransform2By1(this.m_transform);
        return this.m_transform2;
    }

    get transform2FromRoot(): Transform2 {
        const t = this.transform2.clone();
        if (!this.parent) return t;
        return t.addTransform(this.parent!.transform2FromRoot);
    }

    get size(): ShapeSize {
        return this.frame;
    }

    /**
     * 对象内容区位置大小
     */
    get frame() {
        return this.m_frame;
    }
    /**
     * contentFrame+边框，对象实际显示的位置大小
     */
    get visibleFrame() {
        return this.m_frame;
    }
    /**
     * 包含被裁剪的对象
    */
    get outerFrame() {
        return this.m_outerFrame;
    }

    get rotation(): number {
        return makeShapeTransform2By1(this.transform).decomposeEuler().z * 180 / Math.PI;
    }

    get fixedRadius() {
        return this.m_fixedRadius;
    }

    get resizingConstraint() {
        return this.data.resizingConstraint;
    }

    get constrainerProportions() {
        return this.data.constrainerProportions;
    }

    get isClosed() {
        return this.m_data.isClosed;
    }

    /**
     * @returns 
     */
    boundingBox(): ShapeFrame {
        if (this.isNoTransform()) {
            const tx = this.transform.translateX;
            const ty = this.transform.translateY;
            return new ShapeFrame(tx + this.frame.x, ty + this.frame.y, this.frame.width, this.frame.height);
        }
        const path = this.getPath().clone();
        if (path.length > 0) {
            const m = this.matrix2Parent();
            path.transform(m);
            const bounds = path.calcBounds();
            return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        }

        const frame = this.frame;
        const m = this.transform;
        const corners = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height }]
            .map((p) => m.computeCoord(p));
        const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
        const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
        const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
        const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
        return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
    }

    /**
     * @description 无论是否transform都进行Bounds计算并返回
     */
    boundingBox2(): ShapeFrame {
        const path = this.getPath().clone();
        if (path.length > 0) {
            const m = this.matrix2Parent();
            path.transform(m);
            const bounds = path.calcBounds();
            return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        }

        const frame = this.frame;
        const m = this.transform;
        const corners = [
            { x: frame.x, y: frame.y },
            { x: frame.x + frame.width, y: frame.y },
            { x: frame.x + frame.width, y: frame.y + frame.height },
            { x: frame.x, y: frame.y + frame.height }]
            .map((p) => m.computeCoord(p));
        const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
        const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
        const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
        const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
        return new ShapeFrame(minx, miny, maxx - minx, maxy - miny);
    }

    onDataChange(...args: any[]): void {
        if (args.includes('points') // 点
            || args.includes('pathsegs') // 线
            || args.includes('isClosed') // 闭合状态
            || (this.m_fixedRadius || 0) !== ((this.m_data as any).fixedRadius || 0) // 固定圆角
            || args.includes('cornerRadius') // 圆角
            || args.includes('imageRef')
        ) {
            this.m_path = undefined;
            this.m_pathstr = undefined;
        }
    }

    protected _findOV(ot: OverrideType, vt: VariableType): Variable | undefined {
        if (!this.varsContainer) return;
        const _vars = findOverrideAndVar(this.m_data, ot, this.varsContainer, true);
        if (!_vars) return;
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === vt) {
            return _var;
        }
    }

    matrix2Root() {
        const m = this.transform.toMatrix();
        const p = this.parent;
        if (p) {
            m.multiAtLeft(p.matrix2Root())
        }
        return m;
    }

    /**
     * root: page 往上一级
     * @returns
     */
    frame2Root(): ShapeFrame {
        const frame = this.frame;
        const m = this.matrix2Root();
        const lt = m.computeCoord(frame.x, frame.y);
        const rb = m.computeCoord(frame.x + frame.width, frame.y + frame.height);
        return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
    }

    frame2Parent(): ShapeFrame {
        if (this.isNoTransform()) {
            const tx = this.transform.translateX;
            const ty = this.transform.translateY;
            return new ShapeFrame(tx + this.frame.x, ty + this.frame.y, this.frame.width, this.frame.height);
        }
        const frame = this.frame;
        const m = this.matrix2Parent();
        const lt = m.computeCoord(frame.x, frame.y);
        const rb = m.computeCoord(frame.x + frame.width, frame.y + frame.height);
        return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
    }

    get name() {
        const v = this._findOV(OverrideType.Name, VariableType.Name);
        return v ? v.value : this.m_data.name;
    }

    getPage(): ShapeView | undefined {
        let p: ShapeView = this;
        while (p.type !== ShapeType.Page && p.m_parent) {
            p = p.m_parent as ShapeView;
        }
        return p.type == ShapeType.Page ? p : undefined;
    }

    get varbinds() {
        return this.m_data.varbinds;
    }

    isNoTransform() {
        const { m00, m01, m10, m11 } = this.transform;
        return Math.abs(m00 - 1) < float_accuracy && Math.abs(m01) < float_accuracy && Math.abs(m10) < float_accuracy && Math.abs(m11 - 1) < float_accuracy;
    }

    matrix2Parent(matrix?: Matrix) {
        return matrix2parent(this.transform, matrix);
    }

    getFills(): Fill[] {
        const v = this._findOV(OverrideType.Fills, VariableType.Fills);
        return v ? v.value : this.m_data.style.fills;
    }

    getBorders(): Border[] {
        const v = this._findOV(OverrideType.Borders, VariableType.Borders);
        return v ? v.value : this.m_data.style.borders;
    }

    get cornerRadius(): CornerRadius | undefined {
        return undefined;
    }

    get startMarkerType(): MarkerType | undefined {
        const v = this._findOV(OverrideType.StartMarkerType, VariableType.MarkerType);
        return v ? v.value : this.m_data.style.startMarkerType;
    }

    get endMarkerType(): MarkerType | undefined {
        const v = this._findOV(OverrideType.EndMarkerType, VariableType.MarkerType);
        return v ? v.value : this.m_data.style.endMarkerType;
    }

    getShadows(): Shadow[] {
        const v = this._findOV(OverrideType.Shadows, VariableType.Shadows);
        return v ? v.value : this.m_data.style.shadows;
    }

    get blur(): Blur | undefined {
        const v = this._findOV(OverrideType.Blur, VariableType.Blur);
        return v ? v.value : this.data.style.blur;
    }

    getPathStr() {
        if (this.m_pathstr) return this.m_pathstr;
        this.m_pathstr = this.getPath().toString(); // todo fixedRadius
        return this.m_pathstr;
    }

    getPath() {
        if (this.m_path) return this.m_path;
        const frame = this.frame;
        this.m_path = this.m_data.getPathOfSize(frame, this.m_fixedRadius); // todo fixedRadius
        if (frame.x !== 0 || frame.y !== 0) this.m_path.translate(frame.x, frame.y);
        this.m_path.freeze();
        return this.m_path;
    }

    get isVisible(): boolean {
        const v = this._findOV(OverrideType.Visible, VariableType.Visible);
        return v ? v.value : !!this.m_data.isVisible;
    }

    get isLocked(): boolean {
        const v = this._findOV(OverrideType.Lock, VariableType.Lock);
        return v ? v.value : !!this.m_data.isLocked;
    }

    // =================== update ========================
    updateLayoutArgs(trans: Transform, size: ShapeFrame, radius: number | undefined) {

        if (size.width !== this.m_frame.width || size.height !== this.m_frame.height || size.x !== this.m_frame.x || size.y !== this.m_frame.y) {
            this.m_pathstr = undefined; // need update
            this.m_path = undefined;
            this.m_frame.x = size.x;
            this.m_frame.y = size.y;
            this.m_frame.width = size.width;
            this.m_frame.height = size.height;
        }

        if ((this.m_fixedRadius || 0) !== (radius || 0)) {
            this.m_fixedRadius = radius;
            this.m_pathstr = undefined; // need update
            this.m_path = undefined;
        }

        if (!this.m_transform.equals(trans)) {
            this.m_transform.reset(trans);
            this.m_pathstr = undefined; // need update
            this.m_path = undefined;
            this.m_transform2 = undefined;
        }
    }

    updateFrames() {

        let changed = this._save_frame.x !== this.m_frame.x || this._save_frame.y !== this.m_frame.y ||
            this._save_frame.width !== this.m_frame.width || this._save_frame.height !== this.m_frame.height;
        if (changed) {
            this._save_frame.x = this.m_frame.x;
            this._save_frame.y = this.m_frame.y;
            this._save_frame.width = this.m_frame.width;
            this._save_frame.height = this.m_frame.height;
        }

        const borders = this.getBorders();
        let maxborder = 0;
        borders.forEach(b => {
            if (b.position === BorderPosition.Outer) {
                maxborder = Math.max(b.thickness, maxborder);
            }
            else if (b.position !== BorderPosition.Center) {
                maxborder = Math.max(b.thickness / 2, maxborder);
            }
        })

        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - maxborder, this.frame.y - maxborder, this.frame.width + maxborder * 2, this.frame.height + maxborder * 2)) changed = true;

        // update outer
        if (updateFrame(this.m_outerFrame, this.m_visibleFrame.x, this.m_visibleFrame.y, this.m_visibleFrame.width, this.m_visibleFrame.height)) changed = true;

        // to parent frame
        const mapframe = (i: ShapeFrame, out: ShapeFrame) => {
            const transform = this.transform;
            if (this.isNoTransform()) {
                return updateFrame(out, i.x + transform.translateX, i.y + transform.translateY, i.width, i.height);
            }
            const frame = i;
            const m = transform;
            const corners = [
                { x: frame.x, y: frame.y },
                { x: frame.x + frame.width, y: frame.y },
                { x: frame.x + frame.width, y: frame.y + frame.height },
                { x: frame.x, y: frame.y + frame.height }]
                .map((p) => m.computeCoord(p));
            const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
            const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
            const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
            const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
            return updateFrame(out, minx, miny, maxx - minx, maxy - miny);
        }
        if (mapframe(this.m_frame, this._p_frame)) changed = true;
        if (mapframe(this.m_visibleFrame, this._p_visibleFrame)) changed = true;
        if (mapframe(this.m_outerFrame, this._p_outerFrame)) changed = true;

        if (changed) {
            this.m_ctx.addNotifyLayout(this);
        }

        return changed;
    }

    protected layoutChilds(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, parentFrame: ShapeSize | undefined, scale?: {
        x: number,
        y: number
    }) {
    }

    protected _layout(shape: Shape, parentFrame: ShapeSize | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scale: {
        x: number,
        y: number
    } | undefined) {

        const transform = shape.transform;
        // case 1 不需要变形
        if (!scale || scale.x === 1 && scale.y === 1) {
            // update frame, hflip, vflip, rotate
            let frame = this.frame;
            if (this.hasSize()) {
                frame = this.data.frame;
            }
            this.updateLayoutArgs(transform, frame, (shape as PathShape).fixedRadius);
            this.layoutChilds(varsContainer, this.frame);
            return;
        }

        const skewTransfrom = (scalex: number, scaley: number) => {
            let t = transform;
            if (scalex !== scaley) {
                t = t.clone();
                t.scale(scalex, scaley);
                // 保留skew去除scale
                const t2 = makeShapeTransform2By1(t);
                t2.clearScaleSize();
                t = makeShapeTransform1By2(t2);
            }
            return t;
        }

        const resizingConstraint = shape.resizingConstraint ?? 0; // 默认值为靠左、靠顶、宽高固定
        // 当前对象如果没有frame,需要childs layout完成后才有
        // 但如果有constrain,则需要提前计算出frame?当前是直接不需要constrain
        if (!this.hasSize() && (resizingConstraint === 0 || !parentFrame)) {
            let frame = this.frame; // 不需要更新
            const t0 = transform.clone();
            t0.scale(scale.x, scale.y);
            const save1 = t0.computeCoord(0, 0);
            const t = skewTransfrom(scale.x, scale.y).clone();
            const save2 = t.computeCoord(0, 0)
            const dx = save1.x - save2.x;
            const dy = save1.y - save2.y;
            t.trans(dx, dy);
            this.updateLayoutArgs(t, frame, (shape as PathShape).fixedRadius);
            this.layoutChilds(varsContainer, undefined, scale);
            return;
        }

        const size = this.data.frame; // 如果是group,实时计算的大小。view中此时可能没有
        const frame = frame2Parent2(transform, size);
        const saveW = frame.width;
        const saveH = frame.height;

        let scaleX = scale.x;
        let scaleY = scale.y;

        if (parentFrame && resizingConstraint !== 0) {
            fixFrameByConstrain(shape, parentFrame, frame, scaleX, scaleY);
            scaleX = (frame.width / saveW);
            scaleY = (frame.height / saveH);
        } else {
            frame.x *= scale.x;
            frame.y *= scale.y;
            frame.width *= scale.x;
            frame.height *= scale.y;
        }

        const t = skewTransfrom(scaleX, scaleY).clone();
        const cur = t.computeCoord(0, 0);
        t.trans(frame.x - cur.x, frame.y - cur.y);

        const inverse = t.inverse;
        // const lt = inverse.computeCoord(frame.x, frame.y); // 应该是{0，0}
        // if (Math.abs(lt.x) > float_accuracy || Math.abs(lt.y) > float_accuracy) throw new Error();
        const rb = inverse.computeCoord(frame.x + frame.width, frame.y + frame.height);
        const size2 = new ShapeFrame(0, 0, (rb.x), (rb.y));

        this.updateLayoutArgs(t, size2, (shape as PathShape).fixedRadius);
        this.layoutChilds(varsContainer, this.frame, { x: scaleX, y: scaleY });
    }

    protected updateLayoutProps(props: PropsType, needLayout: boolean) {
        // const needLayout = this.m_ctx.removeReLayout(this); // remove from changeset
        if (props.data.id !== this.m_data.id) throw new Error('id not match');
        const dataChanged = objectId(props.data) !== objectId(this.m_data);
        if (dataChanged) {
            // data changed
            this.setData(props.data);
        }
        // check
        const diffTransform = isDiffScale(props.scale, this.m_scale);
        const diffVars = isDiffVarsContainer(props.varsContainer, this.varsContainer);
        if (!needLayout &&
            !dataChanged &&
            !diffTransform &&
            !diffVars) {
            return false;
        }

        if (diffTransform) {
            // update transform
            this.m_scale = props.scale;
        }
        if (diffVars) {
            // update varscontainer
            this.m_ctx.removeDirty(this);
            this.varsContainer = props.varsContainer;
            const _id = this.id;
            // if (_id !== tid) {
            //     // tid = _id;
            // }
        }
        return true;
    }

    // 更新frame, vflip, hflip, rotate, fixedRadius, 及对应的cache数据，如path
    // 更新childs, 及向下更新数据变更了的child(在datachangeset)
    // 父级向下更新时带props, 自身更新不带
    layout(props?: PropsType) {
        // todo props没更新时是否要update
        // 在frame、flip、rotate修改时需要update
        const needLayout = this.m_ctx.removeReLayout(this); // remove from changeset
        if (props && !this.updateLayoutProps(props, needLayout)) {
            return;
        }

        const parent = this.parent;
        const parentFrame = parent?.hasSize() ? parent.frame : undefined;
        this.m_ctx.setDirty(this);
        this._layout(this.m_data, parentFrame, this.varsContainer, this.m_scale);
        this.m_ctx.addNotifyLayout(this);
    }

    // ================== render ===========================


    protected renderFills(): EL[] {
        return renderFills(elh, this.getFills(), this.frame, this.getPathStr());
    }

    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.m_data);
    }

    protected renderShadows(filterId: string): EL[] {
        return renderShadows(elh, filterId, this.getShadows(), this.getPathStr(), this.frame, this.getFills(), this.getBorders(), this.m_data.type, this.blur);
    }

    protected renderBlur(blurId: string): EL[] {
        if (!this.blur) return [];
        return renderBlur(elh, this.blur, blurId, this.frame, this.getFills(), this.getPathStr());
    }

    protected renderProps(): { [key: string]: string } {

        const props: any = {}

        const contextSettings = this.contextSettings;
        if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
            props.opacity = contextSettings.opacity;
        }

        // 填充需要应用transform，边框不用，直接变换path
        if (this.isNoTransform()) {
            const transform = this.transform;
            if (transform.translateX !== 0 || transform.translateY !== 0) props.transform = `translate(${transform.translateX},${transform.translateY})`
        } else {
            props.style = { transform: this.transform.toString() };
        }
        if (contextSettings) {
            if (props.style) {
                props.style['mix-blend-mode'] = contextSettings.blenMode;
            } else {
                const style: any = {
                    'mix-blend-mode': contextSettings.blenMode
                }
                props.style = style;
            }
        }
        return props;
    }

    protected renderStaticProps() {
        const frame = this.frame;
        const props: any = {};
        if (this.isNoTransform()) {
            if (frame.width > frame.height) {
                props.transform = `translate(0, ${(frame.width - frame.height) / 2})`;
            } else {
                props.transform = `translate(${(frame.height - frame.width) / 2}, 0)`;
            }
        } else {
            const box = this.boundingBox();
            let modifyX = 0;
            let modifyY = 0;
            if (box.width > box.height) {
                modifyY = (box.width - box.height) / 2;
            } else {
                modifyX = (box.height - box.width) / 2;
            }
            const __t = this.transform.clone();
            __t.m02 = modifyX;
            __t.m12 = modifyY;
            props.style = { transform: __t.toString() };
        }
        const contextSettings = this.style.contextSettings;
        if (contextSettings) {
            if (props.style) {
                props.style['mix-blend-mode'] = contextSettings.blenMode;
            } else {
                const style: any = {
                    'mix-blend-mode': contextSettings.blenMode
                }
                props.style = style;
            }
        }

        return props;
    }

    protected renderContents(): EL[] {
        const childs = this.m_children;
        childs.forEach((c) => c.render())
        return childs;
    }

    protected m_render_version: number = 0;

    protected checkAndResetDirty(): boolean {
        return this.m_ctx.removeDirty(this);
    }

    render(): number {

        const isDirty = this.checkAndResetDirty();
        if (!isDirty) {
            return this.m_render_version;
        }

        if (!this.isVisible) {
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
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        if (shadows.length > 0) { // 阴影
            const ex_props = Object.assign({}, props);
            delete props.style;
            delete props.transform;
            delete props.opacity;

            const inner_url = innerShadowId(filterId, this.getShadows());
            props.filter = `url(#pd_outer-${filterId}) `;
            if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter += `url(#${blurId}) `;
            if (inner_url.length) props.filter += inner_url.join(' ');
            const body = elh("g", props, [...fills, ...childs, ...borders]);
            this.reset("g", ex_props, [...shadows, ...blur, body])
        } else {
            if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter = `url(#${blurId})`;
            this.reset("g", props, [...blur, ...fills, ...childs, ...borders]);
        }
        return ++this.m_render_version;
    }

    renderStatic() {
        const fills = this.renderFills() || []; // cache
        // childs
        const childs = this.renderContents(); // VDomArray
        // border
        const borders = this.renderBorders() || []; // ELArray

        const props = this.renderStaticProps();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);
        const g_props: any = {}
        const contextSettings = this.style.contextSettings;
        if (contextSettings) {
            const style: any = {
                'mix-blend-mode': contextSettings.blenMode
            }
            if (blur.length) {
                g_props.style = style;
                g_props.opacity = props.opacity;
                delete props.opacity;
            } else {
                if (props.style) {
                    (props.style as any)['mix-blend-mode'] = contextSettings.blenMode;
                } else {
                    props.style = style;
                }
            }
        }

        if (shadows.length > 0) { // 阴影
            const ex_props = Object.assign({}, props);
            delete props.style;
            delete props.transform;
            delete props.opacity;

            const inner_url = innerShadowId(filterId, this.getShadows());
            props.filter = `url(#pd_outer-${filterId}) `;
            if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter += `url(#${blurId}) `;
            if (inner_url.length) props.filter += inner_url.join(' ');
            const body = elh("g", props, [...fills, ...childs, ...borders]);
            if (blur.length) {
                const g = elh('g', g_props, [...shadows, body])
                return elh("g", ex_props, [...blur, g]);
            } else {
                return elh("g", ex_props, [...shadows, ...blur, body]);
            }
        } else {
            if (blur.length && this.blur?.type === BlurType.Gaussian) props.filter = `url(#${blurId})`;
            if (blur.length) {
                const g = elh('g', g_props, [...fills, ...childs, ...borders])
                return elh("g", props, [...blur, g])
            } else {
                return elh("g", props, [...blur, ...fills, ...childs, ...borders])
            }
        }
    }

    get isContainer() {
        return this.m_data.isContainer;
    }

    get pathType() {
        return this.m_data.pathType;
    }

    get isPathIcon() {
        return this.m_data.isPathIcon;
    }

    get radius() {
        return this.m_data.radius;
    }

    get radiusType() {
        return this.m_data.radiusType;
    }

    get isStraight() {
        return this.m_data.isStraight;
    }

    get isImageFill() {
        return this.m_data.getImageFill();
    }
}