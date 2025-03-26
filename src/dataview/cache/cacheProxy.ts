import { Path } from "@kcdesign/path";
import { OverrideType, ShapeFrame, VariableType } from "../../data/typesdefine";
import {
    BasicArray, Blur,
    BlurMask,
    Border,
    BorderMask, CurvePoint,
    Fill,
    FillMask,
    RadiusMask,
    RadiusType,
    Shadow,
    ShadowMask
} from "../../data";
import { ShapeView } from "../shape";
import { SymbolRefView } from "../symbolref";
import { ArtboardView } from "../artboard";
import { SymbolView } from "../symbol";
import { PathShapeView } from "../pathshape";

export class ViewCache {
    protected m_fills: BasicArray<Fill> | undefined;
    protected m_border: Border | undefined;
    protected m_path: Path | undefined;
    protected m_pathstr: string | undefined;
    protected m_is_border_shape: boolean | undefined;
    protected m_border_path: string | undefined;
    protected m_border_path_box: ShapeFrame | undefined;

    constructor(protected view: ShapeView) {
    }


    private __clearCacheByKey(key:
                                  'm_fills'
                                  | 'm_border'
                                  | 'm_path'
                                  | 'm_pathstr'
                                  | 'm_is_border_shape'
                                  | 'm_border_path'
                                  | 'm_border_path_box'
    ) {
        this[key] = undefined;
    }

    clearCacheByKey(keys: string[]) {
        keys.forEach((key: string) => this.__clearCacheByKey(key as any));
    }

    private _onFillMaskChange() {
        this.m_fills = undefined;
        this.view.m_ctx.setDirty(this.view);
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
            fills = mask.fills;
            this.watchFillMask(mask);
        } else {
            const v = this.view._findOV(OverrideType.Fills, VariableType.Fills);
            fills = v ? v.value : this.view.m_data.style.fills;
            this.unwatchFillMask();
        }

        return this.m_fills = fills;
    }

    private _onBorderMaskChange() {
        this.m_border = undefined;
        this.view.m_ctx.setDirty(this.view);
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
        this.view.m_ctx.setDirty(this.view);
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

    get border(): Border {
        if (this.m_border) return this.m_border;
        const mgr = this.view.style.getStylesMgr();
        if (!mgr) return this.m_border ?? this.view.m_data.style.borders;

        const v = this.view._findOV(OverrideType.Borders, VariableType.Borders);
        const border = v ? { ...v.value } : { ...this.view.m_data.style.borders };

        const bordersMask: string | undefined = this.view.bordersMask;
        if (bordersMask) {
            const mask = mgr.getSync(bordersMask) as BorderMask
            border.position = mask.border.position;
            border.sideSetting = mask.border.sideSetting;
            this.watchBorderMask(mask);
        } else {
            this.unwatchBorderMask();
        }

        const fillsMask: string | undefined = this.view.borderFillsMask;
        if (fillsMask) {
            const mask = mgr.getSync(fillsMask) as FillMask;
            border.strokePaints = mask.fills;
            this.watchBorderFillMask(mask);
        } else {
            this.unwatchBorderFillMask();
        }
        return this.m_border = border;
    }

    private _onRadiusMaskChange() {
        this.view.m_ctx.setDirty(this.view);
        this.view.onDataChange('radiusMask');
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
        this.view.m_ctx.setDirty(this.view);
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
            shadows = mask.shadows;
            this.watchShadowMask(mask);
        } else {
            const v = this.view._findOV(OverrideType.Shadows, VariableType.Shadows);
            shadows = v ? v.value : this.view.m_data.style.shadows;
            this.unwatchShadowMask()
        }
        return shadows;
    }

    private _onBlurMaskChange() {
        this.view.m_ctx.setDirty(this.view);
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
            blur = mask.blur;
            this.watchBlurMask(mask);
        } else {
            const v = this.view._findOV(OverrideType.Blur, VariableType.Blur);
            blur = v ? v.value : this.view.m_data.style.blur;
            this.unwatchBlurMask();
        }
        return blur;
    }
}

export class PathShapeViewCache extends ViewCache {
    constructor(protected view: PathShapeView) {
        super(view);
    }

    get radius(): number[] {
        let _radius: number[] = [];
        if (this.view.radiusMask) {
            const mgr = this.view.style.getStylesMgr()!;
            const mask = mgr.getSync(this.view.radiusMask) as RadiusMask;
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            let points: CurvePoint[] = [];
            this.view.segments.forEach(i => points = points.slice(0).concat(i.points as CurvePoint[]));
            const firstR = points[0]?.radius ?? 0;
            for (const p of points) {
                const radius = p.radius ?? 0;
                if (radius !== firstR && this.view.radiusType !== RadiusType.Rect) return _radius = [-1];
                if (this.view.radiusType === RadiusType.Rect) {
                    _radius.push(radius);
                } else {
                    _radius = [firstR ?? (this.view.fixedRadius ?? 0)];
                }
            }
            this.unwatchRadiusMask();
        }
        return _radius
    }
}

