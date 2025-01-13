import * as classes from "./baseclasses"
import {
    BlendMode,
    BlurType,
    BorderOptions,
    BorderPosition,
    BorderSideSetting,
    BorderStyle,
    ColorControls,
    ContactRole,
    ContextSettings,
    CornerRadius,
    CornerType,
    Crdtidx,
    FillRule,
    FillType,
    GradientType,
    MarkerType,
    PaintFilter,
    PatternTransform,
    Point2D,
    Shadow,
    Stop,
    VariableType,
    WindingRule,
    SideType,
} from "./baseclasses";
import { Basic, BasicArray, BasicMap, ResourceMgr } from "./basic";
import { Variable } from "./variable";
import { Color } from "./color";
import { ShapeView } from "../dataview";
import { StyleSheet_variables } from "./typesdefine";
import { v4 } from "uuid";
import { cloneGradient } from "../io/cilpboard";

export {
    GradientType,
    BlendMode,
    FillType,
    BorderPosition,
    BlurType,
    BorderOptions,
    MarkerType,
    WindingRule,
    ExportFileFormat,
    ExportFormatNameingScheme,
    LineCapStyle,
    LineJoinStyle,
    ExportVisibleScaleType,
    ColorControls,
    Stop,
    ContextSettings,
    Shadow,
    GraphicsContextSettings,
    BorderStyle,
    ContactForm,
    ContactType,
    ContactRole,
    ContactRoleType,
    ShadowPosition,
    CornerType,
    BorderSideSetting,
    SideType,
    PatternTransform,
    ImageScaleMode,
    PaintFilter,
    PaintFilterType,
} from "./baseclasses"

export class Gradient extends Basic implements classes.Gradient {
    typeId = 'gradient'
    elipseLength?: number
    from: Point2D
    to: Point2D
    stops: BasicArray<Stop>
    gradientType: GradientType
    gradientOpacity?: number;

    constructor(
        from: Point2D,
        to: Point2D,
        gradientType: GradientType,
        stops: BasicArray<Stop>,
        elipseLength?: number,
        gradientOpacity?: number
    ) {
        super()
        this.from = from
        this.to = to
        this.gradientType = gradientType
        this.stops = stops
        this.elipseLength = elipseLength
        this.gradientOpacity = gradientOpacity
    }
}

export class Border extends Basic implements classes.Border {
    typeId = 'border'
    position: BorderPosition
    borderStyle: BorderStyle
    cornerType: CornerType
    sideSetting: BorderSideSetting
    strokePaints: BasicArray<StrokePaint>
    fillsMask?: string

    constructor(
        position: BorderPosition,
        borderStyle: BorderStyle,
        cornerType: CornerType,
        sideSetting: BorderSideSetting,
        strokePaints: BasicArray<StrokePaint>
    ) {
        super()
        this.position = position
        this.borderStyle = borderStyle
        this.cornerType = cornerType
        this.sideSetting = sideSetting
        this.strokePaints = strokePaints
    }
}

export class BorderMaskType extends Basic implements classes.BorderMaskType {
    typeId = 'border-mask-type'
    position: BorderPosition
    sideSetting: BorderSideSetting

    constructor(
        position: BorderPosition,
        sideSetting: BorderSideSetting,
    ) {
        super()
        this.position = position
        this.sideSetting = sideSetting
    }
}

export class StrokePaint extends Basic implements classes.StrokePaint {
    typeId = 'stroke-paint'
    crdtidx: BasicArray<number>
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    gradient?: Gradient
    imageRef?: string
    imageScaleMode?: classes.ImageScaleMode
    rotation?: number
    scale?: number
    originalImageWidth?: number
    originalImageHeight?: number
    paintFilter?: classes.PaintFilter
    transform?: classes.PatternTransform
    colorMask?: string

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __cacheData?: { media: { buff: Uint8Array, base64: string }, ref: string };

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color,
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
    }

    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }

    getImageMgr(): ResourceMgr<{ buff: Uint8Array, base64: string }> | undefined {
        return this.__imageMgr;
    }

    async loadImage(): Promise<string> {
        if (this.__cacheData) return this.__cacheData.media.base64;
        if (!this.imageRef) return "";
        const mediaMgr = this.__imageMgr;
        const val = mediaMgr && await mediaMgr.get(this.imageRef);
        if (val) {
            this.__cacheData = { media: val, ref: this.imageRef }
            this.notify();
        }
        return this.__cacheData && this.__cacheData.media.base64 || "";
    }
}



