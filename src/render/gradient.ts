import { objectId } from "../basic/objectid";
import { ShapeFrame, Color, Gradient, GradientType, Stop } from "../data/classes";

const defaultColor = Color.DefaultColor;

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
        const stopSCount = value.stops.length;
        const childs = [];
        for (let i = 0; i < stopSCount; i++) {
            const s = value.stops[i];
            childs.push(renderStop(h, s));
        }
        node = h("linearGradient", {
            id,
            x1: value.from.x,
            y1: value.from.y,
            x2: value.to.x,
            y2: value.to.y,
        }, childs);
    }
    else if (value.gradientType == GradientType.Radial) {
        const stopSCount = value.stops.length;
        const childs = [];
        for (let i = 0; i < stopSCount; i++) {
            const s = value.stops[i];
            childs.push(renderStop(h, s));
        }
        const scaleX = 1;
        const scaleY = 1;
        node = h("radialGradient", {
            id,
            cx: value.from.x,
            cy: value.from.y,
            r: Math.sqrt((value.to.y - value.from.y) ** 2 + (value.to.x - value.from.x) ** 2),
            fx: value.from.x,
            fy: value.from.y,
            gradientTransform: "translate(" + value.from.x + "," + value.from.y + ")," +
                // "scale(0.955224, 1.0)," + // todo
                "rotate(" + Math.atan2((value.to.y - value.from.y), (value.to.x - value.from.x)) / Math.PI * 180 + ")," +
                "scale(" + scaleX + " " + scaleY + ")," +
                "translate(" + (-value.from.x) + "," + (-value.from.y) + ")",
        },
            childs);
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
        style =
            "background: conic-gradient(" + gradient + ");" +
            "height:-webkit-fill-available;" +
            "width:-webkit-fill-available;"
        // "transform: rotate(90deg);" +
        // "transform-origin: left top;" +
        // "rotation:90deg" +
        // "rotation-point:0% 0%;" +
        // "}"));
    }
    return { id, style, node };
}