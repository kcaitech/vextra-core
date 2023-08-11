

import { Border, FillType, Style } from "../data/classes";


function handler(h: Function, style: Style, border: Border, path: string): any {
    const thickness = border.thickness;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': thickness
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) body_props['stroke-dasharray'] = `${length}, ${gap}`
    const fillType = border.fillType;
    if (fillType === FillType.SolidColor) {
        const color = border.color;
        const opacity = style.contextSettings.opacity;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")";
    }
    return h('path', body_props);
}


export function render(h: Function, style: Style, path: string): Array<any> {
    const bc = style.borders.length;
    const elArr = new Array();
    for (let i = 0; i < bc; i++) {
        const border: Border = style.borders[i];
        if (!border.isEnabled) continue;
        const fillType = border.fillType;
        (fillType === FillType.SolidColor) && (() => {
            elArr.push(handler(h, style, border, path));
        })()
    }
    return elArr;
}