import { objectId } from "../basic/objectid";
import { ShapeFrame, Color, Gradient, GradientType, Stop } from "../data/classes";

const defaultColor = Color.DefaultColor;
function toRGBA(color: Color): string {
    return "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
}
function renderStop(h: Function, d: Stop): any {
    const position = d.position;
    const color = d.color || defaultColor;
    const rgbColor = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
    const n = h("stop", {
        offset: "" + (position * 100) + "%",
        "stop-color": rgbColor,
        "stop-opacity": color.alpha
    });
    return n;
}

export function render(h: Function, value: Gradient, frame: ShapeFrame): { id: string, style: string | undefined, node: any } {
    const id = "gradient" + objectId(value);
    let style;
    let node: any;
    if (value.gradientType == GradientType.Linear) {
        const { from, to, stops } = value;
        const rotate = Math.atan2((to.y * frame.height - from.y * frame.height), (to.x * frame.width - from.x * frame.width)) / Math.PI * 180 + 90;
        const colors = [];
        if (stops.length === 1) {
            style =
                "background: " + toRGBA(stops[0].color as Color) + ";" +
                "height:-webkit-fill-available;" +
                "width:-webkit-fill-available;"
        }
        for (let i = 0; i < stops.length; i++) {
            const stop = stops[i];
            const c = toRGBA(stop.color as Color);
            colors.push(`${c} ${stop.position * 100}%`)
        }
        const linear = `linear-gradient(${rotate + 90}deg, ${colors.join(', ')})`
        style =
            "background: " + linear + ";" +
            "height:-webkit-fill-available;" +
            "width:-webkit-fill-available;"
    }
    else if (value.gradientType == GradientType.Radial) {
        const { from, to, stops } = value;
        const rotate = Math.atan2((to.y * frame.height - from.y * frame.height), (to.x * frame.width - from.x * frame.width)) / Math.PI * 180 + 90;
        const colors = [];
        if (stops.length === 1) {
            style =
                "background: " + toRGBA(stops[0].color as Color) + ";" +
                "height:-webkit-fill-available;" +
                "width:-webkit-fill-available;"
        }
        for (let i = 0; i < stops.length; i++) {
            const stop = stops[i];
            const c = toRGBA(stop.color as Color);
            colors.push(`${c} ${stop.position * 100}%`)
        }
        const l = Math.sqrt((value.to.y * frame.height - value.from.y * frame.height) ** 2 + (value.to.x * frame.width - value.from.x * frame.width) ** 2);
        const scaleX = l;
        const scaleY = value.elipseLength ? (value.elipseLength * l * frame.width / frame.height) : 0;
        const linear = `radial-gradient(${scaleX}px ${scaleY}px at ${from.x * 100}% ${from.y * 100}%, ${colors.join(', ')})`
        style =
            "background: " + linear + ";" +
            "transform-origin: center;" +
            "transform: rotate(" + rotate + "deg);" +
            "height:-webkit-fill-available;" +
            "width:-webkit-fill-available;"
    }
    else if (value.gradientType == GradientType.Angular) {
        let gradient = "";
        const sc = value.stops.length;
        const calcSmoothColor = () => {
            const firstStop = value.stops[0];
            const lastStop = value.stops[sc - 1];
            const lastDistance = 1 - lastStop.position;
            const firstDistance = firstStop.position;
            const fColor = firstStop.color || defaultColor;
            const lColor = lastStop.color || defaultColor;
            const ratio = 1 / (firstDistance + lastDistance);
            const fRatio = lastDistance * ratio;
            const lRatio = firstDistance * ratio;
            let r = (fColor.red * fRatio + lColor.red * lRatio);
            let g = (fColor.green * fRatio + lColor.green * lRatio);
            let b = (fColor.blue * fRatio + lColor.blue * lRatio);
            let a = (fColor.alpha * fRatio + lColor.alpha * lRatio);
            r = Math.min(Math.max(Math.round(r), 0), 255);
            g = Math.min(Math.max(Math.round(g), 0), 255);
            b = Math.min(Math.max(Math.round(b), 0), 255);
            a = Math.min(Math.max(a, 0), 1);
            return { r, g, b, a };
        }
        if (sc > 0 && value.stops[0].position > 0) {
            const { r, g, b, a } = calcSmoothColor();
            gradient = "rgba(" + r + "," + g + "," + b + "," + a + ")" + " 0deg";
        }
        for (let i = 0; i < sc; i++) {
            const stop = value.stops[i];
            const color = stop.color || defaultColor;
            const rgbColor = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
            const deg = Math.round(stop.position * 360)// % 360;
            gradient.length > 0 && (gradient = gradient + ",")
            gradient = gradient + rgbColor + " " + deg + "deg";
        }
        if (sc > 0 && value.stops[sc - 1].position < 1) {
            const { r, g, b, a } = calcSmoothColor();
            gradient = gradient + "," + "rgba(" + r + "," + g + "," + b + "," + a + ")" + " 360deg";
        }
        // defsChilds.push(h("style", {}, "." + id + "{" +
        const rotate = Math.atan2((value.to.y * frame.height - value.from.y * frame.height), (value.to.x * frame.width - value.from.x * frame.width)) / Math.PI * 180 + 90;
        const from = "from " + rotate + "deg at " + value.from.x * 100 + "% " + value.from.y * 100 + "%";
        style =
            "background: conic-gradient(" + from + "," + gradient + ");" +
            "height:-webkit-fill-available;" +
            "width:-webkit-fill-available;"
        // "transform: rotate(90deg);"
        // "transform-origin: left top;" +
        // "rotation:90deg" +
        // "rotation-point:0% 0%;" +
        // "}"));
    }
    return { id, style, node };
}