/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    Border,
    BorderPosition,
    Fill,
    FillType,
    Gradient,
    Shape,
    ShapeSize,
    ShapeType,
    SideType,
    GradientType,
    Stop,
    Color
} from "../../../data";
import { renderCustomBorder } from "./border_custom";
import { randomId } from "../../basic";
import { render as clippathR } from "./clippath";
import { objectId } from "../../../basic/objectid";

// 渐变色 - 纯白色
const defaultColor = Color.DefaultColor;

function renderStop(h: Function, d: Stop): any {
    return h("stop", {
        offset: "" + (d.position * 100) + "%",
        "stop-color": "rgb(255, 255, 255)",
        "stop-opacity": d.color.alpha || 1
    });
}

function renderGradient(h: Function, value: Gradient, frame: ShapeSize): {
    id: string,
    style: string | undefined,
    node: any
} {
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
    } else if (value.gradientType == GradientType.Radial) {
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
                    "rotate(" + rotate + ") " +
                    "scale(" + scaleX + " " + scaleY + ")"
            },
            childs);
    } else if (value.gradientType == GradientType.Angular) {
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
        const from = "from " + rotate + "deg at " + value.from.x * 100 + "% " + value.from.y * 100 + "%";
        style =
            "background: conic-gradient(" + from + "," + gradient + ");" +
            "height:-webkit-fill-available;" +
            "width:-webkit-fill-available;"
    }
    return { id, style, node };
}

// 填充 - 纯白色、纯色、渐变色
const fillHandler: { [key: string]: (h: Function, frame: ShapeSize, fill: Fill, path: string) => any } = {};
fillHandler[FillType.SolidColor] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): any {
    const color = fill.color;
    return h("path", {
        d: path,
        fill: "rgb(255, 255, 255)",
        "fill-opacity": (color ? color.alpha : 1),
        stroke: 'none',
        'stroke-width': 0,
        "fill-rule": fill.fillRule || "evenodd",
    });
}

fillHandler[FillType.Gradient] = function (h: Function, frame: ShapeSize, fill: Fill, path: string): any {
    const opacity = fill.gradient?.gradientOpacity;
    const elArr = [];
    const g_ = renderGradient(h, fill.gradient as Gradient, frame);
    if (g_.node) {
        elArr.push(g_.node);
    }
    const gid = g_.id;
    const gStyle = g_.style;
    if (gStyle) {
        const id = "clippath-fill-" + objectId(fill) + randomId();
        const cp = clippathR(h, id, path);
        elArr.push(cp);
        elArr.push(h("foreignObject", {
                width: frame.width, height: frame.height, x: 0, y: 0,
                "clip-path": "url(#" + id + ")",
                opacity: opacity === undefined ? 1 : opacity
            },
            h("div", { width: "100%", height: "100%", style: gStyle })));
    } else {
        elArr.push(h('path', {
            d: path,
            fill: "url(#" + gid + ")",
            "fill-opacity": opacity === undefined ? 1 : opacity,
            stroke: 'none',
            'stroke-width': 0,
            "fill-rule": fill.fillRule || "evenodd",
        }));
    }
    return h("g", elArr);
}