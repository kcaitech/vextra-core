import { TextLayout } from "../data/textlayout";
import { OverrideType, Path, TableCellType, Text, VariableType } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/text";
import { DViewCtx, PropsType } from "./viewctx";

export class TableCellView extends ShapeView {

    private m_imgPH: string;

    constructor(ctx: DViewCtx, props: PropsType, imgPH: string) {
        super(ctx, props);
        this.m_imgPH = imgPH;
    }

    getText(): Text {
        const v = this._findOV(OverrideType.Text, VariableType.Text);
        return v ? v.value : this.m_data.text;
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
        if (args.includes('text')) {
            this.m_layout = undefined;
            this.m_textpath = undefined;
        }
        // if (args.includes('variable')) this.m_layout = undefined; // 不确定是不是text变量？
    }

    protected renderBorders(): EL[] {
        return [];
    }

    renderContents(): EL[] {
        const shape = this.m_data;
        const cellType = shape.cellType ?? TableCellType.None;
        if (cellType === TableCellType.None) {
            return [];
        }
        const frame = this.getFrame();
        if (cellType === TableCellType.Image) {
            const url = shape.peekImage(true);
            const img = elh("image", {
                'xlink:href': url ?? this.m_imgPH,
                width: frame.width,
                height: frame.height,
                x: 0,
                y: 0,
                'preserveAspectRatio': 'xMidYMid meet'
            });
            return [img];
        } else if (cellType === TableCellType.Text) {
            const text = this.getText();
            if (!this.m_layout) this.m_layout = text.getLayout2(frame.width, frame.height);
            return renderTextLayout(elh, this.m_layout);
        }
        return [];
    }
}