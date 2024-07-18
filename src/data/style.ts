import * as classes from "./baseclasses"
import {
    BorderOptions, ColorControls, ContextSettings,
    Shadow, WindingRule, FillType, BorderPosition,
    BorderStyle, MarkerType, ContactRole, VariableType, Point2D, GradientType, Stop, BlendMode, FillRule, CornerType, BorderSideSetting,
    BlurType
} from "./baseclasses";
import { Basic, BasicArray, BasicMap, ResourceMgr } from "./basic";
import { Variable } from "./variable";
import { Color } from "./color";
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

/**
 * gradient 
 */
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

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __cacheData?: { media: { buff: Uint8Array, base64: string }, ref: string };

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

    private __startLoad: boolean = false;
    peekImage(startLoad: boolean = false) {
        // const ret = this.__cacheData?.base64;
        // if (ret) return ret;
        // if (!this.imageRef) return "";
        // if (startLoad && !this.__startLoad) {
        //     this.__startLoad = true;
        //     this.__imageMgr && this.__imageMgr.get(this.imageRef).then((val) => {
        //         if (!this.__cacheData) {
        //             this.__cacheData = val;
        //             if (val) this.notify();
        //         }
        //     })
        // }
        // return ret;

        if (this.__cacheData?.ref === this.imageRef) {
            return this.__cacheData?.media.base64;
        }
        if (!this.imageRef) return "";
        if (startLoad && !this.__startLoad) {
            this.__startLoad = true;
            const mediaMgr = this.__imageMgr;
            mediaMgr && mediaMgr
                .get(this.imageRef)
                .then((val) => {
                    if (val) {
                        this.__cacheData = { media: val, ref: this.imageRef! };
                    }
                }).finally(() => {
                    this.__startLoad = false;
                    this.notify('image-reload');
                    return this.__cacheData?.media.base64;
                })
        }
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
    isEnabled: boolean
    center: Point2D
    motionAngle?: number
    radius?: number
    saturation: number
    type: BlurType
    constructor(
        isEnabled: boolean,
        center: Point2D,
        saturation: number,
        type: BlurType,
        motionAngle?: number,
        radius?: number
    ) {
        super()
        this.isEnabled = isEnabled
        this.center = center
        this.saturation = saturation
        this.type = type
        this.motionAngle = motionAngle
        this.radius = radius
    }
}