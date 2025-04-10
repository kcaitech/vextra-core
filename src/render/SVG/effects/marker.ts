/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Border, FillType, MarkerType, Fill, Style } from "../../../data/style";

const marker: { [key: string]: (h: Function, style: Style, border: Border, id: number | string, strokePaint: Fill) => any } = {};
marker[MarkerType.FilledArrow] = function (h: Function, style: Style, border: Border, id: number | string, strokePaint: Fill) {
    const color = strokePaint.color;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: "0 0 10 10",
        refX: 5,
        refY: 5,
        markerWidth: 10,
        markerHeight: 10,
        orient: "auto-start-reverse"
    }
    const fill_color = strokePaint.fillType === FillType.Gradient ? 'white' : "rgb(" + color.red + "," + color.green + "," + color.blue + ")"
    const marker_content_props: any = {
        d: 'M 2 2 L 8 5 L 2 8 Z',
        stroke: 'none',
        fill: fill_color
    }
    return h('marker', marker_props, [h("path", marker_content_props)]);
}
marker[MarkerType.OpenArrow] = function (h: Function, style: Style, border: Border, id: number | string, strokePaint: Fill) {
    const color = strokePaint.color;
    let marker_props: any = {
        id: "arrow-" + id,
        viewBox: '0 0 10 10',
        refX: 7.5,
        refY: 5,
        markerWidth: 10,
        markerHeight: 10,
        orient: "auto-start-reverse"
    }
    const fill_color = strokePaint.fillType === FillType.Gradient ? 'white' : "rgb(" + color.red + "," + color.green + "," + color.blue + ")"
    const marker_content_props: any = {
        points: '4,2 8,5 4,8',
        stroke: fill_color,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        fill: "none"
    }
    return h('marker', marker_props, [h("polyline", marker_content_props)]);
}
marker[MarkerType.FilledCircle] = function (h: Function, style: Style, border: Border, id: number | string, strokePaint: Fill) {
    const color = strokePaint.color;
    const range = border.sideSetting.thicknessTop;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: `0 0 ${range * 6} ${range * 6}`,
        refX: "5",
        refY: "5",
        markerWidth: range * 6,
        markerHeight: range * 6,
        orient: "auto-start-reverse"
    }
    if (range <= 1) {
        delete marker_props.viewBox;
        marker_props.markerWidth = 12;
        marker_props.markerHeight = 12
    }
    const fill_color = strokePaint.fillType === FillType.Gradient ? 'white' : "rgb(" + color.red + "," + color.green + "," + color.blue + ")"
    const marker_content_props: any = {
        cx: 5, cy: 5, r: 3,
        stroke: 'none',
        fill: fill_color,
    }
    return h('marker', marker_props, [h("circle", marker_content_props)]);
}
marker[MarkerType.FilledSquare] = function (h: Function, style: Style, border: Border, id: number | string, strokePaint: Fill) {
    const color = strokePaint.color;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: '0 0 10 10',
        refX: 5,
        refY: 5,
        markerWidth: 10,
        markerHeight: 10,
        orient: "auto-start-reverse"
    }

    const fill_color = strokePaint.fillType === FillType.Gradient ? 'white' : "rgb(" + color.red + "," + color.green + "," + color.blue + ")"
    const marker_content_props: any = {
        d: 'M5 2 L8 5 L5 8 L2 5 z',
        stroke: 'none',
        fill: fill_color
    }
    return h('marker', marker_props, [h("path", marker_content_props)]);
}
marker[MarkerType.Square] = function (h: Function, style: Style, border: Border, id: number | string, strokePaint: Fill) {
    const color = strokePaint.color;
    const range = border.sideSetting.thicknessTop;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: `0 0 ${range * 6} ${range * 6}`,
        refX: "3",
        refY: "3",
        markerWidth: range,
        markerHeight: range,
        orient: "auto-start-reverse"
    }
    if (range <= 1) {
        marker_props.markerWidth = 2;
        marker_props.markerHeight = 2
        marker_props.viewBox = `0 0 ${12} ${12}`;
    }
    const fill_color = strokePaint.fillType === FillType.Gradient ? 'white' : "rgb(" + color.red + "," + color.green + "," + color.blue + ")"
    const marker_content_props: any = {
        width: 6,
        height: 6,
        stroke: 'none',
        fill: fill_color
    }
    return h('marker', marker_props, [h("rect", marker_content_props)]);
}
marker[MarkerType.Round] = function (h: Function, style: Style, border: Border, id: number | string, strokePaint: Fill) {
    const color = strokePaint.color;
    const range = border.sideSetting.thicknessTop;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: `0 0 ${range * 6} ${range * 6}`,
        refX: "5",
        refY: "5",
        markerWidth: range,
        markerHeight: range,
        orient: "auto-start-reverse",
    }
    if (range <= 2) {
        marker_props.markerWidth = 2;
        marker_props.markerHeight = 2
        marker_props.viewBox = `0 0 ${12} ${12}`;
    }
    const fill_color = strokePaint.fillType === FillType.Gradient ? 'white' : "rgb(" + color.red + "," + color.green + "," + color.blue + ")"
    const marker_content_props: any = {
        // d: "M 0 2 A 3 3 0 1 1 0 8z",
        cx: 5, cy: 5, r: 3,
        stroke: 'none',
        fill: fill_color
    }
    return h('marker', marker_props, [h("circle", marker_content_props)]);
}

export function render(h: Function, style: Style, border: Border, markerType: MarkerType, id: number | string, strokePaint: Fill): any {
    return marker[markerType](h, style, border, id, strokePaint);
}