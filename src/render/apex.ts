

import { Border, ShapeFrame, Style, MarkerType } from "../data/classes";
const apexe: { [key: string]: (h: Function, style: Style, frame: ShapeFrame, border: Border) => any } = {};
const apexs: { [key: string]: (h: Function, style: Style, frame: ShapeFrame, border: Border) => any } = {};

function getHorizontalAngle(A: { x: number, y: number }, B: { x: number, y: number }) {
    const deltaX = B.x - A.x, deltaY = B.y - A.y;
    const angleInDegrees = Math.atan2(deltaY, deltaX) * 180 / Math.PI, angle = (angleInDegrees + 360) % 360;
    return angle;
}
apexe[MarkerType.FilledArrow] = function (h: Function, style: Style, frame: ShapeFrame, border: Border) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    const a = { x: frame.width, y: frame.height };
    const af = { w: range * 3, h: range * 3 };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    body_props2.d = `M0 0 L${af.w} ${af.h / 2} L0 ${af.h} z`;
    const r = getHorizontalAngle({ x: 0, y: 0 }, a);
    const g_props: any = {};
    const s: any = {}
    s.transform = "translate(" + a.x + "px," + a.y + "px) "
    s.transform += "rotate(" + r + "deg) "
    s.transform += "translate(" + (- af.w / 2) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexe[MarkerType.OpenArrow] = function (h: Function, style: Style, frame: ShapeFrame, border: Border) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
        fill: "none",
        'stroke-width': range,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }
    const a = { x: frame.width, y: frame.height };
    const af = { w: range * 6, h: range * 6 };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    body_props2.d = `M0 0 L${af.w / 2} ${af.h / 2} L0 ${af.h}`;
    const r = getHorizontalAngle({ x: 0, y: 0 }, a);
    const g_props: any = {};
    const s: any = {}
    s.transform = "translate(" + a.x + "px," + a.y + "px) "
    s.transform += "rotate(" + r + "deg) "
    s.transform += "translate(" + (- af.w / 2) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexe[MarkerType.FilledCircle] = function (h: Function, style: Style, frame: ShapeFrame, border: Border) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    const a = { x: frame.width, y: frame.height };
    const af = { w: range * 3, h: range * 3 };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    const r = af.h / 2;
    body_props2.cx = r, body_props2.cy = r, body_props2.r = r;
    const g_props: any = {};
    const s: any = {}
    s.transform = "translate(" + (a.x - af.w / 2) + "px," + (a.y - af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("circle", body_props2)]);
}
apexe[MarkerType.FilledSquare] = function (h: Function, style: Style, frame: ShapeFrame, border: Border) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    const a = { x: frame.width, y: frame.height };
    const af = { w: range * 3, h: range * 3 };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    body_props2.d = `M${af.w / 2} 0 L${af.w} ${af.h / 2} L${af.w / 2} ${af.h} L0 ${af.h / 2} z`;
    const r = getHorizontalAngle({ x: 0, y: 0 }, a);
    const g_props: any = {};
    const s: any = {}
    s.transform = "translate(" + a.x + "px," + a.y + "px) "
    s.transform += "rotate(" + r + "deg) "
    s.transform += "translate(" + (- af.w / 2) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexs[MarkerType.FilledArrow] = function (h: Function, style: Style, frame: ShapeFrame, border: Border) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    const a = { x: frame.width, y: frame.height };
    const af = { w: range * 3, h: range * 3 };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    body_props2.d = `M0 ${af.h / 2} L${af.w} 0 v${af.h} z`;
    const r = getHorizontalAngle({ x: 0, y: 0 }, a);
    const g_props: any = {};
    const s: any = {}
    s.transform = "rotate(" + r + "deg) "
    s.transform += "translate(" + (- af.w / 2) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexs[MarkerType.OpenArrow] = function (h: Function, style: Style, frame: ShapeFrame, border: Border) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
        fill: "none",
        'stroke-width': range,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    }
    const a = { x: frame.width, y: frame.height };
    const af = { w: range * 6, h: range * 6 };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    body_props2.d = `M${af.w} 0 L${af.w / 2} ${af.h / 2} L${af.w}  ${af.h}`;
    const r = getHorizontalAngle({ x: 0, y: 0 }, a);
    const g_props: any = {};
    const s: any = {}
    s.transform = "rotate(" + r + "deg) "
    s.transform += "translate(" + (- af.w / 2) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexs[MarkerType.FilledCircle] = function (h: Function, style: Style, frame: ShapeFrame, border: Border) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    const af = { w: range * 3, h: range * 3 };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    const r = af.h / 2;
    body_props2.cx = r, body_props2.cy = r, body_props2.r = r;
    const g_props: any = {};
    const s: any = {}
    s.transform = "translate(" + (-r) + "px," + (-r) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("circle", body_props2)]);
}
apexs[MarkerType.FilledSquare] = function (h: Function, style: Style, frame: ShapeFrame, border: Border) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    const a = { x: frame.width, y: frame.height };
    const af = { w: range * 3, h: range * 3 };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    body_props2.d = `M${af.w / 2} 0 L${af.w} ${af.h / 2} L${af.w / 2} ${af.h} L0 ${af.h / 2} z`;
    const r = getHorizontalAngle({ x: 0, y: 0 }, a);
    const g_props: any = {};
    const s: any = {}
    s.transform = "rotate(" + r + "deg) "
    s.transform += "translate(" + (- af.w / 2) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}

export function render(h: Function, style: Style, frame: ShapeFrame): Array<any> {
    const bs = style.borders, elArr = new Array(), b = bs[0];
    if (b.endMarkerType !== MarkerType.Line) {
        elArr.push(apexe[b.endMarkerType](h, style, frame, bs[0]))
    }
    if (b.startMarkerType !== MarkerType.Line) {
        elArr.push(apexs[b.startMarkerType](h, style, frame, bs[0]))
    }
    return elArr;
}