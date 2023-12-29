import { TextLayout } from "../data/textlayout";
import { OverrideType, Path, ShapeFrame, TableCell, TableCellType, Text, VariableType } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView, isDiffShapeFrame } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/text";
import { DViewCtx, PropsType } from "./viewctx";
import { CursorLocate, TextLocate, locateCursor, locateRange, locateText } from "../data/textlocate";

export class TableCellView extends ShapeView {

    private m_imgPH: string;

    constructor(ctx: DViewCtx, props: PropsType & { frame?: ShapeFrame }, imgPH: string) {
        super(ctx, props, false);
        this.m_imgPH = imgPH;

        const frame = props.frame!;
        this.m_frame.x = frame.x;
        this.m_frame.y = frame.y;
        this.m_frame.width = frame.width;
        this.m_frame.height = frame.height;
        this.afterInit();
    }

    layout(props?: PropsType & { frame?: ShapeFrame }): void {

        this.m_ctx.removeReLayout(this);

        const frame = props?.frame;
        if (frame && isDiffShapeFrame(this.m_frame, frame)) {
            this.updateLayoutArgs(frame, undefined, undefined, undefined, undefined);
            this.m_textpath = undefined;
            this.m_layout = undefined; // todo
            if (!this.m_isVirtual) {
                const shape = this.m_data as TableCell;
                shape.text?.updateSize(frame.width, frame.height);
            }
            this.m_ctx.setDirty(this);
        }
    }

    getText(): Text {
        const v = this._findOV(OverrideType.Text, VariableType.Text);
        const ret = v ? v.value : (this.m_data as TableCell).text;
        if (!ret) throw new Error('text not found');
        return ret;
    }

    get text() {
        return this.getText();
    }

    getLayout() {
        const text = this.getText();
        if (this.isVirtualShape) {
            const frame = this.frame;
            if (!this.m_layout) this.m_layout = text.getLayout2(frame.width, frame.height);
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
            const layout = this.getLayout();
            return renderTextLayout(elh, layout);
        }
        return [];
    }
}