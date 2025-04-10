import { SymbolRefView } from "../../symbolref";
import {
    BasicArray, Blur, BlurMask,
    Border,
    BorderMask, CurveMode, CurvePoint,
    Fill,
    FillMask,
    OverrideType, parsePath,
    RadiusMask,
    Shadow, ShadowMask,
    VariableType
} from "../../../data";
import { ViewCache } from "./view";

export class RefViewCache extends ViewCache {
    constructor(protected view: SymbolRefView) {
        super(view);
    }

    protected getPathOfSize() {
        const p1 = new CurvePoint([] as any, '', 0, 0, CurveMode.Straight);
        const p2 = new CurvePoint([] as any, '', 1, 0, CurveMode.Straight);
        const p3 = new CurvePoint([] as any, '', 1, 1, CurveMode.Straight);
        const p4 = new CurvePoint([] as any, '', 0, 1, CurveMode.Straight);
        let radius = this.radius;
        if (this.view.uniformScale) {
            radius = radius.map(i => i * this.view.uniformScale!);
        }
        p1.radius = radius[0];
        p2.radius = radius[1] ?? radius[0];
        p3.radius = radius[2] ?? radius[0];
        p4.radius = radius[3] ?? radius[0];
        return parsePath([p1, p2, p3, p4], true, this.view.frame.width, this.view.frame.height);
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