import {
    Blur,
    Border,
    BorderOptions,
    BorderStyle,
    ContextSettings,
    Fill,
    Gradient,
    Shadow,
    Stop,
    Style
} from "../../../data/style";
import { BlendMode, GradientType, MarkerType, WindingRule, BlurType, LineCapStyle, LineJoinStyle, FillType, BorderPosition, Point2D, Color } from "../../../data/classes"
import { BasicArray } from "../../../data/basic";
import { uuid } from "../../../basic/uuid";
import { IJSON, LoadContext } from "./basic";
import { ShadowPosition } from "../../../data/baseclasses";

export function importColor(data: IJSON): Color {
    // if (!data)
    const alpha: number = data['alpha'] as number;
    let blue: number = data['blue'];
    let green: number = data['green'];
    let red: number = data['red'];
    blue = Math.min(Math.max(Math.round(blue * 255), 0), 255);
    green = Math.min(Math.max(Math.round(green * 255), 0), 255);
    red = Math.min(Math.max(Math.round(red * 255), 0), 255);
    return new Color(alpha, red, green, blue);
}

function importContextSettings(data: IJSON): ContextSettings {
    const blendMode: BlendMode = ((m) => {
        switch (m) {
            case 0: return BlendMode.Normal;
            default: return BlendMode.Normal;
        }
    })(data['blendMode']);
    const opacity: number = data['opacity'];
    return new ContextSettings(blendMode, opacity);
}

export function importXY(str: string): Point2D {
    const idx1 = str.indexOf('{');
    const idx2 = str.indexOf(',');
    const idx3 = str.lastIndexOf('}');
    const x: number = parseFloat(str.substring(idx1 + 1, idx2));
    const y: number = parseFloat(str.substring(idx2 + 1, idx3));
    return new Point2D(x, y);
}

// function genGradientId(gradient: Gradient): string {
//     return "gradient" + objectId(gradient);
// }

function importGradient(data: IJSON): Gradient {
    const elipseLength: number = data['elipseLength'];
    const from: Point2D = importXY(data['from']);
    const gradientType: GradientType = ((t) => {
        switch (t) {
            case 0: return GradientType.Linear;
            case 1: return GradientType.Radial;
            case 2: return GradientType.Angular;
            default: return GradientType.Linear;
        }
    })(data['gradientType']);
    const to: Point2D = importXY(data['to']);
    const stops: Stop[] = (data['stops'] || []).map((d: IJSON) => {
        let position: number = d['position'];
        if (gradientType == GradientType.Angular) {
            position = (position + 90.0 / 360.0) % 1;/* rotate 90deg */
        }
        position = Math.min(Math.max(0, position), 1);
        const color: Color = importColor(d['color']);
        const stop = new Stop(position, color, d["id"]);
        stop.color = color;
        return stop;
    });
    stops.sort((a, b) => a.position == b.position ? -1 : a.position - b.position);
    return new Gradient(from, to, gradientType, new BasicArray<Stop>(...stops), elipseLength);
}

