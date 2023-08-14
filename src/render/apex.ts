

import { Border, ShapeFrame, Style, MarkerType } from "../data/classes";
const apexe: { [key: string]: (h: Function, style: Style, frame: ShapeFrame, border: Border, r: number) => any } = {};
const apexs: { [key: string]: (h: Function, style: Style, frame: ShapeFrame, border: Border, r: number) => any } = {};

apexe[MarkerType.FilledArrow] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
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
    const g_props: any = {};
    const s: any = {}
    s.transform = "translate(" + a.x + "px," + a.y + "px) "
    s.transform += "rotate(" + rad + "rad) "
    s.transform += "translate(" + (- af.w) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexe[MarkerType.OpenArrow] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
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
    const af = { w: range * 4, h: range * 4 };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    body_props2.d = `M0 0 L${af.w / 2} ${af.h / 2} L0 ${af.h}`;
    const g_props: any = {};
    const s: any = {}
    s.transform = "translate(" + a.x + "px," + a.y + "px) "
    s.transform += "rotate(" + rad + "rad) "
    s.transform += "translate(" + (- af.w / 2) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexe[MarkerType.FilledCircle] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
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
    s.transform = "translate(" + a.x + "px," + a.y + "px) "
    s.transform += "rotate(" + rad + "rad) "
    s.transform += "translate(" + (- af.w) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("circle", body_props2)]);
}
apexe[MarkerType.FilledSquare] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
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
    const g_props: any = {};
    const s: any = {}
    s.transform = "translate(" + a.x + "px," + a.y + "px) "
    s.transform += "rotate(" + rad + "rad) "
    s.transform += "translate(" + (- af.w) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexe[MarkerType.Round] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "none",
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    const a = { x: frame.width, y: frame.height };
    const af = { w: range, h: range };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    const rr = range / 2;
    body_props2.d = `M0 0  a${rr},${rr} 0 0 1 0,${2 * rr}  z`;
    const g_props: any = {};
    const s: any = {}
    s.transform = "translate(" + a.x + "px," + a.y + "px) "
    s.transform += "rotate(" + rad + "rad) "
    s.transform += "translate(0px," + (-rr) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexe[MarkerType.Square] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "none",
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    const a = { x: frame.width, y: frame.height };
    const af = { w: range, h: range };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    const rr = range / 2;
    body_props2.d = `M0 0  h${rr} v${2 * rr} h${-rr}  z`;
    const g_props: any = {};
    const s: any = {}
    s.transform = "translate(" + a.x + "px," + a.y + "px) "
    s.transform += "rotate(" + rad + "rad) "
    s.transform += "translate(0px," + (-rr) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexs[MarkerType.FilledArrow] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
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
    body_props2.d = `M0 ${af.h / 2} L${af.w} 0 v${af.h} z`;
    const g_props: any = {};
    const s: any = {}
    s.transform = "rotate(" + rad + "rad) "
    s.transform += "translate(0px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexs[MarkerType.OpenArrow] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
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
    const af = { w: range * 4, h: range * 4 };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    body_props2.d = `M${af.w} 0 L${af.w / 2} ${af.h / 2} L${af.w}  ${af.h}`;
    const g_props: any = {};
    const s: any = {}
    s.transform = "rotate(" + rad + "rad) "
    s.transform += "translate(" + (- af.w / 2) + "px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexs[MarkerType.FilledCircle] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
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
    s.transform = "rotate(" + rad + "rad) "
    s.transform += "translate(0px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("circle", body_props2)]);
}
apexs[MarkerType.FilledSquare] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
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
    body_props2.d = `M${af.w / 2} 0 L${af.w} ${af.h / 2} L${af.w / 2} ${af.h} L0 ${af.h / 2} z`;
    const g_props: any = {};
    const s: any = {}
    s.transform = "rotate(" + rad + "rad) "
    s.transform += "translate(0px," + (- af.h / 2) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexs[MarkerType.Round] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "none",
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    const a = { x: frame.width, y: frame.height };
    const af = { w: range, h: range };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    const rr = range / 2;
    body_props2.d = `M${range} ${0}  a${rr},${rr} 0 0 0 0,${2 * rr}  z`;
    const g_props: any = {};
    const s: any = {}
    s.transform = "rotate(" + rad + "rad) "
    s.transform += "translate(" + (-range) + "px," + (-rr) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}
apexs[MarkerType.Square] = function (h: Function, style: Style, frame: ShapeFrame, border: Border, rad: number) {
    const color = border.color;
    const opacity = style.contextSettings.opacity;
    const range = border.thickness;
    const body_props1: any = {
        stroke: 'none',
        fill: 'none',
    }
    const body_props2: any = {
        stroke: "none",
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    const af = { w: range, h: range };
    body_props1.d = `M0 0 h${af.w} v${af.h} h${-af.w} z`;
    const rr = range / 2;
    body_props2.d = `M${range} ${0}  h${-rr} v${2 * rr} h${rr}  z`;
    const g_props: any = {};
    const s: any = {}
    s.transform = "rotate(" + rad + "rad) "
    s.transform += "translate(" + (-range) + "px," + (-rr) + "px) ";
    g_props.style = s;
    return h('g', g_props, [h("path", body_props1), h("path", body_props2)]);
}

export function render(h: Function, style: Style, frame: ShapeFrame, b: Border, r: number, sm?: MarkerType, em?: MarkerType): Array<any> {
    const elArr = new Array();
    if (em && em !== MarkerType.Line) {
        elArr.push(apexe[em](h, style, frame, b, r))
    }
    if (sm && sm !== MarkerType.Line) {
        elArr.push(apexs[sm](h, style, frame, b, r))
    }
    return elArr;
}