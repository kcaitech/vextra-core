
import { ViewCache } from "./view";
import { TextShapeView } from "../../textshape";
import { Path } from "@kcdesign/path";
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
        view.m_ctx.setReLayout(view);
        view.m_ctx.setDirty(view);
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

            if ((view.m_data as TextShape).varbinds?.has(OverrideType.Text)) {
                let overrideVar: Text | undefined
                const varId = view.data.varbinds?.get(OverrideType.Text)!
                let p = view.m_data.parent;
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
            const maskid: { lineheight: number | undefined; id: string }[] = [];
            const attrField = this.m_proxy_attr_field;
            const spanField = this.m_proxy_span_field;
            text.paras.forEach(p => {
                p.spans.forEach((span: any) => {
                    const mask = (span.textMask && stylesMgr.getSync(span.textMask)) as TextMask;
                    if (!mask?.text) {
                        return span.__getter = undefined
                    } else {
                        maskid.push({ lineheight: mask.text.maximumLineHeight, id: mask.id });
                        span.__getter = (target: object, propertyKey: PropertyKey, receiver?: any) => {
                            const t = spanField.has(propertyKey.toString()) ? mask.text : target;
                            return Reflect.get(t, propertyKey, receiver);
                        }
                        __textMaskSet.add(mask);
                    }
                })
                const _mask = maskid.reduce((max, current) => {
                    return (current.lineheight ?? 0) > (max.lineheight ?? 0) ? current : max;
                }, { lineheight: undefined, id: '' });

                const mask = (_mask.id && stylesMgr.getSync(_mask.id)) as TextMask;
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