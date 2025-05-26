/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

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
import { BorderSideSetting, CornerType, ImageScaleMode, ShadowPosition, SideType } from "../../../data/baseclasses";

export function importColor(data: IJSON): Color {
    // if (!data)
    if (!data) {
        const defaultColor = new Color(1, 216, 216, 216);
        return defaultColor;
    }
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
            case 1: return BlendMode.Darken;
            case 2: return BlendMode.Multiply;
            case 3: return BlendMode.ColorBurn;
            case 4: return BlendMode.Lighten;
            case 5: return BlendMode.Screen;
            case 6: return BlendMode.ColorDodge;
            case 7: return BlendMode.Overlay;
            case 8: return BlendMode.SoftLight;
            case 9: return BlendMode.HardLight;
            case 10: return BlendMode.Difference;
            case 11: return BlendMode.Exclusion;
            case 12: return BlendMode.Hue;
            case 13: return BlendMode.Saturation;
            case 14: return BlendMode.Color;
            case 15: return BlendMode.Luminosity;
            case 16: return BlendMode.PlusDarker;
            case 17: return BlendMode.PlusLighter;
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
    const stops: Stop[] = ((data['stops'] || []) as IJSON[]).map((d: IJSON, i: number) => {
        let position: number = d['position'];
        if (gradientType == GradientType.Angular) {
            position = (position + 90.0 / 360.0) % 1;/* rotate 90deg */
        }
        position = Math.min(Math.max(0, position), 1);
        const color: Color = importColor(d['color']);
        const stop = new Stop(new BasicArray(), uuid(), position, color);
        return stop;
    });
    stops.sort((a, b) => a.position == b.position ? -1 : a.position - b.position);
    stops.forEach((v, i) => { v.crdtidx.push(i); });
    return new Gradient(from, to, gradientType, new BasicArray<Stop>(...stops), elipseLength);
}

export function importStyle(ctx: LoadContext, data: IJSON): Style {

    if (!data) { // 存在数据没有style
        const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
        const strokePaints = new BasicArray<Fill>();
        const border = new Border(BorderPosition.Inner, new BorderStyle(0, 0), CornerType.Miter, side, strokePaints);
        const style: Style = new Style(new BasicArray<Fill>(), new BasicArray<Shadow>(), border);
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

    const borderOptions: BorderOptions = ((d: IJSON) => {
        return new BorderOptions(
            false,
            // new BasicArray<number>(),
            LineCapStyle.Butt,
            LineJoinStyle.Miter
        )
    })(data['borderOptions']);
    const strokePaints: Array<Fill> = (data['borders'] || []).map((d: IJSON, i: number) => {
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
        const strokePaint = new Fill([i] as BasicArray<number>, uuid(), isEnabled, fillType, color);
        strokePaint.gradient = gradient;
        return strokePaint;
    });

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
    const side = new BorderSideSetting(SideType.Normal, 1, 1, 1, 1);
    let border = new Border(BorderPosition.Inner, borderStyle, CornerType.Miter, side, new BasicArray(...strokePaints));
    
    if (data['borders'] && data['borders'].length) {
        const d = data['borders'][0];
        const position: BorderPosition = ((p: number) => {
            switch (p) {
                case 0: return BorderPosition.Center;
                case 1: return BorderPosition.Inner;
                case 2: return BorderPosition.Outer;
                default: return BorderPosition.Inner;
            }
        })(d['position']);
        const corner: CornerType = ((p: number) => {
            switch (p) {
                case 0: return CornerType.Miter;
                case 1: return CornerType.Bevel;
                case 2: return CornerType.Round;
                default: return CornerType.Miter;
            }
        })(d['cornerType']);
        const thickness: number = d['thickness'];
        const side = new BorderSideSetting(SideType.Normal, thickness, thickness, thickness, thickness);
        border = new Border(position, borderStyle, corner, side, new BasicArray(...strokePaints));
    }
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
    const fills: Fill[] = (data['fills'] || []).map((d: IJSON, i: number) => {
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

        const fill = new Fill([i] as BasicArray<number>, uuid(), isEnabled, fillType, color);
        fill.imageScaleMode = patternFillType(d);
        fill.gradient = gradient;
        fill.imageRef = imageRef;
        fill.scale = d['patternTileScale'];
        fill.contextSettings = contextSettings;
        fill.setImageMgr(ctx.mediasMgr);
        return fill;
    });

    const shadows: Shadow[] = (data['shadows'] || []).map((d: IJSON, i: number) => {
        const isEnabled: boolean = d['isEnabled'];
        const color: Color = importColor(d['color']);
        const blurRadius = d["blurRadius"], offsetX = d["offsetX"], offsetY = d["offsetY"], spread = d["spread"]
        const shadow = new Shadow([i] as BasicArray<number>, uuid(), isEnabled, blurRadius, color, offsetX, offsetY, spread, ShadowPosition.Outer);
        return shadow;
    });

    (data['innerShadows'] || []).forEach((d: IJSON, i: number) => {
        const isEnabled: boolean = d['isEnabled'];
        const color: Color = importColor(d['color']);
        const blurRadius = d["blurRadius"], offsetX = d["offsetX"], offsetY = d["offsetY"], spread = d["spread"]
        const shadow = new Shadow([shadows.length + i] as BasicArray<number>, uuid(), isEnabled, blurRadius, color, offsetX, offsetY, spread, ShadowPosition.Inner);
        shadows.push(shadow);
    })

    const style: Style = new Style(new BasicArray<Fill>(...fills), new BasicArray<Shadow>(...shadows), border);

    style.blur = importBlur(data);

    style.startMarkerType = startMarkerType;
    style.endMarkerType = endMarkerType;

    style.miterLimit = miterLimit;
    style.windingRule = windingRule;
    style.borderOptions = borderOptions;
    style.contextSettings = contextSettings;

    return style;
}

function importBlur(data: IJSON): Blur | undefined {
    const d = data['blur'];
    if (!d) return;
    const isEnabled: boolean = d['isEnabled'];
    const saturation = d['radius'];
    const type = (t: number): BlurType => {
        switch (t) {
            case 0: return BlurType.Gaussian;
            case 3: return BlurType.Background;
            default: return BlurType.Gaussian;
        }
    }
    return new Blur(isEnabled, new Point2D(0, 0), saturation, type(d['type']));
}

function patternFillType(data: IJSON) {
    const patternMode = ((t) => {
        switch (t) {
            case 0: return ImageScaleMode.Tile;
            case 1: return ImageScaleMode.Stretch;
            case 2: return ImageScaleMode.Stretch;
            case 3: return ImageScaleMode.Fit;
            case 4: return ImageScaleMode.Crop;
            default: return ImageScaleMode.Stretch;
        }
    })(data['patternFillType']);
    return patternMode;
}