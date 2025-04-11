import { Modifier } from "../basic/modifier";
import { Document, TextMask, Text, StyleMangerMember } from "../../data";
import { PageView, TextShapeView } from "../../dataview";
import { importText, importTextAttr } from "../../data/baseimport";
import { TextShapeEditor } from "../textshape";
import { Operator } from "../../coop/recordop";
import { exportText } from "../../data/baseexport";

export class TextModifier extends Modifier {
    importTextAttr = importTextAttr;

    text4edit(document: Document, pageView: PageView, view: TextShapeView, api: Operator) {
        return new TextShapeEditor(view, pageView, this.repo, document).shape4edit(api, view);
    }

    createTextMask(document: Document, mask: TextMask, pageView: PageView, idx: number, len: number, maskid: string, views?: TextShapeView[],) {
        try {
            const api = this.getApi('createTextMask');
            const page = pageView.data;
            api.styleInsert(document, mask);
            if (views) {
                for (const view of views) {
                    const text = this.text4edit(document, pageView, view, api);
                    api.textModifyTextMask(page, text, idx, len, maskid);
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
                const textWithFormatButMask = cleanMask(view.getText());
                const target = this.text4edit(document, pageView, view, api);
                api.textModifyTextMask(page, target, idx, len, undefined);
                api.deleteText(page, target, idx, len);
                api.insertComplexText(page, target, idx, textWithFormatButMask);
            }
            this.commit();
            return true;
        } catch (error) {
            this.rollback();
            throw error;
        }

        function cleanMask(text: Text) {
            let textWithFormat = exportText(text.getTextWithFormat(idx, len));
            textWithFormat.paras.forEach(para => {
                para.spans.forEach(span => span.textMask = undefined);
            });
            const last = textWithFormat.paras[textWithFormat.paras.length - 1];
            if (last.text.endsWith('\n')) {
                if (last.spans[last.spans.length - 1].length === 1) last.spans.pop();
                last.text = last.text.slice(0, last.text.length - 1);
            }
            textWithFormat = importText(textWithFormat);
            return textWithFormat as Text;
        }
    }

    disableMask(mask: StyleMangerMember) {
        try {
            const api = this.getApi('modifyMaskStatus');
            api.disableMask(mask);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
}
