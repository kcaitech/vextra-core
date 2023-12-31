import { TextLayout } from "../data/textlayout";
import { OverrideType, Path, ShapeFrame, Text, TextBehaviour, TextShape, TextVerAlign, VariableType } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView, isDiffShapeFrame } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/text";
import { CursorLocate, TextLocate, locateCursor, locateRange, locateText } from "../data/textlocate";

export class TextShapeView extends ShapeView {


    protected isNoSupportDiamondScale(): boolean {
        return true;
    }

    getText(): Text {
        const v = this._findOV(OverrideType.Text, VariableType.Text);
        return v ? v.value : (this.m_data as TextShape).text;
    }
    get data() {
        return this.m_data as TextShape;
    }
    get text() {
        return this.getText();
    }

    getLayout() {
        const text = this.getText();
        if (this.isVirtualShape || text !== this.data.text/* todo */) {
            const frame = this.frame;
            if (!this.m_layout || this.m_layoutText !== text) {
                this.m_layout = text.getLayout2(frame.width, frame.height);
                this.m_layoutText = text;
                this.updateFrameByLayout();
            }
            return this.m_layout;
        }
        else {
            return text.getLayout();
        }
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

    getTextPath() {
        if (!this.m_textpath) {
            this.m_textpath = renderText2Path(this.getLayout(), 0, 0)
        }
        return this.m_textpath;
    }

    private m_layout?: TextLayout;
    private m_layoutText?: Text;
    private m_textpath?: Path;

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        // if (args.includes('variable')) this.m_layout = undefined; // 不确定是不是text变量？

        if (args.includes('text')) { // todo 文本要支持局部重排
            this.clearCache();
        }
        else if (args.includes('shape-frame')) {
            this.clearCache();
        }
    }

    renderContents(): EL[] {
        const layout = this.getLayout();
        return renderTextLayout(elh, layout);
    }

    __layoutWidth: number = 0;
    __frameHeight: number = 0;
    __frameWidth: number = 0;
    private updateSize(w: number, h: number) {
        const text = this.m_layoutText;
        if (!text) return;
        const layoutWidth = ((b: TextBehaviour) => {
            switch (b) {
                case TextBehaviour.Flexible: return Number.MAX_VALUE;
                case TextBehaviour.Fixed: return w;
                case TextBehaviour.FixWidthAndHeight: return w;
            }
            // return Number.MAX_VALUE
        })(text.attr?.textBehaviour ?? TextBehaviour.Flexible)
        if (this.__layoutWidth !== layoutWidth) {
            this.__frameHeight = h;
            this.__layoutWidth = layoutWidth;
            this.m_layout = undefined;
        }
        else if (this.__frameHeight !== h && this.m_layout) {
            const vAlign = text.attr?.verAlign ?? TextVerAlign.Top;
            const yOffset: number = ((align: TextVerAlign) => {
                switch (align) {
                    case TextVerAlign.Top: return 0;
                    case TextVerAlign.Middle: return (h - this.m_layout.contentHeight) / 2;
                    case TextVerAlign.Bottom: return h - this.m_layout.contentHeight;
                }
            })(vAlign);
            this.m_layout.yOffset = yOffset;
        }
        this.__frameWidth = w;
        this.__frameHeight = h;
    }

    updateLayoutArgs(frame: ShapeFrame, hflip: boolean | undefined, vflip: boolean | undefined, rotate: number | undefined, radius: number | undefined): void {
        if (this.isVirtualShape && isDiffShapeFrame(this.m_frame, frame)) {
            this.updateSize(frame.width, frame.height);
        }
        super.updateLayoutArgs(frame, hflip, vflip, rotate, radius);
        // update frame by layout
        this.updateFrameByLayout();
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

    clearCache() {
        this.m_layout = undefined;
        this.m_layoutText = undefined;
        this.m_textpath = undefined;
        this.__layoutWidth = 0;
        this.__frameHeight = 0;
        this.__frameWidth = 0;
    }
}