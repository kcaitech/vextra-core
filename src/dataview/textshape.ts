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
    string2Text
} from "../data";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/SVG/text";
import {
    CursorLocate, TextLocate, locateCursor,
    locateNextCursor, locatePrevCursor, locateRange, locateText
} from "../data/text/textlocate";
import { objectId } from "../basic/objectid";
import { Path } from "@kcdesign/path";
import { renderBorders } from "../render/SVG";
import { importBorder } from "../data/baseimport";
import { exportBorder } from "../data/baseexport";

export class TextShapeView extends ShapeView {
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
        if (this.isVirtualShape && this.__preText !== text) {
            this.updateFrameByLayout(frame);
        }
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
        let borders = this.getBorders();
        if (this.mask) {
            borders = borders.map(b => {
                const nb = importBorder(exportBorder(b));
                if (nb.fillType === FillType.Gradient && nb.gradient?.gradientType === GradientType.Angular) nb.fillType = FillType.SolidColor;
                return nb;
            })
        }
        return borders.length > 0 ? renderBorders(elh, borders, this.size, this.getTextPath().toSVGString(), this.m_data) : [];
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
        this.updateFrameByLayout(size);
    }

    private updateFrameByLayout(origin: ShapeSize) {
        if (!this.isVirtualShape || !this.m_layout) return;
        const text = this.getText();
        const textBehaviour = text.attr?.textBehaviour ?? TextBehaviour.Flexible;
        if (textBehaviour !== TextBehaviour.Flexible) return;
        let notify = false;
        if (notify) {
            this.m_pathstr = undefined; // need update
            this.m_path = undefined;
            this.notify("shape-frame");
        }
    }

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
}