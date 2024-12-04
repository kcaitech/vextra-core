import * as classes from "./baseclasses"
import {
    BorderOptions,
    ColorControls,
    ContextSettings,
    Shadow,
    WindingRule,
    FillType,
    BorderPosition,
    BorderStyle,
    MarkerType,
    ContactRole,
    VariableType,
    Point2D,
    GradientType,
    Stop,
    BlendMode,
    FillRule,
    CornerType,
    BorderSideSetting,
    BlurType, CornerRadius, Crdtidx,
    PaintFilter,
    PatternTransform,
} from "./baseclasses";
import { Basic, BasicArray, BasicMap, ResourceMgr } from "./basic";
import { Variable } from "./variable";
import { Color } from "./color";
import { ShapeView } from "../dataview";
import { StyleSheet_variables } from "./typesdefine";
import { v4 } from "uuid";
import { cloneGradient } from "src/io/cilpboard";

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
    PaintFilterType
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
    crdtidx: BasicArray<number>
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings?: ContextSettings
    position: BorderPosition
    thickness: number
    gradient?: Gradient
    borderStyle: BorderStyle
    cornerType: CornerType
    sideSetting: BorderSideSetting
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
        position: BorderPosition,
        thickness: number,
        borderStyle: BorderStyle,
        cornerType: CornerType,
        sideSetting: BorderSideSetting
    ) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
        this.position = position
        this.thickness = thickness
        this.borderStyle = borderStyle
        this.cornerType = cornerType
        this.sideSetting = sideSetting
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
    borders: BasicArray<Border>
    colorControls?: ColorControls
    contextSettings?: ContextSettings
    fills: BasicArray<Fill>
    innerShadows?: BasicArray<Shadow>
    shadows: BasicArray<Shadow>
    contacts?: BasicArray<ContactRole> // todo
    startMarkerType?: MarkerType
    endMarkerType?: MarkerType
    varbinds?: BasicMap<string, string>
    fillsMask?: string

    private __styleMgr?: ResourceMgr<StyleMangerMember>;

    constructor(
        borders: BasicArray<Border>,
        fills: BasicArray<Fill>,
        shadows: BasicArray<Shadow>,
    ) {
        super()
        this.borders = borders
        this.fills = fills
        this.shadows = shadows
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

    getBorders(): BasicArray<Border> {
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
export type StyleMangerMember = FillMask | CornerRadiusMask;

export class StyleSheet extends Basic implements classes.StyleSheet {
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
                        const _g = cloneGradient(s.gradient);
                        new_fill.gradient = _g;
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
            } else if (v instanceof classes.CornerRadius) {
                const radiusMask = new CornerRadiusMask(v4(), sheetId, v.crdtidx, v.lt, v.rt, v.lb, v.lb);
                notifiable_variables.push(radiusMask);
            }
            // 还有其他的一些类型
        }
        return notifiable_variables;
    }
}

interface Mask {
    sheet: string;                          // 所属样式表
    subscribers: Set<ShapeView>;            // 被当前变量遮盖的对象集合
    add: (view: ShapeView) => () => void;   // 添加遮盖对象
    notify: (...args: any[]) => void;       // 当前变量改变，通知所有被遮盖的对象更新试图
}

export class FillMask extends Basic implements Mask, classes.FillMask {
    typeId = 'fill-mask';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    subscribers: Set<ShapeView>;
    name: string;
    description: string;
    fills: BasicArray<Fill>

    constructor(crdtidx: BasicArray<number>, sheet: string, id: string, name: string, description: string, fills: BasicArray<Fill>) {
        super()
        this.crdtidx = crdtidx
        this.id = id
        this.sheet = sheet;
        this.subscribers = new Set<ShapeView>();
        this.name = name;
        this.description = description
        this.fills = fills
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", "fill", ...args);
        this.subscribers.forEach(view => {
            if (view.isDistroyed) return;
            view.m_ctx.setDirty(view); // 将view设置为脏节点之后，下一帧会被更新
        })
    }

    add(view: ShapeView) {
        this.subscribers.add(view);
        return () => {
            this.subscribers.delete(view)
        }
    }
}

export class CornerRadiusMask extends CornerRadius implements Mask {
    sheet: string;
    subscribers: Set<ShapeView>;

    constructor(id: string, sheet: string, crdtidx: Crdtidx, lt: number = 0, rt: number = 0, lb: number = 0, rb: number = 0) {
        super(id, crdtidx, lt, rt, lb, rb);
        this.sheet = sheet;
        this.subscribers = new Set<ShapeView>();
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", "corner-radius", ...args);
        this.subscribers.forEach(view => {
            if (view.isDistroyed) return;
            view.m_ctx.setDirty(view);
        })
    }

    add(view: ShapeView) {
        this.subscribers.add(view);
        return () => {
            this.subscribers.delete(view)
        }
    }
}