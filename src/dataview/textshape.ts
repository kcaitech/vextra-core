/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import {
    OverrideType,
    TextLayout,
    ShapeSize,
    Text,
    TextShape,
    VariableType,
    overrideTextText,
    SymbolShape,
    string2Text,
} from "../data";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { renderText2Path } from "../render/SVG/effects/text";
import {
    CursorLocate, TextLocate, locateCursor,
    locateNextCursor, locatePrevCursor, locateRange, locateText
} from "../data/text/textlocate";
import { objectId } from "../basic/objectid";
import { Path } from "@kcdesign/path";
import { renderBorder } from "../render/SVG/effects";
import { DViewCtx, PropsType } from "./viewctx";
import { TextModifyEffect } from "./proxy/effects/text";
import { TextLayoutMgr } from "./proxy/layout/text";
import { TextViewCache } from "./proxy/cache/text";

export class TextShapeView extends ShapeView {
    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        this.effect = new TextModifyEffect(this);
        this.layoutProxy = new TextLayoutMgr(this);
        this.cache = new TextViewCache(this);
    }
    __str: string | Text | undefined;
    __strText: Text | undefined;

    getText(): Text {
        const v = this._findOV(OverrideType.Text, VariableType.Text);
        if (v) {
            if (this.__str) {
                if (typeof this.__str === "string") {
                    if (this.__str === v.value) {
                        return this.__strText!;
                    }
                } else if (typeof v.value === "string") {
                    //
                } else if (this.__str && v.value && objectId(this.__str) === objectId(v.value)) {
                    return this.__strText!;
                }
            }

            this.__str = v.value;

            let text: Text
            if (v.value instanceof Text) {
                text = v.value
            } else {
                text = string2Text(v.value)
            }

            let origin = (this.m_data as TextShape).text;
            // 可能是var // 有个继承链条？
            if ((this.m_data as TextShape).varbinds?.has(OverrideType.Text)) {
                let ovar: Text | undefined
                const varid = (this.m_data as TextShape).varbinds?.get(OverrideType.Text)!
                let p = this.m_data.parent;
                while (p) {
                    if (p instanceof SymbolShape) {
                        const variable = p.variables.get(varid)
                        if (variable && variable.value instanceof Text) {
                            ovar = variable.value
                            break;
                        }
                    }
                    p = p.parent;
                }
                if (ovar && ovar !== v.value) {
                    origin = overrideTextText(ovar, origin)
                }
            }
            this.__strText = overrideTextText(text, origin);
            return this.__strText;
        }

        const text = (this.m_data as TextShape).text;
        if (typeof text === 'string') throw new Error("");
        return text;
    }

    get data() {
        return this.m_data as TextShape;
    }

    get text() {
        return this.getText();
    }

    get isImageFill() {
        return false;
    }

    private m_layout?: TextLayout;
    // private m_layoutText?: Text;
    private m_textpath?: Path;

    __layoutToken: string | undefined;
    __preText: Text | undefined;

    getLayout() {
        const text = this.getText();

        if (this.__preText && this.__layoutToken && objectId(this.__preText) !== objectId(text)) {
            this.__preText.dropLayout(this.__layoutToken, this.id);
        }
        const frame = this.__origin_frame;
        const layout = text.getLayout3(frame, this.id, this.__layoutToken);
        this.__layoutToken = layout.token;
        if (this.m_layout !== layout.layout) {
            this.m_textpath = undefined;
        }
        this.m_layout = layout.layout;
        // if (this.isVirtualShape && this.__preText !== text) {
        //     this.updateFrameByLayout(frame);
        // }
        this.__preText = text;
        return layout.layout;
    }

    locateText(x: number, y: number): TextLocate {
        const layout = this.getLayout();
        return locateText(layout, x, y);
    }

    locateRange(start: number, end: number): { x: number, y: number }[] {
        return locateRange(this.getLayout(), start, end);
    }

    locateCursor(index: number, cursorAtBefore: boolean): CursorLocate | undefined {
        return locateCursor(this.getLayout(), index, cursorAtBefore);
    }

    locatePrevCursor(index: number): number {
        return locatePrevCursor(this.getLayout(), index);
    }

    locateNextCursor(index: number): number {
        return locateNextCursor(this.getLayout(), index);
    }
    protected renderBorder(): EL[] {
        return renderBorder(elh, this.getBorder(), this.size, this.getTextPath().toSVGString(), this.radius, this.isCustomBorder);
    }

    getTextPath() {
        if (!this.m_textpath) {
            this.m_textpath = renderText2Path(this.getLayout(), 0, 0)
        }
        return this.m_textpath;
    }

    // onDataChange(...args: any[]): void {
    //     super.onDataChange(...args);
    //     this.m_textpath = undefined;
    //     if (this.parent && (args.includes('text'))) {
    //         let p = this.parent as ArtboardView;
    //         while (p && p.autoLayout) {
    //             p.m_ctx.setReLayout(p);
    //             p = p.parent as ArtboardView;
    //         }
    //     }
    //     if (args.includes("text") || args.includes("variables")) this.__str = undefined; // 属性变化后需要重新生成text
    // }

    asyncRender() {
        return this.render();
    }
    render(): number {
        return this.m_renderer.render();
    }

    __origin_frame: ShapeSize = new ShapeSize();

    forceUpdateOriginFrame() {
        const frame = this.data.size;
        // this.__origin_frame.x = frame.x;
        // this.__origin_frame.y = frame.y;
        this.__origin_frame.width = frame.width;
        this.__origin_frame.height = frame.height;
    }

    // private updateFrameByLayout(origin: ShapeSize) {
    //     if (!this.isVirtualShape || !this.m_layout) return;
    //     const text = this.getText();
    //     const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
    //     if (textBehaviour !== TextBehaviour.Flexible) return;
    //     let notify = false;
    //     if (notify) {
    //         this.m_pathstr = undefined; // need update
    //         this.m_path = undefined;
    //         this.notify("shape-frame");
    //     }
    // }

    onDestroy(): void {
        super.onDestroy();
        if (this.__layoutToken && this.__preText) this.__preText.dropLayout(this.__layoutToken, this.id);
    }
}