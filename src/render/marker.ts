import { Border, MarkerType, Style } from "../data/style";

const marker: { [key: string]: (h: Function, style: Style, border: Border, id: number | string) => any } = {};
marker[MarkerType.FilledArrow] = function (h: Function, style: Style, border: Border, id: number | string) {
    const color = border.color;
    const opacity = style.contextSettings?.opacity || 1;
    const range = border.thickness;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: "0 0 10 10",
        refX: "5",
        refY: "5",
        markerWidth: range * 2,
        markerHeight: range * 2,
        orient: "auto-start-reverse"
    }
    const marker_content_props: any = {
        d: 'M 0 0 L 10 5 L 0 10 Z',
        stroke: 'none',
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")"
    }
    return h('marker', marker_props, [h("path", marker_content_props)]);
}
marker[MarkerType.OpenArrow] = function (h: Function, style: Style, border: Border, id: number | string) {
    const color = border.color;
    const opacity = style.contextSettings?.opacity || 1;
    const range = border.thickness;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: "0 0 10 10",
        refX: "7.5",
        refY: "5",
        markerWidth: range * 2,
        markerHeight: range * 2,
        orient: "auto-start-reverse"
    }
    const marker_content_props: any = {
        d: 'M 2 2 L 8 5 L 2 8',
        stroke: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
        'stroke-width': range,
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        fill: "none"
    }
    return h('marker', marker_props, [h("path", marker_content_props)]);
}
marker[MarkerType.FilledCircle] = function (h: Function, style: Style, border: Border, id: number | string) {
    const color = border.color;
    const opacity = style.contextSettings?.opacity || 1;
    const range = border.thickness;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: "0 0 10 10",
        refX: "5",
        refY: "5",
        markerWidth: range * 2,
        markerHeight: range * 2,
        orient: "auto-start-reverse"
    }
    const marker_content_props: any = {
        cx: 5, cy: 5, r: 4,
        stroke: 'none',
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")",
    }
    return h('marker', marker_props, [h("circle", marker_content_props)]);
}
marker[MarkerType.FilledSquare] = function (h: Function, style: Style, border: Border, id: number | string) {
    const color = border.color;
    const opacity = style.contextSettings?.opacity || 1;
    const range = border.thickness;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: "0 0 10 10",
        refX: "5",
        refY: "5",
        markerWidth: range * 2,
        markerHeight: range * 2,
        orient: "auto-start-reverse"
    }
    const marker_content_props: any = {
        d: 'M5 0 L10 5 L5 10 L0 5 z',
        stroke: 'none',
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")"
    }
    return h('marker', marker_props, [h("path", marker_content_props)]);
}
marker[MarkerType.Square] = function (h: Function, style: Style, border: Border, id: number | string) {
    const color = border.color;
    const opacity = style.contextSettings?.opacity || 1;
    const range = border.thickness;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: "0 0 10 10",
        refX: "0",
        refY: "5",
        markerWidth: range * 2,
        markerHeight: range * 2,
        orient: "auto-start-reverse"
    }
    const marker_content_props: any = {
        d: 'M0 0 h10 l10 h-10  z',
        stroke: 'none',
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")"
    }
    return h('marker', marker_props, [h("path", marker_content_props)]);
}
marker[MarkerType.Round] = function (h: Function, style: Style, border: Border, id: number | string) {
    const color = border.color;
    const opacity = style.contextSettings?.opacity || 1;
    const range = border.thickness;
    const marker_props: any = {
        id: "arrow-" + id,
        viewBox: "0 0 10 10",
        refX: "0",
        refY: "5",
        markerWidth: range * 2,
        markerHeight: range * 2,
        orient: "auto-start-reverse"
    }
    const marker_content_props: any = {
        d: 'M0 0 a5,5 0 0 1 0,10 z',
        stroke: 'none',
        fill: "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")"
    }
    return h('marker', marker_props, [h("path", marker_content_props)]);
}
export function render(h: Function, style: Style, border: Border, markerType: MarkerType, id: number | string): any {
    return marker[markerType](h, style, border, id);
}