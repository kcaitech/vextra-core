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
import { RenderTransform } from "./basic";
import { EL, elh } from "./el";
import { FrameType } from "../data/consts";
import { Matrix } from "../basic/matrix";
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";
import { objectId } from "../basic/objectid";
import { BasicArray } from "../data/basic";
import { fixConstrainFrame } from "../data/constrain";
import { BlurType, MarkerType } from "../data/typesdefine";
import {makeShapeTransform2By1, makeShapeTransformBy2, transformEquals} from "../data/shape_transform_util";
import { Transform as Transform2 } from "../basic/transform";
import {Matrix2} from "../index";

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
    // return (!lhs.matrix.equals(rhs.matrix) ||
    //     isDiffShapeFrame(lhs.parentFrame, rhs.parentFrame)
    // )
    return lhs.scaleX !== rhs.scaleX || lhs.scaleY !== rhs.scaleY;
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

export function isNoTransform(trans: RenderTransform | undefined): boolean {
    // return !trans || trans.matrix.isIdentity()
    return !trans || trans.scaleX === 1 && trans.scaleY === 1;
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
    const m = new Matrix(t.m00, t.m10, t.m01, t.m11, t.m02, t.m12);
    if (!matrix) return m;
    matrix.multiAtLeft(m);
    return matrix;
}