export class ArtboardViewCache extends ViewCache {
    constructor(protected view: ArtboardView) {
        super(view);
    }

    get radius(): number[] {
        let _radius: number[];
        if (this.view.radiusMask) {
            const mgr = this.view.style.getStylesMgr()!;
            const mask = mgr.getSync(this.view.radiusMask) as RadiusMask
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            _radius = [
                this.view.cornerRadius?.lt ?? 0,
                this.view.cornerRadius?.rt ?? 0,
                this.view.cornerRadius?.rb ?? 0,
                this.view.cornerRadius?.lb ?? 0,
            ]
            this.unwatchRadiusMask();
        }
        return _radius

    }
}

export class SymbolViewCache extends ViewCache {
    constructor(protected view: SymbolView) {
        super(view);
    }

    get radius(): number[] {
        let _radius: number[];
        if (this.view.radiusMask) {
            const mgr = this.view.style.getStylesMgr()!;
            const mask = mgr.getSync(this.view.radiusMask) as RadiusMask
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            _radius = [
                this.view.cornerRadius?.lt ?? 0,
                this.view.cornerRadius?.rt ?? 0,
                this.view.cornerRadius?.rb ?? 0,
                this.view.cornerRadius?.lb ?? 0,
            ]
            this.unwatchRadiusMask();
        }
        return _radius

    }
}

export class RefViewCache extends ViewCache {
    constructor(protected view: SymbolRefView) {
        super(view);
    }

    get fills(): BasicArray<Fill> {
        if (this.m_fills) return this.m_fills;

        let fills: BasicArray<Fill>;
        const fillsMask = this.view.fillsMask;
        const mgr = this.view.style.getStylesMgr() || this.view.m_sym?.style.getStylesMgr();
        if (fillsMask && mgr) {
            const mask = mgr.getSync(fillsMask) as FillMask;
            fills = mask.fills;
            this.watchFillMask(mask);
        } else {
            const v = this.view._findOV2(OverrideType.Fills, VariableType.Fills);
            fills = v ? v.value as BasicArray<Fill> : this.view.m_sym?.style.fills || new BasicArray();
            this.unwatchFillMask();
        }
        return this.m_fills = fills;
    }

    get border(): Border {
        if (this.m_border) return this.m_border;
        const v = this.view._findOV2(OverrideType.Borders, VariableType.Borders);
        const border = v ? { ...v.value } : { ...this.view.m_sym?.style.borders };
        const bordersMask = this.view.bordersMask;
        const mgr = this.view.style.getStylesMgr();
        if (bordersMask && mgr) {
            const mask = mgr.getSync(bordersMask) as BorderMask
            border.position = mask.border.position;
            border.sideSetting = mask.border.sideSetting;
            this.watchBorderMask(mask);
        } else {
            this.unwatchBorderMask();
        }
        const fillsMask: string | undefined = this.view.borderFillsMask;
        if (fillsMask && mgr) {
            const mask = mgr.getSync(fillsMask) as FillMask;
            border.strokePaints = mask.fills;
            this.watchBorderFillMask(mask);
        } else {
            this.unwatchBorderFillMask();
        }
        return border;
    }

    get radius(): number[] {
        let _radius: number[];
        const mgr = this.view.style.getStylesMgr() || this.view.m_sym?.style.getStylesMgr();
        if (this.view.radiusMask && mgr) {
            const mask = mgr.getSync(this.view.radiusMask) as RadiusMask
            _radius = [...mask.radius];
            this.watchRadiusMask(mask);
        } else {
            const corner = this.view.cornerRadius;
            _radius = [
                corner?.lt ?? 0,
                corner?.rt ?? 0,
                corner?.rb ?? 0,
                corner?.lb ?? 0,
            ]
            this.unwatchRadiusMask();
        }
        return _radius
    }

    get shadows(): BasicArray<Shadow> {
        let shadows: BasicArray<Shadow>;
        const shadowsMask = this.view.shadowsMask;
        const mgr = this.view.style.getStylesMgr() || this.view.m_sym?.style.getStylesMgr();
        if (shadowsMask && mgr) {
            const mask = mgr.getSync(shadowsMask) as ShadowMask;
            shadows = mask.shadows;
            this.watchShadowMask(mask);
        } else {
            const v = this.view._findOV2(OverrideType.Shadows, VariableType.Shadows);
            shadows = v ? v.value : this.view.m_sym?.style.shadows || new BasicArray();
            this.unwatchShadowMask()
        }
        return shadows;
    }

    get blur(): Blur | undefined {
        let blur: Blur;
        const blurMask = this.view.blurMask;
        const mgr = this.view.style.getStylesMgr() || this.view.m_sym?.style.getStylesMgr();
        if (blurMask && mgr) {
            const mask = mgr.getSync(blurMask) as BlurMask;
            blur = mask.blur;
            this.watchBlurMask(mask);
        } else {
            const v = this.view._findOV2(OverrideType.Blur, VariableType.Blur);
            blur = v ? v.value : this.view.m_sym?.style.blur;
            this.unwatchBlurMask()
        }
        return blur;
    }
}