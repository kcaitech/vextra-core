import { objectId } from "../basic/objectid";
import {
    Border,
    FillType,
    MarkerType, OverrideType,
    Shape,
    ShapeFrame,
    Style,
    SymbolRefShape,
    SymbolShape,
    VariableType
} from "../data/classes";
import { findOverrideAndVar } from "../data/utils";
import { randomId } from "./basic";
import { render as marker } from "./marker";

function handler(h: Function, style: Style, border: Border, path: string, shape: Shape, startMarkerType?: MarkerType, endMarkerType?: MarkerType): any {
    const thickness = border.thickness;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': thickness
    }
    const { length, gap } = border.borderStyle;
    if (length || gap) body_props['stroke-dasharray'] = `${length}, ${gap}`;
    const fillType = border.fillType;
    if (fillType === FillType.SolidColor) {
        const color = border.color;
        body_props.stroke = "rgb(" + color.red + "," + color.green + "," + color.blue + ")";
    }
    const g_cs: any[] = [h('path', body_props)];
    if (endMarkerType !== MarkerType.Line || startMarkerType !== MarkerType.Line) {
        if (endMarkerType && endMarkerType !== MarkerType.Line) {
            const rId = randomId();
            const id = "e-" + objectId(shape) + "-" + rId;
            g_cs.unshift(marker(h, style, border, endMarkerType, id));
            body_props['marker-end'] = `url(#arrow-${id})`;
        }
        if (startMarkerType && startMarkerType !== MarkerType.Line) {
            const rId = randomId();
            const id = "s-" + objectId(shape) + "-" + rId;
            g_cs.unshift(marker(h, style, border, startMarkerType, id));
            body_props['marker-start'] = `url(#arrow-${id})`;
        }
        return h('g', { opacity: border.color.alpha }, g_cs);
    }
    return h('path', { opacity: border.color.alpha }, body_props);
}


export function render(h: Function, style: Style, borders: Border[], path: string, shape: Shape): Array<any> {
    const bc = borders.length;
    let elArr = new Array();
    const sm = style.startMarkerType, em = style.endMarkerType;
    for (let i = 0; i < bc; i++) {
        const border: Border = borders[i];
        if (!border.isEnabled) continue;
        const fillType = border.fillType;
        (fillType === FillType.SolidColor) && (() => {
            elArr = elArr.concat(handler(h, style, border, path, shape, sm, em));
        })()
    }
    return elArr;
}

export function renderWithVars(h: Function, shape: Shape, frame: ShapeFrame, path: string,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    let borders = shape.style.borders;
    if (varsContainer) {
        const _vars = findOverrideAndVar(shape, OverrideType.Borders, varsContainer);
        if (_vars) {
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === VariableType.Borders) {
                // return _var.value;
                borders = _var.value;
            }
        }
    }
    return render(h, shape.style, borders, path, shape);
}