/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, BasicMap, ResourceMgr } from "./basic";
import { ShapeType, TableCellType, CrdtNumber, ShapeFrame } from "./baseclasses"
import {Shape, Transform, ShapeSize} from "./shape";
import { Text, TextAttr } from "./text/text"
import { PathType } from "./consts";
import { newTableCellText } from "./text/textutils";
import { Path } from "@kcdesign/path";
export { TableLayout, TableGridItem } from "./tablelayout";
export { TableCellType } from "./baseclasses";
export { CrdtNumber } from "./baseclasses";

export class TableCell extends Shape implements classes.TableCell {
    get size(): classes.ShapeSize {
        return this.frame;
    }
    set size(size: classes.ShapeSize) {
    }
    get frame(): classes.ShapeFrame {
        return new ShapeFrame();
    }

    typeId = 'table-cell'
    cellType: TableCellType
    text: Text
    imageRef?: string
    rowSpan?: number
    colSpan?: number

    private __cacheData?: { media: { buff: Uint8Array, base64: string }, ref: string };

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        cellType: TableCellType,
        text: Text
    ) {
        super(
            crdtidx,
            id,
            name,
            type,
            transform,
            style
        )
        this.cellType = cellType
        this.text = text
    }

    getOpTarget(path: string[]) {
        if (path.length === 0) return this;
        if (path[0] === 'text') { // 兼容旧数据
            if (!this.text) this.text = newTableCellText();
            return this.text?.getOpTarget(path.slice(1));
        }
        return super.getOpTarget(path);
    }

    getCrdtPath(): string[] { // 覆写shape.getCrdtPath
        const p = this.__parent;
        if (!p) throw new Error("cell not inside table?");
        return p.getCrdtPath().concat(this.__propKey!);
    }

    // get shapeId(): (string | { rowIdx: number, colIdx: number })[] {
    //     const table = this.parent as TableShape;
    //     const indexCell = table.indexOfCell2(this);
    //     if (!indexCell) throw new Error("cell has no index?")
    //     return [table.id, indexCell];
    // }

    /**
     * 没有实例化cell前使用来画边框
     * @param frame 
     * @returns 
     */
    static getPathOfSize(frame: ShapeSize): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return Path.fromSVGString(path.join(''));
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return Path.fromSVGString(path.join(''));
    }

    isImageCell() {
        return this.cellType === TableCellType.Image;
    }
    isTextCell() {
        return this.cellType === TableCellType.Text;
    }

    // image
    private __startLoad: boolean = false;
    peekImage(startLoad: boolean = false) {
        if (this.__cacheData?.ref === this.imageRef) {
            return this.__cacheData?.media.base64;
        }
        if (!this.imageRef) return "";
        if (startLoad && !this.__startLoad) {
            this.__startLoad = true;
            const mediaMgr = (this.parent as TableShape).__imageMgr;
            mediaMgr && mediaMgr
                .get(this.imageRef)
                .then((val) => {
                    if (val) {
                        this.__cacheData = { media: val, ref: this.imageRef! };
                    }
                }).finally(() => {
                    this.__startLoad = false;
                    this.notify('image-reload');
                    return this.__cacheData?.media.base64;
                })
        }
    }
    // image shape
    async loadImage(): Promise<string> {
        if (this.__cacheData) return this.__cacheData.media.base64;
        if (!this.imageRef) return "";
        const mediaMgr = (this.parent as TableShape).__imageMgr;
        const val = mediaMgr && await mediaMgr.get(this.imageRef);
        if (val) {
            this.__cacheData = { media: val, ref: this.imageRef }
            this.notify();
        }
        return this.__cacheData && this.__cacheData.media.base64 || "";
    }

    getText(): Text {
        if (!this.text) throw new Error("");
        return this.text;
    }
}

export class TableShape extends Shape implements classes.TableShape {

    static MinCellSize = 10;
    static MaxRowCount = 50;
    static MaxColCount = 50;
    get frame(): classes.ShapeFrame {
        return new ShapeFrame(0, 0, this.size.width, this.size.height);
    }
    hasSize(): boolean {
        return true;
    }
    typeId = 'table-shape'
    // @ts-ignore
    size: ShapeSize
    cells: BasicMap<string, TableCell>
    rowHeights: BasicArray<CrdtNumber>
    colWidths: BasicArray<CrdtNumber>
    textAttr?: TextAttr // 文本默认属性

    __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;
    // private __layout: LayoutItem = new LayoutItem();
    // private __heightTotalWeights: number;
    // private __widthTotalWeights: number;

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        cells: BasicMap<string, TableCell>,
        rowHeights: BasicArray<CrdtNumber>,
        colWidths: BasicArray<CrdtNumber>
    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.Table,
            transform,
            style,
        )
        this.size = size
        this.rowHeights = rowHeights
        this.colWidths = colWidths
        this.cells = cells;
        // this.__heightTotalWeights = rowHeights.reduce((pre, cur) => pre + cur.value, 0);
        // this.__widthTotalWeights = colWidths.reduce((pre, cur) => pre + cur.value, 0);
    }

    getOpTarget(path: string[]): any {
        const path0 = path[0];
        if (path0 === "cells" && path.length > 1) {
            const cellId = path[1];
            const cell = this.cells.get(cellId);
            return cell?.getOpTarget(path.slice(2));
        }
        if (path0 === "textAttr" && !this.textAttr) this.textAttr = new TextAttr();
        return super.getOpTarget(path);
    }

    setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
        this.__imageMgr = imageMgr;
    }

    get naviChilds(): Shape[] | undefined {
        return undefined;
    }

    /**
     * @deprecated
     */
    get datas() {
        return this.cells;
    }

    // updateTotalWeights() {
    //     this.__heightTotalWeights = this.rowHeights.reduce((pre, cur) => pre + cur.value, 0);
    //     this.__widthTotalWeights = this.colWidths.reduce((pre, cur) => pre + cur.value, 0);
    // }

    // get widthTotalWeights() {
    //     return this.__widthTotalWeights;
    // }
    // get heightTotalWeights() {
    //     return this.__heightTotalWeights;
    // }
    get rowCount() {
        return this.rowHeights.length;
    }
    get colCount() {
        return this.colWidths.length;
    }

    getPathOfSize(frame: ShapeSize, fixedRadius?: number): Path {
        const x = 0;
        const y = 0;
        const w = frame.width;
        const h = frame.height;
        const path = [["M", x, y],
        ["l", w, 0],
        ["l", 0, h],
        ["l", -w, 0],
        ["z"]];
        return Path.fromSVGString(path.join(''));
    }

    get pathType() {
        return PathType.Fixed;
    }

    get isPathIcon() {
        return false;
    }
    // get isImageFill() {
    //     return false;
    // }
}