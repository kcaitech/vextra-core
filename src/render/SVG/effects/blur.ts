/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Blur, BlurType, BorderPosition } from "../../../data/baseclasses";
import { Border, Fill, ShapeSize } from "../../../data";
import { randomId } from "../../basic";
import { objectId } from '../../../basic/objectid';

const handler: {
    [key: string]: (h: Function, blur: Blur, id: string, frame: ShapeSize, fills: Fill[], borders: Border | undefined, path: string) => any
} = {};

handler[BlurType.Gaussian] = (h: Function, blur: Blur, id: string, frame: ShapeSize) => {
    const props: any = {
        id: id,
        x: '-20%',
        y: '-20%',
        height: '140%',
        width: '140%',
        'color-interpolation-filters': "sRGB"
    }
    const fe_flood = {
        'flood-opacity': `0`,
        result: `BackgroundImageFix`
    }
    const fe_blend = {
        mode: "normal",
        in: "SourceGraphic",
        in2: "BackgroundImageFix",
        result: "shape"
    }
    const percentx = (blur.saturation / frame.width) * 100;
    const percenty = (blur.saturation / frame.height) * 100;
    props.x = -(percentx + 20) + "%"
    props.y = -(percenty + 20) + "%"
    props.width = ((percentx * 2) + 140) + "%"
    props.height = ((percenty * 2) + 140) + "%"
    const fe_gaussian_blur = {
        stdDeviation: blur.saturation / 2
    }
    return h('defs', {}, [
        h('filter', props, [
            h('feFlood', fe_flood),
            h('feBlend', fe_blend),
            h('feGaussianBlur', fe_gaussian_blur)
        ])
    ]);
}

handler[BlurType.Background] = (h: Function, blur: Blur, id: string, frame: ShapeSize, fills: Fill[], border: Border | undefined, path: string) => {
    // const alphaFill = opacity(fills);
    const alphaBorder = opacity(border ? border.strokePaints : []);
    // if (!alphaFill && !alphaBorder) return;
    const _id = "mask-blur" + objectId(blur) + randomId();
    const width = frame.width;
    const height = frame.height;
    let style: any = {
        width: "100%",
        height: "100%",
    }
    let elArr = [];
    const props: any = {
        x: 0, y: 0, width, height
    }
    const children = [h("path", { d: path, fill: "white" })];
    if (alphaBorder && border) {
        const isEnabled = border.strokePaints.some(p => p.isEnabled);
        if (isEnabled && border.position !== BorderPosition.Inner) {
            let sw = border.sideSetting.thicknessTop;
            if (border.position === BorderPosition.Outer) sw *= 2;
            const props: any = { d: path, fill: 'white', stroke: 'white', 'stroke-width': sw };
            if (border.borderStyle.gap) props['stroke-dasharray'] = 10
            children.push(h('path', props));
        }
    }
    const mask = h("mask", { id: _id }, children);
    elArr.push(mask);
    style['backdrop-filter'] = `blur(${blur.saturation / 2}px)`;
    style['mask'] = "url(#" + _id + ")";
    const div = h('div', { style: style });
    const foreignObject = h("foreignObject", props, div);
    elArr.push(foreignObject);
    return h('g', elArr);
}

export function render(h: Function, blur: Blur, id: string, frame: ShapeSize, fills: Fill[], borders: Border | undefined, path: string) {
    if (!blur || !blur.isEnabled) return [];
    const el = handler[blur.type](h, blur, id, frame, fills, borders, path);
    if (!el) return [];
    return [el];
}

const opacity = (t: (Fill)[]) => {
    for (let i = 0; i < t.length; i++) {
        const __t = t[i];
        if (__t.color.alpha > 0 && __t.isEnabled) return true;
    }
    return false;
}
