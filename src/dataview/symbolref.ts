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
    AutoLayout, Border, ContextSettings, CornerRadius, Fill, MarkerType, OverrideType, PrototypeInterAction, Shadow,
    Shape, ShapeFrame, ShapeSize, SymbolRefShape, SymbolShape, SymbolUnionShape, Variable, VariableType, ShapeType,
    BasicArray, Blur,
    FillMask,
    ShadowMask,
    BorderMask,
    RadiusMask, BlurMask, SideType
} from "../data";
import { ShapeView, fixFrameByConstrain } from "./shape";
import { DataView, RootView } from "./view";
import { getShapeViewId } from "./basic";
import { DViewCtx, PropsType, VarsContainer } from "./viewctx";
import { findOverride, findVar } from "./basic";
import { objectId } from "../basic/objectid";
import { findOverrideAll } from "../data/utils";
import { isEqual } from "../basic/number_utils";
import { updateAutoLayout } from "../editor";
import { ArtboardView } from "./artboard";
import { RefViewCache } from "./proxy/cache/ref";

// 播放页组件状态切换会话存储refId的key值；
export const sessionRefIdKey = 'ref-id-cf76c6c6-beed-4c33-ae71-134ee876b990';

export class SymbolRefView extends ShapeView {

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.symwatcher = this.symwatcher.bind(this);
        this.loadsym();
        this.updateMaskMap();

