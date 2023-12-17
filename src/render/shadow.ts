import {OverrideType, Shadow, ShadowPosition, ShapeType, VariableType} from "../data/baseclasses";
import {Border, Style} from "../data/style";
import {GroupShape, Shape, ShapeFrame, SymbolRefShape, SymbolShape, TextShape, Variable} from "../data/classes";
import {render as borderR} from "./border";
import {render as renderB} from "./line_borders";
import {renderTextLayout} from "./text";
import {renderGroupChilds} from "./group";
import {findOverrideAndVar} from "../data/utils";

const shadowOri: {
    [key: string]: (h: Function, style: Style, frame: ShapeFrame, id: string, i: number, path: string) => any
} = {};
shadowOri[ShadowPosition.Outer] = function (h: Function, style: Style, frame: ShapeFrame, id: string, i: number, path: string): any {
    const {width, height} = frame;
    const shadow = style.shadows[i];
    const f_props: any = {props_w: [], props_h: [], props_x: [], props_y: []}
    getFilterPropsValue(shadow, frame, f_props);
    const {color, offsetX, offsetY, blurRadius, spread} = shadow;
    const {red, green, blue, alpha} = color;
    const filter_props: any = {id: 'spread' + id + i, x: '-20%', y: '-20%', height: '140%', width: '140%'};
    filter_props.width = Math.max(...f_props.props_w);
    filter_props.height = Math.max(...f_props.props_h);
    filter_props.x = Math.min(...f_props.props_x);
    filter_props.y = Math.min(...f_props.props_y);
    const s = (spread / 10000)
    const multix = +((((spread * 2) + width) - (spread / 100)) / width - s).toFixed(3);
    const multiy = +((((spread * 2) + height) - (spread / 100)) / height - s).toFixed(3);
    const fe_color_matrix = {
        type: "matrix",
        values: `0 0 0 ${red / 255} 0
               0 0 0 ${green / 255} 0
               0 0 0 ${blue / 255} 0
               0 0 0 ${alpha} 0`,
        result: `color${i}`
    }
    const filter = h("filter", filter_props, [
        h('feColorMatrix', fe_color_matrix),
        h('feGaussianBlur', {stdDeviation: `${blurRadius / 2}`}),
        h('feOffset', {dx: offsetX / multix, dy: offsetY / multiy,}),
    ])
    let fill = 'none';

    if (style && style.fills.length) {
        for (let i = 0; i < style.fills.length; i++) {
            const _fill = style.fills[i];
            if (_fill.color.alpha !== 0) {
                fill = 'black';
                break;
            }
        }
    }
    const border = borderR(h, style!.borders, frame, path)

    const body_props: any = {
        d: path,
        stroke: 'black',
        fill,
    }
    const g_props = {
        filter: `url(#spread${id + i})`,
        style: `transform-origin: left top; transform: translate(${width / 2}px, ${height / 2}px) scale(${multix >= 0 ? multix : 0}, ${multiy >= 0 ? multiy : 0}) translate(${-width / 2}px, ${-height / 2}px) `,
    }
    const p = h('g', g_props, [h('path', body_props), ...border]);
    return {filter, p}
}
shadowOri[ShadowPosition.Inner] = function (h: Function, style: Style, frame: ShapeFrame, id: string, i: number, path: string): any {
    const f_id = `inner-shadow-${id + i}`;
    const shadow = style.shadows[i];
    const {color, offsetX, offsetY, blurRadius, spread} = shadow;
    const fe_offset_props = {
        dx: offsetX,
        dy: offsetY,
        result: `offsetBlur`
    }
    const fe_gaussian_blur_props = {
        stdDeviation: `${blurRadius / 2}`,
        in: `spread`,
        in2: 'offsetBlur',
        result: `blur`
    }
    const fe_composite1 = {
        operator: 'out',
        in: `SourceGraphic`,
        in2: `blur`,
        result: `inverse`
    }
    const {red, green, blue, alpha} = color;
    const fe_flood = {
        'flood-color': `rgba(${red}, ${green}, ${blue}, ${alpha})`,
        result: `color`
    }
    const fe_composite2 = {
        operator: "in",
        in: `color`,
        in2: `inverse`,
        result: `shadow`
    }
    const fe_composite3 = {
        operator: "over",
        in: `shadow`,
        in2: `SourceGraphic`,
    }
    const fe_morphology = {
        operator: "erode",
        radius: `${spread}`,
        result: 'spread'
    }

    const filter_props = {id: f_id, x: '-20%', y: '-20%', height: '140%', width: '140%'};
    const h_node = [
        h('feOffset', fe_offset_props),
        h('feMorphology', fe_morphology),
        h('feGaussianBlur', fe_gaussian_blur_props),
        h('feComposite', fe_composite1),
        h('feFlood', fe_flood),
        h('feComposite', fe_composite2),
        h('feComposite', fe_composite3),
    ];
    return h('filter', filter_props, h_node);
}

