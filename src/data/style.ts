import * as classes from "./baseclasses"
import {
    Blur, BorderOptions, ColorControls, ContextSettings,
    Shadow, WindingRule, FillType, Gradient, BorderPosition,
    BorderStyle, MarkerType, ContactRole, VariableType
} from "./baseclasses";
import { Basic, BasicArray, ResourceMgr, Watchable } from "./basic";
import { Variable } from "./variable";

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
    BorderStyle,
    ContactForm,
    ContactType,
    ContactRole,
    ContactRoleType
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
    clone(): Color {
        return new Color(this.alpha, this.red, this.green, this.blue);
    }
}

export class Border extends Basic implements classes.Border {
    typeId = 'border'
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings?: ContextSettings
    position: BorderPosition
    thickness: number
    gradient?: Gradient
    borderStyle: BorderStyle
    constructor(
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color,
        position: BorderPosition,
        thickness: number,
        borderStyle: BorderStyle,
    ) {
        super()
        this.id = id
        this.isEnabled = isEnabled
        this.fillType = fillType
        this.color = color
        this.position = position
        this.thickness = thickness
        this.borderStyle = borderStyle
    }
}

export class Fill extends Basic implements classes.Fill {
    typeId = 'fill'
    id: string
    isEnabled: boolean
    fillType: FillType
    color: Color
    contextSettings?: ContextSettings
    gradient?: Gradient
    imageRef?: string

    private __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    private __cacheData?: { buff: Uint8Array, base64: string };

    constructor(
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color
    ) {
        super()
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
        const ret = this.__cacheData?.base64;
        if (ret) return ret;
        if (!this.imageRef) return "";
        if (startLoad && !this.__startLoad) {
            this.__startLoad = true;
            this.__imageMgr && this.__imageMgr.get(this.imageRef).then((val) => {
                if (!this.__cacheData) {
                    this.__cacheData = val;
                    if (val) this.notify();
                }
            })
        }
        return ret;
    }
    // image fill
    async loadImage(): Promise<string> {
        if (!this.imageRef) return "";
        if (this.__cacheData) return this.__cacheData.base64;
        this.__cacheData = this.__imageMgr && await this.__imageMgr.get(this.imageRef)
        if (this.__cacheData) this.notify();
        return this.__cacheData && this.__cacheData.base64 || "";
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
    bordersVar?: string
    colorControls?: ColorControls
    contextSettings?: ContextSettings
    fills: BasicArray<Fill>
    fillsVar?: string
    innerShadows?: BasicArray<Shadow>
    shadows?: BasicArray<Shadow>
    contacts?: BasicArray<ContactRole>
    startMarkerType?: MarkerType
    endMarkerType?: MarkerType
    constructor(
        borders: BasicArray<Border>,
        fills: BasicArray<Fill>
    ) {
        super()
        this.borders = borders
        this.fills = fills
        borders.setTypeId("borders");
        fills.setTypeId("fills");
    }

    private _watch_vars(slot: string, vars: Variable[]) {
        (this.__parent as any)?._watch_vars(slot, vars);
    }
    private findVar(varId: string, ret: Variable[]): boolean {
        return !!(this.__parent as any)?.findVar(varId, ret);
    }
    getFills(): BasicArray<Fill> {
        if (!this.fillsVar) return this.fills;
        const _vars: Variable[] = [];
        this.findVar(this.fillsVar, _vars);
        // watch vars
        this._watch_vars("style.fills", _vars);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.Fills) {
            return _var.value;
        }
        return this.fills;
    }
    getBorders(): BasicArray<Border> {
        if (!this.bordersVar) return this.borders;
        const _vars: Variable[] = [];
        this.findVar(this.bordersVar, _vars);
        // watch vars
        this._watch_vars("style.borders", _vars);
        const _var = _vars[_vars.length - 1];
        if (_var && _var.type === VariableType.Borders) {
            return _var.value;
        }
        return this.borders;
    }
}
