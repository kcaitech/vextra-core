import { Modifier } from "../basic/modifier";
import {
    Document,
    OverrideType,
    TextAttr,
    TextMask,
    Variable,
    VariableType,
    Text
} from "../../data";
import { PageView, ShapeView, TextShapeView } from "../../dataview";
import { Api } from "../../coop";
import { _ov } from "../symbol";
import { importText, importTextAttr } from "../../data/baseimport";
import { fixTextShapeFrameByLayout } from "../utils/other";
import { TextShapeEditor } from "../textshape";
import { Operator } from "../../coop/recordop";
import { exportText } from "../../data/baseexport";

export class TextModifier extends Modifier {
    importTextAttr = importTextAttr;

    text4edit(document: Document, pageView: PageView, view: TextShapeView, api: Operator) {
        return new TextShapeEditor(view, pageView, this.repo, document).shape4edit(api, view);
    }

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

    createTextMask(document: Document, mask: TextMask, pageView: PageView, idx: number, len: number, maskid: string, views?: TextShapeView[],) {
        try {
            const api = this.getApi('createTextMask');
            api.styleInsert(document, mask);
            if (views) {
                const variables: Variable[] = [];
                const shapes: TextShapeView[] = [];
                for (const view of views) {
                    const variable = this.getMaskVariable(api, pageView, view, mask.id);
                    variable ? variables.push(variable) : shapes.push(view);
                }
                const page = pageView.data;
                for (const variable of variables) {
                    if (variable.value !== mask.id) api.shapeModifyVariable(page, variable, mask.id);
                }

                for (const shape of shapes) {
                    api.textModifyTextMask(page, shape, idx, len, maskid);
                    api.textModifParaTextMask(page, shape, idx, len, undefined);
                    fixTextShapeFrameByLayout(api, page, shape);
                }
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    setTextMask(document: Document, pageView: PageView, views: TextShapeView[], idx: number, len: number, maskid: string) {
        try {
            const api = this.getApi('setTextMask');
            const page = pageView.data;
            for (const view of views) {
                const text = this.text4edit(document, pageView, view, api);
                api.textModifyTextMask(page, text, idx, len, maskid);
                if (text instanceof TextShapeView) fixTextShapeFrameByLayout(api, page, text);
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    unbindShapesTextMask(document: Document, pageView: PageView, views: TextShapeView[], idx: number, len: number) {
        try {
            const api = this.getApi('unbindShapesTextMask');
            const page = pageView.data;
            for (const view of views) {
                const textWithFormatButMask = importText(cleanMask(exportText(view.getText().getTextWithFormat(idx, len)) as Text));
                const target = this.text4edit(document, pageView, view, api);
                api.deleteText(page, target, idx, len);
                api.insertComplexText(page, target, idx, textWithFormatButMask);
                if (target instanceof TextShapeView) fixTextShapeFrameByLayout(api, page, target);
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }

        function cleanMask(text: Text) {
            text.paras.forEach(para => {
                para.spans.forEach(span => span.textMask = undefined);
            });
            return text;
        }
    }
}
