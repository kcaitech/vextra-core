import { TextLayout } from "../data/textlayout";
import { OverrideType, Path, Text, TextShape, VariableType } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/text";
import { TextLocate, locateText } from "../data/textlocate";

export class TextShapeView extends ShapeView {


    protected isNoSupportDiamondScale(): boolean {
        return true;
    }

    getText(): Text {
        const v = this._findOV(OverrideType.Text, VariableType.Text);
        return v ? v.value : (this.m_data as TextShape).text;
    }

    get text() {
        return this.getText();
    }

    locateText(x: number, y: number): TextLocate {
        let layout;
        const text = this.getText();
        if (this.isVirtualShape) {
            const frame = this.frame;
            if (!this.m_layout) this.m_layout = text.getLayout2(frame.width, frame.height);
            layout = this.m_layout;
        }
        else {
            layout = text.getLayout();
        }
        return locateText(layout, x, y);
    }

    getTextPath() {
        if (!this.m_textpath) {
            const text = this.getText();
            this.m_textpath = renderText2Path(text, 0, 0)
        }
        return this.m_textpath;
    }

    private m_layout?: TextLayout;
    private m_textpath?: Path;

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        if (args.includes('text')) { // todo 文本要支持局部重排
            this.m_layout = undefined;
            this.m_textpath = undefined;
        }
        // if (args.includes('variable')) this.m_layout = undefined; // 不确定是不是text变量？
    }

    renderContents(): EL[] {
        const text = this.getText();
        if (this.isVirtualShape) {
            const frame = this.frame;
            if (!this.m_layout) this.m_layout = text.getLayout2(frame.width, frame.height);
            return renderTextLayout(elh, this.m_layout);
        }
        else {
            return renderTextLayout(elh, text.getLayout());
        }
    }
}