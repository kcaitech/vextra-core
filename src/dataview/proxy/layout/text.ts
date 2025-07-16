/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { ViewLayout } from "./view";
import { ShapeFrame, ShapeSize, Text, TextBehaviour, TextHorAlign, TextVerAlign, Transform } from "../../../data";
import { TextShapeView } from "../../textshape";
import { ShapeView } from "../../shape";

export class TextLayoutMgr extends ViewLayout {
    constructor(protected view: TextShapeView) {
        super(view);
    }

    updateLayoutArgs(trans: Transform, size: ShapeFrame): void {
        super.updateLayoutArgs(trans, size);
        const view = this.view;
        view.frameProxy.__origin_frame.width = size.width;
        view.frameProxy.__origin_frame.height = size.height;
        view.getLayout();
    }

     measure(parentFrame: ShapeSize | undefined, scale: { x: number; y: number; } | undefined): void {
        const view = this.view;
        const shape = view.data;
        const transform = shape.transform.clone();
        if (view.parent && view.parent.autoLayout) {
            transform.translateX = view.transform.translateX;
            transform.translateY = view.transform.translateY;
        }

        function fixTransform(offsetX: number, offsetY: number, transform: Transform, s: ShapeView) {
            const t = transform.clone();
            const targetXY = t.computeCoord(offsetX, offsetY)
            const dx = targetXY.x - t.translateX;
            const dy = targetXY.y - t.translateY;
            if (dx || dy) {
                t.trans(dx, dy)
            }
            if (s.parent && s.parent.autoLayout) {
                t.translateX = s.transform.translateX;
                t.translateY = s.transform.translateY;
            }
            return t;
        }

        const size = view.data.size
        const frame = view.data.frame;
        // 根据排版结果更新frame
        const text = view.getText();
        const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
        switch (textBehaviour) {
            case TextBehaviour.Fixed: {
                const layout = view.getLayout();
                const fontsize = text.attr?.fontSize ?? Text.DefaultFontSize;
                const targetHeight = Math.ceil(Math.max(fontsize, layout.contentHeight));
                frame.height = targetHeight
                const verAlign = text.attr?.verAlign ?? TextVerAlign.Top;
                if (verAlign === TextVerAlign.Middle) {
                    this.updateLayoutArgs(fixTransform(0, (size.height - targetHeight) / 2, view.data.transform, view), frame);
                } else if (verAlign === TextVerAlign.Bottom) {
                    this.updateLayoutArgs(fixTransform(0, (size.height - targetHeight), view.data.transform, view), frame);
                } else {
                    this.updateLayoutArgs(transform, frame);
                }
                break;
            }
            case TextBehaviour.Flexible: {
                const layout = view.getLayout();
                const targetWidth = Math.ceil(layout.contentWidth);
                const targetHeight = Math.ceil(layout.contentHeight);
                frame.width = targetWidth
                frame.height = targetHeight
                const verAlign = text.attr?.verAlign ?? TextVerAlign.Top;
                let transform = view.data.transform;
                if (verAlign === TextVerAlign.Middle) {
                    transform = fixTransform(0, (size.height - targetHeight) / 2, transform, view);
                } else if (verAlign === TextVerAlign.Bottom) {
                    transform = fixTransform(0, (size.height - targetHeight), transform, view);
                }
                for (let i = 0, pc = text.paras.length; i < pc; i++) {
                    const para = text.paras[i];
                    const horAlign = para.attr?.alignment ?? TextHorAlign.Left;
                    if (targetWidth === Math.ceil(layout.paras[i].paraWidth)) {
                        if (horAlign === TextHorAlign.Centered) {
                            transform = fixTransform((size.width - targetWidth) / 2, 0, transform, view);
                        } else if (horAlign === TextHorAlign.Right) {
                            transform = fixTransform(size.width - targetWidth, 0, transform, view);
                        }
                    }
                }
                this.updateLayoutArgs(transform, frame);
                break;
            }
            default:
                this.updateLayoutArgs(transform, frame);
                break;
        }
        this.updateFrames();
    }
}