/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { render as renderGradient } from "./gradient";
import { objectId } from '../../../basic/objectid';
import {
    Border,
    BorderPosition,
    Fill,
    FillType,
    Gradient,
    GradientType,
    ShapeSize,
} from "../../../data";
import { randomId } from "../../basic";
import { renderCustomBorder } from "./border_custom";
import { EL } from "../../../dataview";

const handler: {
    [key: string]: (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill) => EL
} = {};
const angularHandler: {
    [key: string]: (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill) => EL
} = {};

angularHandler[BorderPosition.Inner] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill): EL {
    const rId = randomId();
    const clipId = "clippath-border" + objectId(strokePaints) + rId;
    const maskId = "mask-border" + objectId(strokePaints) + rId;
    const thickness = border.sideSetting.thicknessTop;
    const width = frame.width;
    const height = frame.height;
    const g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
    const opacity = strokePaints.gradient?.gradientOpacity;
    const path_props: any = {
        d: path,
        stroke: "white",
        'stroke-width': 2 * thickness,
        "clip-path": "url(#" + clipId + ")",
        "stroke-linejoin": border.cornerType,
        opacity: opacity === undefined ? 1 : opacity
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`
    }
    return h("g", [
        h("mask", {
            id: maskId,
            width,
            height
        }, [
            h("rect", {
                x: 0,
                y: 0,
                width,
                height,
                fill: "black"
            }),
            h("clipPath", { id: clipId }, h("path", {
                d: path,
                "clip-rule": "evenodd",
            })),
            h('path', path_props)
        ]),

        h("foreignObject", {
            x: 0,
            y: 0,
            width,
            height,
            mask: "url(#" + maskId + ")"
        },
            h("div", { width: "100%", height: "100%", style: g_.style }))
    ]);
}

angularHandler[BorderPosition.Center] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill): EL {
    const rId = randomId();
    const maskId = "mask-border" + objectId(strokePaints) + rId;
    const thickness = border.sideSetting.thicknessTop;
    const g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
    const x = -thickness / 2;
    const y = -thickness / 2;
    const width = frame.width + thickness;
    const height = frame.height + thickness;
    const opacity = strokePaints.gradient?.gradientOpacity;
    const path_props: any = {
        d: path,
        stroke: "white",
        'stroke-width': thickness,
        "stroke-linejoin": border.cornerType,
        opacity: opacity === undefined ? 1 : opacity
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`
    }
    return h("g", [
        h("mask", {
            id: maskId,
            maskContentUnits: "userSpaceOnUse",
            x,
            y,
            width,
            height
        }, [
            h("rect", { x, y, width, height, fill: "black" }),
            h("path", path_props)
        ]),
        h("foreignObject", {
            width,
            height,
            x,
            y,
            mask: "url(#" + maskId + ")"
        },
            h("div", { width: "100%", height: "100%", style: g_.style })),
    ])
}

angularHandler[BorderPosition.Outer] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill): EL {
    const thickness = border.sideSetting.thicknessTop;
    const g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
    const width = frame.width + 2 * thickness;
    const height = frame.height + 2 * thickness;
    const x = -thickness;
    const y = -thickness;
    const rId = randomId();
    const mask1Id = "mask1-border" + objectId(strokePaints) + rId;
    const mask2Id = "mask2-border" + objectId(strokePaints) + rId;
    const opacity = strokePaints.gradient?.gradientOpacity;
    const path_props: any = {
        d: path,
        stroke: "white",
        'stroke-width': 2 * thickness,
        mask: "url(#" + mask1Id + ")",
        "stroke-linejoin": border.cornerType,
        opacity: opacity === undefined ? 1 : opacity
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        path_props['stroke-dasharray'] = `${length}, ${gap}`
    }
    return h("g", [
        h("mask", {
            id: mask2Id,
            x, y,
            width,
            height
        }, [
            h("mask", {
                id: mask1Id,
                x: -thickness, y: -thickness,
                width,
                height
            }, [
                h("path", { d: path, fill: "black", 'stroke-width': 2 * thickness, stroke: 'white' }),
                h("path", { d: path, fill: "black" }),
            ]),
            h("rect", { x, y, width, height, fill: "black" }),
            h('path', path_props)
        ]),
        h("foreignObject", {
            width: width + (6 * thickness),
            height: height + (6 * thickness),
            x: x - (3 * thickness),
            y: y - (3 * thickness),
            mask: "url(#" + mask2Id + ")"
        },
            h("div", { width: "100%", height: "100%", style: g_.style })),
    ]);
}

