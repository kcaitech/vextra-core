import * as classes from "./baseclasses"
import {
    Blur, BorderOptions, ColorControls, ContextSettings,
    Shadow, WindingRule, FillType, Gradient, BorderPosition,
    BorderStyle, MarkerType, ContactRole, VariableType
} from "./baseclasses";
import { Basic, BasicArray, BasicMap, ResourceMgr } from "./basic";
import { Variable } from "./variable";
import { Color } from "./color";
import { CrdtIndex } from "./crdt";
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
    ContactRoleType, 
    ShadowPosition
} from "./baseclasses"

export class Border extends Basic implements classes.Border {
    typeId = 'border'
    crdtidx: CrdtIndex
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
        crdtidx: CrdtIndex,
        id: string,
        isEnabled: boolean,
        fillType: FillType,
        color: Color,
        position: BorderPosition,
        thickness: number,
        borderStyle: BorderStyle,
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
    }
}

export class Fill extends Basic implements classes.Fill {
    typeId = 'fill'
    crdtidx: CrdtIndex
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
        crdtidx: CrdtIndex,
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
    colorControls?: ColorControls
    contextSettings?: ContextSettings
    fills: BasicArray<Fill>
    innerShadows?: BasicArray<Shadow>
    shadows: BasicArray<Shadow>
    contacts?: BasicArray<ContactRole>
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
        borders.setTypeId("borders");
        fills.setTypeId("fills");
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
