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
    Transform,
    BasicArray,
    makeShapeTransform2By1,
    makeShapeTransform1By2
} from "../data";
import { findOverrideAndVar } from "./basic";
import { EL, elh } from "./el";
import { Matrix } from "../basic/matrix";
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";
import { objectId } from "../basic/objectid";
import { fixConstrainFrame } from "../data/constrain";
import { BlurType, MarkerType } from "../data";
import { Transform as Transform2 } from "../basic/transform";
import { GroupShapeView } from "./groupshape";

export function isDiffShapeFrame(lsh: ShapeFrame, rsh: ShapeFrame) {
    return (
        lsh.x !== rsh.x ||
        lsh.y !== rsh.y ||
        lsh.width !== rsh.width ||
        lsh.height !== rsh.height
    );
}

export function isDiffRenderTransform(lhs: { x: number, y: number } | undefined, rhs: {
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

export function isNoTransform(trans: { x: number, y: number } | undefined): boolean {
    // return !trans || trans.matrix.isIdentity()
    return !trans || trans.x === 1 && trans.y === 1;
}

export function fixFrameByConstrain(shape: Shape, parentFrame: ShapeSize, frame: ShapeFrame, scaleX: number, scaleY: number) {
    const originParentFrame = shape.parent?.size; // 至少有page!
    if (!originParentFrame) return;

    const isGroupChild = shape.parent?.type === ShapeType.Group;

    if (isGroupChild) { // 编组的子元素当忽略约束并跟随编组缩放
        frame.x *= scaleX;
        frame.y *= scaleY;
        frame.width *= scaleX;
        frame.height *= scaleY;
    } else {
        const resizingConstraint = shape.resizingConstraint!; // 默认值为靠左、靠顶、宽高固定
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

    const path = shape.getPathOfFrame(frame);
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

function frame2Parent(t: Transform, size: ShapeSize): ShapeFrame {
    if (t.m00 == 1 && t.m01 === 0 && t.m10 === 0 && t.m11 === 1) return new ShapeFrame(t.m02, t.m12, size.width, size.height)
    const lt = t.computeCoord(0, 0);
    const rb = t.computeCoord(size.width, size.height);
    return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
}

export class ShapeView extends DataView {
    m_transform: Transform;
    m_size: ShapeSize;
    m_fixedRadius?: number;
    m_path?: Path;
    m_pathstr?: string;

    m_transform2: Transform2 | undefined;

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        const shape = props.data;

        const t = shape.transform;
        this.m_transform = new Transform(t.m00, t.m01, t.m02, t.m10, t.m11, t.m12)
        this.m_size = new ShapeSize(shape.size.width, shape.size.height);
        this.m_fixedRadius = (shape as PathShape).fixedRadius; // rectangle
    }

    onMounted() {
        const parentFrame = this.parent?.size;

        this._layout(this.m_size, this.m_data, parentFrame, this.varsContainer, this.m_transx);
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

    get size() {
        return this.m_size;
    }

    get frame(): ShapeFrame {
        if (this.isNoTransform()) return new ShapeFrame(this.transform.m02, this.transform.m12, this.size.width, this.size.height);
        const transform2 = this.transform2;
        const trans = transform2.decomposeTranslate();
        return new ShapeFrame(trans.x, trans.y, this.size.width, this.size.height);
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

    // private __boundingBox?: ShapeFrame;
    boundingBox(): ShapeFrame {
        if (this.isNoTransform()) return this.frame;
        const path = this.getPath().clone();
        if (path.length > 0) {
            const m = this.matrix2Parent();
            path.transform(m);
            const bounds = path.calcBounds();
            return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
        }

        const frame = this.frame;
        const m = this.matrix2Parent();
        const corners = [{ x: 0, y: 0 }, { x: frame.width, y: 0 }, { x: frame.width, y: frame.height }, {
            x: 0,
            y: frame.height
        }]
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
        const m = this.matrix2Parent();
        const corners = [{ x: 0, y: 0 }, { x: frame.width, y: 0 }, { x: frame.width, y: frame.height }, {
            x: 0,
            y: frame.height
        }]
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
        const frame = this.size;
        const m = this.matrix2Root();
        const lt = m.computeCoord(0, 0);
        const rb = m.computeCoord(frame.width, frame.height);
        return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
    }

    frame2Parent(): ShapeFrame {
        if (this.isNoTransform()) return this.frame;
        const frame = this.size;
        const m = this.matrix2Parent();
        const lt = m.computeCoord(0, 0);
        const rb = m.computeCoord(frame.width, frame.height);
        return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
    }

    get name() {
        const v = this._findOV(OverrideType.Name, VariableType.Name);
        return v ? v.value : this.m_data.name;
    }

    get frameType() {
        return this.m_data.frameType;
    }

    getPage(): ShapeView | undefined {
        let p: ShapeView = this;
        while (p.type !== ShapeType.Page && p.m_parent) {
            p = p.m_parent as ShapeView;
        }
        return p.type === ShapeType.Page ? p : undefined;
    }

    get varbinds() {
        return this.m_data.varbinds;
    }

    isNoTransform() {
        const t = this.transform;
        return t.m00 == 1 && t.m01 === 0 && t.m10 === 0 && t.m11 === 1;
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
        this.m_path = this.m_data.getPathOfFrame(this.size, this.m_fixedRadius); // todo fixedRadius
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

    get mask(): boolean {
        return !!this.m_data.mask;
    }

    get masked(): boolean {
        return Boolean((this.parent as GroupShapeView)?.maskMap.get(this.id) && !this.m_data.mask);
    }

    get maskedBy() {
        return (this.parent as GroupShapeView)?.maskedByMap.get(this.id);
    }

    get maskId(): string {
        return (this.parent as GroupShapeView)?.maskMap.get(this.id) || '';
    }

    // prepare() {
    //     // prepare path
    //     // prepare frame
    // }

    // =================== update ========================
    updateLayoutArgs(trans: Transform, size: ShapeSize, radius: number | undefined) {

        if (size.width !== this.size.width || size.height !== this.size.height) {
            this.m_pathstr = undefined; // need update
            this.m_path = undefined;
            this.size.width = size.width;
            this.size.height = size.height;
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

    protected layoutChilds(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, parentFrame: ShapeSize, scale?: {
        x: number,
        y: number
    }) {
    }

    protected _layout(size: ShapeSize, shape: Shape, parentFrame: ShapeSize | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, scale: {
        x: number,
        y: number
    } | undefined) {
        let notTrans = isNoTransform(scale);
        const trans = shape.transform;
        // case 1 不需要变形
        if (!scale || notTrans) {
            // update frame, hflip, vflip, rotate
            this.updateLayoutArgs(trans, size, (shape as PathShape).fixedRadius);
            this.layoutChilds(varsContainer, this.size);
            return;
        }

        const frameType = shape.frameType;
        if (!frameType) { // 无实体frame
            return;
        }

        // const canSkew = frameType === FrameType.Path && !shape.isNoTransform();

        const frame = frame2Parent(shape.transform, size);
        const saveW = frame.width;
        const saveH = frame.height;

        let scaleX = scale.x;
        let scaleY = scale.y;

        if (parentFrame) {
            fixFrameByConstrain(shape, parentFrame, frame, scaleX, scaleY);
            scaleX = (frame.width / saveW);
            scaleY = (frame.height / saveH);
        } else {
            frame.x *= scaleX;
            frame.y *= scaleY;
            frame.width *= scaleX;
            frame.height *= scaleY;
        }

        // if (!canSkew && scaleX !== scaleY) {
        //     scaleX = Math.min(scaleX, scaleY);
        //     scaleY = scaleX;
        //     frame.width = saveW * scaleX;
        //     frame.height = saveH * scaleY;
        // }

        // 保持frame.{x, y}不变
        const sizeXY = shape.transform.inverseRef(frame.width, frame.height);
        const size2 = new ShapeSize(sizeXY.x, sizeXY.y);

        let transform = shape.transform.clone();
        if (scaleX !== scaleY) {
            transform.scale(scaleX, scaleY);
            // 保留skew去除scale
            const t2 = makeShapeTransform2By1(transform);
            t2.clearScaleSize();
            transform = makeShapeTransform1By2(t2);
        }
        const frame2 = frame2Parent(transform, size2);
        const dx = frame.x - frame2.x;
        const dy = frame.y - frame2.y;
        transform.trans(dx, dy);

        this.updateLayoutArgs(transform, size2, (shape as PathShape).fixedRadius);

        this.layoutChilds(varsContainer, this.size, { x: scaleX, y: scaleY });
    }

    // 更新frame, fixedRadius, 及对应的cache数据，如path
    // 更新childs, 及向下更新数据变更了的child(在datachangeset)
    // 父级向下更新时带props, 自身更新不带
    layout(props?: PropsType) {
        // todo props没更新时是否要update
        // 在frame修改时需要update
        const needLayout = this.m_ctx.removeReLayout(this); // remove from changeset

        if (props) {
            if (props.data.id !== this.m_data.id) throw new Error('id not match');
            const dataChanged = objectId(props.data) !== objectId(this.m_data);
            if (dataChanged) {
                // data changed
                this.setData(props.data);
            }
            // check
            const diffTransform = isDiffRenderTransform(props.transx, this.m_transx);
            const diffVars = isDiffVarsContainer(props.varsContainer, this.varsContainer);
            if (!needLayout &&
                !dataChanged &&
                !diffTransform &&
                !diffVars) return;

            if (diffTransform) {
                // update transform
                this.m_transx = props.transx;
            }
            if (diffVars) {
                // update varscontainer
                this.m_ctx.removeDirty(this);
                this.varsContainer = props.varsContainer;
            }
        }

        // todo
        const parentFrame = this.parent?.size;

        this.m_ctx.setDirty(this);
        this._layout(this.m_data.size, this.m_data, parentFrame, this.varsContainer, this.m_transx);
        this.notify("layout");
        this.emit("layout");
    }

    // ================== render ===========================

    protected renderFills(): EL[] {
        // if (!this.m_fills) {
        //     this.m_fills = renderFills(elh, this.getFills(), this.frame, this.getPathStr());
        // }
        // return this.m_fills;
        return renderFills(elh, this.getFills(), this.size, this.getPathStr());
    }

    protected renderBorders(): EL[] {
        // if (!this.m_borders) {
        //     this.m_borders = renderBorders(elh, this.getBorders(), this.frame, this.getPathStr());
        // }
        // return this.m_borders;
        return renderBorders(elh, this.getBorders(), this.size, this.getPathStr(), this.m_data);
    }

    protected renderShadows(filterId: string): EL[] {
        return renderShadows(elh, filterId, this.getShadows(), this.getPathStr(), this.size, this.getFills(), this.getBorders(), this.m_data.type, this.blur);
    }

    protected renderBlur(blurId: string): EL[] {
        if (!this.blur) return [];
        return renderBlur(elh, this.blur, blurId, this.size, this.getFills(), this.getPathStr());
    }

    protected renderProps(): { [key: string]: string } & { style: any } {
        const props: any = {};
        const style: any = {};

        style['transform'] = this.transform.toString();

        const contextSettings = this.contextSettings;

        if (contextSettings) {
            if (contextSettings.opacity !== undefined) {
                props.opacity = contextSettings.opacity;
            }
            style['mix-blend-mode'] = contextSettings.blenMode;
        }

        props.style = style;

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
                props.style = { 'mix-blend-mode': contextSettings.blenMode };
            }
        }

        return props;
    }

    protected renderContents(): EL[] {
        const childs = this.m_children;
        childs.forEach((c) => c.render());
        return childs;
    }

    // private m_save_render: EL | undefined;

    protected m_render_version: number = 0;

    get renderVersion() {
        return this.m_render_version;
    }

    protected checkAndResetDirty(): boolean {
        return this.m_ctx.removeDirty(this);
    }

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        if (!this.isVisible) {
            this.reset("g"); // 还是要给个节点，不然后后面可见了挂不上dom
            return ++this.m_render_version;
        }

        const fills = this.renderFills() || []; // cache
        const borders = this.renderBorders() || []; // ELArray
        const childs = this.renderContents(); // VDomArray

        const props = this.renderProps();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        if (shadows.length) { // 阴影
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
        const fills = this.renderFills() || [];
        const childs = this.renderContents();
        const borders = this.renderBorders() || [];

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
                    props.style['mix-blend-mode'] = contextSettings.blenMode;
                } else {
                    props.style = style;
                }
            }
        }

        if (shadows.length) { // 阴影
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

    get dom() {
        const fills = this.renderFills();
        const childs = this.renderContents();
        const borders = this.renderBorders();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        let children = [...fills, ...childs, ...borders];

        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.getShadows());
            if (this.type === ShapeType.Rectangle || this.type === ShapeType.Oval) {
                if (inner_url.length) filter = `${inner_url.join(' ')}`
            } else {
                filter = `url(#pd_outer-${filterId}) `;
                if (inner_url.length) filter += inner_url.join(' ');
            }
            children = [...shadows, elh("g", { filter }, children)];
        }

        if (blur.length) {
            let filter: string = '';
            if (this.blur?.type === BlurType.Gaussian) filter = `url(#${blurId})`;
            children = [...blur, elh('g', { filter }, children)];
        }

        return elh("g", {}, children);
    }
}