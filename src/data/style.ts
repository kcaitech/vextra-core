/**
 * @author: zhangruiqiang
 * @date: 2022/5/15
 */

export class Color {
    private m_alpha: number;
    private m_blue: number;
    private m_green: number;
    private m_red: number;

    constructor(r: number, g: number, b: number, a: number) {
        this.m_alpha = a;
        this.m_blue = b;
        this.m_green = g;
        this.m_red = r;
    }
    get alpha(): number {
        return this.m_alpha;
    }
    get blue(): number {
        return this.m_blue;
    }
    get green(): number {
        return this.m_green;
    }
    get red(): number {
        return this.m_red;
    }
}

export class Stop {
    private m_position: number;
    private m_color: Color;

    constructor(position: number, color: Color) {
        this.m_position = position;
        this.m_color = color;
    }
    get position(): number {
        return this.m_position;
    }
    get color(): Color {
        return this.m_color;
    }
}

export function makePair<T1, T2>(first: T1, second: T2):Pair<T1, T2> {
    return {first, second};
}

export interface Pair<T1, T2> {
    first: T1;
    second: T2;
}

export interface XY<T1, T2> {
    x: T1;
    y: T2;
}

export enum GradientType {
    Linear,
    Radial,
    Angular,
}

export class Gradient {
    private m_elipseLength: number;
    private m_from: XY<number, number>;
    private m_gradientType: GradientType;
    private m_to: XY<number, number>;
    private m_stops:Stop[];
    
    constructor(elipseLength: number, 
        from: XY<number, number>, 
        gradientType: GradientType, 
        to: XY<number, number>,
        stops:Stop[]) {
            this.m_elipseLength = elipseLength;
            this.m_from = from;
            this.m_gradientType = gradientType;
            this.m_to = to;
            this.m_stops = stops;
    }

    get elipseLength(): number {
        return this.m_elipseLength;
    }
    get from(): XY<number, number> {
        return this.m_from;
    }
    get gradientType(): GradientType {
        return this.m_gradientType;
    }
    get to(): XY<number, number> {
        return this.m_to;
    }
    get stopsCount(): number {
        return this.m_stops.length;
    }
    getStopByIndex(index: number): Stop {
        return this.m_stops[index];
    }
}

export enum BlendMode {
    Mode0, // todo
}

export class ContextSettings {
    private m_blendMode: BlendMode;
    private m_opacity: number;

    constructor(blendMode: BlendMode, opacity: number) {
        this.m_blendMode = blendMode;
        this.m_opacity = opacity;
    }
    get blendMode(): BlendMode {
        return this.m_blendMode;
    }
    get opacity(): number {
        return this.m_opacity;
    }
}

export enum FillType {
    SolidColor, // todo
    Gradient,
    Pattern,
}

export class Fill {
    // private m_shape: object;// todo
    private m_isEnabled: boolean;
    private m_fillType: FillType;
    private m_color: Color;
    private m_contextSettings: ContextSettings;
    // private m_gradientId: string | undefined;
    // private m_gradientType: GradientType | undefined;
    private m_gradient: Gradient | undefined;

    constructor(//shape: object, 
        isEnabled: boolean, 
        fillType: FillType, 
        color: Color, 
        contextSettings: ContextSettings, 
        gradient: Gradient | undefined) {
            // this.m_shape = shape;
            this.m_isEnabled = isEnabled;
            this.m_fillType = fillType;
            this.m_color = color;
            this.m_contextSettings = contextSettings;
            this.m_gradient = gradient;
    }
    // get shape(): object {
    //     return this.m_shape;
    // }
    get isEnabled(): boolean {
        return this.m_isEnabled;
    }
    get fillType(): FillType {
        return this.m_fillType;
    }
    get color(): Color {
        return this.m_color;
    }
    get contextSettings(): ContextSettings {
        return this.m_contextSettings;
    }
    get gradient(): Gradient | undefined {
        return this.m_gradient;
    }
    // get gradientId(): string | undefined {
    //     return this.m_gradientId;
    // }
    // get gradientType() : GradientType | undefined {
    //     return this.m_gradientType;
    // }
}

export enum BorderPosition {
    Inner,
    Center,
    Outer,
}

export class Border {
    // private m_shape: object; // todo
    private m_isEnabled: boolean;
    private m_fillType: FillType;
    private m_color: Color;
    private m_contextSettings: ContextSettings;
    // private m_gradientId: string | undefined;
    // private m_gradientType: GradientType | undefined;
    private m_position: BorderPosition;
    private m_thickness: number;
    private m_gradient: Gradient | undefined;

