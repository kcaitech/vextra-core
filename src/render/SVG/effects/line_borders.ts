/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { objectId } from "../../../basic/objectid";
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
    PathShape,
    Fill
} from "../../../data/classes";
import { findOverrideAndVar } from "../../../data/utils";
import { randomId } from "../../basic";
import { render as marker } from "./marker";
import { render as renderGradient } from "./gradient";
import { render as lineGradient } from "./line_gradient";
function handler(h: Function, style: Style, border: Border, path: string, shape: Shape,strokePaint: Fill, startMarkerType?: MarkerType, endMarkerType?: MarkerType): any {
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
    const fillType = strokePaint.fillType;
    if (fillType === FillType.SolidColor) {
        const color = strokePaint.color;
        body_props.stroke = "rgb(" + color.red + "," + color.green + "," + color.blue + ")";
        body_props['opacity'] = strokePaint.color.alpha;
    } else {
        g_ = renderGradient(h, strokePaint.gradient as Gradient, shape.size);
        const opacity = strokePaint.gradient?.gradientOpacity;
        body_props.opacity = opacity === undefined ? 1 : opacity; ``
        body_props.stroke = "url(#" + g_.id + ")";
    }
    if ((endMarkerType && endMarkerType !== MarkerType.Line) || (startMarkerType && startMarkerType !== MarkerType.Line)) {
        delete body_props.opacity;
        let line_g;
        if (strokePaint.fillType === FillType.Gradient) {
            line_g = lineGradient(h, strokePaint.gradient as Gradient, shape.size, thickness);
        }
        const g_cs: any[] = [h('path', body_props)];
        if (endMarkerType && endMarkerType !== MarkerType.Line) {
            const rId = randomId();
            const id = "e-" + objectId(shape) + "-" + rId;
            g_cs.unshift(marker(h, style, border, endMarkerType, id, strokePaint));
            body_props['marker-end'] = `url(#arrow-${id})`;
        }
        if (startMarkerType && startMarkerType !== MarkerType.Line) {
            const rId = randomId();
            const id = "s-" + objectId(shape) + "-" + rId;
            g_cs.unshift(marker(h, style, border, startMarkerType, id, strokePaint));
            body_props['marker-start'] = `url(#arrow-${id})`;
        }
        if (line_g) {
            body_props.stroke = 'white'
            const frame = shape.size;
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
            return h('g', { opacity: strokePaint.color.alpha }, g_cs);
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



function angular_handler(h: Function, style: Style, border: Border, path: string, shape: Shape,strokePaint: Fill, startMarkerType?: MarkerType, endMarkerType?: MarkerType): any {
    const thickness = border.sideSetting.thicknessTop;
    const opacity = strokePaint.gradient?.gradientOpacity;
    let line_g = lineGradient(h, strokePaint.gradient as Gradient, shape.size, thickness);
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
    const frame = shape.size;
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
            g_cs.unshift(marker(h, style, border, endMarkerType, id, strokePaint));
            body_props['marker-end'] = `url(#arrow-${id})`;
        }
        if (startMarkerType && startMarkerType !== MarkerType.Line) {
            const rId = randomId();
            const id = "s-" + objectId(shape) + "-" + rId;
            g_cs.unshift(marker(h, style, border, startMarkerType, id, strokePaint));
            body_props['marker-start'] = `url(#arrow-${id})`;
        }
        if (line_g && line_g.style) {
            body_props.stroke = 'white'
            const mk = h("mask", { id }, g_cs);

            return h('g', [mk, fg]);
        } else {
            const color = strokePaint.color;
            body_props['stroke'] = "rgb(" + color.red + "," + color.green + "," + color.blue + ")";
            return h('g', g_cs);
        }
    }
    return h("g", elArr);
}


export function render(h: Function, style: Style, border: Border | undefined, startMarkerType: MarkerType | undefined, endMarkerType: MarkerType | undefined, path: string, shape: Shape): Array<any> {
    let elArr = new Array();
    if(!border) return elArr;
    const bc = border.strokePaints.length;
    const sm = startMarkerType, em = endMarkerType;
    for (let i = 0; i < bc; i++) {
        const strokePaint: Fill = border.strokePaints[i];
        if (!strokePaint.isEnabled) continue;
        const fillType = strokePaint.fillType;
        const gradientType = strokePaint.gradient && strokePaint.gradient.gradientType;
        fillType == FillType.Gradient && gradientType == GradientType.Angular && (() => {
            elArr.push(angular_handler(h, style, border, path, shape,strokePaint, sm, em));
        })() || (fillType == FillType.SolidColor || (fillType == FillType.Gradient && gradientType !== GradientType.Angular)) && (() => {
            elArr.push(handler(h, style, border, path, shape,strokePaint, sm, em));
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