export function importStyle(ctx: LoadContext, data: IJSON): Style {

    if (!data) { // 存在数据没有style
        const style: Style = new Style(new BasicArray<Border>(), new BasicArray<Fill>(), new BasicArray<Shadow>());
        return style;
    }

    // const gradients = env.gradients;
    const miterLimit: number = data['miterLimit'];

    const windingRule: WindingRule = ((t: number) => {
        switch (t) {
            case 0: return WindingRule.NonZero;
            case 1: return WindingRule.EvenOdd;
            default: return WindingRule.NonZero;
        }
    })(data['windingRule']);

    // const blur: Blur = ((d) => {
    //     return new Blur(
    //         false,
    //         new Point2D(0, 0), // {x: 0, y: 0},
    //         0,
    //         BlurType.Gaussian
    //     );
    // })(data['blur']);

    const borderOptions: BorderOptions = ((d: IJSON) => {
        return new BorderOptions(
            false,
            // new BasicArray<number>(),
            LineCapStyle.Butt,
            LineJoinStyle.Miter
        )
    })(data['borderOptions']);

    const borders: Border[] = (data['borders'] || []).map((d: IJSON) => {
        const isEnabled: boolean = d['isEnabled'];
        const fillType: FillType = ((t) => {
            switch (t) {
                case 0: return FillType.SolidColor;
                case 1: return FillType.Gradient;
                case 2: return FillType.Gradient;
                case 3: return FillType.Gradient;
                case 4: return FillType.Pattern;
                default: return FillType.SolidColor;
            }
        })(d['fillType']);
        const color: Color = importColor(d['color']);

        const contextSettings: ContextSettings | undefined = d['contextSettings'] && importContextSettings(d['contextSettings']);
        let gradient;
        // let gradientType;
        if (fillType == FillType.Gradient && d['gradient']) {
            gradient = importGradient(d['gradient']);
            // gradientType = gradient.gradientType;
            // gradientId = genGradientId(gradient);
            // gradients.set(gradientId, gradient);
        }

        const position: BorderPosition = ((p: number) => {
            switch (p) {
                case 0: return BorderPosition.Center;
                case 1: return BorderPosition.Inner;
                case 2: return BorderPosition.Outer;
                default: return BorderPosition.Center;
            }
        })(d['position']);

        const thickness: number = d['thickness'];

        const borderStyle: BorderStyle = ((dashPattern: number[] | undefined) => {
            const bs = new BorderStyle(0, 0);
            if (!dashPattern) {
                //
            }
            else if (dashPattern.length === 1) {
                bs.length = dashPattern[0];
                bs.gap = 0;
            } else if (dashPattern.length === 2) {
                bs.length = dashPattern[0];
                bs.gap = dashPattern[1];
            }
            return bs
        })(data['borderOptions'] ? data['borderOptions'].dashPattern : undefined);

        const border = new Border(uuid(), isEnabled, fillType, color, position, thickness, borderStyle);
        border.gradient = gradient;
        border.contextSettings = contextSettings;
        return border;
    });
    const getMarkerType = (st: number): MarkerType => {
        switch (st) {
            case 0: return MarkerType.Line;
            case 1: return MarkerType.OpenArrow;
            case 2: return MarkerType.FilledArrow;
            case 5: return MarkerType.FilledCircle;
            case 7: return MarkerType.FilledSquare;
            default: return MarkerType.Line;
        }
    }
    const startMarkerType: MarkerType = getMarkerType(data['startMarkerType']);
    const endMarkerType: MarkerType = getMarkerType(data['endMarkerType']);

    const contextSettings: ContextSettings | undefined = data['contextSettings'] && importContextSettings(data['contextSettings']);
    const fills: Fill[] = (data['fills'] || []).map((d: IJSON) => {
        const isEnabled: boolean = d['isEnabled'];
        const fillType = ((t) => {
            switch (t) {
                case 0: return FillType.SolidColor;
                case 1: return FillType.Gradient;
                case 2: return FillType.Gradient;
                case 3: return FillType.Gradient;
                case 4: return FillType.Pattern;
                default: return FillType.SolidColor;
            }
        })(d['fillType']);
        const color: Color = importColor(d['color']);
        const contextSettings: ContextSettings | undefined = d['contextSettings'] && importContextSettings(d['contextSettings']);

        let gradient;
        // let gradientType;
        if (fillType == FillType.Gradient && d['gradient']) {
            gradient = importGradient(d['gradient']);
            // gradientType = gradient.gradientType;
            // gradientId = genGradientId(gradient);
            // gradients.set(gradientId, gradient);
        }

        let imageRef;
        if (fillType === FillType.Pattern && d['image']) {
            // "image": {
            //     "_class": "MSJSONFileReference",
            //     "_ref_class": "MSImageData",
            //     "_ref": "images\/853732577995ec08625706620b0235b0184b90e8.pdf"
            // },
            const image = d['image'];
            const ref = image['_ref'] || "";
            imageRef = ref.substring(ref.indexOf('/') + 1);
        }

        const fill = new Fill(uuid(), isEnabled, fillType, color);
        fill.gradient = gradient;
        fill.imageRef = imageRef;
        fill.contextSettings = contextSettings;
        fill.setImageMgr(ctx.mediasMgr);
        return fill;
    });
    const shadows: Shadow[] = (data['shadows'] || []).map((d: IJSON) => {
        const isEnabled: boolean = d['isEnabled'];
        const color: Color = importColor(d['color']);
        const blurRadius = d["blurRadius"], offsetX = d["offsetX"], offsetY = d["offsetY"], spread = d["spread"]
        const shadow = new Shadow(uuid(), isEnabled, blurRadius, color, offsetX, offsetY, spread, ShadowPosition.Outer);
        return shadow;
    });

    const style: Style = new Style(new BasicArray<Border>(...borders), new BasicArray<Fill>(...fills), new BasicArray<Shadow>(...shadows));

    style.startMarkerType = startMarkerType;
    style.endMarkerType = endMarkerType;

    style.miterLimit = miterLimit;
    style.windingRule = windingRule;
    // style.blur = blur;
    style.borderOptions = borderOptions;
    style.contextSettings = contextSettings;

    return style;
}