import { TextLayout } from "../data/textlayout";
import { OverrideType, Path, ShapeFrame, TableCell, TableCellType, Text, VariableType } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/text";
import { DViewCtx, PropsType } from "./viewctx";

export class TableCellView extends ShapeView {

    private m_imgPH: string;

    constructor(ctx: DViewCtx, props: PropsType & { frame?: ShapeFrame }, imgPH: string) {
        super(ctx, props);
        this.m_imgPH = imgPH;

        const frame = props.frame!;
        this.m_frame.x = frame.x;
        this.m_frame.y = frame.y;
        this.m_frame.width = frame.width;
        this.m_frame.height = frame.height;
    }

    layout(props: PropsType, force?: boolean | undefined): void {
        // super.update(props, force);
        this.m_ctx.removeReLayout(this);
        // this.m_ctx.setDirty(this);
    }

    getText(): Text {
        const v = this._findOV(OverrideType.Text, VariableType.Text);
        return v ? v.value : (this.m_data as TableCell).text;
    }

    getTextPath() {
        if (!this.m_textpath) {
            const text = this.getText();
            this.m_textpath = renderText2Path(text, 0, 0)
        }
        return this.m_textpath;
    }

    isVisible(): boolean {
        return true;
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

    protected renderBorders(): EL[] {
        return [];
    }

    renderContents(): EL[] {
        const shape = this.m_data as TableCell;
        const cellType = shape.cellType ?? TableCellType.None;
        if (cellType === TableCellType.None) {
            return [];
        }
        const frame = this.frame;
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
            if (this.m_isVirtual) {
                const text = this.getText();
                if (!this.m_layout) this.m_layout = text.getLayout2(frame.width, frame.height);
                return renderTextLayout(elh, this.m_layout);
            }
            else {
                // todo: 临时方案，后续应该把data里的layout数据去掉
                const layout = shape.getLayout();
                return renderTextLayout(elh, layout!);
            }
        }
        return [];
    }
}