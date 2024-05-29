import { TextLayout } from "../data/textlayout";
import { Path, ShapeFrame, TableCell, TableCellType, Text } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView, isDiffShapeFrame } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/text";
import { DViewCtx, PropsType } from "./viewctx";
import { CursorLocate, TextLocate, locateCursor, locateNextCursor, locatePrevCursor, locateRange, locateText } from "../data/textlocate";
import { newTableCellText } from "../data/textutils";
import { objectId } from "../basic/objectid";
import { TableView } from "./table";

export class TableCellView extends ShapeView {

    private m_imgPH: string;
    private m_index: { row: number, col: number };

    constructor(ctx: DViewCtx, props: PropsType & { frame: ShapeFrame } & { index: { row: number, col: number } }, imgPH: string) {
        super(ctx, props, false);
        this.m_imgPH = imgPH;

        const frame = props.frame;
        // this.m_frame.x = frame.x;
        // this.m_frame.y = frame.y;
        // this.m_frame.width = frame.width;
        // this.m_frame.height = frame.height;
        this.m_index = props.index;
        this.afterInit();
    }

    protected afterInit(): void {
        // const frame = this.frame;
        // if (!this.isVirtualShape && this.cellType === TableCellType.Text) {
        //     const text = this.getText();
        //     text.updateSize(frame.width, frame.height);
        // }
    }

    get data(): TableCell {
        return this.m_data as TableCell;
    }
    get index() {
        return this.m_index;
    }

    layout(props?: PropsType & { frame: ShapeFrame, index: { row: number, col: number } }): void {

        this.m_ctx.removeReLayout(this);

        if (!props) return;

        if (props.data.id !== this.m_data.id) throw new Error('id not match');
        const dataChanged = objectId(props.data) !== objectId(this.m_data);
        if (dataChanged) {
            // data changed
            this.setData(props.data);
        }

        const frame = props.frame;
        // if (isDiffShapeFrame(this.m_frame, frame)) {
        //     this.updateLayoutArgs(frame, undefined, undefined, undefined, undefined);
        //     this.m_textpath = undefined;
        //     this.m_layout = undefined; // todo
        //     // if (!this.m_isVirtual) {
        //     //     const shape = this.m_data as TableCell;
        //     //     shape.text?.updateSize(frame.width, frame.height);
        //     // }
        //     this.m_ctx.setDirty(this);
        // }

        const index = props.index;
        if (index.col !== this.m_index.col || index.row !== this.m_index.row) {
            this.m_index = index;
            // this.m_ctx.setDirty(this);
        }
    }

    getText(): Text {
        // const v = this._findOV(OverrideType.Text, VariableType.Text);
        // if (v) {
        //     const ret = v.value;
        //     if (!ret) throw new Error('text not found');
        //     return ret;
        // }
        const ret = (this.m_data as TableCell).text;
        if (ret) return ret;
        const textAttr = (this.parent as TableView).data.textAttr;
        const _text = newTableCellText(textAttr);
        return _text;
    }

    get text() {
        return this.getText();
    }

    get cellType() {
        return this.data.cellType;
    }

    get rowSpan() {
        return this.data.rowSpan;
    }
    get colSpan() {
        return this.data.colSpan;
    }
    get imageRef() {
        return this.data.imageRef;
    }

    private m_layout?: TextLayout;
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
        // if (this.isVirtualShape) {
        //     this.updateFrameByLayout();
        // }
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

    get isVisible(): boolean {
        return true;
    }

    // private m_layout?: TextLayout;
    // private m_textpath?: Path;

    onDataChange(...args: any[]): void {
        super.onDataChange(...args);
        if (args.includes('text') || this.data.cellType !== TableCellType.Text) { // todo 文本要支持局部重排
            this.m_layout = undefined;
            this.m_textpath = undefined;
        }
        // if (args.includes('variable')) this.m_layout = undefined; // 不确定是不是text变量？
        this.renderContents();

        (this.parent as any)?.bubblewatcher(...args);
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
            // if (!this.m_isVirtual) {
            //     shape.text?.updateSize(frame.width, frame.height);
            // }
            const layout = this.getLayout();
            return renderTextLayout(elh, layout, frame);
        }
        return [];
    }

    onDestory(): void {
        super.onDestory();
        if (this.__layoutToken && this.__preText) this.__preText.dropLayout(this.__layoutToken, this.id);
    }
}