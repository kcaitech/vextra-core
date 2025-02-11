import { innerShadowId, renderBlur, renderBorders, renderFills, renderShadows } from "../render";
import {
    BasicArray,
    Blur,
    BlurType,
    Border,
    BorderPosition,
    ContextSettings,
    CornerRadius,
    CurvePoint,
    ExportOptions,
    Fill,
    FillType,
    GradientType,
    MarkerType,
    OverlayBackgroundAppearance,
    OverlayBackgroundInteraction,
    OverlayPosition,
    OverrideType,
    PathShape,
    Point2D,
    PrototypeInterAction,
    PrototypeStartingPoint,
    ResizingConstraints2,
    ScrollBehavior,
    ScrollDirection,
    Shadow,
    ShadowPosition,
    Shape,
    ShapeFrame,
    ShapeSize,
    ShapeType,
    SymbolRefShape,
    SymbolShape,
    Transform,
    Variable,
    VariableType
} from "../data";
import { findOverrideAndVar } from "./basic";
import { EL, elh } from "./el";
import { Matrix } from "../basic/matrix";
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";
import { objectId } from "../basic/objectid";
import { float_accuracy } from "../basic/consts";
import { GroupShapeView } from "./groupshape";
import { importFill, importStrokePaint } from "../data/baseimport";
import { exportFill, exportStrokePaint } from "../data/baseexport";
import { PageView } from "./page";
import { ArtboardView } from "./artboard";
import { findOverrideAll } from "../data/utils";
import { Path } from "@kcdesign/path";
import { isEqual } from "../basic/number_utils";

export function isDiffShapeFrame(lsh: ShapeFrame, rsh: ShapeFrame) {
    return (
        !isEqual(lsh.x, rsh.x) ||
        !isEqual(lsh.y, rsh.y) ||
        !isEqual(lsh.width, rsh.width) ||
        !isEqual(lsh.height, rsh.height)
    );
}