        this.cache = new RefViewCache(this);
    }

    get uniformScale() {
        return this.data.uniformScale;
    }

    get isImageFill() {
        return false;
    }

    onMounted(): void {
        if (!this.m_sym) {
            super.onMounted();
            return;
        }
        this._layout(this.m_props.layoutSize, this.m_props.scale);
    }

    getDataChilds(): Shape[] {
        return this.m_sym ? this.m_sym.childs : [];
    }

    getRefId(): string {
        const swap_ref_id = this.getSessionRefId();
        if (swap_ref_id) {
            return swap_ref_id as string;
        }
        const v = this._findOV(OverrideType.SymbolID, VariableType.SymbolRef);
        return v ? v.value : (this.m_data as SymbolRefShape).refId;
    }

    getSessionRefId(): boolean | string {
        const jsonString = this.m_ctx.sessionStorage.get(sessionRefIdKey);
        if (!this.m_ctx.isDocument && jsonString) {
            const refIdArray = JSON.parse(jsonString);
            const maprefIdArray = new Map(refIdArray) as Map<string, string>;
            if (maprefIdArray.has(this.id)) {
                return maprefIdArray.get(this.id) || false;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    updateMaskMap() {
        const map = this.maskMap;
        map.clear();

        const children = this.getDataChilds();
        let mask: Shape | undefined = undefined;
        const maskShape: Shape[] = [];
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.mask) {
                mask = child;
                maskShape.push(child);
            } else {
                mask && map.set(child.id, mask);
            }
        }
        this.childs.forEach(c => {
            if (c.mask) return;
            c.m_ctx.setDirty(c);
        });
        maskShape.forEach(m => m.notify('rerender-mask'));
        this.notify('mask-env-change');
    }

    m_sym: SymbolShape | undefined;
    private m_union: SymbolShape | undefined;

    symwatcher(...args: any[]) {
        // todo
        this.m_ctx.setReLayout(this);
        super.onDataChange(...args);
    }

    findOverride(refId: string, type: OverrideType): Variable[] | undefined {
        const varsContainer = (this.varsContainer || []).concat(this.data);
        return findOverride(refId, type, varsContainer || []);
    }

    findVar(varId: string, ret: Variable[]) {            // todo subdata, proxy
        const varsContainer = (this.varsContainer || []).concat(this.data);
        findVar(varId, ret, varsContainer || []);
    }

    loadsym() {
        const symMgr = (this.m_data as SymbolRefShape).getSymbolMgr();
        if (!symMgr) return;
        const refId = this.getRefId();
        const sym = symMgr.get(refId);
        if (!sym) return;

        if (this.m_sym && objectId(this.m_sym) === objectId(sym)) return;

        // this.m_refId = refId;
        if (this.m_sym) this.m_sym.unwatch(this.symwatcher);
        this.m_sym = sym;
        if (this.m_sym) this.m_sym.watch(this.symwatcher);
        // union
        const union = this.m_sym?.parent instanceof SymbolUnionShape ? this.m_sym.parent : undefined;
        if (this.m_union?.id !== union?.id) {
            if (this.m_union) this.m_union.unwatch(this.symwatcher);
            this.m_union = union;
            if (this.m_union) this.m_union.watch(this.symwatcher);
        }
        this.m_pathstr = '';
        this.m_path = undefined;
        this.m_ctx.setReLayout(this);
    }

    onDestroy(): void {
        super.onDestroy();
        if (this.m_union) this.m_union.unwatch(this.symwatcher);
        if (this.m_sym) this.m_sym.unwatch(this.symwatcher);
    }

    private layoutChild(
        parentFrame: ShapeSize | undefined,
        child: Shape,
        idx: number,
        scale: { x: number, y: number } | undefined,
        varsContainer: VarsContainer | undefined,
        resue: Map<string, DataView>,
        rView: RootView | undefined
    ): boolean {
        let cdom: DataView | undefined = resue.get(child.id);
        const props = { data: child, scale, varsContainer, isVirtual: true, layoutSize: parentFrame };

        if (cdom) {
            const changed = this.moveChild(cdom, idx);
            cdom.layout(props);
            return changed;
        }

        cdom = rView && rView.getView(getShapeViewId(child.id, varsContainer));
        if (cdom) {
            // 将cdom移除再add到当前group
            const p = cdom.parent;
            if (p) p.removeChild(cdom);
            this.addChild(cdom, idx);
            cdom.layout(props);
            return true;
        }

        const comsMap = this.m_ctx.comsMap;
        const Com = comsMap.get(child.type) || comsMap.get(ShapeType.Rectangle)!;
        cdom = new Com(this.m_ctx, props) as DataView;
        this.addChild(cdom, idx);
        return true;
    }

    layout(props?: PropsType | undefined): void {
        const needLayout = this.m_ctx.removeReLayout(this); // remove from changeset
        if (props && !this.updateLayoutProps(props, needLayout)) return;

        this.m_ctx.setDirty(this);
        this.m_ctx.addNotifyLayout(this);

        this._layout(this.m_props.layoutSize, this.m_props.scale)
    }

    protected _layout(
        parentFrame: ShapeSize | undefined,
        _scale: { x: number; y: number; } | undefined
    ): void {
        const shape = this.data as SymbolRefShape;
        const transform = shape.transform.clone();
        if ((this.parent as ArtboardView)?.autoLayout) {
            transform.translateX = this.m_transform.translateX;
            transform.translateY = this.m_transform.translateY;
        }
        if (!this.m_sym) {
            this.updateLayoutArgs(transform, shape.frame, 0);
            this.removeChilds(0, this.m_children.length).forEach((c) => c.destroy());
            this.updateFrames();
            return;
        }
        const prescale = { x: _scale?.x ?? 1, y: _scale?.y ?? 1 }
        const scale = { x: prescale.x, y: prescale.y }

        const isCustomSize = this.isCustomSize
        const uniformScale = this.uniformScale
        // 计算自身大小
        let size = new ShapeSize();

        // 计算排版空间大小
        let layoutSize = new ShapeSize();
        // 调整过大小的，使用用户调整的大小，否则跟随symbol大小
        if (isCustomSize) {
            size.width = this.m_data.size.width
            size.height = this.m_data.size.height
        } else {
            size.width = this.m_sym.size.width
            size.height = this.m_sym.size.height
            if (uniformScale) {
                size.width *= uniformScale
                size.height *= uniformScale
            }
        }

        const autoLayout = this.autoLayout
        const selfframe = new ShapeFrame(0, 0, size.width, size.height)
        const childscale = { x: scale.x, y: scale.y } // 传递给子对象的缩放值
        // case 1 不需要变形
        if (isEqual(scale.x, 1) && isEqual(scale.y, 1)) {
            layoutSize.width = size.width
            layoutSize.height = size.height
            if (uniformScale) {
                // 放大layoutSize
                layoutSize.width /= uniformScale
                layoutSize.height /= uniformScale
            }
            childscale.x = layoutSize.width / this.m_sym.size.width;
            childscale.y = layoutSize.height / this.m_sym.size.height;
            // let frame = this.m_data.frame;
            this.updateLayoutArgs(transform, selfframe, 0);
            this.layoutChilds(layoutSize, childscale);
            if (autoLayout) this._autoLayout(autoLayout, layoutSize)
            this.updateFrames();
            return;
        }

        let scaleX = scale.x;
        let scaleY = scale.y;
        const resizingConstraint = shape.resizingConstraint ?? 0; // 默认值为靠左、靠顶、宽高固定
        if (parentFrame && resizingConstraint !== 0 && !autoLayout) {
            // 要调整下scale
            const _size = shape.size
            scaleX *= size.width / _size.width
            scaleY *= size.height / _size.height
            // 在parentFrame的排版空间内,根据缩放后的大小布局自己
            const { transform, targetWidth, targetHeight } = fixFrameByConstrain(shape, parentFrame, scaleX, scaleY);
            // 计算出自身大小
            selfframe.width = targetWidth
            selfframe.height = targetHeight
            this.updateLayoutArgs((transform), selfframe, this.fixedRadius);
        } else { // 没有约束
            const transform = shape.transform.clone();
            transform.scale(scaleX, scaleY);
            const __decompose_scale = transform.clearScaleSize();
            // 保持对象位置不变
            // virtual是整体缩放，位置是会变化的，不需要trans
            if (!this.m_isVirtual) transform.trans(transform.translateX - shape.transform.translateX, transform.translateY - shape.transform.translateY);

            if (this.parent && (this.parent as ArtboardView).autoLayout) {
                transform.translateX = this.m_transform.translateX;
                transform.translateY = this.m_transform.translateY;
            }

            selfframe.width = size.width * __decompose_scale.x
            selfframe.height = size.height * __decompose_scale.y

            this.updateLayoutArgs((transform), selfframe, this.fixedRadius);
        }
        layoutSize.width = selfframe.width
        layoutSize.height = selfframe.height
        if (uniformScale) {
            // 放大layoutSize
            layoutSize.width /= uniformScale
            layoutSize.height /= uniformScale
        }
        // 不对的
        // 重新计算 childscale
        childscale.x = layoutSize.width / this.m_sym.size.width;
        childscale.y = layoutSize.height / this.m_sym.size.height;
        this.layoutChilds(layoutSize, childscale);
        const childs = this.childs.filter(c => c.isVisible);
        if (autoLayout && childs.length && this.m_sym.autoLayout) this._autoLayout(autoLayout, layoutSize);
        this.updateFrames();
    }

    _autoLayout(autoLayout: AutoLayout, layoutSize: ShapeSize) {
        if (this instanceof SymbolRefView && !this.symData?.autoLayout) return;
        const childs = this.childs.filter(c => c.isVisible);
        const layout = updateAutoLayout(childs, autoLayout, layoutSize);
        let hidden = 0;
        for (let i = 0, len = this.childs.length; i < len; i++) {
            const cc = this.childs[i];
            const newTransform = cc.transform.clone();
            const index = Math.min(i - hidden, layout.length - 1);
            newTransform.translateX = layout[index].x;
            newTransform.translateY = layout[index].y;
            if (!cc.isVisible) {
                hidden += 1;
            }
            cc.m_ctx.setDirty(cc);
            cc.updateLayoutArgs(newTransform, cc.frame, cc.fixedRadius);
            cc.updateFrames();
        }
        const selfframe = new ShapeFrame(0, 0, layoutSize.width, layoutSize.height);
        this.updateLayoutArgs(this.transform, selfframe, this.fixedRadius);
    }

    protected layoutChilds(
        parentFrame: ShapeSize | undefined,
        scale?: { x: number, y: number }
    ): void {
        const varsContainer = (this.varsContainer || []).concat(this.m_data as SymbolRefShape);
        if (this.m_sym!.parent instanceof SymbolUnionShape) {
            varsContainer.push(this.m_sym!.parent);
        }
        varsContainer.push(this.m_sym!);

        const childs = this.getDataChilds();
        const resue: Map<string, DataView> = new Map();
        this.m_children.forEach((c) => resue.set(c.data.id, c));
        const rootView = this.getRootView();
        let changed = false;
        for (let i = 0, len = childs.length; i < len; i++) {
            const cc = childs[i];
            // update childs
            if (this.layoutChild(parentFrame, cc, i, scale, varsContainer, resue, rootView)) changed = true;
        }

        // 删除多余的
        if (this.m_children.length > childs.length) {
            const removes = this.removeChilds(childs.length, Number.MAX_VALUE);
            if (rootView) rootView.addDelayDestroy(removes);
            else removes.forEach((c => c.destroy()));
            changed = true;
        }

        if (changed) this.notify("childs");
    }

    _findOV2(ot: OverrideType, vt: VariableType): Variable | undefined {
        const data = this.data;
        const varsContainer = (this.varsContainer || []).concat(data);
        const id = ""; // ?
        const _vars = findOverride(id, ot, varsContainer);
        if (!_vars) return;
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === vt) {
            return _var;
        }
    }

    protected _findOV2All(ot: OverrideType, vt: VariableType): Variable[] | undefined {
        const data = this.data;
        const varsContainer = (this.varsContainer || []).concat(data);
        const id = ""; // ?
        return findOverrideAll(id, ot, varsContainer);
    }

    get bordersMask(): string | undefined {
        const v = this._findOV2(OverrideType.BordersMask, VariableType.BordersMask);
        return v ? v.value : this.m_sym?.style.bordersMask;
    }

    get borderFillsMask(): string | undefined {
        const v = this._findOV2(OverrideType.BorderFillsMask, VariableType.BorderFillsMask);
        return v ? v.value : this.m_sym?.style.borders.fillsMask;
    }

    get shadowsMask(): string | undefined {
        const v = this._findOV2(OverrideType.ShadowsMask, VariableType.ShadowsMask);
        return v ? v.value as string : this.m_sym?.style.shadowsMask;
    }

    get radiusMask(): string | undefined {
        const v = this._findOV2(OverrideType.RadiusMask, VariableType.RadiusMask);
        return v ? v.value : this.m_sym?.radiusMask;
    }

    get blurMask(): string | undefined {
        const v = this._findOV2(OverrideType.BlursMask, VariableType.BlursMask);
        return v ? v.value : this.m_sym?.style.blursMask;
    }

    get name() {
        const v = this._findOV2(OverrideType.Name, VariableType.Name);
        return v ? v.value as string : this.data.name;
    }

    render(): number {
        return this.m_renderer.render(this.type);
    }

    get startMarkerType(): MarkerType | undefined {
        const v = this._findOV2(OverrideType.StartMarkerType, VariableType.MarkerType);
        return v ? v.value : this.m_sym?.style.startMarkerType;
    }

    get endMarkerType(): MarkerType | undefined {
        const v = this._findOV2(OverrideType.EndMarkerType, VariableType.MarkerType);
        return v ? v.value : this.m_sym?.style.endMarkerType;
    }

    get cornerRadius(): CornerRadius | undefined {
        const v = this._findOV2(OverrideType.CornerRadius, VariableType.CornerRadius);
        if (v) return v.value;
        return this.m_sym?.cornerRadius;
    }

    get prototypeInterActions(): BasicArray<PrototypeInterAction> | undefined {
        // 三个合并
        const v = this._findOV2All(OverrideType.ProtoInteractions, VariableType.ProtoInteractions);
        if (!v) {
            return this.inheritPrototypeInterActions;
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
        const inherit = (this.inheritPrototypeInterActions || []) as BasicArray<PrototypeInterAction>;
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

    get inheritPrototypeInterActions(): BasicArray<PrototypeInterAction> | undefined {
        if (this.m_data.prototypeInteractions) {
            return this.m_data.prototypeInteractions.slice(0).concat(...(this.m_sym?.prototypeInteractions || [])) as BasicArray<PrototypeInterAction>
        }
        return this.m_sym?.prototypeInteractions;
    }

    get autoLayout(): AutoLayout | undefined {
        const v = this._findOV2(OverrideType.AutoLayout, VariableType.AutoLayout);
        if (v) return v.value;
        return this.m_sym?.autoLayout;
    }

    get frame4child() {
        return this.frame;
    }

    get contextSettings(): ContextSettings | undefined {
        const v = this._findOV2(OverrideType.ContextSettings, VariableType.ContextSettings);
        if (v) return v.value;
        return this.m_sym?.style.contextSettings;
    }

    get symData() {
        return this.m_sym;
    }

    get refId(): string {
        return this.getRefId();
    }

    get data() {
        return this.m_data as SymbolRefShape;
    }

    get variables() {
        return this.data.variables;
    }

    get overrides() {
        return this.data.overrides;
    }

    get isCustomSize() {
        return this.data.isCustomSize;
    }

    get frameMaskDisabled() {
        const v = this._findOV2(OverrideType.FrameMaskDisabled, VariableType.FrameMaskDisabled);
        if (v) return v.value;
        return this.m_sym?.frameMaskDisabled;
    }

    get isCustomBorder() {
        return this.getBorder().sideSetting.sideType !== SideType.Normal;
    }
}