import { Modifier } from "../basic/modifier";
import {
    BasicArray, Blur,
    BlurMask, BlurType,
    Document,
    OverrideType,
    Page, Point2D,
    Shape, StrikethroughType, StyleMangerMember,
    TextAttr,
    TextMask,
    TextTransformType,
    UnderlineType,
    Variable,
    VariableType,
    Text,
    Para,
    Span
} from "../../data";
import { adapt2Shape, PageView, ShapeView, TextShapeView } from "../../dataview";
import { Api } from "../../coop";
import { _ov } from "../symbol";
import { importTextAttr } from "../../data/baseimport";
import { mergeParaAttr, mergeSpanAttr, mergeTextAttr, newText } from "../../data/text/textutils";
import { Editor } from "..";
import { fixTextShapeFrameByLayout } from "../utils/other";

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
                    if (shape instanceof TextShapeView) fixTextShapeFrameByLayout(api, page, shape);
                }
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    setTextMask(pageView: PageView, views: TextShapeView[], idx: number, len: number, maskid: string) {
        try {
            const api = this.getApi('setTextMask');
            if (views) {
                const variables: Variable[] = [];
                const shapes: TextShapeView[] = [];
                for (const view of views) {
                    const variable = this.getMaskVariable(api, pageView, view, maskid);
                    variable ? variables.push(variable) : shapes.push(view);
                }
                const page = pageView.data;
                for (const variable of variables) {
                    api.shapeModifyVariable(page, variable, maskid);
                }

                for (const shape of shapes) {
                    api.textModifyTextMask(page, shape, idx, len, maskid);
                    api.textModifParaTextMask(page, shape, idx, len, undefined);
                    if (shape instanceof TextShapeView) fixTextShapeFrameByLayout(api, page, shape);
                }
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

    unbindShapesTextMask(pageView: PageView, views: TextShapeView[], idx: number, len: number) {
        try {
            const api = this.getApi('unbindShapesTextMask');
            if (views) {
                const variables: Variable[] = [];
                const shapes: TextShapeView[] = [];
                for (const view of views) {
                    const variable = this.getMaskVariable(api, pageView, view, undefined);
                    variable ? variables.push(variable) : shapes.push(view);
                }
                const page = pageView.data;
                for (const variable of variables) {
                    api.shapeModifyVariable(page, variable, undefined);
                }

                let index = 0;
                for (const shape of shapes) {
                    const _text = shape.text
                    const text1 = new Text(new BasicArray());
                  
                    _text.paras.forEach((p) => {
                        const para = new Para(p.text, new BasicArray())
                       
                      
                        p.spans.forEach((s) => {
                            const span = new Span(s.length);
                            if (s.textMask) {
                                const mask = shape.text.getStylesMgr()?.getSync(s.textMask) as TextMask;
                                const _text = importTextAttr(mask.text)
                                mergeParaAttr(p, _text);
                                mergeSpanAttr(s, _text);
                            }
                            para.spans.push(s)
                        })
                        text1.paras.push(p)
                    })
                    api.deleteText(page, shape, index, Infinity);
                    api.insertComplexText(page, shape, index, text1)
                    api.textModifyTextMask(page, shape, idx, len, undefined);
                    api.textModifParaTextMask(page, shape, idx, len, undefined);
                    if (shape instanceof TextShapeView) fixTextShapeFrameByLayout(api, page, shape);
                }
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }
    }

}
