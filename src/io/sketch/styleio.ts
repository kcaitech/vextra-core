import { BlendMode, 
    Blur, 
    Border, 
    BorderOptions, 
    Color, 
    ContextSettings, 
    Fill, 
    FillType, 
    Gradient, 
    GradientType, 
    makePair, 
    MarkerType, 
    Pair, 
    Stop, 
    Style, 
    WindingRule, 
    XY} from "@/data/style";
import { objectId } from "@/basic/objectid";
import { Env } from "./envio";

export interface IJSON {
	[key: string]: any
}

function importColor(data: IJSON): Color {
    // if (!data)
    const alpha: number = data['alpha'] as number;
    let blue: number = data['blue'];
    let green: number = data['green'];
    let red: number = data['red'];
    blue = Math.round(blue * 255) % 255;
    green = Math.round(green * 255) % 255;
    red = Math.round(red * 255) % 255;
    return new Color(red, green, blue, alpha);
}

function importContextSettings(data: IJSON): ContextSettings {
    const blendMode: BlendMode = ((m) => {
        switch(m) {
            case 0: return BlendMode.Mode0;
            default: return BlendMode.Mode0;
        }
    })(data['blendMode']);
    const opacity: number = data['opacity'];
    return new ContextSettings(blendMode, opacity);
}

export function importXY(str: string): XY<number, number> {
    const idx1 = str.indexOf('{');
    const idx2 = str.indexOf(',');
    const idx3 = str.lastIndexOf('}');
    const x: number = parseFloat(str.substring(idx1 + 1, idx2));
    const y: number = parseFloat(str.substring(idx2 + 1, idx3));
    return {x, y};
}

function genGradientId(gradient: Gradient): string {
    return "gradient" + objectId(gradient);
}

function importGradient(data: IJSON): Gradient {
    const elipseLength: number = data['elipseLength'];
    const from: XY<number, number> = importXY(data['from']);
    const gradientType: GradientType = ((t) => {
        switch(t) {
            case 0: return GradientType.Type0;
            default: return GradientType.Type0;
        }
    })(data['gradientType']);
    const to: XY<number, number> = importXY(data['to']);
    const stops: Stop[] = (data['stops'] || []).map((d: IJSON)=> {
        const position: number = d['position'];
        const color: Color = importColor(d['color']);
        return new Stop(position, color);
    });
    return new Gradient(elipseLength, from, gradientType, to, stops);
}

export function importStyle(env:Env, data: IJSON): Style {

    const gradients = env.gradients;

    const endMarkerType: MarkerType = ((t: number) => {
            switch(t) {
                case 0: return MarkerType.Type0;
                default: return MarkerType.Type0;
            }
        })(data['endMarkerType']);
    const miterLimit: number = data['miterLimit'];
    const startMarkerType: MarkerType = ((t: number) => {
            switch(t) {
                case 0: return MarkerType.Type0;
                default: return MarkerType.Type0;
            }
        })(data['startMarkerType']);
    const windingRule: WindingRule = ((t: number) => {
        switch(t) {
            case 0: return WindingRule.Rule0;
            case 1: return WindingRule.Rule1;
            default: return WindingRule.Rule0;
        }
    })(data['windingRule']);

    const blur: Blur = ((d) => {
            return new Blur();
        })(data['blur']);

    const borderOptions: BorderOptions = ((d: IJSON) => {
            return new BorderOptions();
        })(data['borderOptions']);

    const borders: Border[] = (data['borders'] || []).map((d: IJSON) => {
        const isEnabled: boolean = d['isEnabled'];
        const fillType: FillType = ((t) => {
                switch(t) {
                    case 0: return FillType.Type0;
                    default: return FillType.Type0;
                }
            })(d['fillType']);
        const color: Color = importColor(d['color']);

        const contextSettings: ContextSettings = importContextSettings(d['contextSettings']);
        let gradientId;
        if (data['gradient']) {
            const gradient = importGradient(data['gradient']);
            gradientId = genGradientId(gradient);
            gradients.set(gradientId, gradient);
        }

        return new Border(isEnabled, fillType, color, contextSettings, gradientId);
        });

    const contextSettings: ContextSettings = importContextSettings(data['contextSettings']);
    const fills: Fill[] = (data['fills'] || []).map((d: IJSON) => {
        const isEnabled: boolean = d['isEnabled'];
        const fillType = ((t) => {
            switch(t) {
                case 0: return FillType.Type0;
                default: return FillType.Type0;
            }
        })(d['fillType']);
        const color: Color = importColor(d['color']);
        const contextSettings: ContextSettings = importContextSettings(data['contextSettings']);

        let gradientId;
        if (data['gradient']) {
            const gradient: Gradient = importGradient(data['gradient']);
            gradientId = genGradientId(gradient);
            gradients.set(gradientId, gradient);
        }

        return new Fill(isEnabled, fillType, color, contextSettings, gradientId);
    });

    const innerShadows: object[] = (data['innerShadows'] || []).map((d: object) => {
        return d;// todo
    });
    const shadows: object[] = (data['shadows'] || []).map((d: object) => {
        return d; // todo
    });

    const style: Style = new Style(//shape, 
        endMarkerType, 
        miterLimit, 
        startMarkerType, 
        windingRule, 
        blur, 
        borderOptions, 
        borders, 
        contextSettings, 
        fills, 
        innerShadows, 
        shadows);

    // return makePair(style, gradients);
    return style;
}