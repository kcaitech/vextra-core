/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Document, PageListItem } from "../data/document";
import { Page } from "../data/page";
import { GroupShape, Shape, SymbolShape } from "../data/shape";
import { ShapeFrame, SymbolUnionShape } from "../data/shape";
import { BasicArray, BasicMap } from "../data/basic";
import { IImportContext, importSymbolShape, importSymbolUnionShape } from "../data/baseimport";
import { FMT_VER_latest } from "../data/fmtver";
import { ShapeSize } from "../data/typesdefine";
import { BasicOp } from "./basicop";

export class PageOp {
    constructor(private _basicop: BasicOp) { }
    
    pageInsert(document: Document, page: Page, index: number) {
        if (index < 0) return;
        const pagesList = document.pagesList;
        if (index >= pagesList.length) index = pagesList.length;
        const idx = new BasicArray<number>();
        const item = new PageListItem(idx, page.id, page.name);
        this._basicop.crdtArrayInsert(pagesList, index, item);
        this._basicop.crdtSetAttr(document.pagesMgr, page.id, page);
    }
    pageDelete(document: Document, index: number) {
        const pagesList = document.pagesList;
        if (index < 0 || index >= pagesList.length) return;
        if (pagesList.length <= 1) return;
        const item = pagesList[index];
        this._basicop.crdtArrayRemove(pagesList, index);
        this._basicop.crdtSetAttr(document.pagesMgr, item.id, undefined);
    }
    pageModifyName(document: Document, pageId: string, name: string) {
        const item = document.pagesList.find(p => p.id === pageId);
        return item && this._basicop.crdtSetAttr(item, "name", name);
    }
    
    registSymbol(document: Document, symbolId: string, pageId: string) {
        return this._basicop.crdtSetAttr(document.symbolregist, symbolId, pageId);
    }
    
    /**
     * 
     * @param document 
     * @param fromIdx 
     * @param toIdx 移动前的index
     */
    pageMove(document: Document, fromIdx: number, toIdx: number) {
        return this._basicop.crdtArrayMove(document.pagesList, fromIdx, toIdx);
    }
    
    _checkNum(x: number) {
        // check
        if (Number.isNaN(x) || (!Number.isFinite(x))) throw new Error(String(x));
    }
    
    _checkFrame(shape: Shape) {
        if (!shape.hasSize()) return;
        const frame: ShapeSize = shape.size;
        if (frame.width === 0 || frame.height === 0) throw new Error();
        // _checkNum(frame.x);
        // _checkNum(frame.y);
        this._checkNum(frame.width);
        this._checkNum(frame.height);
    }
    
    shapeInsert(document: Document, page: Page, parent: GroupShape, shape: Shape, index: number) {
        // shape不可以一次性插入多个对象，需要分开插入
        // 从根开始插入
    
        this._checkFrame(shape);
    
    
        const recursive = (p: GroupShape, shape: Shape, index: number) => {
    
            let childs: Shape[] | undefined = undefined;
            if (shape instanceof GroupShape) {
                childs = shape.childs.slice(0);
                (shape).childs.length = 0;
            }
            const op = this._basicop.crdtShapeInsert(page, p, shape, index);
            if (op) page.onAddShape(op, false);
    
            if (childs) for (let i = 0; i < childs.length; ++i) {
                recursive(shape as GroupShape, childs[i], i);
            }
    
            if (shape instanceof SymbolShape && (!(shape instanceof SymbolUnionShape))) {
                this.registSymbol(document, shape.id, page.id);
                if (document.freesymbols && document.freesymbols.has(shape.id)) {
                    this._basicop.crdtSetAttr(document.freesymbols, shape.id, undefined);
                }
                document.symbolsMgr.clearDuplicate(shape.id);
            }
        }
        recursive(parent, shape, index);
    
        // needUpdateFrame.push({ shape, page });
    
    }
    shapeDelete(document: Document, page: Page, parent: GroupShape, index: number) {
    
        // shape不可以一次删除多个对象，要分开删除
        // 从叶子开始删除
        const recursive = (parent: GroupShape, shape: Shape, index: number, level: number) => {
            let saveShape: SymbolShape | undefined;
            if (shape instanceof SymbolShape && (!(level > 0 && parent instanceof SymbolShape))) {
                // 备份symbolshape
                const ctx = new class implements IImportContext {
                    document: Document = document;
                    curPage: string = page.id;
                    fmtVer: string = FMT_VER_latest;
                }
                saveShape = shape instanceof SymbolUnionShape ? importSymbolUnionShape(shape, ctx) : importSymbolShape(shape, ctx);
            }
            if (shape instanceof GroupShape) {
                const childs = shape.childs;
                for (let i = childs.length - 1; i >= 0; --i) {
                    const c = childs[i];
                    recursive(shape, c, i, level + 1);
                }
            }
            const op = this._basicop.crdtShapeRemove(page, parent, index);
            if (op) {
                if (shape instanceof SymbolShape && (!(shape instanceof SymbolUnionShape))) {
                    this.registSymbol(document, shape.id, "freesymbols");
                    document.symbolsMgr.clearDuplicate(shape.id);
                }
                if (saveShape) {
                    if (!document.freesymbols) document.freesymbols = new BasicMap();
                    this._basicop.crdtSetAttr(document.freesymbols, saveShape.id, saveShape);
                    document.symbolsMgr.clearDuplicate(saveShape.id);
                }
                page.onRemoveShape(op, false);
            }
        }
        const shape = parent.childs[index];
        recursive(parent, shape, index, 0);
    
        // if (ops.length > 0 && parent.childs.length > 0) {
        //     needUpdateFrame.push({ shape: parent.childs[0], page })
        // }
    
    }
    /**
     * 
     * @param page 
     * @param parent 
     * @param index 
     * @param parent2 
     * @param index2 移动后的index
     * @param needUpdateFrame 
     * @returns 
     */
    shapeMove(page: Page, parent: GroupShape, index: number, parent2: GroupShape, index2: number) {
        const op = this._basicop.crdtShapeMove(page, parent, index, parent2, index2);
        // if (op && op.length > 0) {
        //     needUpdateFrame.push({ shape: op[op.length - 1].data2 as Shape, page })
        //     if (parent.id !== parent2.id && parent.childs.length > 0) {
        //         needUpdateFrame.push({ shape: parent.childs[0], page })
        //     }
        // }
        return op;
    }
}