export function isDiffShapeSize(lsh: ShapeSize | undefined, rsh: ShapeSize | undefined) {
    if (lsh === rsh) { // both undefined
        return false;
    }
    if (lsh === undefined || rsh === undefined) {
        return true;
    }
    return (
        !isEqual(lsh.width, rsh.width) ||
        !isEqual(lsh.height, rsh.height)
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
    return !isEqual(lhs.x, rhs.x) || !isEqual(lhs.y, rhs.y);
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
    return !trans || isEqual(trans.x, 1) && isEqual(trans.y, 1);
}

export function fixFrameByConstrain(shape: Shape, parentFrame: ShapeSize, scaleX: number, scaleY: number) {
    const originParentFrame = shape.parent!.size; // frame
    if (shape.parent!.type === ShapeType.Group) {
        const transform = (shape.transform.clone());
        transform.scale(scaleX, scaleY);
        const __decompose_scale = transform.clearScaleSize();
        const size = shape.size;
        return { transform, targetWidth: size.width * __decompose_scale.x, targetHeight: size.height * __decompose_scale.y };
    } else {
        const __cur_env = {
            width: parentFrame.width,
            height: parentFrame.height
        }
        const __pre_env = {
            width: originParentFrame.width,
            height: originParentFrame.height
        }

        return fixConstrainFrame2(shape, { x: scaleX, y: scaleY }, __cur_env as ShapeSize, __pre_env as ShapeSize);
    }
}

export function fixConstrainFrame2(shape: Shape, scale: { x: number, y: number }, currentEnvSize: ShapeSize, originEnvSize: ShapeSize) {
    const resizingConstraint = shape.resizingConstraint ?? 0;
    const size = shape.size;

    let targetWidth: number = size.width;
    let targetHeight: number = size.height;

    const transform = (shape.transform.clone());

    const __scale = { x: 1, y: 1 };

    // 水平
    if (ResizingConstraints2.isHorizontalScale(resizingConstraint)) {
        // 跟随缩放
        // const __p_transform_hor_scale = new Transform2().setScale(ColVector3D.FromXYZ(scale.x, 1, 1));
        transform.scale(scale.x, 1);

        const __decompose_scale = transform.clearScaleSize();
        __scale.x *= Math.abs(__decompose_scale.x);
        __scale.y *= Math.abs(__decompose_scale.y);

        targetWidth = size.width * __scale.x;
        targetHeight = size.height * __scale.y;

        // transform.clearScaleSize();
    } else if (ResizingConstraints2.isFixedLeftAndRight(resizingConstraint)) {
        const bounding = shape.boundingBox();
        const __to_right = toRight(bounding);

        const __target_width = currentEnvSize.width - bounding.x - __to_right;
        const __target_sx = __target_width / bounding.width;

        // const __sec_transform = new Transform2()
        //     .setTranslate(ColVector3D.FromXY(bounding.x, bounding.y));

        transform.trans(bounding.x, bounding.y);

        // todo 这里还保留有transform 确实没错?
        // const __scale_trans = __sec_transform.setScale(ColVector3D.FromXYZ(__target_sx, 1, 1));

        transform.scale(__target_sx, 1);

        // 结算到size上
        const __decompose_scale = transform.clearScaleSize();
        __scale.x *= Math.abs(__decompose_scale.x);
        __scale.y *= Math.abs(__decompose_scale.y);

        targetWidth = size.width * __scale.x;
        targetHeight = size.height * __scale.y;

        // transform.clearScaleSize();
    } else {
        if (ResizingConstraints2.isFlexWidth(resizingConstraint)) {
            // const __p_transform_hor_scale = new Transform2().setScale(ColVector3D.FromXYZ(scale.x, 1, 1));
            transform.scale(scale.x, 1);
            const __decompose_scale = transform.clearScaleSize();
            __scale.x *= Math.abs(__decompose_scale.x);
            __scale.y *= Math.abs(__decompose_scale.y);
            targetWidth = size.width * __scale.x;
            targetHeight = size.height * __scale.y;
            // transform.clearScaleSize();

            if (ResizingConstraints2.isFixedToLeft(resizingConstraint)) {
                const bounding = shape.boundingBox();
                transform.trans(-(bounding.x * scale.x - bounding.x), 0);
            } else if (ResizingConstraints2.isFixedToRight(resizingConstraint)) {
                const bounding = shape.boundingBox();
                const __to_right = toRight(bounding);
                transform.trans(__to_right * scale.x - __to_right, 0);
            } else if (ResizingConstraints2.isHorizontalJustifyCenter(resizingConstraint)) {
                const __center_offset_left = centerOffsetLeft(shape.boundingBox());
                transform.trans(-(__center_offset_left * scale.x - __center_offset_left), 0);
            }
        } else {
            if (ResizingConstraints2.isFixedToRight(resizingConstraint)) {
                transform.trans((scale.x - 1) * originEnvSize.width, 0);
            } else if (ResizingConstraints2.isHorizontalJustifyCenter(resizingConstraint)) {
                const delta = currentEnvSize.width / 2 - originEnvSize.width / 2;
                transform.trans(delta, 0);
            }
        }
    }

    // 垂直
    if (ResizingConstraints2.isVerticalScale(resizingConstraint)) {
        // const __p_transform_ver_scale = new Transform2().setScale(ColVector3D.FromXYZ(1, scale.y, 1));
        transform.scale(1, scale.y);

        const __decompose_scale = transform.clearScaleSize();
        __scale.x *= Math.abs(__decompose_scale.x);
        __scale.y *= Math.abs(__decompose_scale.y);

        targetWidth = size.width * __scale.x;
        targetHeight = size.height * __scale.y;
        // transform.clearScaleSize();
    } else if (ResizingConstraints2.isFixedTopAndBottom(resizingConstraint)) {
        const bounding = shape.boundingBox();
        const __to_bottom = toBottom(bounding);
        const __target_height = currentEnvSize.height - bounding.y - __to_bottom;
        const __target_sy = __target_height / bounding.height;
        // const __sec_transform = new Transform2()
        //     .setTranslate(ColVector3D.FromXY(bounding.x, bounding.y));

        transform.trans(-bounding.x, -bounding.y);
        // todo
        // const __scale_trans = __sec_transform.setScale(ColVector3D.FromXYZ(1, __target_sy, 1));

        transform.scale(1, __target_sy);
        const __decompose_scale = transform.clearScaleSize();
        __scale.x *= Math.abs(__decompose_scale.x);
        __scale.y *= Math.abs(__decompose_scale.y);

        targetWidth = size.width * __scale.x;
        targetHeight = size.height * __scale.y;

        // transform.clearScaleSize();
    } else {
        if (ResizingConstraints2.isFlexHeight(resizingConstraint)) {
            // 高度不固定
            // const __p_transform_ver_scale = new Transform2().setScale(ColVector3D.FromXYZ(1, scale.y, 1));

            transform.scale(1, scale.y);

            const __decompose_scale = transform.clearScaleSize();
            __scale.x *= Math.abs(__decompose_scale.x);
            __scale.y *= Math.abs(__decompose_scale.y);

            targetWidth = size.width * __scale.x;
            targetHeight = size.height * __scale.y;

            // transform.clearScaleSize();

            if (ResizingConstraints2.isFixedToTop(resizingConstraint)) {
                // 靠顶部固定
                const bounding = shape.boundingBox();
                transform.trans(0, -(bounding.y * scale.y - bounding.y));
            } else if (ResizingConstraints2.isFixedToBottom(resizingConstraint)) {
                // 靠底边固定
                const __to_bottom = toBottom(shape.boundingBox());
                transform.trans(0, __to_bottom * scale.y - __to_bottom);
            } else if (ResizingConstraints2.isVerticalJustifyCenter(resizingConstraint)) {
                // 居中
                const __center_offset_top = centerOffsetTop(shape.boundingBox());
                transform.trans(0, -(__center_offset_top * scale.y - __center_offset_top));
            }
        } else {
            // 高度固定
            if (ResizingConstraints2.isFixedToBottom(resizingConstraint)) {
                // 靠底边固定
                transform.trans(0, (scale.y - 1) * originEnvSize.height);
            } else if (ResizingConstraints2.isVerticalJustifyCenter(resizingConstraint)) {
                // 居中
                const delta = originEnvSize.height / 2 - currentEnvSize.height / 2;
                transform.trans(0, delta);
            }
        }
    }


    return { transform, targetWidth, targetHeight };

    function toRight(bounding: ShapeFrame) {
        return originEnvSize.width - bounding.x - bounding.width;
    }

    function centerOffsetLeft(bounding: ShapeFrame) {
        return (bounding.x + bounding.width / 2) - originEnvSize.width / 2;
    }

    function toBottom(bounding: ShapeFrame) {
        return originEnvSize.height - bounding.y - bounding.height;
    }

    function centerOffsetTop(bounding: ShapeFrame) {
        return (bounding.y + bounding.height / 2) - originEnvSize.height / 2;
    }
}

export function matrix2parent(t: Transform, matrix?: Transform) {
    // const t = this.transform;
    const m = t;
    if (!matrix) return m.clone();
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
        const bounds = path.bbox();
        _minx = bounds.x;
        _maxx = bounds.x2;
        _miny = bounds.y;
        _maxy = bounds.y2;
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

    m_border_path?: Path;
    m_border_path_box?: ShapeFrame;

    // m_transform2: Transform2 | undefined;
    m_transform_form_mask?: Transform;
    m_mask_group?: ShapeView[];

    // fill、border等属性随着变量、遮罩、样式库等因素的加入，获取路径不断加长。现在缓存fill和border，不至于每次都重新通过长的路径获取
    m_fills: Fill[] | undefined;
    m_borders: Border | undefined;

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        const shape = props.data;
        const t = shape.transform;
        this.m_transform = new Transform(t.m00, t.m01, t.m02, t.m10, t.m11, t.m12)
        this.m_fixedRadius = (shape as PathShape).fixedRadius; // rectangle
    }

    hasSize() {
        return this.m_data.hasSize();
    }

    onMounted() {
        this._layout(this.m_props.layoutSize, this.m_props.scale);
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

    get exportOptions(): ExportOptions | undefined {
        const v = this._findOV(OverrideType.ExportOptions, VariableType.ExportOptions);
        return v ? v.value : this.data.exportOptions;
    }

    get contextSettings(): ContextSettings | undefined {
        const v = this._findOV(OverrideType.ContextSettings, VariableType.ContextSettings);
        return v ? v.value : this.data.style.contextSettings;
    }

    get naviChilds(): ShapeView[] | undefined {
        return this.m_children as ShapeView[];
    }

    get transform() {
        return this.m_transform
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
        return this.m_visibleFrame;
    }

    /**
     * 包含被裁剪的对象
     */
    get outerFrame() {
        return this.m_outerFrame;
    }

    get rotation(): number {
        return (this.transform).decomposeRotate() * 180 / Math.PI;
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

    get x(): number {
        return this.transform.m02
    }

    get y(): number {
        return this.transform.m12
    }

    /**
     *  transform -> clientXY
     *  数据里的值(transform)并不一定是用户直观上的值(clientXY)，需要通过计算来简化或转换
     *  需要注意的是，frame的偏移目前只发生编组类图形和页面上，其中页面的坐标系需要帮用户隐藏掉，取而代之的是一个固定的Root坐标系
     *  所以在处理页面下的直接子元素时，也应该忽略掉frame的偏移；
     */
    protected m_client_x: number | undefined = undefined;

    get clientX(): number {
        return this.m_client_x ?? (this.m_client_x = (() => {
            let offset = 0;
            if (this.parent?.type !== ShapeType.Page) {
                offset = this.parent?.frame.x ?? 0;
            }
            return this._p_frame.x - offset;
        })());
    }

    protected m_client_y: number | undefined = undefined;

    get clientY(): number {
        return this.m_client_y ?? (this.m_client_y = (() => {
            let offset = 0;
            if (this.parent?.type !== ShapeType.Page) {
                offset = this.parent?.frame.y ?? 0;
            }
            return this._p_frame.y - offset;
        })());
    }

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
            const bounds = path.bbox();
            return new ShapeFrame(bounds.x, bounds.y, bounds.w, bounds.h);
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
            const bounds = path.bbox();
            return new ShapeFrame(bounds.x, bounds.y, bounds.w, bounds.h);
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
        if (args.includes('mask') || args.includes('isVisible')) {
            (this.parent as GroupShapeView).updateMaskMap();
            (this.parent as GroupShapeView).updateFrames(); // 遮罩图层会改变父级的frame结构 // todo 等排版更新就行？
        }

        if (this.parent && (args.includes('transform') || args.includes('size') || args.includes('isVisible'))) {
            // 执行父级自动布局
            const autoLayout = (this.parent as ArtboardView).autoLayout;
            if (autoLayout) {
                this.parent.m_ctx.setReLayout(this.parent);
            }
        } else if (args.includes('borders') && this.parent) {
            const autoLayout = (this.parent as ArtboardView).autoLayout;
            if (autoLayout?.bordersTakeSpace) {
                this.parent.m_ctx.setReLayout(this.parent);
            }
        }

        if (args.includes('points')
            || args.includes('pathsegs')
            || args.includes('isClosed')
            || (this.m_fixedRadius || 0) !== ((this.m_data as any).fixedRadius || 0)
            || args.includes('cornerRadius')
            || args.includes('imageRef')
        ) {
            this.m_path = undefined;
            this.m_pathstr = undefined;
        }

        if (args.includes('variables')) {
            this.m_fills = undefined;
            this.m_borders = undefined;
        }
        else if (args.includes('fills')) {
            this.m_fills = undefined;
        }
        else if (args.includes('borders')) {
            this.m_borders = undefined;
        }

        const masked = this.masked;
        if (masked) masked.notify('rerender-mask');
    }

    _findOV(ot: OverrideType, vt: VariableType): Variable | undefined {
        if (!this.varsContainer) return;
        const _vars = findOverrideAndVar(this.m_data, ot, this.varsContainer, true);
        if (!_vars) return;
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === vt) {
            return _var;
        }
    }

    protected _findOVAll(ot: OverrideType, vt: VariableType): Variable[] | undefined {
        if (!this.varsContainer) return;
        const _vars = findOverrideAll(this.m_data.id, ot, this.varsContainer);
        // if (!_vars) return;
        // const _var = _vars[_vars.length - 1];
        // if (_var && _var.type === vt) {
        //     return _var;
        // }
        return _vars;
    }

    matrix2Root() {
        const m = this.transform.clone()
        const p = this.parent;
        if (p) {
            const offset = (p as ArtboardView).innerTransform;
            offset && m.multiAtLeft(offset)
            p.uniformScale && m.scale(p.uniformScale);
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

    get name(): string {
        const v = this._findOV(OverrideType.Name, VariableType.Name);
        return v ? v.value : this.m_data.name;
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
        const { m00, m01, m10, m11 } = this.transform;
        return Math.abs(m00 - 1) < float_accuracy && Math.abs(m01) < float_accuracy && Math.abs(m10) < float_accuracy && Math.abs(m11 - 1) < float_accuracy;
    }

    matrix2Parent(matrix?: Transform) {
        const m = matrix2parent(this.transform, matrix);
        if (this.parent?.uniformScale) m.scale(this.parent.uniformScale);
        return m;
    }

    getFills(): Fill[] {
        if (this.m_fills) return this.m_fills;
        const v = this._findOV(OverrideType.Fills, VariableType.Fills);
        this.m_fills = v ? v.value as Fill[] : this.m_data.style.fills
        return this.m_fills;
    }

    getBorders(): Border {
        if (this.m_borders) return this.m_borders;
        const v = this._findOV(OverrideType.Borders, VariableType.Borders);
        this.m_borders = v ? v.value as Border : this.m_data.style.borders
        return this.m_borders;
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
        return v ? v.value : this.m_data.style.blur;
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

    get mask(): boolean {
        return !!this.m_data.mask;
    }

    get masked() {
        return this.parent ? (this.parent as GroupShapeView).maskMap?.get(this.m_data.id) : undefined;
    }

    indexOfChild(view: ShapeView) {
        return this.childs.indexOf(view)
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
            // this.m_transform2 = undefined;
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

        const border = this.getBorders();
        let maxtopborder = 0;
        let maxleftborder = 0;
        let maxrightborder = 0;
        let maxbottomborder = 0;
        if (border) {
            const isEnabled = border.strokePaints.some(p => p.isEnabled);
            if (isEnabled) {
                const outer = border.position === BorderPosition.Outer;
                maxtopborder = outer ? border.sideSetting.thicknessTop : border.sideSetting.thicknessTop / 2;
                maxleftborder = outer ? border.sideSetting.thicknessLeft : border.sideSetting.thicknessLeft / 2;
                maxrightborder = outer ? border.sideSetting.thicknessRight : border.sideSetting.thicknessRight / 2;
                maxbottomborder = outer ? border.sideSetting.thicknessBottom : border.sideSetting.thicknessBottom / 2;
            }
        }
        // 阴影
        const shadows = this.getShadows();
        let st = 0, sb = 0, sl = 0, sr = 0;
        shadows.forEach(s => {
            if (!s.isEnabled) return;
            if (s.position !== ShadowPosition.Outer) return;
            const w = s.blurRadius + s.spread;
            sl = Math.max(-s.offsetX + w, sl);
            sr = Math.max(s.offsetX + w, sr);
            st = Math.max(-s.offsetY + w, st);
            sb = Math.max(s.offsetY + w, sb);
        })

        const el = Math.max(maxleftborder, sl);
        const et = Math.max(maxtopborder, st);
        const er = Math.max(maxrightborder, sr);
        const eb = Math.max(maxbottomborder, sb);

        // update visible
        if (updateFrame(this.m_visibleFrame, this.frame.x - el, this.frame.y - et, this.frame.width + el + er, this.frame.height + et + eb)) changed = true;

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
            this.m_client_x = this.m_client_y = undefined;
        }

        return changed;
    }

    protected layoutChilds(
        parentFrame: ShapeSize | undefined,
        scale?: { x: number, y: number }
    ) {
    }

    protected _layout(
        parentFrame: ShapeSize | undefined,
        scale: { x: number, y: number } | undefined,
    ) {
        const shape = this.data;
        const transform = shape.transform.clone();
        if (this.parent && (this.parent as ArtboardView).autoLayout) {
            transform.translateX = this.m_transform.translateX;
            transform.translateY = this.m_transform.translateY;
        }
        
        // case 1 不需要变形
        if (!scale || isEqual(scale.x, 1) && isEqual(scale.y, 1)) {
            let frame = this.frame;
            if (this.hasSize()) frame = this.data.frame;
            this.updateLayoutArgs(transform, frame, (shape as PathShape).fixedRadius);
            this.layoutChilds(this.frame);
            this.updateFrames();
            return;
        }

        const skewTransform = (scalex: number, scaley: number) => {
            let t = transform;
            if (scalex !== scaley) {
                t = t.clone();
                t.scale(scalex, scaley);
                // 保留skew去除scale
                t.clearScaleSize();
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
            const t = skewTransform(scale.x, scale.y).clone();
            const save2 = t.computeCoord(0, 0)
            const dx = save1.x - save2.x;
            const dy = save1.y - save2.y;
            t.trans(dx, dy);
            this.updateLayoutArgs(t, frame, (shape as PathShape).fixedRadius);
            this.layoutChilds(undefined, scale);
            this.updateFrames();
            return;
        }

        const size = this.data.size; // 如果是group,实时计算的大小。view中此时可能没有
        const saveW = size.width;
        const saveH = size.height;

        let scaleX = scale.x;
        let scaleY = scale.y;

        if (parentFrame && resizingConstraint !== 0) {
            const { transform, targetWidth, targetHeight } = fixFrameByConstrain(shape, parentFrame, scaleX, scaleY);
            this.updateLayoutArgs((transform), new ShapeFrame(0, 0, targetWidth, targetHeight), (shape as PathShape).fixedRadius);
            this.layoutChilds(this.frame, { x: targetWidth / saveW, y: targetHeight / saveH });
        } else {
            const transform = (shape.transform.clone());
            // const __p_transform_scale = new Transform2().setScale(ColVector3D.FromXYZ(scaleX, scaleY, 1));
            transform.scale(scaleX, scaleY);
            const __decompose_scale = transform.clearScaleSize();
            // 这里应该是virtual，irtual是整体缩放，位置是会变化的，不需要trans
            // 保持对象位置不变
            // transform.trans(transform.translateX - shape.transform.translateX, transform.translateY - shape.transform.translateY);
            const size = shape.size;
            let layoutSize = new ShapeSize();
            const frame = new ShapeFrame(0, 0, size.width * __decompose_scale.x, size.height * __decompose_scale.y);

            if (this.parent && (this.parent as ArtboardView).autoLayout) {
                transform.translateX = this.m_transform.translateX;
                transform.translateY = this.m_transform.translateY;
            }

            layoutSize.width = frame.width
            layoutSize.height = frame.height
            this.updateLayoutArgs((transform), frame, (shape as PathShape).fixedRadius);
            this.layoutChilds(this.frame, { x: frame.width / saveW, y: frame.height / saveH });
        }
        this.updateFrames();

        // const t = skewTransform(scaleX, scaleY).clone();
        // const cur = t.computeCoord(0, 0);
        // t.trans(frame.x - cur.x, frame.y - cur.y);
        // const inverse = t.inverse;
        // const rb = inverse.computeCoord(frame.x + frame.width, frame.y + frame.height);
        // const size2 = new ShapeFrame(0, 0, (rb.x), (rb.y));

        // this.updateLayoutArgs(t, size2, (shape as PathShape).fixedRadius);
        //
        // this.layoutChilds(varsContainer, this.frame, { x: scaleX, y: scaleY });
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
        const diffScale = isDiffScale(props.scale, this.m_props.scale);
        const diffLayoutSize = isDiffShapeSize(props.layoutSize, this.m_props.layoutSize)
        const diffVars = isDiffVarsContainer(props.varsContainer, this.varsContainer);
        if (!needLayout &&
            !dataChanged &&
            !diffScale &&
            !diffVars &&
            !diffLayoutSize) {
            return false;
        }
        this.m_props = props
        this.m_isVirtual = props.isVirtual
        // this.m_uniform_scale = props.uniformScale;
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
        if (props && !this.updateLayoutProps(props, needLayout)) return;

        this.m_ctx.setDirty(this);
        this._layout(this.m_props.layoutSize, this.m_props.scale);
        this.m_ctx.addNotifyLayout(this);
    }

    // ================== render ===========================

    protected renderFills(): EL[] {
        let fills = this.getFills();
        if (this.mask) {
            fills = fills.map(f => {
                if (f.fillType === FillType.Gradient && f.gradient?.gradientType === GradientType.Angular) {
                    const nf = importFill(exportFill(f));
                    nf.fillType = FillType.SolidColor;
                    return nf;
                } else return f;
            })
        }
        return renderFills(elh, fills, this.size, this.getPathStr(), 'fill-' + this.id);
    }

    protected renderBorders(): EL[] {
        let border = this.getBorders();
        if (this.mask && border) {
            border.strokePaints.map(b => {
                const nb = importStrokePaint(exportStrokePaint(b));
                if (nb.fillType === FillType.Gradient && nb.gradient?.gradientType === GradientType.Angular) nb.fillType = FillType.SolidColor;
                return nb;
            });
        }
        return renderBorders(elh, border, this.size, this.getPathStr(), this.m_data);
    }

    protected renderShadows(filterId: string): EL[] {
        return renderShadows(elh, filterId, this.getShadows(), this.getPathStr(), this.frame, this.getFills(), this.getBorders(), this.m_data, this.blur);
    }

    protected renderBlur(blurId: string): EL[] {
        if (!this.blur) return [];
        return renderBlur(elh, this.blur, blurId, this.frame, this.getFills(), this.getBorders(), this.getPathStr());
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

    protected m_render_version: number = 0;

    protected checkAndResetDirty(): boolean {
        return this.m_ctx.removeDirty(this);
    }

    asyncRender(): number {
        const renderContents = this.renderContents;
        this.renderContents = () => this.m_children;
        const version = this.render();
        this.renderContents = renderContents;
        return version;
    }

    render(): number {
        if (!this.checkAndResetDirty()) return this.m_render_version;

        const masked = this.masked;
        if (masked) {
            (this.getPage() as PageView)?.getView(masked.id)?.render();
            this.reset("g");
            return ++this.m_render_version;
        }

        if (!this.isVisible) {
            this.reset("g");
            return ++this.m_render_version;
        }

        const fills = this.renderFills();
        const borders = this.renderBorders();
        let childs = this.renderContents();
        const autoInfo = (this as any).autoLayout;
        if (autoInfo && autoInfo.stackReverseZIndex) {
            childs = childs.reverse();
        }

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);


        let props = this.renderProps();
        let children = [...fills, ...childs, ...borders];
        // 阴影
        if (shadows.length) {
            let filter: string = '';
            const inner_url = innerShadowId(filterId, this.getShadows());
            filter = `url(#pd_outer-${filterId}) `;
            if (inner_url.length) filter += inner_url.join(' ');
            children = [...shadows, elh("g", { filter }, children)];
        }

        // 模糊
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);
        if (blur.length) {
            if (this.blur!.type === BlurType.Gaussian) {
                children = [...blur, elh('g', { filter: `url(#${blurId})` }, children)];
            } else {
                const __props: any = {};
                if (props.opacity) {
                    __props.opacity = props.opacity;
                    delete props.opacity;
                }
                if (props.style?.["mix-blend-mode"]) {
                    __props["mix-blend-mode"] = props.style["mix-blend-mode"];
                    delete props.style["mix-blend-mode"];
                }
                children = [...blur, elh('g', __props, children)];
            }
        }

        // 遮罩
        const _mask_space = this.renderMask();
        if (_mask_space) {
            Object.assign(props.style, { transform: _mask_space.toString() });
            const id = `mask-base-${objectId(this)}`;
            const __body_transform = this.transformFromMask;
            const __body = elh("g", { style: { transform: __body_transform } }, children);
            this.bleach(__body);
            children = [__body];
            const mask = elh('mask', { id }, children);
            const rely = elh('g', { mask: `url(#${id})` }, this.relyLayers);
            children = [mask, rely];
        }

        this.reset("g", props, children);

        return ++this.m_render_version;
    }

    renderStatic() {
        const fills = this.renderFills() || [];
        let childs = this.renderContents();
        const autoInfo = (this as any).autoLayout;
        if (autoInfo && autoInfo.stackReverseZIndex) {
            childs = childs.reverse();
        }
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
        return this.m_data.isImageFill;
    }

    get prototypeStartPoint(): PrototypeStartingPoint | undefined {
        return this.m_data.prototypeStartingPoint;
    }

    get prototypeInterActions(): BasicArray<PrototypeInterAction> | undefined {
        const v = this._findOVAll(OverrideType.ProtoInteractions, VariableType.ProtoInteractions);
        if (!v) {
            return this.m_data.prototypeInteractions;
        }
        // 需要做合并
        // 合并vars
        const overrides = new BasicArray<PrototypeInterAction>();
        v.reverse().forEach(v => {
            const o = (v.value as BasicArray<PrototypeInterAction>).slice(0).reverse();
            o.forEach(o => {
                if (!overrides.find(o1 => o1.id === o.id)) overrides.push(o);
            })
        })
        overrides.reverse();

        const deleted = overrides.filter((v) => !!v.isDeleted);
        const inherit = this.m_data.prototypeInteractions || [];
        const ret = new BasicArray<PrototypeInterAction>();
        inherit.forEach(v => {
            if (v.isDeleted) return;
            if (deleted.find(v1 => v1.id === v.id)) return;
            const o = overrides.find(v1 => v1.id === v.id);
            ret.push(o ? o : v);
        })
        overrides.forEach(v => {
            if (v.isDeleted) return;
            if (inherit.find(v1 => v1.id === v.id)) return;
            ret.push(v);
        })
        return ret;
    }

    get overlayPosition(): OverlayPosition | undefined {
        return this.m_data.overlayPosition
    }

    get overlayBackgroundInteraction(): OverlayBackgroundInteraction | undefined {
        return this.m_data.overlayBackgroundInteraction
    }

    get overlayBackgroundAppearance(): OverlayBackgroundAppearance | undefined {
        return this.m_data.overlayBackgroundAppearance
    }

    get scrollDirection(): ScrollDirection | undefined {
        return this.m_data.scrollDirection
    }

    get scrollBehavior(): ScrollBehavior | undefined {
        return this.m_data.scrollBehavior;
    }

    get relyLayers() {
        if (!this.m_transform_form_mask) this.m_transform_form_mask = this.renderMask();
        if (!this.m_transform_form_mask) return;

        const group = this.m_mask_group || [];
        if (group.length < 2) return;
        const inverse = (this.m_transform_form_mask).inverse;
        const els: EL[] = [];
        for (let i = 1; i < group.length; i++) {
            const __s = group[i];
            if (!__s.isVisible) continue;
            const dom = __s.dom;
            if (!(dom.elattr as any)['style']) {
                (dom.elattr as any)['style'] = {};
            }
            (dom.elattr as any)['style']['transform'] = (__s.transform.clone().multi(inverse)).toString();
            els.push(dom);
        }

        return els;
    }

    get transformFromMask() {
        this.m_transform_form_mask = this.renderMask();
        if (!this.m_transform_form_mask) return;

        const space = (this.m_transform_form_mask).inverse;

        return (this.transform.clone().multi(space)).toString()
    }

    renderMask() {
        if (!this.mask) return;
        const parent = this.parent;
        if (!parent) return;
        const __children = parent.childs;
        let index = __children.findIndex(i => i.id === this.id);
        if (index === -1) return;
        const maskGroup: ShapeView[] = [this];
        this.m_mask_group = maskGroup;
        for (let i = index + 1; i < __children.length; i++) {
            const cur = __children[i];
            if (cur && !cur.mask) maskGroup.push(cur);
            else break;
        }
        let x = Infinity;
        let y = Infinity;

        maskGroup.forEach(s => {
            const box = s.boundingBox();
            if (box.x < x) x = box.x;
            if (box.y < y) y = box.y;
        });

        return new Transform(1, 0, x, 0, 1, y);
    }

    bleach(el: EL) {  // 漂白
        if (el.elattr.fill && el.elattr.fill !== 'none' && !(el.elattr.fill as string).startsWith('url(#gradient')) {
            el.elattr.fill = '#FFF';
        }
        if (el.elattr.stroke && el.elattr.stroke !== 'none' && !(el.elattr.stroke as string).startsWith('url(#gradient')) {
            el.elattr.stroke = '#FFF';
        }
        // 漂白阴影
        if (el.eltag === 'feColorMatrix' && el.elattr.result) {
            let values: any = el.elattr.values;
            if (values) values = values.split(' ');
            if (values[3]) values[3] = 1;
            if (values[8]) values[8] = 1;
            if (values[13]) values[13] = 1;
            el.elattr.values = values.join(' ');
        }

        if (Array.isArray(el.elchilds)) el.elchilds.forEach(el => this.bleach(el));
    }

    get dom() {
        const fills = this.renderFills();
        const childs = this.renderContents();
        const borders = this.renderBorders();

        const filterId = `${objectId(this)}`;
        const shadows = this.renderShadows(filterId);
        const blurId = `blur_${objectId(this)}`;
        const blur = this.renderBlur(blurId);

        const contextSettings = this.style.contextSettings;
        const props: any = {};
        if (contextSettings) {
            if (contextSettings.opacity !== undefined) {
                props.opacity = contextSettings.opacity;
            }
            props.style = { 'mix-blend-mode': contextSettings.blenMode };
        }

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

        return elh("g", props, children);
    }

    reloadImage(target?: Set<string>) {
        const fills = this.getFills(); // 重载填充图片
        fills.forEach((fill) => {
            if (fill.fillType === FillType.Pattern) {
                if (!target) fill.reloadImage();
                else if (target.has(fill.imageRef || '')) fill.reloadImage();
            }
        })
        this.m_ctx.setDirty(this);
    }

    get stackPositioning() {
        return this.m_data.stackPositioning;
    }
    get uniformScale(): number | undefined {
        return undefined;
    }

    get borderPath() {
        return this.m_border_path;
    }

    get borderPathBox() {
        return this.m_border_path_box;
    }
}