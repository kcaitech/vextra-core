/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    BasicArray,
    Blur, BlurMask,
    Border, BorderMask,
    BorderPosition,
    ContextSettings,
    CornerRadius, CurveMode,
    CurvePoint,
    ExportOptions,
    Fill, FillMask,
    FillType,
    MarkerType,
    OverlayBackgroundAppearance,
    OverlayBackgroundInteraction,
    OverlayPosition,
    OverrideType, parsePath,
    PathShape,
    PrototypeInterAction,
    PrototypeStartingPoint, RadiusMask, RadiusType,
    ResizingConstraints2,
    ScrollBehavior,
    ScrollDirection,
    Shadow, ShadowMask,
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
import { EL } from "./el";
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";
import { objectId } from "../basic/objectid";
import { float_accuracy } from "../basic/consts";
import { findOverrideAll } from "../data/utils";
import { Path } from "@kcdesign/path";
import { isEqual } from "../basic/number_utils";

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

export function fixFrameByConstrain(shape: Shape, parentFrame: ShapeSize, scaleX: number, scaleY: number) {
    const originParentFrame = shape.parent!.size; // frame
    if (shape.parent!.type === ShapeType.Group) {
        const transform = (shape.transform.clone());
        transform.scale(scaleX, scaleY);
        const __decompose_scale = transform.clearScaleSize();
        const size = shape.size;
        return {
            transform,
            targetWidth: size.width * __decompose_scale.x,
            targetHeight: size.height * __decompose_scale.y
        };
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

export function fixConstrainFrame2(shape: Shape, scale: {
    x: number,
    y: number
}, currentEnvSize: ShapeSize, originEnvSize: ShapeSize) {
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

    m_fills: BasicArray<Fill> | undefined;
    m_border: Border | undefined;

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        const shape = props.data;
        const t = shape.transform;
        this.m_transform = new Transform(t.m00, t.m01, t.m02, t.m10, t.m11, t.m12)
        this.m_fixedRadius = (shape as PathShape).fixedRadius;
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
    maskMap: Map<string, Shape> = new Map;
    updateMaskMap() {
    }
    onDataChange(...args: any[]): void {
        if (args.includes('mask') || args.includes('isVisible')) {
            this.parent!.updateMaskMap();
        }

        if (this.parent && (args.includes('transform') || args.includes('size') || args.includes('isVisible') || args.includes('autoLayout'))) {
            // 执行父级自动布局
            let p = this.parent as any;
            while (p && p.autoLayout) {
                p.m_ctx.setReLayout(p);
                p = p.parent as any;
            }
        } else if (args.includes('borders') && this.parent) {
            let p = this.parent as any;
            while (p && p.autoLayout) {
                if (p.autoLayout?.bordersTakeSpace) {
                    p.m_ctx.setReLayout(p);
                }
                p = p.parent as any;
            }
        }

        if (args.includes('points')
            || args.includes('pathsegs')
            || args.includes('isClosed')
            || (this.m_fixedRadius || 0) !== ((this.m_data as any).fixedRadius || 0)
            || args.includes('cornerRadius')
            || args.includes('imageRef')
            || args.includes('radiusMask')
            || args.includes('variables')
        ) {
            this.m_path = undefined;
            this.m_pathstr = undefined;
        }

        if (args.includes('variables')) {
            this.m_fills = undefined;
            this.m_border = undefined;
            this.m_is_border_shape = undefined;
        } else if (args.includes('fills')) {
            this.m_fills = undefined;
            this.m_is_border_shape = undefined;
        } else if (args.includes('borders')) {
            this.m_border = undefined;
            this.m_is_border_shape = undefined;
        } else if (args.includes('fillsMask')) {
            this.m_fills = undefined;
            this.m_is_border_shape = undefined;
        } else if (args.includes('bordersMask')) {
            this.m_border = undefined;
            this.m_border_path = undefined;
            this.m_border_path_box = undefined;
            this.m_is_border_shape = undefined;
        }

        const masked = this.masked;
        if (masked) masked.notify('rerender-mask');
    }

    _findOV(ot: OverrideType, vt: VariableType): Variable | undefined {
        if (!this.varsContainer) return;
        const _vars = findOverrideAndVar(this.m_data, ot, this.varsContainer, true);
        if (!_vars) return;
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === vt) return _var;
    }

    protected _findOVAll(ot: OverrideType, vt: VariableType): Variable[] | undefined {
        if (!this.varsContainer) return;
        return findOverrideAll(this.m_data.id, ot, this.varsContainer);
    }

    matrix2Root() {
        const m = this.transform.clone()
        const p = this.parent;
        if (p) {
            const offset = (p as any).innerTransform;
            offset && m.multiAtLeft(offset)
            p.uniformScale && m.scale(p.uniformScale);
            m.multiAtLeft(p.matrix2Root())
        }
        return m;
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

    get fillsMask(): string | undefined {
        const v = this._findOV(OverrideType.FillsMask, VariableType.FillsMask);
        return v ? v.value : this.m_data.style.fillsMask;
    }

    private _onFillMaskChange() {
        this.m_fills = undefined;
        this.m_ctx.setDirty(this);
        this.notify('style', 'fills', 'mask');
    }

    private m_unbind_fill: undefined | (() => void) = undefined;

    private onFillMaskChange = this._onFillMaskChange.bind(this);

    protected watchFillMask(mask: FillMask) {
        this.m_unbind_fill?.();
        this.m_unbind_fill = mask.watch(this.onFillMaskChange);
    }

    protected unwatchFillMask() {
        this.m_unbind_fill?.();
    }

    getFills(): BasicArray<Fill> {
        if (this.m_fills) return this.m_fills;
        let fills: BasicArray<Fill>;

        const fillsMask: string | undefined = this.fillsMask;
        if (fillsMask) {
            const mask = this.style.getStylesMgr()!.getSync(fillsMask) as FillMask;
            fills = mask.fills;
            this.watchFillMask(mask);
        } else {
            const v = this._findOV(OverrideType.Fills, VariableType.Fills);
            fills = v ? v.value : this.m_data.style.fills;
            this.unwatchFillMask();
        }

        return this.m_fills = fills;
    }

    private _onBorderMaskChange() {
        this.m_border = undefined;
        this.m_ctx.setDirty(this);
        this.notify('style', 'border', 'mask');
    }

    private m_unbind_border: undefined | (() => void) = undefined;

    private onBorderMaskChange = this._onBorderMaskChange.bind(this);

    protected watchBorderMask(mask: BorderMask) {
        this.m_unbind_border?.();
        this.m_unbind_border = mask.watch(this.onBorderMaskChange);
    }

    protected unwatchBorderMask() {
        this.m_unbind_border?.();
    }

    private _onBorderFillMaskChange() {
        this.m_border = undefined;
        this.m_ctx.setDirty(this);
        this.notify('style', 'paints', 'mask');
    }

    private m_unbind_border_fill: undefined | (() => void) = undefined;

    private onBorderFillMaskChange = this._onBorderFillMaskChange.bind(this);

    protected watchBorderFillMask(mask: FillMask) {
        this.m_unbind_border_fill?.();
        this.m_unbind_border_fill = mask.watch(this.onBorderFillMaskChange);
    }

    protected unwatchBorderFillMask() {
        this.m_unbind_border_fill?.();
    }

    getBorder(): Border {
        if (this.m_border) return this.m_border;
        const mgr = this.style.getStylesMgr();
        if (!mgr) return this.m_border ?? this.m_data.style.borders;

        const v = this._findOV(OverrideType.Borders, VariableType.Borders);
        const border = v ? { ...v.value } : { ...this.m_data.style.borders };

        const bordersMask: string | undefined = this.bordersMask;
        if (bordersMask) {
            const mask = mgr.getSync(bordersMask) as BorderMask
            border.position = mask.border.position;
            border.sideSetting = mask.border.sideSetting;
            this.watchBorderMask(mask);
        } else {
            this.unwatchBorderMask();
        }

        const fillsMask: string | undefined = this.borderFillsMask;
        if (fillsMask) {
            const mask = mgr.getSync(fillsMask) as FillMask;
            border.strokePaints = mask.fills;
            this.watchBorderFillMask(mask);
        } else {
            this.unwatchBorderFillMask();
        }
        return this.m_border = border;
    }

    get bordersMask(): string | undefined {
        const v = this._findOV(OverrideType.BordersMask, VariableType.BordersMask);
        return v ? v.value : this.m_data.style.bordersMask;
    }

    get borderFillsMask(): string | undefined {
        const v = this._findOV(OverrideType.BorderFillsMask, VariableType.BorderFillsMask);
        return v ? v.value : this.m_data.style.borders.fillsMask;
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

    get shadowsMask(): string | undefined {
        const v = this._findOV(OverrideType.ShadowsMask, VariableType.ShadowsMask);
        return v ? v.value : this.m_data.style.shadowsMask;
    }

    private _onShadowMaskChange() {
        this.m_ctx.setDirty(this);
        this.notify('style', 'shadows', 'mask');
    }

    private m_unbind_shadow: undefined | (() => void) = undefined;
    private onShadowMaskChange = this._onShadowMaskChange.bind(this);

    protected watchShadowMask(mask: ShadowMask) {
        this.m_unbind_shadow?.();
        this.m_unbind_shadow = mask.watch(this.onShadowMaskChange);
    }

    protected unwatchShadowMask() {
        this.m_unbind_shadow?.();
    }

    getShadows(): BasicArray<Shadow> {
        let shadows: BasicArray<Shadow> = new BasicArray();
        if (this.shadowsMask) {
            const mgr = this.style.getStylesMgr();
            if (!mgr) return shadows;
            const mask = mgr.getSync(this.shadowsMask) as ShadowMask;
            shadows = mask.shadows;
            this.watchShadowMask(mask);
        } else {
            const v = this._findOV(OverrideType.Shadows, VariableType.Shadows);
            shadows = v ? v.value : this.m_data.style.shadows;
            this.unwatchShadowMask()
        }
        return shadows;
    }

    private _onBlurMaskChange() {
        this.m_ctx.setDirty(this);
        this.notify('style', 'blur', 'mask');
    }

    get blurMask(): string | undefined {
        const v = this._findOV(OverrideType.BlursMask, VariableType.BlursMask);
        return v ? v.value : this.m_data.style.blursMask;
    }

    private m_unbind_blur: undefined | (() => void) = undefined;
    private onBlurMaskChange = this._onBlurMaskChange.bind(this);

    watchBlurMask(mask: BlurMask) {
        this.m_unbind_blur?.();
        this.m_unbind_blur = mask.watch(this.onBlurMaskChange);
    }

    unwatchBlurMask() {
        this.m_unbind_blur?.();
    }

    get blur(): Blur | undefined {
        let blur: Blur;
        if (this.blurMask) {
            const mgr = this.style.getStylesMgr()!;
            const mask = mgr.getSync(this.blurMask) as BlurMask
            blur = mask.blur;
            this.watchBlurMask(mask);
        } else {
            const v = this._findOV(OverrideType.Blur, VariableType.Blur);
            blur = v ? v.value : this.m_data.style.blur;
            this.unwatchBlurMask();
        }
        return blur;
    }

    getPathOfSize() {
        const p1 = new CurvePoint([] as any, '', 0, 0, CurveMode.Straight);
        const p2 = new CurvePoint([] as any, '', 1, 0, CurveMode.Straight);
        const p3 = new CurvePoint([] as any, '', 1, 1, CurveMode.Straight);
        const p4 = new CurvePoint([] as any, '', 0, 1, CurveMode.Straight);
        const radius = this.radius;
        p1.radius = radius[0];
        p2.radius = radius[1] ?? radius[0];
        p3.radius = radius[2] ?? radius[0];
        p4.radius = radius[3] ?? radius[0];
        return parsePath([p1, p2, p3, p4], true, this.frame.width, this.frame.height);
    }

    getPathStr() {
        if (this.m_pathstr) return this.m_pathstr;
        this.m_pathstr = this.getPath().toString();
        return this.m_pathstr;
    }

    getPath() {
        if (this.m_path) return this.m_path;
        this.m_path = this.getPathOfSize();
        const frame = this.frame;
        if (frame.x || frame.y) this.m_path.translate(frame.x, frame.y);
        this.m_path.freeze();
        return this.m_path;
    }

    get borderPath() {
        return this.m_border_path ?? (this.m_border_path = (() => new Path())());
    }

    get borderPathBox() {
        return this.m_border_path_box ?? (this.m_border_path_box = (() => {
            const bbox = this.borderPath.bbox();
            return new ShapeFrame(bbox.x, bbox.y, bbox.w, bbox.h);
        })());
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
        return this.parent?.maskMap?.get(this.m_data.id);
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

        const border = this.getBorder();
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
            this.m_border_path = undefined;
            this.m_is_border_shape = undefined;
            this.m_border_path_box = undefined;
        }

        return changed;
    }

    protected layoutChilds(parentFrame: ShapeSize | undefined, scale?: { x: number, y: number }) {
    }

    protected _layout(parentFrame: ShapeSize | undefined, scale: { x: number, y: number } | undefined,) {
        const shape = this.data;
        const transform = shape.transform.clone();
        if (this.parent && (this.parent as any).autoLayout) {
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
            transform.scale(scaleX, scaleY);
            const __decompose_scale = transform.clearScaleSize();
            // 这里应该是virtual，是整体缩放，位置是会变化的，不需要trans
            // 保持对象位置不变
            const size = shape.size;
            let layoutSize = new ShapeSize();
            const frame = new ShapeFrame(0, 0, size.width * __decompose_scale.x, size.height * __decompose_scale.y);

            if (this.parent && (this.parent as any).autoLayout) {
                transform.translateX = this.m_transform.translateX;
                transform.translateY = this.m_transform.translateY;
            }

            layoutSize.width = frame.width
            layoutSize.height = frame.height
            this.updateLayoutArgs((transform), frame, (shape as PathShape).fixedRadius);
            this.layoutChilds(this.frame, { x: frame.width / saveW, y: frame.height / saveH });
        }
        this.updateFrames();
    }

    protected updateLayoutProps(props: PropsType, needLayout: boolean) {
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
        if (diffVars) {
            this.m_ctx.removeDirty(this);
            this.varsContainer = props.varsContainer;
        }
        return true;
    }

    // 更新frame, vflip, hflip, rotate, fixedRadius, 及对应的cache数据，如path
    // 更新childs, 及向下更新数据变更了的child(在data change set)
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

    protected renderContents(): EL[] {
        const childs = this.m_children;
        childs.forEach((c) => c.render());
        return childs;
    }

    asyncRender(): number {
        const renderContents = this.renderContents;
        this.renderContents = () => this.m_children;
        const version = this.render();
        this.renderContents = renderContents;
        return version;
    }

    render(): number {
        return this.m_renderer.render();
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

    private _onRadiusMaskChange() {
        this.m_ctx.setDirty(this);
        this.onDataChange('radiusMask');
        this.notify('radiusMask');
    }

    private m_unbind_Radius: undefined | (() => void) = undefined;
    private onRadiusMaskChange = this._onRadiusMaskChange.bind(this);

    protected watchRadiusMask(mask: RadiusMask) {
        this.m_unbind_Radius?.();
        this.m_unbind_Radius = mask.watch(this.onRadiusMaskChange);
    }

    protected unwatchRadiusMask() {
        this.m_unbind_Radius?.();
    }

    get radius(): number[] {
        let _radius: number[];
        if (this.radiusMask) {
            const mgr = this.style.getStylesMgr()!;
            const mask = mgr.getSync(this.radiusMask) as RadiusMask
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            _radius = [this.fixedRadius ?? 0]
            if (this.radiusType === RadiusType.Rect && _radius.length === 1) {
                _radius = [_radius[0], _radius[0], _radius[0], _radius[0]];
            }
            this.unwatchRadiusMask();
        }
        return _radius
    }

    get radiusType() {
        return this.m_data.radiusType;
    }

    get isStraight() {
        return this.m_data.isStraight;
    }

    get isImageFill() {
        return this.getFills().some(fill => fill.fillType === FillType.Pattern);
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

    get radiusMask(): string | undefined {
        const v = this._findOV(OverrideType.RadiusMask, VariableType.RadiusMask);
        return v ? v.value : this.m_data.radiusMask;
    }

    protected m_is_border_shape: boolean | undefined = undefined;

    get isBorderShape() {
        return this.m_is_border_shape ?? (this.m_is_border_shape = (() => {
            const borders = this.getBorder();
            return !this.getFills().length && borders && borders.strokePaints.some(p => p.isEnabled);
        })());
    }

    get isCustomBorder() {
        return false;
    }
}