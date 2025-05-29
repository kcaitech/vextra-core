/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Style } from "./style";
import * as classes from "./baseclasses"
import { BasicArray, BasicMap } from "./basic";
import { ShapeType, CrdtNumber, ShapeFrame, TableCellAttr } from "./baseclasses"
import {Shape, Transform, ShapeSize} from "./shape";
import { TextAttr } from "./text/text"
import { PathType } from "./consts";
import { Path } from "@kcdesign/path";
import { Artboard } from "./baseclasses";
export { CrdtNumber } from "./baseclasses";

export class TableShape2 extends Shape implements classes.TableShape2 {

    static MinCellSize = 10;
    static MaxRowCount = 50;
    static MaxColCount = 50;
    get frame(): classes.ShapeFrame {
        return new ShapeFrame(0, 0, this.size.width, this.size.height);
    }
    hasSize(): boolean {
        return true;
    }
    typeId = "table-shape2"
    // @ts-ignore
    size: ShapeSize
    cells: BasicMap<string, Artboard>
    rowHeights: BasicArray<CrdtNumber>
    colWidths: BasicArray<CrdtNumber>
    textAttr?: TextAttr // 文本默认属性

    // __imageMgr?: ResourceMgr<{ buff: Uint8Array, base64: string }>;

    constructor(
        crdtidx: BasicArray<number>,
        id: string,
        name: string,
        type: ShapeType,
        transform: Transform,
        style: Style,
        size: ShapeSize,
        cells: BasicMap<string, Artboard>,
        cellAttrs: BasicMap<string, TableCellAttr>,
        rowHeights: BasicArray<CrdtNumber>,
        colWidths: BasicArray<CrdtNumber>
    ) {
        super(
            crdtidx,
            id,
            name,
            ShapeType.Table2,
            transform,
            style,
        )
        this.size = size
        this.rowHeights = rowHeights
        this.colWidths = colWidths
        this.cells = cells;
        this.cellAttrs = cellAttrs;
    }
    cellAttrs: BasicMap<string, TableCellAttr>;

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

    // setImageMgr(imageMgr: ResourceMgr<{ buff: Uint8Array, base64: string }>) {
    //     this.__imageMgr = imageMgr;
    // }

    get naviChilds(): Shape[] | undefined {
        return undefined;
    }

    /**
     * @deprecated
     */
    get datas() {
        return this.cells;
    }

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
