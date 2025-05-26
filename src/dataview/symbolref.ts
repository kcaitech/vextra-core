/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    AutoLayout, ContextSettings, CornerRadius, MarkerType, OverrideType, PrototypeInteraction,
    Shape, SymbolRefShape, SymbolShape, SymbolUnionShape, Variable, VariableType,
    BasicArray, SideType
} from "../data";
import { ShapeView } from "./shape";
import { DViewCtx, PropsType } from "./viewctx";
import { findOverride, findVar } from "./basic";
import { objectId } from "../basic/objectid";
import { findOverrideAll } from "../data/utils";
import { RefViewCache } from "./proxy/cache/ref";
import { RefLayout } from "./proxy/layout/ref";
import { RefViewModifyEffect } from "./proxy/effects/ref";

// 播放页组件状态切换会话存储refId的key值；
export const sessionRefIdKey = 'ref-id-cf76c6c6-beed-4c33-ae71-134ee876b990';

export class SymbolRefView extends ShapeView {

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.symwatcher = this.symwatcher.bind(this);
        this.loadsym();
        this.updateMaskMap();

        this.cache = new RefViewCache(this);
        this.layoutProxy = new RefLayout(this);
        this.effect = new RefViewModifyEffect(this);
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
        this.layoutProxy.measure(this.m_props.layoutSize, this.m_props.scale);
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
            const mapRefIdArray = new Map(refIdArray) as Map<string, string>;
            if (mapRefIdArray.has(this.id)) {
                return mapRefIdArray.get(this.id) || false;
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

        const children = this.childs;
        let mask: ShapeView | undefined = undefined;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.mask) {
                mask = child;
            } else {
                mask && map.set(child.id, mask);
            }
        }

        this.notify('mask-env-change');
    }

    m_sym: SymbolShape | undefined;
    private m_union: SymbolShape | undefined;

    symwatcher(...args: any[]) {
        // todo
        this.m_ctx.setReLayout(this);
        super.onUpdate(...args);
    }

    findOverride(refId: string, type: OverrideType): Variable[] | undefined {
        const varsContainer = (this.varsContainer || []).concat(this.data);
        return findOverride(refId, type, varsContainer || []);
    }

    findVar(varId: string, ret: Variable[]) {            // todo sub data, proxy
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
        this.cache.clearCacheByKeys(['m_pathstr', 'm_path']);
        this.m_ctx.setReLayout(this);
    }

    onDestroy(): void {
        super.onDestroy();
        if (this.m_union) this.m_union.unwatch(this.symwatcher);
        if (this.m_sym) this.m_sym.unwatch(this.symwatcher);
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
        return this.m_renderer.render();
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

    get prototypeInteractions(): BasicArray<PrototypeInteraction> | undefined {
        // 三个合并
        const v = this._findOV2All(OverrideType.ProtoInteractions, VariableType.ProtoInteractions);
        if (!v) {
            return this.inheritPrototypeInterActions;
        }
        // 需要做合并
        // 合并vars
        const overrides = new BasicArray<PrototypeInteraction>();
        v.reverse().forEach(v => {
            const o = (v.value as BasicArray<PrototypeInteraction>).slice(0).reverse();
            o.forEach(o => {
                if (!overrides.find(o1 => o1.id === o.id)) overrides.push(o);
            })
        })
        overrides.reverse();

        const deleted = overrides.filter((v) => !!v.isDeleted);
        const inherit = (this.inheritPrototypeInterActions || []) as BasicArray<PrototypeInteraction>;
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

    get inheritPrototypeInterActions(): BasicArray<PrototypeInteraction> | undefined {
        if (this.m_data.prototypeInteractions) {
            return this.m_data.prototypeInteractions.slice(0).concat(...(this.m_sym?.prototypeInteractions || [])) as BasicArray<PrototypeInteraction>
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