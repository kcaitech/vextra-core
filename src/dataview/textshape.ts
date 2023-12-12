import { TextLayout } from "../data/textlayout";
import { OverrideType, Text, VariableType } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { renderTextLayout } from "../render/text";

export class TextShapeView extends ShapeView {

    getText(): Text {
        const v = this._findOV(OverrideType.Text, VariableType.Text);
        return v ? v.value : this.m_data.text;
    }

    private m_layout?: TextLayout;

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        if (args.includes('text')) this.m_layout = undefined;
        // if (args.includes('variable')) this.m_layout = undefined; // 不确定是不是text变量？
    }

    renderContents(): EL[] {
        const text = this.getText();
        const frame = this.getFrame();
        if (!this.m_layout) this.m_layout = text.getLayout2(frame.width, frame.height);
        return renderTextLayout(elh, this.m_layout);
    }
}