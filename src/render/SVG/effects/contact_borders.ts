/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */



import { objectId } from "../../../basic/objectid";
import { Border, FillType, MarkerType, Shape, Fill, Style } from "../../../data/classes";
import { render as rm } from "./marker";

function handler(h: Function, style: Style, border: Border, path: string, shape: Shape, strokePaint: Fill, startMarkerType?: MarkerType, endMarkerType?: MarkerType): any {
    const thickness = border.sideSetting.thicknessTop;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': thickness
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) body_props['stroke-dasharray'] = `${length}, ${gap}`;
    const fillType = strokePaint.fillType;
    if (fillType === FillType.SolidColor) {
        const color = strokePaint.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    } else if (fillType === FillType.Gradient) {
        const color = strokePaint.color;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha) + ")";
    }
    const g_cs: any[] = [h('path', body_props)];
    if (endMarkerType !== MarkerType.Line || startMarkerType !== MarkerType.Line) {
        if (endMarkerType && endMarkerType !== MarkerType.Line) {
            const id = "e-" + objectId(shape);
            g_cs.unshift(rm(h, style, border, endMarkerType, id, strokePaint));
            body_props['marker-end'] = `url(#arrow-${id})`;
        }
        if (startMarkerType && startMarkerType !== MarkerType.Line) {
            const id = "s-" + objectId(shape);
            g_cs.unshift(rm(h, style, border, startMarkerType, id, strokePaint));
            body_props['marker-start'] = `url(#arrow-${id})`;
        }
        return g_cs;
    } else {
        return h('path', body_props);
    }
}


export function render(h: Function, style: Style, path: string, shape: Shape): Array<any> {
    const border = style.borders;
    let elArr = new Array();
    if (!border) return elArr;
    const bc = border.strokePaints.length;
    const sm = style.startMarkerType, em = style.endMarkerType;
    for (let i = 0; i < bc; i++) {
        const strokePaint: Fill = border.strokePaints[i];
        if (!strokePaint.isEnabled) continue;
        (() => {
            elArr = elArr.concat(handler(h, style, border, path, shape, strokePaint, sm, em));
        })()
    }
    return elArr;
}