import * as classes from "./baseclasses"
import { Blur, BorderOptions, ColorControls, ContextSettings, Shadow, WindingRule, Fill, Border } from "./baseclasses";
import { Basic, BasicArray } from "./basic";

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
    Color,
    Fill,
    Border,
    BorderStyle
} from "./baseclasses"

// export class Color extends classes.Color {
//     toRGBA(): string {
//         return "rgba(" + this.red + "," + this.green + "," + this.blue + "," + this.alpha + ")";
//     }
//     toRGB(): string {
//         return "rgb(" + this.red + "," + this.green + "," + this.blue + ")";
//     }
        // toHex(): string {
        //     const toHex = (n: number) => {
        //         return n.toString(16).toUpperCase().length === 1 ? `0${n.toString(16).toUpperCase()}` : n.toString(16).toUpperCase();
        //     }
        //     return "#" + toHex(this.red) + toHex(this.green) + toHex(this.blue);
        // }
// }

// export class Fill extends classes.Fill {
//     notify(...args: any[]): void {
//         super.notify('fill', ...args);
//     }
// }

// export class Border extends classes.Border {
//     notify(...args: any[]): void {
//         super.notify('border', ...args);
//     }
// }

export class Style extends Basic implements classes.Style {
    typeId = 'style'
    miterLimit: number
    windingRule: WindingRule
    blur: Blur
    borderOptions: BorderOptions
    borders: BasicArray<Border >
    colorControls?: ColorControls
    contextSettings: ContextSettings
    fills: BasicArray<Fill >
    innerShadows: BasicArray<Shadow >
    shadows: BasicArray<Shadow >
    constructor(
        miterLimit: number,
        windingRule: WindingRule,
        blur: Blur,
        borderOptions: BorderOptions,
        borders: BasicArray<Border >,
        contextSettings: ContextSettings,
        fills: BasicArray<Fill >,
        innerShadows: BasicArray<Shadow >,
        shadows: BasicArray<Shadow >
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
    }
}