    constructor(//shape: object, 
        isEnabled: boolean,
        fillType: FillType,
        color: Color,
        contextSettings: ContextSettings,
        // gradientId: string | undefined,
        // gradientType: GradientType | undefined,
        position: BorderPosition,
        thickness: number,
        gradient: Gradient | undefined) {
            // this.m_shape = shape;
            this.m_isEnabled = isEnabled;
            this.m_fillType = fillType;
            this.m_color = color;
            this.m_contextSettings = contextSettings;
            // this.m_gradientId = gradientId;
            // this.m_gradientType = gradientType;
            this.m_position = position;
            this.m_thickness = thickness;
            this.m_gradient = gradient;
    }
    // get shape(): object {
    //     return this.m_shape;
    // }
    get isEnabled(): boolean {
        return this.m_isEnabled;
    }
    get fillType(): FillType {
        return this.m_fillType;
    }
    get color(): Color {
        return this.m_color;
    }
    get contextSettings(): ContextSettings {
        return this.m_contextSettings;
    }
    // get gradientId(): string | undefined {
    //     return this.m_gradientId;
    // }
    // get gradientType(): GradientType | undefined {
    //     return this.m_gradientType;
    // }
    get position(): BorderPosition {
        return this.m_position;
    }
    get thickness(): number {
        return this.m_thickness;
    }
    get gradient(): Gradient | undefined {
        return this.m_gradient;
    }
}

export enum BlurType {

}

export class Blur {
    // "blur": {
    //     "_class": "blur",
    //     "isEnabled": false,
    //     "center": "{0.5, 0.5}",
    //     "motionAngle": 0,
    //     "radius": 10,
    //     "saturation": 1,
    //     "type": 0
    // },
}

export class BorderOptions {
    // private m_isEnabled: boolean;
    // private m_dashPattern: 
    // private m_lineCapStyle:
    // private m_lineJoinStyle:

    // "borderOptions": {
    //     "_class": "borderOptions",
    //     "isEnabled": true,
    //     "dashPattern": [],
    //     "lineCapStyle": 0,
    //     "lineJoinStyle": 0
    // },
}

export class ColorControls {
    // "colorControls": {
    //     "_class": "colorControls",
    //     "isEnabled": false,
    //     "brightness": 0,
    //     "contrast": 1,
    //     "hue": 0,
    //     "saturation": 1
    // },
}

export enum MarkerType {
    Type0, // todo
}

export enum WindingRule {
    Rule0,
    Rule1, // todo
}

export class Style {
    // private m_shape: object; // todo
    private m_endMarkerType: MarkerType;
    private m_miterLimit: number;
    private m_startMarkerType: MarkerType;
    private m_windingRule: WindingRule;
    private m_blur: Blur;
    private m_borderOptions: BorderOptions;
    private m_borders: Border[];
    private m_colorControls: ColorControls | undefined;
    private m_contextSettings: ContextSettings;
    private m_fills: Fill[];
    private m_innerShadows: object[]; // todo
    private m_shadows: object[]; // todo
    
    constructor(//shape: object, 
        endMarkerType: MarkerType,
        miterLimit: number,
        startMarkerType: MarkerType,
        windingRule: WindingRule,
        blur: Blur,
        borderOptions: BorderOptions,
        borders: Border[],
        contextSettings: ContextSettings,
        fills: Fill[],
        innerShadows: object[],
        shadows: object[]) {
        // this.m_shape = shape;
        this.m_endMarkerType = endMarkerType;
        this.m_miterLimit = miterLimit;
        this.m_startMarkerType = startMarkerType;
        this.m_windingRule = windingRule;
        this.m_blur = blur;
        this.m_borderOptions = borderOptions;
        this.m_borders = borders;
        this.m_contextSettings = contextSettings;
        this.m_fills = fills;
        this.m_innerShadows = innerShadows;
        this.m_shadows = shadows;
    }

    // get shape(): object {
    //     return this.m_shape;
    // }
    get endMarkerType(): MarkerType {
        return this.m_endMarkerType;
    }
    get miterLimit(): number {
        return this.m_miterLimit;
    }
    get startMarkerType(): MarkerType {
        return this.m_startMarkerType;
    }
    get windingRule(): WindingRule {
        return this.m_windingRule;
    }
    get blur(): Blur {
        return this.m_blur;
    }
    get borderOptions(): BorderOptions {
        return this.m_borderOptions;
    }
    get bordersCount(): number {
        return this.m_borders.length;
    }
    getBorderByIndex(index: number): Border {
        return this.m_borders[index];
    }
    get contextSettings() {
        return this.m_contextSettings;
    }
    get fillsCount(): number {
        return this.m_fills.length;
    }
    getFillByIndex(index: number): Fill {
        return this.m_fills[index];
    }
    get innerShadowsCount(): number {
        return this.m_innerShadows.length;
    }
    getInnerShadowByIndex(index: number) {
        return this.m_innerShadows[index];
    }
    get shadowsCount(): number {
        return this.m_shadows.length;
    }
    getShadowByIndex(index: number) {
        return this.m_shadows[index];
    }
}
