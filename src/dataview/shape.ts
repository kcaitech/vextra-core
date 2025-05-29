/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    AutoLayout,
    BasicArray,
    Blur,
    Border,
    ContextSettings,
    CornerRadius,
    ExportOptions,
    Fill,
    FillType,
    MarkerType,
    OverlayBackgroundAppearance,
    OverlayBackgroundInteraction,
    OverlayPosition,
    OverrideType,
    PrototypeInteraction,
    PrototypeStartingPoint,
    ResizingConstraints2,
    ScrollBehavior,
    ScrollDirection,
    Shadow,
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
import { DataView } from "./view"
import { DViewCtx, PropsType } from "./viewctx";
import { objectId } from "../basic/objectid";
import { float_accuracy } from "../basic/consts";
import { findOverrideAll } from "../data/utils";
import { isEqual } from "../basic/number_utils";
import { ViewModifyEffect } from "./proxy/effects/view";
import { ViewCache } from "./proxy/cache/view";
import { ViewLayout } from "./proxy/layout/view";
import { FrameProxy } from "./proxy/frame/view";

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
    const m = t;
    if (!matrix) return m.clone();
    matrix.multiAtLeft(m);
    return matrix;
}

export class ShapeView extends DataView {
    frameProxy: FrameProxy;
    cache: ViewCache;
    effect: ViewModifyEffect;
    layoutProxy: ViewLayout;

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        const t = props.data.transform;
        this.transform = new Transform(t.m00, t.m01, t.m02, t.m10, t.m11, t.m12);

        this.frameProxy = new FrameProxy(this);
        this.cache = new ViewCache(this);
        this.effect = new ViewModifyEffect(this);
        this.layoutProxy = new ViewLayout(this);
    }

    onMounted() {
        this.layoutProxy.measure(this.m_props.layoutSize, this.m_props.scale);
    }

    layout(props?: PropsType) {
        this.layoutProxy.layout(props);
    }

    render(): number {
        return this.m_renderer.render();
    }

    onUpdate(...args: any[]) {
        this.effect.emit(args);
        this.effect.clearCache(args);
    }

    asyncRender(): number {
        return this.m_renderer.asyncRender();
    }

    staticRender() {
        // todo
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

    get hasSize() {
        return this.m_data.hasSize();
    }

    get size(): ShapeSize {
        return this.frame;
    }

    /**
     * 对象内容区位置大小
     */
    get frame() {
        return this.frameProxy.frame;
    }

    get relativeFrame() {
        return this.frameProxy._p_frame
    }

    /**
     * contentFrame+边框，对象实际显示的位置大小
     */
    get visibleFrame() {
        return this.frameProxy.visibleFrame;
    }

    get relativeVisibleFrame() {
        return this.frameProxy._p_visibleFrame;
    }

    /**
     * 包含被裁剪的对象
     */
    get outerFrame() {
        return this.frameProxy.outerFrame;
    }

    get relativeOuterFrame() {
        return this.frameProxy._p_outerFrame;
    }

    get x(): number {
        return this.transform.m02
    }

    get y(): number {
        return this.transform.m12
    }

    get clientX(): number {
        return this.frameProxy.clientX;
    }

    get clientY(): number {
        return this.frameProxy.clientY;
    }

    boundingBox(): ShapeFrame {
        return this.frameProxy.boundingBox();
    }

    transform: Transform;

    isNoTransform() {
        const { m00, m01, m10, m11 } = this.transform;
        return Math.abs(m00 - 1) < float_accuracy && Math.abs(m01) < float_accuracy && Math.abs(m10) < float_accuracy && Math.abs(m11 - 1) < float_accuracy;
    }

    matrix2Parent(matrix?: Transform) {
        const m = matrix2parent(this.transform, matrix);
        if (this.parent?.uniformScale) m.scale(this.parent.uniformScale);
        return m;
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

    get rotation(): number {
        return (this.transform).decomposeRotate() * 180 / Math.PI;
    }

    get fixedRadius() {
        return undefined;
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

    maskMap: Map<string, ShapeView> = new Map;

    updateMaskMap() {
    }

    get mask(): boolean {
        return !!this.m_data.mask;
    }

    get masked() {
        return this.parent?.maskMap?.get(this.data.id);
    }

    get varbinds() {
        return this.m_data.varbinds;
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

    get fillsMask(): string | undefined {
        const v = this._findOV(OverrideType.FillsMask, VariableType.FillsMask);
        return v ? v.value : this.m_data.style.fillsMask;
    }

    getFills(): BasicArray<Fill> {
        return this.cache.fills;
    }

    getBorder(): Border {
        return this.cache.border;
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

    getShadows(): BasicArray<Shadow> {
        return this.cache.shadows;
    }

    get blurMask(): string | undefined {
        const v = this._findOV(OverrideType.BlursMask, VariableType.BlursMask);
        return v ? v.value : this.m_data.style.blursMask;
    }

    get blur(): Blur | undefined {
        return this.cache.blur;
    }

    getPathStr() {
        return this.cache.pathStr;
    }

    getPath() {
        return this.cache.path;
    }

    get borderPath() {
        return this.cache.borderPath;
    }

    get borderPathBox() {
        return this.cache.borderPathBox;
    }

    get isVisible(): boolean {
        const v = this._findOV(OverrideType.Visible, VariableType.Visible);
        return v ? v.value : !!this.m_data.isVisible;
    }

    get isLocked(): boolean {
        const v = this._findOV(OverrideType.Lock, VariableType.Lock);
        return v ? v.value : !!this.m_data.isLocked;
    }

    indexOfChild(view: ShapeView) {
        return this.childs.indexOf(view)
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

    get radius(): number[] {
        return this.cache.radius;
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

    get prototypeInteractions(): BasicArray<PrototypeInteraction> | undefined {
        const v = this._findOVAll(OverrideType.ProtoInteractions, VariableType.ProtoInteractions);
        if (!v) {
            return this.m_data.prototypeInteractions;
        }
        // 需要做合并 合并vars
        const overrides = new BasicArray<PrototypeInteraction>();
        v.reverse().forEach(v => {
            const o = (v.value as BasicArray<PrototypeInteraction>).slice(0).reverse();
            o.forEach(o => {
                if (!overrides.find(o1 => o1.id === o.id)) overrides.push(o);
            })
        })
        overrides.reverse();

        const deleted = overrides.filter((v) => !!v.isDeleted);
        const inherit = this.m_data.prototypeInteractions || [];
        const ret = new BasicArray<PrototypeInteraction>();
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

    get isBorderShape() {
        return this.cache.isBorderShape;
    }

    get isCustomBorder() {
        return false;
    }

    get autoLayout(): AutoLayout | undefined {
        return undefined;
    }

    get frameMaskDisabled(): boolean | undefined {
        return undefined;
    }
}