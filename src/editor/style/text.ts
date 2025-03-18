import { Modifier } from "../basic/modifier";
import {
    BasicArray, Blur,
    BlurMask, BlurType,
    Document,
    OverrideType,
    Page, Point2D,
    Shape, StyleMangerMember,
    TextAttr,
    TextMask,
    Variable,
    VariableType
} from "../../data";
import { adapt2Shape, PageView, ShapeView, TextShapeView } from "../../dataview";
import { Api } from "../../coop";
import { _ov } from "../symbol";
import { importTextAttr } from "../../data/baseimport";

export class TextModifier extends Modifier {
    importTextAttr = importTextAttr;

    getMaskVariable(api: Api, page: PageView, view: ShapeView, value: any) {
        return _ov(VariableType.TextMask, OverrideType.TextMask, () => value, view, page, api);
    }

    getTextVariable(api: Api, page: PageView, view: TextShapeView) {
        const valueFun = (_var: Variable | undefined) => {
            const text = _var?.value ?? view.text.attr;
            return text && importTextAttr(text) || new TextAttr();
        };
        return _ov(VariableType.Text, OverrideType.Text, valueFun, view, page, api)!;
    }

    createTextMask(document: Document, mask: TextMask, pageView: PageView, views?: ShapeView[]) {
        try {
            const api = this.getApi('createTextMask');
            api.styleInsert(document, mask);
            if (views) {
                const variables: Variable[] = [];
                const shapes: Shape[] = [];
                for (const view of views) {
                    const variable = this.getMaskVariable(api, pageView, view, mask.id);
                    variable ? variables.push(variable) : shapes.push(adapt2Shape(view));
                }
                const page = pageView.data;
                for (const variable of variables) {
                    if (variable.value !== mask.id) api.shapeModifyVariable(page, variable, mask.id);
                }
                // for (const shape of shapes) api.modifyBlurMask(page, shape, mask.id);
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

}