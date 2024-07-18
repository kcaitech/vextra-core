import { objectId } from "../basic/objectid";
import { render as clippathR } from "./clippath"
import {
    Border,
    FillType,
    MarkerType, OverrideType,
    Shape,
    ShapeFrame,
    Style,
    SymbolRefShape,
    SymbolShape,
    VariableType,
    Gradient,
    GradientType,
    PathShape
} from "../data/classes";
import { findOverrideAndVar } from "../data/utils";
import { randomId } from "./basic";
import { render as marker } from "./marker";
import { render as renderGradient } from "./gradient";
import { render as lineGradient } from "./line_gradient";
function handler(h: Function, style: Style, border: Border, path: string, shape: Shape, startMarkerType?: MarkerType, endMarkerType?: MarkerType): any {
    const thickness = border.sideSetting.thicknessTop;
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        "stroke-linejoin": border.cornerType,
        'stroke-width': thickness
    }
    if (shape instanceof PathShape && shape.pathsegs.length > 1) {
        if (startMarkerType === MarkerType.Round || endMarkerType === MarkerType.Round) {
            body_props['stroke-linecap'] = 'round';
        } else if (startMarkerType === MarkerType.Square || endMarkerType === MarkerType.Square) {
            body_props['stroke-linecap'] = 'square';
        }
    }
    let g_;
    const { length, gap } = border.borderStyle;
    if (length || gap) body_props['stroke-dasharray'] = `${length}, ${gap}`;
    const fillType = border.fillType;
    if (fillType === FillType.SolidColor) {
        const color = border.color;
        body_props.stroke = "rgb(" + color.red + "," + color.green + "," + color.blue + ")";
        body_props['opacity'] = border.color.alpha;
    } else {
        g_ = renderGradient(h, border.gradient as Gradient, shape.frame);
        const opacity = border.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity; ``
        body_props.stroke = "url(#" + g_.id + ")";
    }
    if ((endMarkerType && endMarkerType !== MarkerType.Line) || (startMarkerType && startMarkerType !== MarkerType.Line)) {
        delete body_props.opacity;
        let line_g;
        if (border.fillType === FillType.Gradient) {
            line_g = lineGradient(h, border.gradient as Gradient, shape.frame, thickness);
        }
        const g_cs: any[] = [h('path', body_props)];
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
        if (line_g) {
            body_props.stroke = 'white'
            const frame = shape.frame;
            const id = "mask-line-" + objectId(border) + randomId();
            const mk = h("mask", { id }, g_cs);
            const width = frame.width + (thickness * 12);
            const height = frame.height + (thickness * 12);
            const offset = -(thickness * 6);
            const rect_h = h("rect", {
                x: offset,
                y: offset,
                width,
                height,
                fill: "url(#" + line_g.id + ")",
                mask: "url(#" + id + ")",
            })
            return h('g', [line_g.node, mk, rect_h]);
        } else {
            return h('g', { opacity: border.color.alpha }, g_cs);
        }
    }
    if (g_ && g_.node) {
        delete body_props.opacity;
        const g_cs: any[] = [h('path', body_props)];
        g_cs.unshift(g_.node);
        return h('g', g_cs);
    }

    return h('path', body_props);
}



function angular_handler(h: Function, style: Style, border: Border, path: string, shape: Shape, startMarkerType?: MarkerType, endMarkerType?: MarkerType): any {
    const thickness = border.sideSetting.thicknessTop;
    const opacity = border.gradient?.gradientOpacity;
    let line_g = lineGradient(h, border.gradient as Gradient, shape.frame, thickness);
    const id = "mask-line-" + objectId(border) + randomId();
    const body_props: any = {
        d: path,
        fill: "none",
        stroke: '',
        "stroke-linejoin": border.cornerType,
        'stroke-width': thickness
    }
    if (shape instanceof PathShape && shape.pathsegs.length > 1) {
        if (startMarkerType === MarkerType.Round || endMarkerType === MarkerType.Round) {
            body_props['stroke-linecap'] = 'round';
        } else if (startMarkerType === MarkerType.Square || endMarkerType === MarkerType.Square) {
            body_props['stroke-linecap'] = 'square';
        }
    }
    const elArr = new Array();
    const frame = shape.frame;
    const fg = h("foreignObject", {
        width: frame.width + (thickness * 12), height: frame.height + (thickness * 12), x: -(thickness * 6), y: -(thickness * 6),
        mask: "url(#" + id + ")",
    },
        h("div", { width: "100%", height: "100%", style: 'overflow: hidden; height: 100%' }, [h("div", { width: "100%", height: "100%", style: line_g.style })]))
    const { length, gap } = border.borderStyle;
    if (length || gap) body_props['stroke-dasharray'] = `${length}, ${gap}`;
    body_props.stroke = "white";
    const mk = h("mask", { id }, [h("path", body_props)]);
    elArr.push(mk);
    elArr.push(fg);
    if ((endMarkerType && endMarkerType !== MarkerType.Line) || (startMarkerType && startMarkerType !== MarkerType.Line)) {
        delete body_props.opacity;
        const g_cs: any[] = [h('path', body_props)];
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
        if (line_g && line_g.style) {
            body_props.stroke = 'white'
            const mk = h("mask", { id }, g_cs);

            return h('g', [mk, fg]);
        } else {
            const color = border.color;
            body_props['stroke'] = "rgb(" + color.red + "," + color.green + "," + color.blue + ")";
            return h('g', g_cs);
        }
    }
    return h("g", elArr);
}


export function render(h: Function, style: Style, borders: Border[], startMarkerType: MarkerType | undefined, endMarkerType: MarkerType | undefined, path: string, shape: Shape): Array<any> {
    const bc = borders.length;
    let elArr = new Array();
    const sm = startMarkerType, em = endMarkerType;
    for (let i = 0; i < bc; i++) {
        const border: Border = borders[i];
        if (!border.isEnabled) continue;
        const fillType = border.fillType;
        const gradientType = border.gradient && border.gradient.gradientType;
        fillType == FillType.Gradient && gradientType == GradientType.Angular && (() => {
            elArr.push(angular_handler(h, style, border, path, shape, sm, em));
        })() || (fillType == FillType.SolidColor || (fillType == FillType.Gradient && gradientType !== GradientType.Angular)) && (() => {
            elArr.push(handler(h, style, border, path, shape, sm, em));
        })()
    }
    return elArr;
}

export function renderWithVars(h: Function, shape: Shape, frame: ShapeFrame, path: string,
    varsContainer: (SymbolRefShape | SymbolShape)[] | undefined) {
    const style = shape.style;
    let borders = shape.style.borders;
    let startMarkerType = style.startMarkerType;
    let endMarkerType = style.endMarkerType;
    if (varsContainer) {
        let _vars = findOverrideAndVar(shape, OverrideType.Borders, varsContainer);
        if (_vars) {
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === VariableType.Borders) {
                // return _var.value;
                borders = _var.value;
            }
        }
        _vars = findOverrideAndVar(shape, OverrideType.StartMarkerType, varsContainer);
        if (_vars) {
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === VariableType.MarkerType) {
                // return _var.value;
                startMarkerType = _var.value;
            }
        }
        _vars = findOverrideAndVar(shape, OverrideType.EndMarkerType, varsContainer);
        if (_vars) {
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === VariableType.MarkerType) {
                // return _var.value;
                endMarkerType = _var.value;
            }
        }
    }
    return render(h, shape.style, borders, startMarkerType, endMarkerType, path, shape);
}