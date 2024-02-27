import { objectId } from "../basic/objectid";
import { ShapeFrame, Color, Gradient, GradientType, Stop } from "../data/classes";

const defaultColor = Color.DefaultColor;
function toRGBA(color: Color): string {
    return "rgba(" + color.red + "," + color.green + "," + color.blue + "," + color.alpha + ")";
}

export function render(value: Gradient, frame: ShapeFrame, thickness: number): { id: string, style: string | undefined, node: any } {
    const id = "gradient" + objectId(value);
    let style;
    let node: any;
    if (value.gradientType == GradientType.Linear) {
        const { from, to, stops } = value;
        let rotate = Math.atan2((to.y * frame.height - from.y * frame.height), (to.x * frame.width - from.x * frame.width)) / Math.PI * 180 + 90;
        const colors: any[] = [];
        if (stops.length === 1) {
            style =
                "background: " + toRGBA(stops[0].color as Color) + ";" +
                "height:-webkit-fill-available;" +
                "width:-webkit-fill-available;"
        }
        const sort_p = [];
        const l = frame.height / (frame.height + (thickness * 12));
        const slope = (to.y - from.y) / (to.x - from.x);
        let M = 1;
        let _from = { x: 0, y: 0 }
        let _to = { x: 0, y: 0 }
        if (from.x - to.x === 0 && from.y - to.y === 0) {
            _from = { x: 0, y: 0 };
            _to = { x: 0, y: 0 };
            rotate = 0;
        } else if (from.y - to.y === 0) {
            _from = { x: from.x, y: 0 };
            _to = { x: to.x, y: 0 };
        } else if (from.x - to.x === 0) {
            _from = { x: 0, y: from.y };
            _to = { x: 0, y: to.y };
        } else {
            const { distance, d } = linear_distance(from, to, slope, frame);
            M = distance;
            const d1 = (from.y * frame.height) + ((from.x * frame.width) / slope);
            const d2 = (to.y * frame.height) + ((to.x * frame.width) / slope);
            const { f, t } = map_from_to(d, d1, d2, slope);
            _from = f;
            _to = t;
        }
        
        for (let i = 0; i < stops.length; i++) {
            const stop = stops[i];
            const c = toRGBA(stop.color as Color);
            const x1 = _from.x + ((_to.x - _from.x) * stop.position);
            const y1 = _from.y + ((_to.y - _from.y) * stop.position);
            const m = m_len(from, to, x1, y1, frame);
            const ret = is_positive(from, to, x1, y1) ? m : -m;
            const result = ret + (thickness * 6);
            
            sort_p.push({ color: c, position: result });
        }
        if (stops.length > 1) {
            if (sort_p[0].position - sort_p[1].position > 0) {
                sort_p.sort((a, b) => a.position - b.position);
                rotate += 180;
            }
        }

        sort_p.forEach((p) => {
            colors.push(`${p.color} ${p.position}px`)
        })
        const linear = `linear-gradient(${rotate}deg,${colors.join(', ')})`
        style =
            "background: " + linear + ";" +
            "height:-webkit-fill-available;" +
            "width:-webkit-fill-available;"
    }
    else if (value.gradientType == GradientType.Radial) {
        const { from, to, stops } = value;
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
        const radial = `radial-gradient(${scaleY}px ${scaleX}px at ${from.x * frame.width + (thickness * 6)}px ${from.y * frame.height + (thickness * 6)}px, ${colors.join(', ')})`
        style =
            "background: " + radial + ";" +
            "transform-origin: " + ((to.x * frame.width) + (thickness * 6)) + "px " + ((to.y * frame.height) + (thickness * 6)) + "px;" +
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
        const rotate = Math.atan2((value.to.y * frame.height - value.from.y * frame.height), (value.to.x * frame.width - value.from.x * frame.width)) / Math.PI * 180 + 90;
        const from = "from " + rotate + "deg at " + ((value.from.x * frame.width) + (thickness * 6)) + "px " + ((value.from.y * frame.height) + (thickness * 6)) + "px";
        style =
            "background: conic-gradient(" + from + "," + gradient + ");" +
            "height:-webkit-fill-available;" +
            "width:-webkit-fill-available;"
    }
    return { id, style, node };
}

