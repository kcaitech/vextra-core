import * as classes from "./baseclasses"
import { Blur, BorderOptions, ColorControls, ContextSettings, Shadow, WindingRule, FillType, Gradient, BorderPosition, BorderStyle, MarkerType } from "./baseclasses";
import { Basic, BasicArray, ResourceMgr } from "./basic";

export {
    GradientType,
    BlendMode,
    FillType,
    BorderPosition,
    BlurType,
    Blur,
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
    Gradient,
    ContextSettings,
    Shadow,
    GraphicsContextSettings,
    BorderStyle
} from "./baseclasses"

export class Color extends classes.Color {

    static DefaultColor = new Color(0, 0, 0, 0);

    toRGBA(): string {
        return "rgba(" + this.red + "," + this.green + "," + this.blue + "," + this.alpha + ")";
    }
    toRGB(): string {
        return "rgb(" + this.red + "," + this.green + "," + this.blue + ")";
    }
    toHex(): string {
        const toHex = (n: number) => {
            return n.toString(16).toUpperCase().length === 1 ? `0${n.toString(16).toUpperCase()}` : n.toString(16).toUpperCase();
        }
        return "#" + toHex(this.red) + toHex(this.green) + toHex(this.blue);
    }

    equals(color: Color): boolean {
        return this.alpha === color.alpha &&
            this.blue === color.blue &&
            this.green === color.green &&
            this.red === color.red;
    }
}

export class Border extends Basic implements classes.Border {
    typeId = 'border'
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings: ContextSettings
    position: BorderPosition
    thickness: number
    gradient?: Gradient
    borderStyle: BorderStyle
    startMarkerType: MarkerType
    endMarkerType: MarkerType
    constructor(
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color,
        contextSettings: ContextSettings,
        position: BorderPosition,
        thickness: number,
        borderStyle: BorderStyle,
        startMarkerType: MarkerType,
        endMarkerType: MarkerType
    ) {
        super()
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
        this.contextSettings = contextSettings
        this.position = position
        this.thickness = thickness
        this.borderStyle = borderStyle
        this.startMarkerType = startMarkerType
        this.endMarkerType = endMarkerType
    }
}

export class Fill extends Basic implements classes.Fill {
    typeId = 'fill'
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings: ContextSettings
    gradient?: Gradient
    imageRef?: string

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __cacheData?: { buff: Uint8Array, base64: string };

    constructor(
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color,
        contextSettings: ContextSettings
    ) {
        super()
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
        this.contextSettings = contextSettings
    }
    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }
    peekImage() {
        return this.__cacheData?.base64;
    }
    // image fill
    async loadImage(): Promise<string> {
        if (!this.imageRef) return "";
        if (this.__cacheData) return this.__cacheData.base64;
        this.__cacheData = this.__imageMgr && await this.__imageMgr.get(this.imageRef)
        return this.__cacheData && this.__cacheData.base64 || "";
    }
}

export class Style extends Basic implements classes.Style {
    typeId = 'style'
    miterLimit: number
    windingRule: WindingRule
    blur: Blur
    borderOptions: BorderOptions
    borders: BasicArray<Border>
    colorControls?: ColorControls
    contextSettings: ContextSettings
    fills: BasicArray<Fill>
    innerShadows: BasicArray<Shadow>
    shadows: BasicArray<Shadow>
    constructor(
        miterLimit: number,
        windingRule: WindingRule,
        blur: Blur,
        borderOptions: BorderOptions,
        borders: BasicArray<Border>,
        contextSettings: ContextSettings,
        fills: BasicArray<Fill>,
        innerShadows: BasicArray<Shadow>,
        shadows: BasicArray<Shadow>
    ) {
        super()
        this.miterLimit = miterLimit
        this.windingRule = windingRule
        this.blur = blur
        this.borderOptions = borderOptions
        this.borders = borders
        this.contextSettings = contextSettings
        this.fills = fills
        this.innerShadows = innerShadows
        this.shadows = shadows
        borders.setTypeId("borders");
        fills.setTypeId("fills");
    }
}
