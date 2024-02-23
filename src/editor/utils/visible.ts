import {OverrideType, Shape, Variable, VariableType} from "../../data/shape";
import {Api} from "../coop/recordapi";
import {Page} from "../../data/page";
import {get_symbol_by_layer, is_part_of_symbol, modify_variable_with_api} from "./symbol";

function finder_visible_binds(shapes: Shape[]) {
    const variables: Map<string, { shape: Shape, variable: Variable }> = new Map();
    for (let i = 0, l = shapes.length; i < l; i++) {
        const item = shapes[i];
        const bind = item.varbinds?.get(OverrideType.Visible);
        if (!bind) continue;
        const sym = get_symbol_by_layer(item);
        if (!sym) continue;
        const sym_variables = sym.variables;
        if (!sym_variables) continue;
        const variable = sym_variables.get(bind);
        if (variable) variables.set(variable.id, {shape: sym, variable: variable});
    }
    return variables;
}

export function after_toggle_shapes_visible(api: Api, page: Page, shapes: Shape[]) {
    const visible_variables = finder_visible_binds(shapes);
    if (!visible_variables.size) return;
    visible_variables.forEach(v => {
        modify_variable_with_api(api, page, v.shape, VariableType.Visible, OverrideType.Visible, (_var) => {
            return _var ? !_var.value : !v.shape.isVisible;
        })
    })
}