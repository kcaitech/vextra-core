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
    TextBehaviour,
    TextShape,
    Transform,
    VariableType,
    ShapeFrame,
    GradientType,
    FillType,
    overrideTextText,
    SymbolShape,
    string2Text,
    Shape,
    SymbolRefShape,
    TextVerAlign,
    TextHorAlign,
    TextMask,
    Span,
    Para,
    ParaAttr
} from "../data";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/text";
import {
    CursorLocate, TextLocate, locateCursor,
    locateNextCursor, locatePrevCursor, locateRange, locateText
} from "../data/text/textlocate";
import { objectId } from "../basic/objectid";
import { Path } from "@kcdesign/path";
import { renderBorders } from "../render";
import { importFill } from "../data/baseimport";
import { exportFill } from "../data/baseexport";
import { ArtboardView } from "./artboard";

export class TextShapeView extends ShapeView {
    __str: string | Text | undefined;
    __strText: Text | undefined;

    private _onTextMaskChange() {
        this.getText().dropAllLayout();
        this.m_ctx.setReLayout(this);           
        this.m_ctx.setDirty(this);
        this.notify('style', 'text', 'mask');
    }

    private onTextMaskChange = this._onTextMaskChange.bind(this);

    textMaskSet: Set<TextMask> = new Set();

    getText(): Text {
        const __textMaskSet: Set<TextMask> = new Set();

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

            const text: Text = v.value instanceof Text ? v.value : string2Text(v.value);

            let origin =  (this.m_data as TextShape).text;

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

        // 检查并应用textMask样式
        const stylesMgr = text.getStylesMgr();
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
            text.paras.forEach(p => {
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
            if (!__textMaskSet.has(mask)) mask.unwatch(this.onTextMaskChange);
        });
        __textMaskSet.forEach(mask => {
            if (!this.textMaskSet.has(mask)) mask.watch(this.onTextMaskChange);
        });
        this.textMaskSet = __textMaskSet;
        
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
    protected renderBorders(): EL[] {
        let border = this.getBorders();
        if (this.mask && border) {
            border.strokePaints.map(b => {
                const nb = importFill(exportFill(b));
                if (nb.fillType === FillType.Gradient && nb.gradient?.gradientType === GradientType.Angular) nb.fillType = FillType.SolidColor;
                return nb;
            });
        }
        return border && border.strokePaints.some(p => p.isEnabled) ? renderBorders(elh, border, this.size, this.getTextPath().toSVGString(), this.m_data, this.radius) : [];
    }

    getTextPath() {
        if (!this.m_textpath) {
            this.m_textpath = renderText2Path(this.getLayout(), 0, 0)
        }
        return this.m_textpath;
    }

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        this.m_textpath = undefined;
        if (this.parent && (args.includes('text'))) {
            let p = this.parent as ArtboardView;
            while (p && p.autoLayout) {
                p.m_ctx.setReLayout(p);
                p = p.parent as ArtboardView;
            }
        }
        if (args.includes("text") || args.includes("variables")) this.__str = undefined; // 属性变化后需要重新生成text
    }

    asyncRender() {
        return this.render();
    }

    renderContents(): EL[] {        
        const layout = this.getLayout();
        return renderTextLayout(elh, layout, this.frame, this.blur);
    }

    __origin_frame: ShapeSize = new ShapeSize();

    forceUpdateOriginFrame() {
        const frame = this.data.size;
        // this.__origin_frame.x = frame.x;
        // this.__origin_frame.y = frame.y;
        this.__origin_frame.width = frame.width;
        this.__origin_frame.height = frame.height;
    }

