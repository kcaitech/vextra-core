import {
    Border,
    FillType,
    MarkerType, OverrideType,
    Shape,
    ShapeFrame,
    Style,
    SymbolRefShape,
    SymbolShape,
    Variable, VariableType
} from "../data/classes";
import {render as ra} from "./apex";
import {findOverrideAndVar} from "../data/utils";

function getHorizontalRadians(A: { x: number, y: number }, B: { x: number, y: number }) {
    return Math.atan2(B.y - A.y, B.x - A.x)
}

function handler(h: Function, style: Style, border: Border, path: string, shape: Shape, startMarkerType?: MarkerType, endMarkerType?: MarkerType): any {
    const thickness = border.thickness;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        'stroke-width': thickness
    }
    const {length, gap} = border.borderStyle;
    if (length || gap) body_props['stroke-dasharray'] = `${length}, ${gap}`;
    const fillType = border.fillType;
    if (fillType === FillType.SolidColor) {
        const color = border.color;
        const opacity = style.contextSettings?.opacity || 1;
        body_props.stroke = "rgba(" + color.red + "," + color.green + "," + color.blue + "," + (color.alpha * opacity) + ")";
    }
    if (endMarkerType !== MarkerType.Line || startMarkerType !== MarkerType.Line) {
        const f = shape.frame, t = border.thickness;
        let s = {x: 0, y: 0}, e = {x: f.width, y: f.height};
        const r = getHorizontalRadians(s, e);
        const g_cs: any[] = ra(h, style, f, border, r, startMarkerType, endMarkerType);
        if (startMarkerType && startMarkerType !== MarkerType.Line && startMarkerType !== MarkerType.OpenArrow && startMarkerType !== MarkerType.Round && startMarkerType !== MarkerType.Square) {
            s.x = 2 * t * Math.cos(r), s.y = 2 * t * Math.sin(r);
        }
        if (endMarkerType && endMarkerType !== MarkerType.Line && endMarkerType !== MarkerType.OpenArrow && endMarkerType !== MarkerType.Round && endMarkerType !== MarkerType.Square) {
            e.x -= 2 * t * Math.cos(r), e.y -= 2 * t * Math.sin(r);
        }
        body_props.d = `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
        g_cs.push(h('path', body_props));
        return g_cs;
    } else {
        return h('path', body_props);
    }
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
                               varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
                               consumedVars: { slot: string, vars: Variable[] }[] | undefined) {
    let borders = shape.style.borders;
    if (varsContainer) {
        const _vars = findOverrideAndVar(shape, OverrideType.Borders, varsContainer);
        if (_vars) {
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === VariableType.Borders) {
                // return _var.value;
                borders = _var.value;
                if (consumedVars) consumedVars.push({slot: OverrideType.Borders, vars: _vars})
            }
        }
    }
    return render(h, shape.style, borders, path, shape);
}