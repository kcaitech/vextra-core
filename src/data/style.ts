/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

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
    CornerType,
    FillRule,
    FillType,
    GradientType,
    MarkerType,
    PaintFilter,
    PatternTransform,
    Point2D,
    Shadow,
    Stop,
    WindingRule,
    TextAttr
} from "./baseclasses";
import { Basic, BasicArray, BasicMap, ResourceMgr, WatchableObject } from "./basic";
import { Color } from "./color";
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
    strokePaints: BasicArray<Fill>
    fillsMask?: string

    constructor(
        position: BorderPosition,
        borderStyle: BorderStyle,
        cornerType: CornerType,
        sideSetting: BorderSideSetting,
        strokePaints: BasicArray<Fill>
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
}

export class Blur extends Basic implements classes.Blur {
    typeId = 'blur'
    isEnabled: boolean
    center: Point2D
    motionAngle?: number
    radius?: number
    saturation: number
    type: BlurType
    mask?: string

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

/**
 * @description 样式库管理器数据组成
 */
export type StyleMangerMember = FillMask | ShadowMask | BlurMask | BorderMask | RadiusMask| TextMask;

export class StyleSheet extends Basic implements classes.StyleSheet {
    typeId = "style-sheet"
    id: string
    name: string
    variables: BasicArray<StyleMangerMember>
    crdtidx: BasicArray<number>

    constructor(crdtidx: BasicArray<number>, id: string, name: string, variables: StyleSheet_variables) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.name = name;
        this.variables = this.transform2notifiable(id, variables);
    }

    private transform2notifiable(sheetId: string, variables: StyleSheet_variables) {
        const notifiable_variables = new BasicArray<StyleMangerMember>();
        for (const variable of variables) {
            const v = variable as any;
            if (v.typeId === 'fill-mask') {
                const fills = new BasicArray<Fill>();
                v.fills.forEach((s: Fill) => {
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
                const fillMask = new FillMask(v.crdtidx, sheetId, v.id, v.name, v.description, fills);
                notifiable_variables.push(fillMask);
            } else if (v.typeId === 'shadow-mask') {
                const shadows = new BasicArray<Shadow>();
                v.shadows.forEach((i: Shadow) => {
                    const { crdtidx, id, isEnabled, blurRadius, color, offsetX, offsetY, spread, position, contextSettings } = i
                    const new_shadow = new Shadow(crdtidx, id, isEnabled, blurRadius, new Color(color.alpha, color.red, color.green, color.blue), offsetX, offsetY, spread, position)
                    new_shadow.contextSettings = contextSettings
                    shadows.push(new_shadow)
                })
                const shadowMask = new ShadowMask(v.crdtidx, sheetId, v.id, v.name, v.description, shadows);
                notifiable_variables.push(shadowMask);
            } else if (v.typeId === 'blur-mask') {
                const { isEnabled, center, saturation, type } = v.blur;
                const blur = new Blur(isEnabled, center, saturation, type);
                blur.motionAngle = v.blur.motionAngle;
                blur.radius = v.blur.radius;
                const blurmask = new BlurMask(v.crdtidx, sheetId, v.id, v.name, v.description, blur);
                notifiable_variables.push(blurmask);
            } else if (v.typeId === 'border-mask') {
                const { position, sideSetting } = v.border;
                const side = new BorderSideSetting(sideSetting.sideType, sideSetting.thicknessTop, sideSetting.thicknessLeft, sideSetting.thicknessBottom, sideSetting.thicknessRight);
                const border = new BorderMaskType(position, side);
                const borderMask = new BorderMask(v.crdtidx, sheetId, v.id, v.name, v.description, border);
                notifiable_variables.push(borderMask);
            } else if (v.typeId === 'radius-mask') {
                const value = v.radius
                const radiusmask = new RadiusMask(v.crdtidx, sheetId, v.id, v.name, v.description, value)
                notifiable_variables.push(radiusmask)
            } else if (v.typeId === 'text-mask') {
                const text = v.text;
                const textmask = new TextMask(v.crdtidx, sheetId, v.id, v.name, v.description, text);
                notifiable_variables.push(textmask);
            }
        }
        return notifiable_variables;
    }
}

export class FillMask extends WatchableObject implements classes.FillMask {
    typeId = 'fill-mask';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    name: string;
    description: string;
    fills: BasicArray<Fill>;
    disabled?: boolean;

    constructor(crdtidx: BasicArray<number>, sheet: string, id: string, name: string, description: string, fills: BasicArray<Fill>, disabled?: boolean) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.sheet = sheet;
        this.name = name;
        this.description = description;
        this.fills = fills;
        this.disabled = disabled;
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", ...args);
    }
}

export class ShadowMask extends WatchableObject implements classes.ShadowMask {
    typeId = 'shadow-mask';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    name: string;
    description: string;
    shadows: BasicArray<Shadow>;
    disabled?: boolean;

    constructor(crdtidx: BasicArray<number>, sheet: string, id: string, name: string, description: string, shadows: BasicArray<Shadow>, disabled?: boolean) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.sheet = sheet;
        this.name = name;
        this.description = description;
        this.shadows = shadows;
        this.disabled = disabled;
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", ...args);
    }
}

export class BlurMask extends WatchableObject implements classes.BlurMask {
    typeId = 'blur-mask';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    name: string;
    description: string;
    blur: Blur;
    disabled?: boolean;

    constructor(crdtidx: BasicArray<number>, sheet: string, id: string, name: string, description: string, blur: Blur, disabled?: boolean) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.sheet = sheet;
        this.name = name;
        this.description = description;
        this.blur = blur;
        this.disabled = disabled;
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", ...args);
    }
}

export class BorderMask extends WatchableObject implements classes.BorderMask {
    typeId = 'border-mask';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    name: string;
    description: string;
    border: BorderMaskType;
    disabled?: boolean;

    constructor(crdtidx: BasicArray<number>, sheet: string, id: string, name: string, description: string, border: BorderMaskType, disabled?: boolean) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.sheet = sheet;
        this.name = name;
        this.description = description;
        this.border = border;
        this.disabled = disabled;
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", ...args);
    }
}

export class RadiusMask extends WatchableObject implements classes.RadiusMask {
    typeId = 'radius-mask';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    name: string;
    description: string;
    radius: BasicArray<number>;
    disabled?: boolean;

    constructor(crdtidx: BasicArray<number>, sheet: string, id: string, name: string, description: string, radius: BasicArray<number>, disabled?: boolean) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.sheet = sheet;
        this.name = name;
        this.description = description;
        this.radius = radius;
        this.disabled = disabled;
    }
}

export class TextMask extends WatchableObject implements classes.TextMask {
    typeId = 'text-mask-living';
    crdtidx: BasicArray<number>;
    id: string;
    sheet: string;
    name: string;
    description: string;
    text: TextAttr;
    disabled?: boolean;

    constructor(crdtidx: BasicArray<number>, sheet: string, id: string, name: string, description: string, text: TextAttr, disabled?: boolean) {
        super();
        this.crdtidx = crdtidx;
        this.id = id;
        this.sheet = sheet;
        this.name = name;
        this.description = description;
        this.text = text;
        this.disabled = disabled;
    }

    notify(...args: any[]) {
        super.notify("style-mask-change", ...args);
    }
}