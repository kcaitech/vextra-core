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
    BasicArray, Blur, BlurMask,
    Border,
    BorderMask, BorderSideSetting, CurveMode, CurvePoint,
    Fill,
    FillMask,
    OverrideType, parsePath,
    RadiusMask,
    RadiusType, Shadow, ShadowMask, ShapeFrame,
    SideType,
    VariableType
} from "../../../data";
import { ShapeView } from "../../shape";
import { Path } from "@kcaitech/path";

export class ViewCache {
    protected m_fills: BasicArray<Fill> | undefined;
    protected m_border: Border | undefined;
    protected m_path: Path | undefined;
    protected m_pathstr: string | undefined;

    constructor(protected view: ShapeView) {
    }

    private __clearCacheByKey(key: 'm_fills' | 'm_border') {
        this[key] = undefined;
    }

    clearCacheByKeys(keys: string[]) {
        keys.forEach((key: string) => this.__clearCacheByKey(key as any));
    }

    private _onFillMaskChange() {
        this.m_fills = undefined;
        this.view.ctx.setDirty(this.view);
        this.view.notify('style', 'fills', 'mask');
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

    get fills(): BasicArray<Fill> {
        if (this.m_fills) return this.m_fills;
        let fills: BasicArray<Fill>;

        const fillsMask: string | undefined = this.view.fillsMask;
        if (fillsMask) {
            const mask = this.view.style.getStylesMgr()!.getSync(fillsMask) as FillMask;
            if (!mask) return this.view.data.style.fills;
            fills = mask.fills;
            this.watchFillMask(mask);
        } else {
            const v = this.view._findOV(OverrideType.Fills, VariableType.Fills);
            fills = v ? v.value : this.view.data.style.fills;
            this.unwatchFillMask();
        }

        return this.m_fills = fills;
    }

    private _onBorderMaskChange() {
        this.m_border = undefined;
        this.view.ctx.setDirty(this.view);
        this.view.notify('style', 'border', 'mask');
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
        this.view.ctx.setDirty(this.view);
        this.view.notify('style', 'paints', 'mask');
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

    sideSettingOrDefault(sideSetting: BorderSideSetting): BorderSideSetting {
        return sideSetting ?? new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    }

    get border(): Border {
        if (this.m_border) return this.m_border;
        const mgr = this.view.style.getStylesMgr();

        const v = this.view._findOV(OverrideType.Borders, VariableType.Borders);
        const border = v ? { ...v.value } : { ...this.view.data.style.borders };
        border.sideSetting = this.sideSettingOrDefault(border.sideSetting);
        border.strokePaints = border.strokePaints ?? new BasicArray();
        if (!mgr) return this.m_border = border;
        const bordersMask: string | undefined = this.view.bordersMask;
        if (bordersMask) {
            const mask = mgr.getSync(bordersMask) as BorderMask
            if (mask) {
                border.position = mask.border.position;
                border.sideSetting = mask.border.sideSetting;
                this.watchBorderMask(mask);
            }
        } else {
            this.unwatchBorderMask();
        }

        const fillsMask: string | undefined = this.view.borderFillsMask;
        if (fillsMask) {
            const mask = mgr.getSync(fillsMask) as FillMask;
            if (!mask) {
                border.strokePaints = new BasicArray();
                return this.m_border = border;
            }
            border.strokePaints = mask.fills;
            this.watchBorderFillMask(mask);
        } else {
            this.unwatchBorderFillMask();
        }
        return this.m_border = border;
    }

    private _onRadiusMaskChange() {
        this.view.ctx.setDirty(this.view);
        this.view.onUpdate('radiusMask');
        this.view.notify('radiusMask');
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
        if (this.view.radiusMask) {
            const mgr = this.view.style.getStylesMgr()!;
            const mask = mgr.getSync(this.view.radiusMask) as RadiusMask
            if (!mask) return [this.view.fixedRadius ?? 0];
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            _radius = [this.view.fixedRadius ?? 0]
            if (this.view.radiusType === RadiusType.Rect && _radius.length === 1) {
                _radius = [_radius[0], _radius[0], _radius[0], _radius[0]];
            }
            this.unwatchRadiusMask();
        }
        return _radius
    }

    private _onShadowMaskChange() {
        this.view.ctx.setDirty(this.view);
        this.view.notify('style', 'shadows', 'mask');
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

    get shadows(): BasicArray<Shadow> {
        let shadows: BasicArray<Shadow> = new BasicArray();
        if (this.view.shadowsMask) {
            const mgr = this.view.style.getStylesMgr();
            if (!mgr) return shadows;
            const mask = mgr.getSync(this.view.shadowsMask) as ShadowMask;
            if (!mask) return this.view.data.style.shadows;
            shadows = mask.shadows;
            this.watchShadowMask(mask);
        } else {
            const v = this.view._findOV(OverrideType.Shadows, VariableType.Shadows);
            shadows = v ? v.value : this.view.data.style.shadows;
            this.unwatchShadowMask()
        }
        return shadows;
    }

    private _onBlurMaskChange() {
        this.view.ctx.setDirty(this.view);
        this.view.notify('style', 'blur', 'mask');
    }

    private m_unbind_blur: undefined | (() => void) = undefined;
    private onBlurMaskChange = this._onBlurMaskChange.bind(this);

    protected watchBlurMask(mask: BlurMask) {
        this.m_unbind_blur?.();
        this.m_unbind_blur = mask.watch(this.onBlurMaskChange);
    }

    protected unwatchBlurMask() {
        this.m_unbind_blur?.();
    }

    get blur(): Blur | undefined {
        let blur: Blur;
        if (this.view.blurMask) {
            const mgr = this.view.style.getStylesMgr()!;
            const mask = mgr.getSync(this.view.blurMask) as BlurMask
            if (!mask) return this.view.data.style.blur;
            blur = mask.blur;
            this.watchBlurMask(mask);
        } else {
            const v = this.view._findOV(OverrideType.Blur, VariableType.Blur);
            blur = v ? v.value : this.view.data.style.blur;
            this.unwatchBlurMask();
        }
        return blur;
    }

    get pathStr() {
        if (this.m_pathstr) return this.m_pathstr;
        this.m_pathstr = this.path.toString();
        return this.m_pathstr;
    }

    get path() {
        if (this.m_path) return this.m_path;
        this.m_path = this.getPathOfSize();
        const frame = this.view.frame;
        if (frame.x || frame.y) this.m_path.translate(frame.x, frame.y);
        this.m_path.freeze();
        return this.m_path;
    }

    get borderPathBox() {
        return new ShapeFrame(0, 0, 1, 1);
    }

    get borderPath() {
        return new Path();
    }

    get isBorderShape() {
        return false;
    }

    protected getPathOfSize() {
        const p1 = new CurvePoint([] as any, '', 0, 0, CurveMode.Straight);
        const p2 = new CurvePoint([] as any, '', 1, 0, CurveMode.Straight);
        const p3 = new CurvePoint([] as any, '', 1, 1, CurveMode.Straight);
        const p4 = new CurvePoint([] as any, '', 0, 1, CurveMode.Straight);
        const radius = this.radius;
        p1.radius = radius[0];
        p2.radius = radius[1] ?? radius[0];
        p3.radius = radius[2] ?? radius[0];
        p4.radius = radius[3] ?? radius[0];
        return parsePath([p1, p2, p3, p4], true, this.view.frame.width, this.view.frame.height);
    }
}