export function boundingBox(frame: ShapeSize, shape: Shape): ShapeFrame {
    // const path = this.getPath();
    const path = shape.getPathOfFrame(frame);
    if (path.length > 0) {
        // path.transform(m);
        const bounds = path.calcBounds();
        return new ShapeFrame(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    }
    // // const frame = this.frame;
    // const corners = [{ x: 0, y: 0 }, { x: frame.width, y: 0 }, { x: frame.width, y: frame.height }, {
    //     x: 0,
    //     y: frame.height
    // }]
    //     .map((p) => m.computeCoord(p));
    // const minx = corners.reduce((pre, cur) => Math.min(pre, cur.x), corners[0].x);
    // const maxx = corners.reduce((pre, cur) => Math.max(pre, cur.x), corners[0].x);
    // const miny = corners.reduce((pre, cur) => Math.min(pre, cur.y), corners[0].y);
    // const maxy = corners.reduce((pre, cur) => Math.max(pre, cur.y), corners[0].y);
    return new ShapeFrame(0, 0, frame.width, frame.height);
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

export class ShapeView extends DataView {
    // layout & render args
    // m_frame: ShapeFrame;
    // m_hflip?: boolean;
    // m_vflip?: boolean;
    // m_rotate?: number;
    m_transform: Transform;
    m_size: ShapeSize;

    m_fixedRadius?: number;
    // cache
    // m_fills?: EL[]; // 不缓存,可回收
    // m_borders?: EL[];
    m_path?: Path;
    m_pathstr?: string;

    m_transform2: Transform2;

    constructor(ctx: DViewCtx, props: PropsType, isTopClass: boolean = true) {
        super(ctx, props);
        const shape = props.data;
        // const frame = shape.frame;
        // this.m_frame = new ShapeFrame(frame.x, frame.y, frame.width, frame.height);
        // this.m_hflip = shape.isFlippedHorizontal;
        // this.m_vflip = shape.isFlippedVertical;
        // this.m_rotate = shape.rotation;

        const t = shape.transform;
        this.m_transform = new Transform(t.m00, t.m01, t.m02, t.m10, t.m11, t.m12)
        this.m_size = new ShapeSize(shape.size.width, shape.size.height);
        this.m_fixedRadius = (shape as PathShape).fixedRadius; // rectangle

        this.m_transform2 = makeShapeTransform2By1(this.m_transform);

        if (isTopClass) this.afterInit();
    }

    protected afterInit() {
        this._layout(this.m_size, this.m_data, this.m_transx, this.varsContainer);
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
        if (!transformEquals(makeShapeTransformBy2(this.m_transform2), this.transform)) {
            this.m_transform2.setMatrix(new Matrix2([4, 4], [
                this.transform.m00, this.transform.m01, 0, this.transform.m02,
                this.transform.m10, this.transform.m11, 0, this.transform.m12,
                0, 0, 1, 0,
                0, 0, 0, 1,
            ], true))
        }
        return this.m_transform2;
    }

    get size() {
        return this.m_size;
    }

    get frame(): ShapeFrame {
        const transform2 = makeShapeTransform2By1(this.transform);
        const trans = transform2.decomposeTranslate();
        const scale = transform2.decomposeScale();
        const width = Math.abs(this.size.width * scale.x);
        const height = Math.abs(this.size.height * scale.y);
        const frame = new ShapeFrame(trans.x, trans.y, width, height);
        // Object.freeze(frame);
        return frame;
    }

    get rotation(): number {
        return makeShapeTransform2By1(this.transform).decomposeEuler().z * 180 / Math.PI;
    }

    get isFlippedHorizontal(): boolean {
        return makeShapeTransform2By1(this.transform).isFlipH;
    }

    get isFlippedVertical(): boolean {
        return makeShapeTransform2By1(this.transform).isFlipV
    }

    get skewX(): number {
        return makeShapeTransform2By1(this.transform).decomposeSkew().x * 180 / Math.PI;
    }

    get skewY(): number {
        return makeShapeTransform2By1(this.transform).decomposeSkew().y * 180 / Math.PI;
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
        ) {
            this.m_path = undefined;
            this.m_pathstr = undefined;
        }
        // if (args.includes('fills')) this.m_fills = undefined;
        // if (args.includes('borders')) this.m_borders = undefined;
        // this.updateRenderArgs(this.data.frame, this.data.isFlippedHorizontal, this.data.isFlippedVertical, this.data.rotation, this.data.fixedRadius)
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
        let s: ShapeView | undefined = this;
        const m = new Matrix();
        while (s) {
            s.matrix2Parent(m);
            s = s.parent;
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
        const lt = m.computeCoord(0, 0);
        const rb = m.computeCoord(frame.width, frame.height);
        return new ShapeFrame(lt.x, lt.y, rb.x - lt.x, rb.y - lt.y);
    }

    frame2Parent(): ShapeFrame {
        if (this.isNoTransform()) return this.frame;
        const frame = this.frame;
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
        return p.type == ShapeType.Page ? p : undefined;
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
        this.m_path = this.m_data.getPathOfFrame(this.frame, this.m_fixedRadius); // todo fixedRadius
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
        }
    }

    protected layoutOnNormal(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    }

    protected layoutOnRectShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, renderTrans: RenderTransform) {
    }

    protected layoutOnDiamondShape(varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, renderTrans: RenderTransform) {
    }

    protected isNoSupportDiamondScale(): boolean {
        return this.m_data.isNoSupportDiamondScale;
    }

    protected _layout(size: ShapeSize, shape: Shape, renderTrans: RenderTransform | undefined, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
        let notTrans = isNoTransform(renderTrans);
        const trans = shape.transform;
        // case 1 不需要变形
        if (!renderTrans || notTrans) {
            // update frame, hflip, vflip, rotate
            this.updateLayoutArgs(trans, size, (shape as PathShape).fixedRadius);
            this.layoutOnNormal(varsContainer);
            return;
        }

        const frameType = shape.frameType;
        if (!frameType) { // 无实体frame
            return;
        }

        const canSkew = frameType === FrameType.Path && !shape.isNoTransform();
        const pScaleX = renderTrans.scaleX;
        const pScaleY = renderTrans.scaleY;

        const bbox = boundingBox(size, shape);
        const saveW = bbox.width;
        const saveH = bbox.height;
        const frame = new ShapeFrame(bbox.x, bbox.y, bbox.width, bbox.height);

        fixFrameByConstrain(shape, renderTrans.parentFrame, frame, pScaleX, pScaleY);

        let scaleX = frame.width / saveW;
        let scaleY = frame.height / saveH;
        if (!canSkew && scaleX !== scaleY) {
            scaleX = Math.min(scaleX, scaleY);
            scaleY = scaleX;
            frame.width = saveW * scaleX;
            frame.height = saveH * scaleY;
        }

        const transform = shape.transform.clone();
        const lt = transform.inverseCoord(frame.x, frame.y);
        transform.scale(scaleX, scaleY);
        const lt2 = transform.computeCoord(lt.x, lt.y);
        const dx = lt2.x - lt.x;
        const dy = lt2.y - lt.y;
        transform.trans(dx, dy);

        this.updateLayoutArgs(transform, frame, (shape as PathShape).fixedRadius);

        const chilsTrans = {
            // dx,
            // dy,
            scaleX: scaleX,
            scaleY: scaleY,
            parentFrame: frame
        }

        if (canSkew && scaleX !== scaleY) {
            this.layoutOnDiamondShape(varsContainer, chilsTrans);
        }
        else {
            this.layoutOnRectShape(varsContainer, chilsTrans);
        }
    }

    // 更新frame, vflip, hflip, rotate, fixedRadius, 及对应的cache数据，如path
    // 更新childs, 及向下更新数据变更了的child(在datachangeset)
    // 父级向下更新时带props, 自身更新不带
    layout(props?: PropsType) {
        // todo props没更新时是否要update
        // 在frame、flip、rotate修改时需要update
        const needLayout = this.m_ctx.removeReLayout(this); // remove from changeset

        if (props) {
            // 
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
                this.varsContainer = props.varsContainer;
                const _id = this.id;
                // if (_id !== tid) {
                //     // tid = _id;
                // }
            }
        }

        this.m_ctx.setDirty(this);
        this._layout(this.m_data.size, this.m_data, this.m_transx, this.varsContainer);
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
        const frame = this.frame;
        // const path = this.getPath(); // cache
        const props: any = {}

        const contextSettings = this.contextSettings;
        if (contextSettings && (contextSettings.opacity ?? 1) !== 1) {
            props.opacity = contextSettings.opacity;
        }

        if (this.isNoTransform()) {
            if (frame.x !== 0 || frame.y !== 0) props.transform = `translate(${frame.x},${frame.y})`
        } else {
            // const cx = frame.x + frame.width / 2;
            // const cy = frame.y + frame.height / 2;
            const style: any = { transform: this.matrix2Parent().toString() }
            // style.transform = ''
            // style.transform = "translate(" + cx + "px," + cy + "px) "
            // style.transform = "translate(" +frame.x + "px," + frame.y + "px) " // dev code
            // if (this.m_hflip) style.transform += "rotateY(180deg) "
            // if (this.m_vflip) style.transform += "rotateX(180deg) "
            // if (this.m_rotate) style.transform += "rotate(" + this.m_rotate + "deg) "
            // style.transform += "translate(" + (frame.x) + "px," + (frame.y) + "px)"
            props.style = style;
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
            const style: any = {};
            style.transform = "translate(" + (modifyX + box.width / 2) + "px," + (modifyY + box.height / 2) + "px) ";
            if (!!this.isFlippedHorizontal) style.transform += "rotateY(180deg) ";
            if (!!this.isFlippedVertical) style.transform += "rotateX(180deg) ";
            if (this.rotation) style.transform += "rotate(" + this.rotation + "deg) ";
            style.transform += "translate(" + (-frame.width / 2) + "px," + (-frame.height / 2) + "px)";
            props.style = style;
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
}