function calculateDistance(x1: number, y1: number, x2: number, y2: number) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

const linear_distance = (from: { x: number, y: number }, to: { x: number, y: number }, slope: number, frame: ShapeFrame) => {
    let ret = { distance: 0, d: 0 }
    if (to.x - from.x > 0) {
        if (to.y - from.y > 0) {
            // to为第四象限 y = kx x = y / k
            const pointy = slope * frame.width;
            const point2 = frame.height / slope;
            const distance1 = calculateDistance(0, 0, frame.width, pointy);
            const distance2 = calculateDistance(0, 0, point2, frame.height);
            ret.distance = distance2 > distance1 ? distance1 : distance2;
        } else {
            //to 为第一象限 y = kx + d  d = y - kx  x = y - d / k
            const d = frame.height;
            const pointy = slope * frame.width + d;
            const point2 = -d / slope;
            const distance1 = calculateDistance(0, frame.height, frame.width, pointy);
            const distance2 = calculateDistance(0, frame.height, point2, 0);
            ret.distance = distance2 > distance1 ? distance1 : distance2;
            ret.d = d;
        }
    } else {
        if (to.y - from.y > 0) {
            // to为第三象限 y = kx + d  d = y - kx  x = y - d / k
            const d = -slope * frame.width;
            const pointy = d;
            const point2 = (frame.height - d) / slope;
            const distance1 = calculateDistance(frame.width, 0, 0, pointy);
            const distance2 = calculateDistance(frame.width, 0, point2, frame.height);
            ret.distance = distance2 > distance1 ? distance1 : distance2;
            ret.d = d;
        } else {
            // to为第二象限 y = kx + d  d = y - kx  x = y - d / k
            const d = frame.height - (slope * frame.width);
            const pointy = d;
            const point2 = -d / slope;
            const distance1 = calculateDistance(frame.width, frame.height, 0, pointy);
            const distance2 = calculateDistance(frame.width, frame.height, point2, 0);
            ret.distance = distance2 > distance1 ? distance1 : distance2;
            ret.d = d;
        }
    }
    return ret;
}

const map_from_to = (d: number, d1: number, d2: number, slope: number) => {
    const f_x = (d1 - d) / (slope - (-1 / slope));
    const f_y = (slope * f_x) + d;
    const t_x = (d2 - d) / (slope - (-1 / slope));
    const t_y = (slope * t_x) + d;
    return { f: { x: f_x, y: f_y }, t: { x: t_x, y: t_y } }
}

const is_positive = (from: { x: number, y: number }, to: { x: number, y: number }, x: number, y: number) => {
    let result = false;
    if (to.x - from.x > 0) {
        if (to.y - from.y > 0) {
            // 第四象限
            result = x < 0 ? false : true;
        } else {
            // 第一象限
            result = x < 0 ? false : true;
        }
    } else {
        if (to.y - from.y > 0) {
            // 第三象限
            result = y < 0 ? false : true;
        } else {
            // 第二象限
            result = y > 1 ? false : true;
        }
    }
    return result;
}

const m_len = (from: { x: number, y: number }, to: { x: number, y: number }, x: number, y: number, frame: ShapeFrame) => {
    let result;
    if (to.y === from.y && to.x === from.x) {
        result = x;
    } else if (to.x === from.x) {
        result = Math.hypot(x, y);
    } else if (to.y === from.y) {
        result = Math.hypot(x, y);
    } else {
        if (to.x - from.x > 0) {
            if (to.y - from.y > 0) {
                result = Math.hypot(x, y);
            } else {
                result = Math.hypot(x, y - frame.height);
            }
        } else {
            if (to.y - from.y > 0) {
                result = Math.hypot(x - frame.width, y);
            } else {
                result = Math.hypot(x - frame.width, y - frame.height);
            }
        }
    }
    return result;
}