export class Fill extends Basic implements classes.Fill {
    typeId = 'fill'
    crdtidx: BasicArray<number>
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings?: ContextSettings
    gradient?: Gradient
    imageRef?: string
    fillRule?: FillRule
    imageScaleMode?: classes.ImageScaleMode
    rotation?: number
    scale?: number
    originalImageWidth?: number
    originalImageHeight?: number
    paintFilter?: classes.PaintFilter
    transform?: classes.PatternTransform
    colorMask?: string
    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __cacheData?: { media: { buff: Uint8Array, base64: string }, ref: string };

    private __styleMgr?: ResourceMgr<StyleMangerMember>;

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
    }

    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }

    getImageMgr(): ResourceMgr<{ buff: Uint8Array, base64: string }> | undefined {
        return this.__imageMgr;
    }

    setStylesMgr(styleMgr: ResourceMgr<StyleMangerMember>) {
        this.__styleMgr = styleMgr;
    }

    getStylesMgr(): ResourceMgr<StyleMangerMember> | undefined {
        return this.__styleMgr;
    }

    private __startLoad: boolean = false;

    peekImage(startLoad: boolean = false) {
        if (this.__cacheData?.ref === this.imageRef) return this.__cacheData?.media.base64;
        if (!this.imageRef) return "";
        if (startLoad && !this.__startLoad) {
            this.__startLoad = true;
            const origin = !!this.__cacheData?.media;
            const mediaMgr = this.__imageMgr;
            mediaMgr && mediaMgr
                .get(this.imageRef)
                .then((val) => {
                    if (val) this.__cacheData = { media: val, ref: this.imageRef! };
                    else this.__cacheData = { media: { base64: '', buff: new Uint8Array() }, ref: this.imageRef! };
                })
                .finally(() => {
                    this.__startLoad = false;
                    if (origin !== !!this.__cacheData?.media) this.notify('image-reload');
                    return this.__cacheData?.media.base64;
                })
        }
    }

    reloadImage() {
        this.__cacheData = undefined;
        this.peekImage();
    }

    // image fill
    async loadImage(): Promise<string> {
        if (this.__cacheData) return this.__cacheData.media.base64;
        if (!this.imageRef) return "";
        const mediaMgr = this.__imageMgr;
        const val = mediaMgr && await mediaMgr.get(this.imageRef);
        if (val) {
            this.__cacheData = { media: val, ref: this.imageRef }
            this.notify();
        }
        return this.__cacheData && this.__cacheData.media.base64 || "";
    }

    private __is_editing_image: boolean = false;

    startEditImage(v: boolean) {
        this.__is_editing_image = v;
        this.notify();
    }

    get isEditingImage() {
        return this.__is_editing_image;
    }
}

export class Style extends Basic implements classes.Style {

    static DefaultWindingRule = WindingRule.EvenOdd;

    typeId = 'style'
    miterLimit?: number
    windingRule?: WindingRule
    blur?: Blur
    borderOptions?: BorderOptions
    borders: Border
    colorControls?: ColorControls
    contextSettings?: ContextSettings
    fills: BasicArray<Fill>
    innerShadows?: BasicArray<Shadow>
    shadows: BasicArray<Shadow>
    contacts?: BasicArray<ContactRole>
    startMarkerType?: MarkerType
    endMarkerType?: MarkerType
    varbinds?: BasicMap<string, string>
    fillsMask?: string
    shadowsMask?: string
    blursMask?: string
    bordersMask?: string

    private __styleMgr?: ResourceMgr<StyleMangerMember>;

    constructor(
        fills: BasicArray<Fill>,
        shadows: BasicArray<Shadow>,
        border: Border
    ) {
        super()
        this.fills = fills
        this.shadows = shadows
        this.borders = border
    }

    setStylesMgr(styleMgr: ResourceMgr<StyleMangerMember>) {
        this.__styleMgr = styleMgr;
    }

    getStylesMgr(): ResourceMgr<StyleMangerMember> | undefined {
        return this.__styleMgr;
    }

    getOpTarget(path: string[]) {
        const path0 = path[0];
        if (path0 === 'contacts' && !this.contacts) this.contacts = new BasicArray<ContactRole>();
        if (path0 === 'contextSettings' && !this.contextSettings) this.contextSettings = new ContextSettings(BlendMode.Normal, 1)
        return super.getOpTarget(path);
    }

    private findVar(varId: string, ret: Variable[]): boolean {
        return !!(this.__parent as any)?.findVar(varId, ret);
    }

    getFills(): BasicArray<Fill> {
        if (!this.varbinds) return this.fills;

        const fillsVar = this.varbinds.get(classes.OverrideType.Fills);
        if (!fillsVar) return this.fills;

        const _vars: Variable[] = [];
        this.findVar(fillsVar, _vars);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.Fills) {
            return _var.value;
        }
        return this.fills;
    }

    getBorders(): Border {
        if (!this.varbinds) return this.borders;

        const bordersVar = this.varbinds.get(classes.OverrideType.Borders);
        if (!bordersVar) return this.borders;

        const _vars: Variable[] = [];
        this.findVar(bordersVar, _vars);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.Borders) {
            return _var.value;
        }
        return this.borders;
    }
}

