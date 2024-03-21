import { TextLayout } from "../data/textlayout";
import { OverrideType, Para, Path, ShapeFrame, Span, Text, TextShape, VariableType } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/text";
import { CursorLocate, TextLocate, locateCursor, locateNextCursor, locatePrevCursor, locateRange, locateText } from "../data/textlocate";
import { BasicArray } from "../data/basic";
import { mergeParaAttr, mergeSpanAttr, mergeTextAttr } from "../data/textutils";

export class TextShapeView extends ShapeView {


    protected isNoSupportDiamondScale(): boolean {
        return this.m_data.isNoSupportDiamondScale;
    }
    __str: string | undefined;
    __strText: Text | undefined;
    getText(): Text {
        const v = this._findOV(OverrideType.Text, VariableType.Text);
        if (v && typeof v.value === 'string') {
            if (this.__str === v.value) {
                return this.__strText!;
            }
            this.__str = v.value;
            const str = v.value.split('\n');
            const origin = (this.m_data as TextShape).text;
            this.__strText = new Text(new BasicArray<Para>());
            if (origin.attr) mergeTextAttr(this.__strText, origin.attr);
            const originp = origin.paras[0];
            const originspan = originp.spans[0];
            for (let i = 0; i < str.length; ++i) {
                const p = new Para(str[i], new BasicArray<Span>());
                p.spans.push(new Span(p.length));
                mergeParaAttr(p, originp);
                mergeSpanAttr(p.spans[0], originspan);
                this.__strText.paras.push(p);
            }
            return this.__strText;
        }

        const text = v ? v.value : (this.m_data as TextShape).text;
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
        if (this.__preText !== text && this.__layoutToken && this.__preText) this.__preText.dropLayout(this.__layoutToken, this.id);
        const frame = this.frame;
        const layout = text.getLayout3(frame, this.id, this.__layoutToken);
        this.__layoutToken = layout.token;
        this.__preText = text;

        if (this.m_layout !== layout.layout) {
            this.m_textpath = undefined;
        }

        this.m_layout = layout.layout;
        if (this.isVirtualShape) {
            this.updateFrameByLayout();
        }
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

    getTextPath() {
        if (!this.m_textpath) {
            this.m_textpath = renderText2Path(this.getLayout(), 0, 0)
        }
        return this.m_textpath;
    }


    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        // if (args.includes('variable')) this.m_layout = undefined; // 不确定是不是text变量？

        // if (args.includes('text')) { // todo 文本要支持局部重排
        //     this.clearCache();
        // }
        // else if (args.includes('shape-frame')) {
        //     this.clearCache();
        // }
    }

    renderContents(): EL[] {
        const layout = this.getLayout();
        return renderTextLayout(elh, layout, this.frame);
    }

    updateLayoutArgs(frame: ShapeFrame, hflip: boolean | undefined, vflip: boolean | undefined, rotate: number | undefined, radius: number | undefined): void {
        // if (this.isVirtualShape && isDiffShapeFrame(this.m_frame, frame)) {
        //     this.updateSize(frame.width, frame.height);
        // }
        super.updateLayoutArgs(frame, hflip, vflip, rotate, radius);
        // update frame by layout
        // this.updateFrameByLayout();
        this.getLayout(); // 要提前排版，不然frame不对，填充不对。也可以考虑先renderContents，再renderFills。
    }

    private updateFrameByLayout() {
        if (!this.isVirtualShape || !this.m_layout) return;

        const width = this.m_layout.contentWidth;
        const height = this.m_layout.contentHeight;
        let notify = false;
        if (width > this.m_frame.width) {
            this.m_frame.width = width;
            notify = true;
        }
        if (height > this.m_frame.height) {
            this.m_frame.height = height;
            notify = true;
        }
        // notify?
        if (notify) {
            this.m_pathstr = undefined; // need update
            this.m_path = undefined;
            this.notify("shape-frame");
        }
    }

    // clearCache() {
    //     this.m_layout = undefined;
    //     // this.m_layoutText = undefined;
    //     this.m_textpath = undefined;
    // }

    onDestory(): void {
        super.onDestory();
        if (this.__layoutToken && this.__preText) this.__preText.dropLayout(this.__layoutToken, this.id);
    }
}