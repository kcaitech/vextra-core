/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Fill, FillType, Gradient, ShapeSize } from "../../../data";
import { render as renderGradient } from "./gradient";
import { render as clippathR } from "./clippath"
import { objectId } from "../../../basic/objectid";
import { patternRender } from "./pattern";
import { EL } from "../../../dataview";

function randomId() {
    return Math.floor((Math.random() * 100000) + 1);
}

const handler: { [key: string]: (h: Function, fill: Fill, path: string, frame: ShapeSize) => EL } = {};
handler[FillType.SolidColor] = function (h: Function, fill: Fill, path: string): EL {
    const color = fill.color;
    return h("path", {
        class: 'fill-' + randomId(),
        d: path,
        fill: "rgb(" + color.red + "," + color.green + "," + color.blue + ")",
        "fill-opacity": color.alpha,
        stroke: 'none',
        'stroke-width': 0,
        "fill-rule": fill.fillRule || "evenodd",
    });
}

handler[FillType.Gradient] = function (h: Function, fill: Fill, path: string, frame: ShapeSize): EL {
    const opacity = fill.gradient?.gradientOpacity;
    const elArr = [];
    const g_ = renderGradient(h, fill.gradient as Gradient, frame);
    if (g_.node) elArr.push(g_.node);
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
            class: objectId(fill) + randomId(),
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

handler[FillType.Pattern] = function (h: Function, fill: Fill, path: string, frame: ShapeSize): EL {
    const id = "pattern-fill-" + objectId(fill) + randomId();
    const color = fill.color.alpha ?? 1;
    const pattern = patternRender(h, frame, id, path, fill);

    const _path = h('path', {
        d: path,
        fill: 'url(#' + id + ')',
        "fill-opacity": color
    })

    return h("g", [pattern, _path]);
}

export function render(h: Function, fills: Fill[], frame: ShapeSize, path: string): EL[] {
    const elArr: EL[] = [];
    for (const fill of fills) {
        if (!fill.isEnabled) continue;
        elArr.push(handler[fill.fillType](h, fill, path, frame));
    }
    return elArr;
}