export class Blur extends Basic implements classes.Blur {
    typeId = 'blur'
    crdtidx: BasicArray<number>
    isEnabled: boolean
    center: Point2D
    motionAngle?: number
    radius?: number
    saturation: number
    type: BlurType
    mask?: string

    constructor(
        crdtidx: BasicArray<number>,
        isEnabled: boolean,
        center: Point2D,
        saturation: number,
        type: BlurType,
        motionAngle?: number,
        radius?: number
    ) {
        super()
        this.crdtidx = crdtidx
        this.isEnabled = isEnabled
        this.center = center
        this.saturation = saturation
        this.type = type
        this.motionAngle = motionAngle
        this.radius = radius
    }
}

/**
 * @description 样式库管理器数据组成
 */
export type StyleMangerMember = FillMask | ShadowMask | BlurMask | BorderMask;

export class StyleSheet extends Basic implements classes.StyleSheet {
    typeId = "style-sheet"
    id: string
    name: string
    variables: BasicArray<StyleMangerMember>

    constructor(id: string, name: string, variables: StyleSheet_variables) {
        super();
        this.id = id;
        this.name = name;
        this.variables = this.transform2notifiable(id, variables);
    }

    private transform2notifiable(sheetId: string, variables: StyleSheet_variables) {
        const notifiable_variables = new BasicArray<StyleMangerMember>();
        for (const v of variables) {
            if (v instanceof classes.FillMask) {
                const fills = new BasicArray<Fill>();
                v.fills.forEach(s => {
                    const { crdtidx, id, isEnabled, fillType, color, contextSettings, imageRef, imageScaleMode, rotation, scale, originalImageWidth, originalImageHeight, paintFilter, transform } = s;
                    const new_fill = new Fill(crdtidx, id, isEnabled, fillType, new Color(color.alpha, color.red, color.green, color.blue))
                    if (s.gradient) {
                        new_fill.gradient = cloneGradient(s.gradient);
                    }
                    new_fill.imageRef = imageRef;
                    new_fill.imageScaleMode = imageScaleMode;
                    new_fill.rotation = rotation;
                    new_fill.scale = scale;
                    new_fill.originalImageWidth = originalImageWidth;
                    new_fill.originalImageHeight = originalImageHeight;
                    new_fill.originalImageHeight = originalImageHeight;
                    if (paintFilter) {
                        new_fill.paintFilter = new PaintFilter(paintFilter.exposure, paintFilter.contrast, paintFilter.saturation, paintFilter.temperature, paintFilter.tint, paintFilter.shadow, paintFilter.hue);
                    }
                    if (transform) {
                        new_fill.transform = new PatternTransform(transform.m00, transform.m01, transform.m02, transform.m10, transform.m11, transform.m12);
                    }
                    s.contextSettings = contextSettings;
                    fills.push(new_fill)
                })
                const fillMask = new FillMask(v.crdtidx, sheetId, v4(), v.name, v.description, fills);
                notifiable_variables.push(fillMask);
            } else if (v instanceof classes.ShadowMask) {
                const shadows = new BasicArray<Shadow>();
                v.shadows.forEach(i => {
                    const { crdtidx, id, isEnabled, blurRadius, color, offsetX, offsetY, spread, position, contextSettings } = i
                    const new_shadow = new Shadow(crdtidx, id, isEnabled, blurRadius, new Color(color.alpha, color.red, color.green, color.blue), offsetX, offsetY, spread, position)
                    new_shadow.contextSettings = contextSettings
                    shadows.push(new_shadow)
                })
                const shadowMask = new ShadowMask(v.crdtidx, sheetId, v4(), v.name, v.description, shadows);
                notifiable_variables.push(shadowMask);
            } else if (v instanceof classes.BlurMask) {
                const { crdtidx, isEnabled, center, saturation, type } = v.blur;
                const blur = new Blur(crdtidx, isEnabled, center, saturation, type);
                blur.motionAngle = v.blur.motionAngle;
                blur.radius = v.blur.radius;
                blur.mask = v.blur.mask;
                const blurmask = new BlurMask(v.crdtidx, sheetId, v4(), v.name, v.description, blur);
                notifiable_variables.push(blurmask);
            } else if (v instanceof classes.BorderMask) {
                const { position, sideSetting } = v.border;
                const side = new BorderSideSetting(sideSetting.sideType, sideSetting.thicknessTop, sideSetting.thicknessLeft, sideSetting.thicknessBottom, sideSetting.thicknessRight);
                const border = new BorderMaskType(position, side);
                const borderMask = new BorderMask(v.crdtidx,sheetId, v4(), v.name, v.description, border);
                notifiable_variables.push(borderMask);
            }
            // 还有其他的一些类型
        }
        return notifiable_variables;
    }
}