function shadowType(h: Function, shape: Shape, i: number, id: string, pathstr: string, borders: Border[], varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, comsMap?: Map<ShapeType, any>): any {
    const style = shape.style;
    const shadow = style.shadows[i];
    const f_props: any = {props_w: [], props_h: [], props_x: [], props_y: []}
    getFilterPropsValue(shadow, shape.frame, f_props);
    const {color, offsetX, offsetY, blurRadius, spread} = shadow;
    const {red, green, blue, alpha} = color;
    const filter_props: any = {id: 'outer' + id + i, x: '-20%', y: '-20%', height: '140%', width: '140%'};
    filter_props.width = Math.max(...f_props.props_w);
    filter_props.height = Math.max(...f_props.props_h);
    filter_props.x = Math.min(...f_props.props_x);
    filter_props.y = Math.min(...f_props.props_y);
    const fe_color_matrix = {
        type: "matrix",
        values: `0 0 0 ${red / 255} 0
               0 0 0 ${green / 255} 0
               0 0 0 ${blue / 255} 0
               0 0 0 ${alpha} 0`,
        result: `color${i}`
    }
    const filter = h("filter", filter_props, [
        h('feColorMatrix', fe_color_matrix),
        h('feGaussianBlur', {stdDeviation: `${blurRadius / 2}`}),
        h('feOffset', {dx: offsetX, dy: offsetY,}),
    ])
    let fill = 'none';
    if (style && style.fills.length) {
        for (let i = 0; i < style.fills.length; i++) {
            const _fill = style.fills[i];
            if (_fill.color.alpha !== 0) {
                fill = 'black';
                break;
            }
        }
    }
    const g_props: any = {
        filter: `url(#outer${id + i})`,
    }
    if (shape.type === ShapeType.Group) {
        g_props["fill-rule"] = "evenodd"
    }
    let border = borderR(h, style!.borders, shape.frame, pathstr!)
    if (shape.type === ShapeType.Image) {
        fill = 'black';
    } else if (shape.type === ShapeType.Line) {
        border = renderB(h, shape.style, borders, pathstr!, shape);
    } else if (shape.type === ShapeType.Text) {
        border = border.concat(renderTextLayout(h, (shape as TextShape).getLayout()));
        const p = h('g', g_props, border);
        return {filter, p}
    } else if (shape.type === ShapeType.Group && comsMap) {
        border = border.concat(renderGroupChilds(h, shape as GroupShape, comsMap, undefined, varsContainer));
        const p = h('g', g_props, border);
        return {filter, p}
    }

    const body_props: any = {
        d: pathstr,
        stroke: 'black',
        fill,
    }
    if (shape.type === ShapeType.Path2) {
        body_props["fill-rule"] = "evenodd"
    }
    const p = h('g', g_props, [h('path', body_props), ...border]);
    return {filter, p}
}

export function render(h: Function, id: string, shadows: Shadow[], borders: Border[], path: string, shape: Shape, varsContainer: (SymbolRefShape | SymbolShape)[] | undefined, comsMap?: Map<ShapeType, any>) {
    const elArr = [];
    const style = shape.style;
    const frame = shape.frame;
    const inner_f = [];
    const filters = [];
    const paths = [];
    for (let i = 0; i < shadows.length; i++) {
        const shadow = shadows[i];
        const position = shadow.position;
        if (!shadow.isEnabled) continue;
        if (position === ShadowPosition.Outer) {
            if (shape.type === ShapeType.Rectangle || shape.type === ShapeType.Artboard || shape.type === ShapeType.Oval) {
                const {filter, p} = shadowOri[position](h, style, frame, id, i, path);
                filters.push(filter);
                paths.push(p);
            } else {
                const {filter, p} = shadowType(h, shape, i, id, path, borders, varsContainer, comsMap);
                filters.push(filter);
                paths.push(p);
            }
        } else if (position === ShadowPosition.Inner) {
            const filter = shadowOri[position](h, style, frame, id, i, path);
            inner_f.push(filter);
        }
    }
    if (filters.length) {
        elArr.push(h("g", [...filters, ...paths]));
    }
    elArr.push(...inner_f);
    return elArr;
}

export function innerShadowId(id: string, shadows?: Shadow[]) {
    let ids = [];
    if (shadows && shadows.length) {
        for (let i = 0; i < shadows.length; i++) {
            const shadow = shadows[i];
            if (shadow.position === ShadowPosition.Inner) {
                let _id = `url(#inner-shadow-${id + i})`;
                ids.push(_id)
            }
        }
    }
    return ids.join(' ');
}

const getFilterPropsValue = (shadow: Shadow, frame: ShapeFrame, f_props: any) => {
    const {color, offsetX, offsetY, blurRadius, spread} = shadow;
    const {width, height} = frame;
    const props_w = width + Math.max(0, offsetX) + blurRadius + Math.max(0, spread) + (width * 0.2);
    const props_h = height + Math.max(0, offsetY) + blurRadius + Math.max(0, spread) + (height * 0.2);
    const props_x = -((props_w - width) / 2);
    const props_y = -((props_h - height) / 2);
    f_props.props_h.push(props_h);
    f_props.props_w.push(props_w);
    f_props.props_x.push(props_x);
    f_props.props_y.push(props_y);
}

export function renderWithVars(h: Function, id: string, shape: Shape, path: string,
                               varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
                               compos_map?: Map<ShapeType, any>
) {
    let shadows = shape.style.shadows;
    if (varsContainer) {
        const _vars = findOverrideAndVar(shape, OverrideType.Shadows, varsContainer);
        if (_vars) {
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === VariableType.Shadows) {
                // return _var.value;
                shadows = _var.value;
            }
        }
    }
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
    return render(h, id, shadows, borders, path, shape, varsContainer, compos_map);
}