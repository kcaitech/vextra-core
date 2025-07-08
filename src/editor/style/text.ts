/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Modifier } from "../basic/modifier";
import { Document, TextMask, Text, StyleMangerMember } from "../../data";
import { PageView, TextShapeView } from "../../dataview";
import { importText, importTextAttr } from "../../data/baseimport";
import { TextShapeEditor } from "../textshape";
import { Operator } from "../../operator/operator";
import { exportText } from "../../data/baseexport";

export class TextModifier extends Modifier {
    importTextAttr = importTextAttr;

    text4edit(document: Document, pageView: PageView, view: TextShapeView, op: Operator) {
        return new TextShapeEditor(view, pageView, this.repo, document).shape4edit(op, view);
    }

    createTextMask(document: Document, mask: TextMask, pageView: PageView, idx: number, len: number, maskid: string, views?: TextShapeView[],) {
        try {
            const op = this.getOperator('createTextMask');
            const page = pageView.data;
            op.styleInsert(document, mask);
            if (views) {
                for (const view of views) {
                    const text = this.text4edit(document, pageView, view, op);
                    op.textModifyTextMask(page, text, idx, len, maskid);
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
            const op = this.getOperator('setTextMask');
            const page = pageView.data;
            for (const view of views) {
                const text = this.text4edit(document, pageView, view, op);
                op.textModifyTextMask(page, text, idx, len, maskid);
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
            const op = this.getOperator('unbindShapesTextMask');
            const page = pageView.data;
            for (const view of views) {
                const textWithFormatButMask = cleanMask(view.getText());
                const target = this.text4edit(document, pageView, view, op);
                op.textModifyTextMask(page, target, idx, len, undefined);
                op.deleteText(page, target, idx, len);
                op.insertComplexText(page, target, idx, textWithFormatButMask);
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
            const op = this.getOperator('modifyMaskStatus');
            op.disableMask(mask);
            this.commit();
        } catch (error) {
            this.rollback();
            throw error;
        }
    }
}
