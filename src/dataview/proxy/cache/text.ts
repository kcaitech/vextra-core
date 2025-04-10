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
    TextShape,
    VariableType
} from "../../../data";
import { objectId } from "../../../basic/objectid";

export class TextViewCache extends ViewCache {
    constructor(protected view: TextShapeView) {
        super(view);
    }

    private m_textpath?: Path;
    private m_str: string | Text | undefined;
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
        const __textMaskSet: Set<TextMask> = new Set();
        const view = this.view

        const v = view._findOV(OverrideType.Text, VariableType.Text);
        if (v) {
            if (this.m_str) {
                if (typeof this.m_str === "string") {
                    if (this.m_str === v.value) {
                        return this.m_text!;
                    }
                } else if (typeof v.value === "string") {
                    //
                } else if (this.m_str && v.value && objectId(this.m_str) === objectId(v.value)) {
                    return this.m_text!;
                }
            }

            this.m_str = v.value;

            const _text: Text = v.value instanceof Text ? v.value : string2Text(v.value);

            let origin = (view.m_data as TextShape).text;

            // 可能是var // 有个继承链条？
            if ((view.m_data as TextShape).varbinds?.has(OverrideType.Text)) {
                let ovar: Text | undefined
                const varid = (view.m_data as TextShape).varbinds?.get(OverrideType.Text)!
                let p = view.m_data.parent;
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
                    origin = overrideText(ovar, origin)
                }
            }

            return this.m_text = overrideText(_text, origin);
        }

        const _text = (view.m_data as TextShape).text;

        // 检查并应用textMask样式
        const stylesMgr = _text.getStylesMgr();
        if (stylesMgr) {
            // 创建一个Proxy来包装text对象
            let maskid: {
                lineheight: number | undefined
                id: string
            }[] = [];
            const specialProperties = new Set([
                'alignment',
                'paraSpacing',
                'autoLineHeight',
                'minimumLineHeight',
                'maximumLineHeight',
                'indent',
                'textMask'
            ]);
            _text.paras.forEach(p => {
                p.spans.forEach(span => {
                    // span
                    const mask = (span.textMask && stylesMgr.getSync(span.textMask)) as TextMask | undefined;
                    if (!mask?.text) {
                        (span as any).__getter = undefined
                        return
                    }

                    __textMaskSet.add(mask);
                    maskid.push({ lineheight: mask.text.maximumLineHeight, id: mask.id });
                    (span as any).__getter = (target: object, propertyKey: PropertyKey, receiver?: any) => {
                        const val = Reflect.get(mask.text, propertyKey)
                        if (val !== undefined) return val
                        return Reflect.get(target, propertyKey, receiver)
                    }
                })
                // para
                const _mask = maskid.reduce((max, current) => {
                    return (current.lineheight ?? 0) > (max.lineheight ?? 0) ? current : max;
                }, { lineheight: undefined, id: '' });

                const mask = (_mask.id && stylesMgr.getSync(_mask.id)) as TextMask;
                if (!mask?.text) {
                    (p as any).attr.__getter = undefined
                    return
                }
                __textMaskSet.add(mask);
                (p.attr as any).__getter = (target: object, propertyKey: PropertyKey, receiver?: any) => {
                    const val = Reflect.get(mask.text, propertyKey);
                    const key = propertyKey as string;
                    if (specialProperties.has(key)) {
                        return key === 'textMask' ? '' : val !== undefined ? val : Reflect.get(target, propertyKey, receiver);
                    }
                    return Reflect.get(target, propertyKey, receiver);
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

        return _text;
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