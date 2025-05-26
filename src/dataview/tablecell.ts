/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { TextLayout } from "../data/text/textlayout";
import { BlurType, ShapeFrame, TableCell, TableCellType, Text } from "../data/classes";
import { EL, elh } from "./el";
import { ShapeView } from "./shape";
import { renderText2Path, renderTextLayout } from "../render/SVG/effects/text";
import { DViewCtx, PropsType } from "./viewctx";
import { CursorLocate, TextLocate, locateCursor, locateNextCursor, locatePrevCursor, locateRange, locateText } from "../data/text/textlocate";
import { newTableCellText } from "../data/text/textutils";
import { objectId } from "../basic/objectid";
import { TableView } from "./table";
import { innerShadowId } from "../render/SVG/effects";
import { Path } from "@kcdesign/path";

export class TableCellView extends ShapeView {

    private m_imgPH: string;
    private m_index: { row: number, col: number };

    constructor(ctx: DViewCtx, props: PropsType & { frame: ShapeFrame } & { index: { row: number, col: number } }, imgPH: string) {
        super(ctx, props);
        this.m_imgPH = imgPH;

        const frame = props.frame;
        this.transform.m02 = frame.x;
        this.transform.m12 = frame.y;
        // this.m_frame.x = frame.x;
        // this.m_frame.y = frame.y;
        this.frame.width = frame.width;
        this.frame.height = frame.height;
        this.m_index = props.index;
        // this.afterInit();
    }

    // onMounted(): void {
    //     const frame = this.frame;
    //     if (!this.isVirtualShape && this.cellType === TableCellType.Text) {
    //         const text = this.getText();
    //         text.updateSize(frame.width, frame.height);
    //     }
    // }

    get data(): TableCell {
        return this.m_data as TableCell;
    }
    get index() {
        return this.m_index;
    }

    // layout(props?: PropsType & { frame: ShapeFrame, index: { row: number, col: number } }): void {
    //
    //     this.m_ctx.removeReLayout(this);
    //
    //     if (!props) return;
    //
    //     if (props.data.id !== this.m_data.id) throw new Error('id not match');
    //     const dataChanged = objectId(props.data) !== objectId(this.m_data);
    //     if (dataChanged) {
    //         // data changed
    //         this.setData(props.data);
    //     }
    //
    //     const frame = props.frame;
    //     if (this.m_transform.m02 !== frame.x || this.m_transform.m12 !== frame.y || this.frame.width !== frame.width || this.frame.height !== frame.height) {
    //         // this.updateLayoutArgs(frame, undefined, undefined, undefined, undefined);
    //         this.m_transform.m02 = frame.x;
    //         this.m_transform.m12 = frame.y;
    //         // this.m_frame.x = frame.x;
    //         // this.m_frame.y = frame.y;
    //         this.frame.width = frame.width;
    //         this.frame.height = frame.height;
    //         this.m_textpath = undefined;
    //         this.m_layout = undefined; // todo
    //         this.m_path = undefined;
    //         this.m_pathstr = undefined;
    //         // if (!this.m_isVirtual) {
    //         //     const shape = this.m_data as TableCell;
    //         //     shape.text?.updateSize(frame.width, frame.height);
    //         // }
    //         this.m_ctx.setDirty(this);
    //     }
    //
    //     const index = props.index;
    //     if (index.col !== this.m_index.col || index.row !== this.m_index.row) {
    //         this.m_index = index;
    //         // this.m_ctx.setDirty(this);
    //     }
    // }

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

    // onDataChange(...args: any[]): void {
    //     super.onDataChange(...args);
    //     if (args.includes('text') || this.data.cellType !== TableCellType.Text) { // todo 文本要支持局部重排
    //         this.m_layout = undefined;
    //         this.m_textpath = undefined;
    //     }
    //     // if (args.includes('variable')) this.m_layout = undefined; // 不确定是不是text变量？
    //     this.renderContents();
    //
    //     (this.parent as any)?.bubblewatcher(...args);
    // }

    protected renderBorder(): EL[] {
        return [];
    }

    // renderContents(): EL[] {
    //     const shape = this.m_data as TableCell;
    //     const cellType = shape.cellType ?? TableCellType.None;
    //     if (cellType === TableCellType.None) {
    //         return [];
    //     }
    //     const frame = this.frame;
    //     if (cellType === TableCellType.Image) {
    //         const url = shape.peekImage(true);
    //         const img = elh("image", {
    //             'xlink:href': url ?? this.m_imgPH,
    //             width: frame.width,
    //             height: frame.height,
    //             x: 0,
    //             y: 0,
    //             'preserveAspectRatio': 'xMidYMid meet'
    //         });
    //         return [img];
    //     } else if (cellType === TableCellType.Text) {
    //         // if (!this.m_isVirtual) {
    //         //     shape.text?.updateSize(frame.width, frame.height);
    //         // }
    //         const layout = this.getLayout();
    //         return renderTextLayout(elh, layout, frame, this.blur);
    //     }
    //     return [];
    // }

    onDestroy(): void {
        super.onDestroy();
        if (this.__layoutToken && this.__preText) this.__preText.dropLayout(this.__layoutToken, this.id);
    }
    // asyncRender() {
    //     return this.render();
    // }

    // render(): number {
        // if (!this.checkAndResetDirty()) return this.m_render_version;
        //
        // if (!this.isVisible) {
        //     this.reset("g");
        //     return ++this.m_render_version;
        // }
        //
        // const fills = this.renderFills();
        // const borders = this.renderBorder();
        // const childs = this.renderContents();
        //
        // const filterId = `${objectId(this)}`;
        // const shadows = this.renderShadows(filterId);
        // const blurId = `blur-${objectId(this)}`;
        // const blur = this.renderBlur(blurId);
        //
        // let props = this.renderProps();
        // let children = [...fills, ...childs, ...borders];
        //
        // // 阴影
        // if (shadows.length) {
        //     let filter: string = '';
        //     const inner_url = innerShadowId(filterId, this.getShadows());
        //     filter = `url(#shadow-outer-${filterId}) `;
        //     if (inner_url.length) filter += inner_url.join(' ');
        //     children = [...shadows, elh("g", { filter }, children)];
        // }
        //
        // // 模糊
        // if (blur.length) {
        //     let filter: string = '';
        //     if (this.blur?.type === BlurType.Gaussian) filter = `url(#${blurId})`;
        //     children = [...blur, elh('g', { filter }, children)];
        // }
        //
        // this.reset("g", props, children);
        //
        // return ++this.m_render_version;
        // return this.m_renderer.render(this.type);
    // }
}