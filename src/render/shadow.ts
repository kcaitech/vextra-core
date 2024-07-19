import {
    Blur, Border, Fill, Shape, ShapeSize, SymbolRefShape, SymbolShape, BlurType,
    BorderPosition,
    OverrideType,
    Shadow,
    ShadowPosition,
    ShapeType,
    VariableType
} from "../data";
import { render as borderR } from "./border";
import { findOverrideAndVar } from "../data/utils";
const shadowOri: {
    [key: string]: (h: Function, shadow: Shadow, frame: ShapeSize, id: string, i: number, path: string, fills: Fill[], borders: Border[], shapeType: ShapeType, blur?: Blur) => any
} = {};
shadowOri[ShadowPosition.Outer] = function (h: Function, shadow: Shadow, frame: ShapeSize, id: string, i: number, path: string, fills: Fill[], borders: Border[], shapeType: ShapeType, blur?: Blur): any {
    const { width, height } = frame;
    // const shadow = style.shadows[i];
    const f_props: any = {
        props_w: [width * 1.4],
        props_h: [height * 1.4],
        props_x: [-(width * 0.2)],
        props_y: [-(height * 0.2)]
    }
    getFilterPropsValue(shadow, frame, f_props);
    const { color, offsetX, offsetY, blurRadius, spread } = shadow;
    const { red, green, blue, alpha } = color;
    const filter_props: any = {
        id: 'spread' + id + i,
        x: '-20%',
        y: '-20%',
        height: '140%',
        width: '140%',
        'color-interpolation-filters': "sRGB"
    };
    const m_border = max_border(borders);
    filter_props.width = ((Math.max(...f_props.props_w) + ((blur?.saturation || 0) * 2) + (m_border * 2)) / width) * 100 + '%';
    filter_props.height = ((Math.max(...f_props.props_h) + ((blur?.saturation || 0) * 2) + (m_border * 2)) / height) * 100 + '%';
    filter_props.x = ((Math.min(...f_props.props_x) - (blur?.saturation || 0) - m_border) / width) * 100 + '%';
    filter_props.y = ((Math.min(...f_props.props_y) - (blur?.saturation || 0) - m_border) / height) * 100 + '%';
    const s = (spread / 10000)
    const multix = +((((spread * 2) + width) - (spread / 100)) / width - s).toFixed(3);
    const multiy = +((((spread * 2) + height) - (spread / 100)) / height - s).toFixed(3);
    const fe_color_matrix1 = {
        type: "matrix",
        values: `0 0 0 ${red / 255} 0
               0 0 0 ${green / 255} 0
               0 0 0 ${blue / 255} 0
               0 0 0 ${alpha} 0`,
        result: `color${i}`
    }
    const fe_color_matrix = {
        in: `SourceAlpha`,
        type: "matrix",
        values: `0 0 0 0 0
                   0 0 0 0 0
                   0 0 0 0 0
                   0 0 0 127 0`,
    }
    const fe_offset = { dx: offsetX / multix, dy: offsetY / multiy, }
    const fe_gaussian_blur = {
        stdDeviation: `${blurRadius / 2}`,
    }
    const fe_blend = {
        mode: "normal",
        in2: 'BackgroundImageFix',
        result: `effect${i + 1}_dropShadow`
    }
    const fe_flood = {
        'flood-opacity': `0`,
        result: `BackgroundImageFix`
    }
    const filter_child = [
        h('feFlood', fe_flood),
        h('feColorMatrix', fe_color_matrix),
        h('feOffset', fe_offset),
        h('feGaussianBlur', fe_gaussian_blur),
        h('feColorMatrix', fe_color_matrix1),
        h('feBlend', fe_blend)
    ]
    if (blur && blur.isEnabled) {
        if (blur.type === BlurType.Gaussian) {
            filter_child.push(h('feGaussianBlur', { stdDeviation: `${blur.saturation / 2}` }))
        }
    }
    const filter = h("filter", filter_props, filter_child);
    let fill = 'none';

    if (fills.length) {
        for (let i = 0; i < fills.length; i++) {
            const _fill = fills[i];
            if (_fill.color.alpha !== 0 && _fill.isEnabled) {
                fill = 'black';
                break;
            }
        }
    }
    const border = borderR(h, borders, frame, path, undefined)

    const body_props: any = {
        d: path,
        fill,
    }
    const g_props = {
        filter: `url(#spread${id + i})`,
        style: `transform-origin: left top; transform: translate(${width / 2}px, ${height / 2}px) scale(${multix >= 0 ? multix : 0}, ${multiy >= 0 ? multiy : 0}) translate(${-width / 2}px, ${-height / 2}px) `,
    }
    const p = h('g', g_props, [h('path', body_props), ...border]);
    return { filter, p }
}
shadowOri[ShadowPosition.Inner] = function (h: Function, shadow: Shadow, frame: ShapeSize, id: string, i: number, path: string, fills: Fill[], borders: Border[], shapeType: ShapeType): any {
    const f_id = `inner-shadow-${id + i}`;
    // const shadow = style.shadows[i];
    const { width, height } = frame;
    const { color, offsetX, offsetY, blurRadius, spread } = shadow;
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
    const { red, green, blue, alpha } = color;
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

    const filter_props = {
        id: f_id,
        x: -width * 0.2,
        y: -height * 0.2,
        height: height * 1.4,
        width: width * 1.4,
        'color-interpolation-filters': "sRGB",
        filterUnits: 'userSpaceOnUse'
    };
    if (shapeType === ShapeType.Line) {
        const m_border = max_border(borders) * 9;
        filter_props.x = -(width * 0.2) - m_border;
        filter_props.y = -(height * 0.2) - m_border;
        filter_props.width = (width * 1.4) + (m_border * 2);
        filter_props.height = (height * 1.4) + (m_border * 2);
    }
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

function shadowShape(h: Function, shadows: Shadow[], frame: ShapeSize, id: string, borders: Border[], shapeType: ShapeType): any {
    shadows = shadows.filter(s => s.position === ShadowPosition.Outer);
    const { width, height } = frame;
    const f_props: any = {
        props_w: [width * 1.8],
        props_h: [height * 1.8],
        props_x: [-(width * 0.4)],
        props_y: [-(height * 0.4)]
    }
    if (shadows.length === 0) return undefined;
    const h_nodes = [];
    for (let i = 0; i < shadows.length; i++) {
        const shadow = shadows[i];
        const position = shadow.position;
        if (!shadow.isEnabled) continue;
        if (position === ShadowPosition.Outer) {
            getFilterPropsValue(shadow, frame, f_props);
            const { color, offsetX, offsetY, blurRadius, spread } = shadow;
            const fe_color_matrix = {
                in: `SourceAlpha`,
                type: "matrix",
                values: `0 0 0 0 0
                           0 0 0 0 0
                           0 0 0 0 0
                           0 0 0 127 0`,
            }
            const fe_offset = { dx: offsetX, dy: offsetY, }
            const fe_gaussian_blur = {
                stdDeviation: `${blurRadius / 2}`,
            }
            const fe_color_matrix2 = {
                type: "matrix",
                values: ` 0 0 0 ${color.red / 255} 0
                               0 0 0 ${color.green / 255} 0
                               0 0 0 ${color.blue / 255} 0
                               0 0 0 ${color.alpha} 0`,
            }
            const _in = i > 0 ? `effect${i}_dropShadow` : `BackgroundImageFix`;
            const fe_blend = {
                mode: "normal",
                in2: _in,
                result: `effect${i + 1}_dropShadow`
            }
            const h_node = [
                h('feColorMatrix', fe_color_matrix),
                h('feOffset', fe_offset),
                h('feGaussianBlur', fe_gaussian_blur),
                h('feColorMatrix', fe_color_matrix2),
                h('feBlend', fe_blend),
            ];
            h_nodes.push(...h_node);
        }
    }
    const filter_props: any = { id: 'pd_outer-' + id, x: '-20%', y: '-20%', height: '140%', width: '140%' };
    const m_border = shapeType === ShapeType.Line ? max_border(borders) * 9 : max_border(borders);
    filter_props.width = ((Math.max(...f_props.props_w) + Math.max(...f_props.props_w) + (m_border * 2)) / width) * 100 + '%';
    filter_props.height = ((Math.max(...f_props.props_h) + Math.max(...f_props.props_h) + (m_border * 2)) / height) * 100 + '%';
    filter_props.x = ((Math.min(...f_props.props_x) + Math.min(...f_props.props_x) - m_border) / width) * 100 + '%';
    filter_props.y = ((Math.min(...f_props.props_y) + Math.min(...f_props.props_y) - m_border) / height) * 100 + '%';
    const fe_flood = {
        'flood-opacity': `0`,
        result: `BackgroundImageFix`
    }
    const fe_blend = {
        mode: "normal",
        in: `SourceGraphic`,
        in2: `effect${shadows.length}_dropShadow`,
        result: `shape`
    }
    const filter = h("filter", filter_props, [
        h('feFlood', fe_flood),
        ...h_nodes,
        h('feBlend', fe_blend),
    ])
    return filter;
}

export function render(h: Function, id: string, shadows: Shadow[], path: string, frame: ShapeSize, fills: Fill[], borders: Border[], shapeType: ShapeType, blur?: Blur) {
    const elArr = [];
    // const style = shape.style;
    // const frame = shape.frame;
    const inner_f = [];
    let filters: any[] = [];
    let paths: any[] = [];

    for (let i = 0; i < shadows.length; i++) {
        const shadow = shadows[i];
        const position = shadow.position;
        if (!shadow.isEnabled) continue;
        if (position === ShadowPosition.Outer) {
            if (shapeType === ShapeType.Rectangle || shapeType === ShapeType.Artboard || shapeType === ShapeType.Oval) {
                const {
                    filter,
                    p
                } = shadowOri[position](h, shadow, frame, id, i, path, fills, borders, shapeType, blur);
                filters.push(filter);
                paths.push(p);
            }
        } else if (position === ShadowPosition.Inner) {
            const filter = shadowOri[position](h, shadow, frame, id, i, path, fills, borders, shapeType);
            inner_f.push(filter);
        }
    }
    if (shapeType !== ShapeType.Rectangle && shapeType !== ShapeType.Artboard && shapeType !== ShapeType.Oval) {
        const filter = shadowShape(h, shadows, frame, id, borders, shapeType);
        if (filter) {
            elArr.push(filter);
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
    return ids;
}

const getFilterPropsValue = (shadow: Shadow, frame: ShapeSize, f_props: any) => {
    const { offsetX, offsetY, blurRadius, spread } = shadow;
    const { width, height } = frame;
    const props_w = width + Math.abs(offsetX) + (blurRadius * 2) + Math.abs(spread * 2) + (width * 0.4);
    const props_h = height + Math.abs(offsetY) + (blurRadius * 2) + Math.abs(spread * 2) + (height * 0.4);
    const props_x = Math.min(0, offsetX) - blurRadius - Math.min(0, spread) - (width * 0.2);
    const props_y = Math.min(0, offsetY) - blurRadius - Math.min(0, spread) - (height * 0.2);
    f_props.props_h.push(props_h);
    f_props.props_w.push(props_w);
    f_props.props_x.push(props_x);
    f_props.props_y.push(props_y);
}

export function renderWithVars(h: Function, id: string, shape: Shape, frame: ShapeSize, path: string,
                               varsContainer?: (SymbolRefShape | SymbolShape)[] | undefined
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
    let fills = shape.style.fills;
    if (varsContainer) {
        const _vars = findOverrideAndVar(shape, OverrideType.Fills, varsContainer);
        if (_vars) {
            // (hdl as any as VarWatcher)._watch_vars(propertyKey.toString(), _vars);
            const _var = _vars[_vars.length - 1];
            if (_var && _var.type === VariableType.Fills) {
                // return _var.value;
                fills = _var.value;
            }
        }
    }
    return render(h, id, shadows, path, frame, fills, borders, shape.type);
}

const max_border = (borders: Border[]) => {
    if (!borders.length) return 0;
    let max = 0;
    for (let i = 0; i < borders.length; i++) {
        const border = borders[i];
        if (!border.isEnabled || border.position === BorderPosition.Inner) continue;
        const { thicknessBottom, thicknessTop, thicknessLeft, thicknessRight } = border.sideSetting;
        const max_border = Math.max(thicknessBottom, thicknessTop, thicknessLeft, thicknessRight);
        if (max_border > max) {
            max = border.position === BorderPosition.Center ? max_border / 2 : max_border;
        }
    }
    return max;
}