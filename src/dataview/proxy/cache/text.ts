/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { ViewCache } from "./view";
import { TextShapeView } from "../../textshape";
import { Path } from "@kcaitech/path";
import { renderText2Path } from "../../../render/SVG/effects/text";
import {
    overrideText,
    OverrideType,
    string2Text,
    SymbolShape,
    Text, TextLayout,
    TextMask,
    TextShape, Variable,
    VariableType
} from "../../../data";
import { objectId } from "../../../basic/objectid";

export class TextViewCache extends ViewCache {
    constructor(protected view: TextShapeView) {
        super(view);
    }

    private m_textpath?: Path;
    private m_text: Text | undefined;
    private m_layout?: TextLayout;
    private m_layout_token: string | undefined;
    private m_pre_text: Text | undefined;

    get textPath() {
        return this.m_textpath ?? (this.m_textpath = renderText2Path(this.layout, 0, 0));
    }

    private _onTextMaskChange() {
        const view = this.view
        view.getText().dropAllLayout();
        view.ctx.setReLayout(view);
        view.ctx.setDirty(view);
        view.notify('style', 'text', 'mask');
    }

    private onTextMaskChange = this._onTextMaskChange.bind(this);
    textMaskSet: Set<TextMask> = new Set();

    get text(): Text {
        if (this.m_text) return this.m_text;

        const v = this.view._findOV(OverrideType.Text, VariableType.Text);
        if (v) {
            this.m_text = this.getTextFromVariable(v);
        } else {
            this.m_text = this.textProxy(this.view.data.text);
        }
        return this.m_text;
    }

    private getTextFromVariable(variable: Variable) {
        const view = this.view;

        const textWithUnknownFormat: Text = variable.value instanceof Text ? variable.value : string2Text(variable.value);

        if (textWithUnknownFormat.fixed) {
            return this.textProxy(textWithUnknownFormat);
        } else {
            let origin = view.data.text;

            if ((view.data as TextShape).varbinds?.has(OverrideType.Text)) {
                let overrideVar: Text | undefined
                const varId = view.data.varbinds?.get(OverrideType.Text)!
                let p = view.data.parent;
                while (p) {
                    if (p instanceof SymbolShape) {
                        const variable = p.variables.get(varId)
                        if (variable && variable.value instanceof Text) {
                            overrideVar = variable.value
                            break;
                        }
                    }
                    p = p.parent;
                }

                if (overrideVar && overrideVar !== variable.value) {
                    origin = overrideText(overrideVar, origin)
                }
            }

            return this.textProxy(overrideText(textWithUnknownFormat, origin));
        }
    }

    private m_proxy_attr_field = new Set<string>([
        'autoLineHeight',
        'minimumLineHeight',
        'maximumLineHeight',
    ]);
    private m_proxy_span_field = new Set<string>([
        'fontName',
        'fontSize',
        'italic',
        'kerning',
        'strikethrough',
        'transform',
        'underline',
        'weight'
    ]);

    private textProxy(text: Text) {
        const __textMaskSet: Set<TextMask> = new Set();

        const stylesMgr = text.getStylesMgr() ?? this.view.style.getStylesMgr();
        if (stylesMgr) {
            // 创建一个Proxy来包装text对象
            const masks: { lineheight: number | undefined; id: string, auto: boolean | undefined }[] = [];
            const attrField = this.m_proxy_attr_field;
            const spanField = this.m_proxy_span_field;
            text.paras.forEach(p => {
                p.spans.forEach((span: any) => {
                    const mask = (span.textMask && stylesMgr.getSync(span.textMask)) as TextMask;
                    if (!mask?.text) {
                        return span.__getter = undefined
                    } else {
                        masks.push({
                            lineheight: mask.text.maximumLineHeight,
                            id: mask.id,
                            auto: mask.text.autoLineHeight
                        });
                        span.__getter = (target: object, propertyKey: PropertyKey, receiver?: any) => {
                            const t = spanField.has(propertyKey.toString()) ? mask.text : target;
                            return Reflect.get(t, propertyKey, receiver);
                        }
                        __textMaskSet.add(mask);
                    }
                })
                if (!masks.length) {
                    (p as any).attr.__getter = undefined;
                    return
                }

                let id: string = masks[0].id;
                let max: number = -Infinity;

                for (const mask of masks) {
                    if (mask.auto) continue;
                    if (mask.lineheight !== undefined && mask.lineheight > max) {
                        id = mask.id;
                        max = mask.lineheight;
                    }
                }

                const mask = stylesMgr.getSync(id) as TextMask;
                if (!mask?.text) {
                    (p as any).attr.__getter = undefined;
                } else {
                    (p.attr as any).__getter = (target: object, propertyKey: PropertyKey, receiver?: any) => {
                        const t = attrField.has(propertyKey.toString()) ? mask.text : target;
                        return Reflect.get(t, propertyKey, receiver);
                    }
                    __textMaskSet.add(mask);
                }
            })
        }

        this.textMaskSet.forEach(mask => {
            if (__textMaskSet.has(mask)) return;
            mask.unwatch(this.onTextMaskChange);
        });
        __textMaskSet.forEach(mask => {
            if (this.textMaskSet.has(mask)) return;
            mask.watch(this.onTextMaskChange);
        });
        this.textMaskSet = __textMaskSet;

        return text;
    }

    get layout() {
        const view = this.view;
        const text = this.text;

        if (this.m_pre_text && this.m_layout_token && objectId(this.m_pre_text) !== objectId(text)) {
            this.m_pre_text.dropLayout(this.m_layout_token, view.id);
        }

        const frame = view.frameProxy.__origin_frame;
        const layout = text.getLayout3(frame, view.id, this.m_layout_token);

        this.m_layout_token = layout.token;
        if (this.m_layout !== layout.layout) {
            this.m_textpath = undefined;
        }
        this.m_layout = layout.layout;
        this.m_pre_text = text;
        return layout.layout;
    }

    dropLayout() {
        if (this.m_layout_token && this.m_pre_text) this.m_pre_text.dropLayout(this.m_layout_token, this.view.id);
    }
}