    updateLayoutArgs(trans: Transform, size: ShapeFrame, radius: number | undefined): void {
        // if (this.isVirtualShape && isDiffShapeFrame(this.m_frame, frame)) {
        //     this.updateSize(frame.width, frame.height);
        // }
        super.updateLayoutArgs(trans, size, radius);
        // this.__origin_frame.x = frame.x;
        // this.__origin_frame.y = frame.y;
        this.__origin_frame.width = size.width;
        this.__origin_frame.height = size.height;
        // update frame by layout
        this.getLayout(); // 要提前排版，不然frame不对，填充不对。也可以考虑先renderContents，再renderFills。
        // this.updateFrameByLayout(size);
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

    bleach(el: EL) {  // 漂白
        if (el.elattr.fill) el.elattr.fill = '#FFF';
        if (el.elattr.stroke) el.elattr.stroke = '#FFF';

        // 漂白字体
        if (el.eltag === 'text') {
            if ((el.elattr?.style as any).fill) {
                (el.elattr?.style as any).fill = '#FFF'
            }
        }

        // 漂白阴影
        if (el.eltag === 'feColorMatrix' && el.elattr.result) {
            let values: any = el.elattr.values;
            if (values) values = values.split(' ');
            if (values[3]) values[3] = 1;
            if (values[8]) values[8] = 1;
            if (values[13]) values[13] = 1;
            el.elattr.values = values.join(' ');
        }

        // 渐变漂白不了

        if (Array.isArray(el.elchilds)) el.elchilds.forEach(el => this.bleach(el));
    }

    onDestroy(): void {
        super.onDestroy();
        if (this.__layoutToken && this.__preText) this.__preText.dropLayout(this.__layoutToken, this.id);
    }

    protected _layout(parentFrame: ShapeSize | undefined, scale: { x: number; y: number; } | undefined): void {        
        const shape = this.data;
        const transform = shape.transform.clone();
        if (this.parent && (this.parent as ArtboardView).autoLayout) {
            transform.translateX = this.m_transform.translateX;
            transform.translateY = this.m_transform.translateY;
        }
        // if (!this.isVirtualShape && this.getText() === this.data.text) {
        //     this.updateLayoutArgs(transform, this.data.frame, undefined)
        //     this.updateFrames();
        //     return
        // }

        function fixTransform(offsetX: number, offsetY: number, transform: Transform, s: ShapeView) {
            const targetXY = transform.computeCoord(offsetX, offsetY)
            const dx = targetXY.x - transform.translateX;
            const dy = targetXY.y - transform.translateY;
            if (dx || dy) {
                transform = transform.clone().trans(dx, dy)
            }
            if (s.parent && (s.parent as ArtboardView).autoLayout) {
                transform.translateX = s.m_transform.translateX;
                transform.translateY = s.m_transform.translateY;
            }
            return transform;
        }
        const size = this.data.size
        const frame = this.data.frame;
        // 根据排版结果更新frame
        const text = this.getText();
        const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
        switch (textBehaviour) {
            case TextBehaviour.Fixed: {
                const layout = this.getLayout();
                const fontsize = text.attr?.fontSize ?? Text.DefaultFontSize;
                const targetHeight = Math.ceil(Math.max(fontsize, layout.contentHeight));
                frame.height = targetHeight
                const verAlign = text.attr?.verAlign ?? TextVerAlign.Top;

                if (verAlign === TextVerAlign.Middle) {
                    this.updateLayoutArgs(fixTransform(0, (size.height - targetHeight) / 2, this.data.transform, this), frame, undefined);
                } else if (verAlign === TextVerAlign.Bottom) {
                    this.updateLayoutArgs(fixTransform(0, (size.height - targetHeight), this.data.transform, this), frame, undefined);
                }
                else {
                    this.updateLayoutArgs(transform, frame, undefined);
                }
                break;
            }
            case TextBehaviour.Flexible: {
                const layout = this.getLayout();
                const targetWidth = Math.ceil(layout.contentWidth);
                const targetHeight = Math.ceil(layout.contentHeight);
                frame.width = targetWidth
                frame.height = targetHeight
                const verAlign = text.attr?.verAlign ?? TextVerAlign.Top;
                let transform = this.data.transform;
                if (verAlign === TextVerAlign.Middle) {
                    transform = fixTransform(0, (size.height - targetHeight) / 2, transform, this);
                } else if (verAlign === TextVerAlign.Bottom) {
                    transform = fixTransform(0, (size.height - targetHeight), transform, this);
                }
                for (let i = 0, pc = text.paras.length; i < pc; i++) {
                    const para = text.paras[i];
                    const horAlign = para.attr?.alignment ?? TextHorAlign.Left;
                    if (targetWidth === Math.ceil(layout.paras[i].paraWidth)) {
                        if (horAlign === TextHorAlign.Centered) {
                            transform = fixTransform((size.width - targetWidth) / 2, 0, transform, this);
                        } else if (horAlign === TextHorAlign.Right) {
                            transform = fixTransform(size.width - targetWidth, 0, transform, this);
                        }
                    }
                }
                this.updateLayoutArgs(transform, frame, undefined);
                break;
            }
            default:
                this.updateLayoutArgs(transform, frame, undefined);
                break;
        }
        this.updateFrames();
    }
}