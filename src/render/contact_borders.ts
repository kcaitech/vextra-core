

import { objectId } from "../basic/objectid";
import { Border, FillType, MarkerType, Shape, Style } from "../data/classes";
import { render as rm } from "./marker";

function handler(h: Function, style: Style, border: Border, path: string, shape: Shape, mark_id: any, startMarkerType?: MarkerType, endMarkerType?: MarkerType): any {
    const thickness = border.thickness;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': thickness
    }
    if (mark_id) {
        body_props['mask'] = `url(#${mark_id})`;
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) body_props['stroke-dasharray'] = `${length}, ${gap}`;
    const fillType = border.fillType;
    if (fillType === FillType.SolidColor) {
        const color = border.color;
        const opacity = style.contextSettings?.opacity || 1;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")";
    }
    const g_cs: any[] = [h('path', body_props)];
    if (endMarkerType !== MarkerType.Line || startMarkerType !== MarkerType.Line) {
        if (endMarkerType && endMarkerType !== MarkerType.Line) {
            const id = "e-" + objectId(shape);
            g_cs.unshift(rm(h, style, border, endMarkerType, id));
            body_props['marker-end'] = `url(#arrow-${id})`;
        }
        if (startMarkerType && startMarkerType !== MarkerType.Line) {
            const id = "s-" + objectId(shape);
            g_cs.unshift(rm(h, style, border, startMarkerType, id));
            body_props['marker-start'] = `url(#arrow-${id})`;
        }
        return g_cs;
    } else {
        return h('path', body_props);
    }
}


export function render(h: Function, style: Style, path: string, shape: Shape, mark_id: any): Array<any> {
    const bc = style.borders.length;
    let elArr = new Array();
    const sm = style.startMarkerType, em = style.endMarkerType;
    for (let i = 0; i < bc; i++) {
        const border: Border = style.borders[i];
        if (!border.isEnabled) continue;
        const fillType = border.fillType;
        (fillType === FillType.SolidColor) && (() => {
            elArr = elArr.concat(handler(h, style, border, path, shape, mark_id, sm, em));
        })()
    }
    return elArr;
}