handler[BorderPosition.Inner] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill): EL {
    const rId = randomId();
    const clipId = "clippath-border" + objectId(strokePaints) + rId;
    const thickness = border.sideSetting.thicknessTop;
    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': 2 * thickness,
        "stroke-linejoin": border.cornerType,
        'clip-path': "url(#" + clipId + ")"
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`
    }
    const fillType = strokePaints.fillType;
    if (fillType == FillType.SolidColor) {
        const color = strokePaints.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, strokePaints.gradient!, frame);
        const opacity = strokePaints.gradient!.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
        body_props.stroke = "url(#" + g_.id + ")";
    }

    const elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    elArr.push(
        h("clipPath", { id: clipId }, h("path", {
            d: path,
            "clip-rule": "evenodd",
        })),
        h('path', body_props)
    );
    return h("g", elArr);
}

handler[BorderPosition.Center] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill): EL {
    const thickness = border.sideSetting.thicknessTop;
    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        "stroke-linejoin": border.cornerType,
        'stroke-width': thickness
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`
    }

    const fillType = strokePaints.fillType;
    if (fillType == FillType.SolidColor) {
        const color = strokePaints.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
        const opacity = strokePaints.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
        body_props.stroke = "url(#" + g_.id + ")";
    }
    const body = h('path', body_props);
    if (g_ && g_.node) {
        return h("g", [g_.node, body]);
    } else {
        return body;
    }
}

handler[BorderPosition.Outer] = function (h: Function, frame: ShapeSize, border: Border, path: string, strokePaints: Fill): EL {
    const thickness = border.sideSetting.thicknessTop;

    let g_;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        "stroke-linejoin": border.cornerType,
        'stroke-width': 2 * thickness,
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) {
        body_props['stroke-dasharray'] = `${length}, ${gap}`;
    }
    const fillType = strokePaints.fillType;
    if (fillType == FillType.SolidColor) {
        const color = strokePaints.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else {
        g_ = renderGradient(h, strokePaints.gradient as Gradient, frame);
        const opacity = strokePaints.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity;
        body_props.stroke = "url(#" + g_.id + ")";
    }

    const rId = randomId();
    const maskId = "mask-border" + objectId(strokePaints) + rId;
    body_props.mask = "url(#" + maskId + ")";

    const width = frame.width + 2 * thickness;
    const height = frame.height + 2 * thickness;

    const elArr = [];
    if (g_ && g_.node) {
        elArr.push(g_.node);
    }
    const mask = h(
        "mask",
        { id: maskId, x: -thickness, y: -thickness, width, height },
        [
            h("path", { d: path, fill: "black", 'stroke-width': 2 * thickness, stroke: 'white' }),
            h("path", { d: path, fill: "black" }),
        ]
    )
    const b_ = h('path', body_props);
    elArr.push(mask, b_);
    return (h("g", elArr));
}

export function render(h: Function, border: Border, frame: ShapeSize, path: string, radius: number[], customSide: boolean): EL[] {
    const elArr: EL[] = [];
    for (const fill of border.strokePaints) {
        if (!fill.isEnabled) continue;
        if (customSide) {
            elArr.push(renderCustomBorder(h, frame, border, path, fill, radius));
            continue;
        }
        if (fill.fillType == FillType.SolidColor) {
            elArr.push(handler[border.position](h, frame, border, path, fill));
        } else if (fill.fillType == FillType.Gradient) {
            const gradientType = fill.gradient!.gradientType;
            if (gradientType === GradientType.Angular) {
                elArr.push(angularHandler[border.position](h, frame, border, path, fill));
            } else {
                elArr.push(handler[border.position](h, frame, border, path, fill));
            }
        }
    }
    return elArr;
}