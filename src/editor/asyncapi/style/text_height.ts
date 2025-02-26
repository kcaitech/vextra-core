import { AsyncApiCaller } from "../basic/asyncapi";
import {
    Color,
    Fill,
    GroupShape,
    OverrideType,
    Shape,
    string2Text,
    SymbolRefShape,
    SymbolShape,
    Text,
    Variable,
    VariableType
} from "../../../data";
import { Api } from "../../../coop";
import { ShapeView, TextShapeView } from "../../../dataview";
import { varParent } from "../../symbol";
import { uuid } from "../../../basic/uuid";
import { prepareVar } from "../../symbol_utils";
import { importText } from "../../../data/baseimport";

export class TextAsyncApi extends AsyncApiCaller {
    overrideVariable(varType: VariableType, overrideType: OverrideType, valuefun: (_var: Variable | undefined) => any, api: Api, view: ShapeView) {
        return prepareVar(api, this.pageView, view, overrideType, varType, valuefun)?.var;
    }
    shape4edit(api: Api, shape: TextShapeView): Variable | TextShapeView {
        let _var = this.overrideVariable(VariableType.Text, OverrideType.Text, (_var) => {
            if (_var) {
                if (_var.value instanceof Text) return importText(_var.value);
                if (typeof _var.value === 'string') {
                    return string2Text(_var.value)
                }
            }
            else {
                return string2Text(shape.text.toString())
            }
            throw new Error();
        }, api, shape);

        if (_var && (typeof _var.value === 'string')) { // 这有问题！
            const host = varParent(_var)! as SymbolRefShape | SymbolShape;
            const textVar = new Variable(uuid(), VariableType.Text, _var.name, string2Text(shape.text.toString()));
            if (host instanceof SymbolShape) {
                api.shapeRemoveVariable(this.page, host, _var.id);
                api.shapeAddVariable(this.page, host, textVar);
                const bindid = _var.id;
                const rebind = (shape: Shape) => {
                    if (shape.varbinds?.get(OverrideType.Text) === bindid) {
                        api.shapeUnbinVar(this.page, shape, OverrideType.Text);
                        api.shapeBindVar(this.page, shape, OverrideType.Text, textVar.id);
                    }
                    if (shape instanceof GroupShape) {
                        shape.childs.forEach(c => rebind(c));
                    }
                }
                rebind(host);
            } else {
                let override_id: string | undefined;
                for (let [k, v] of host.overrides!) {
                    if (v === _var.id) {
                        override_id = k;
                        break;
                    }
                }
                if (!override_id) throw new Error();
                api.shapeRemoveOverride(this.page, host, override_id);
                api.shapeRemoveVariable(this.page, host, _var.id);
                api.shapeAddVariable(this.page, host, textVar);
                api.shapeAddOverride(this.page, host, override_id, textVar.id);
            }
            _var = textVar;
        }
        if (_var && _var.value instanceof Text) {
            this.__repo.updateTextSelectionPath(_var.value);
            return _var;
        }
        return shape;
    }
    start() {
        return this.__repo.start('modify-text-height-color');
    }

    commit() {
        if (this.__repo.isNeedCommit() && !this.exception) {
            this.__repo.commit();
        } else {
            this.__repo.rollback();
        }
    }


    /* 修改纯色 */
    modifySolidColor(actions: { fill: Fill, color: Color }[]) {
        try {
            for (const action of actions) this.api.setFillColor(action.fill, action.color);
            this.updateView();
        } catch (err) {
            this.exception = true;
            console.error(err);
        }
    }

    modifySolidColor2(missions: Function[]) {
        try {
            missions.forEach((call) => call(this.api));
        } catch (error) {
            this.exception = true;
            console.error(error);
        }
    }

}