interface Mask {
    sheet: string;                          // 所属样式表
    __subscribers: Set<ShapeView>;            // 被当前变量遮盖的对象集合
    add: (view: ShapeView) => () => void;   // 添加遮盖对象
    notify: (...args: any[]) => void;       // 当前变量改变，通知所有被遮盖的对象更新试图
}

export class FillMask extends Basic implements Mask, classes.FillMask {
    typeId = 'fill-mask-living';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    __subscribers: Set<ShapeView>;
    name: string;
    description: string;
    fills: BasicArray<Fill>

    constructor(crdtidx: BasicArray<number>, sheet: string, id: string, name: string, description: string, fills: BasicArray<Fill>) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.sheet = sheet;
        this.__subscribers = new Set<ShapeView>();
        this.name = name;
        this.description = description;
        this.fills = fills;
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", "fill", ...args);
        this.__subscribers.forEach(view => {
            if (view.isDistroyed) return;
            view.m_ctx.setDirty(view); // 将view设置为脏节点之后，下一帧会被更新
        })
    }

    add(view: ShapeView) {
        this.__subscribers.add(view);
        return () => {
            this.__subscribers.delete(view)
        }
    }
}

export class ShadowMask extends Basic implements Mask, classes.ShadowMask {
    typeId = 'shadow-mask-living';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    __subscribers: Set<ShapeView>;
    name: string;
    description: string;
    shadows: BasicArray<Shadow>;

    constructor(crdtidx: BasicArray<number>, sheet: string, id: string, name: string, description: string, shadows: BasicArray<Shadow>) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.sheet = sheet;
        this.__subscribers = new Set<ShapeView>();
        this.name = name;
        this.description = description;
        this.shadows = shadows;
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", "shadow", ...args);
        this.__subscribers.forEach(view => {
            if (view.isDistroyed) return;
            view.m_ctx.setDirty(view); // 将view设置为脏节点之后，下一帧会被更新
        })
    }

    add(view: ShapeView) {
        this.__subscribers.add(view);
        return () => {
            this.__subscribers.delete(view)
        }
    }
}

export class BlurMask extends Basic implements Mask, classes.BlurMask {
    typeId = 'blur-mask-living';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    __subscribers: Set<ShapeView>;
    name: string;
    description: string;
    blur: Blur;

    constructor(crdtidx: BasicArray<number>, sheet: string, id: string, name: string, description: string, blur: Blur) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.sheet = sheet;
        this.__subscribers = new Set<ShapeView>();
        this.name = name;
        this.description = description;
        this.blur = blur;
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", "blur", ...args);
        this.__subscribers.forEach(view => {
            if (view.isDistroyed) return;
            view.m_ctx.setDirty(view); // 将view设置为脏节点之后，下一帧会被更新
        })
    }

    add(view: ShapeView) {
        this.__subscribers.add(view);
        return () => {
            this.__subscribers.delete(view)
        }
    }
}

export class BorderMask extends Basic implements Mask, classes.BorderMask {
    typeId = 'border-mask-living';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    __subscribers: Set<ShapeView>;
    name: string;
    description: string;
    border: BorderMaskType;

    constructor(crdtidx: BasicArray<number>,sheet: string, id: string, name: string, description: string, border: BorderMaskType) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.sheet = sheet;
        this.__subscribers = new Set<ShapeView>();
        this.name = name;
        this.description = description;
        this.border = border;
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", "border", ...args);
        this.__subscribers.forEach(view => {
            if (view.isDistroyed) return;
            view.m_ctx.setDirty(view); // 将view设置为脏节点之后，下一帧会被更新
        })
    }

    add(view: ShapeView) {
        this.__subscribers.add(view);
        return () => {
            this.__subscribers.delete(view)
        }
    }
}

export class CornerRadiusMask extends CornerRadius implements Mask {
    sheet: string;
    __subscribers: Set<ShapeView>;

    constructor(id: string, sheet: string, crdtidx: Crdtidx, lt: number = 0, rt: number = 0, lb: number = 0, rb: number = 0) {
        super(id, crdtidx, lt, rt, lb, rb);
        this.sheet = sheet;
        this.__subscribers = new Set<ShapeView>();
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", "corner-radius", ...args);
        this.__subscribers.forEach(view => {
            if (view.isDistroyed) return;
            view.m_ctx.setDirty(view);
        })
    }

    add(view: ShapeView) {
        this.__subscribers.add(view);
        return () => {
            this.__subscribers.delete(view)
        }
    }
}