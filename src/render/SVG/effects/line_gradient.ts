/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { objectId } from "../../../basic/objectid";
import { Color, Gradient, GradientType, Stop, ShapeSize } from "../../../data/classes";

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

export function render(h: Function, value: Gradient, frame: ShapeSize, thickness: number): { id: string, style: string | undefined, node: any } {
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
            x1: value.from.x * frame.width,
            y1: value.from.y * frame.height,
            x2: value.to.x * frame.width,
            y2: value.to.y * frame.height,
            gradientUnits: "userSpaceOnUse",
        }, childs);
    }
    else if (value.gradientType == GradientType.Radial) {
        const stopSCount = value.stops.length;
        const childs = [];
        for (let i = 0; i < stopSCount; i++) {
            const s = value.stops[i];
            childs.push(renderStop(h, s));
        }
        const l = Math.sqrt((value.to.y * frame.height - value.from.y * frame.height) ** 2 + (value.to.x * frame.width - value.from.x * frame.width) ** 2);
        const scaleX = l;
        const scaleY = value.elipseLength ? (value.elipseLength * l * frame.width / frame.height) : 0;
        const rotate = Math.atan2((value.to.y * frame.height - value.from.y * frame.height), (value.to.x * frame.width - value.from.x * frame.width)) / Math.PI * 180;

        node = h("radialGradient", {
            id,
            cx: 0,
            cy: 0,
            r: 1,
            gradientUnits: "userSpaceOnUse",
            gradientTransform: "translate(" + value.from.x * frame.width + "," + value.from.y * frame.height + ") " +
                // "scale(0.955224, 1.0)," + // todo
                "rotate(" + rotate + ") " +
                "scale(" + scaleX + " " + scaleY + ")"
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
        const rotate = Math.atan2((value.to.y * frame.height - value.from.y * frame.height), (value.to.x * frame.width - value.from.x * frame.width)) / Math.PI * 180 + 90;
        // const from = "from " + rotate + "deg at " + ((value.from.x * frame.width) + (thickness * 6)) + "px " + ((value.from.y * frame.height) + (thickness * 6)) + "px";
        const from = "from " + rotate + "deg at " + value.from.x * 100 + "% " + value.from.y * 100 + "%";
        style =
            "background: conic-gradient(" + from + "," + gradient + ");" +
            "height:-webkit-fill-available;" +
            "width:-webkit-fill-available;"
    }
    return { id, style, node };
}



