import {
    PageCmdDelete,
    PageCmdInsert,
    PageCmdModify,
    ShapeCmdRemove,
    ShapeCmdInsert,
    ShapeCmdModify,
    ShapeCmdMove,
    TextCmdModify,
    TextCmdRemove,
    TextCmdInsert,
    ShapeArrayAttrInsert,
    ShapeArrayAttrRemove,
    ShapeArrayAttrModify,
    ShapeArrayAttrMove,
    PageCmdMove,
    ShapeOpMove,
    IdOpSet,
    ShapeOpRemove,
    ShapeArrayAttrModify2,
    TableCmdInsert,
    TableCmdRemove,
    TableOpInsert
} from "../../coop/data/classes";
import { Document } from "../../data/document";
import {
    IImportContext,
    importFlattenShape,
    importArtboard,
    importGroupShape,
    importImageShape,
    importLineShape,
    importOvalShape,
    importPage,
    importPathShape,
    importRectShape,
    importSymbolRefShape,
    importSymbolShape,
    importTextShape,
    importFill,
    importBorder,
    importColor,
    importBorderPosition,
    importBorderStyle,
    importText,
    importSpanAttr,
    importPoint2D,
    importTableShape,
    importPathShape2,
    importTableCell
} from "../../io/baseimport";
import * as types from "../../data/typesdefine"
import {
    GroupShape,
    Page,
    Shape,
    TextShape,
    RectShape,
    Color,
    PathShape,
    TextHorAlign,
    UnderlineType,
    StrikethroughType,
    BulletNumbersType,
    TextTransformType,
    BulletNumbersBehavior,
    TableCell,
    Text,
    TableShape
} from "../../data/classes";

import * as api from "../basicapi"
import { BORDER_ATTR_ID, BORDER_ID, FILLS_ATTR_ID, FILLS_ID, PAGE_ATTR_ID, POINTS_ATTR_ID, POINTS_ID, SHAPE_ATTR_ID, TABLE_COL_WIDTHS_ID, TABLE_ROW_HEIGHTS_ID, TEXT_ATTR_ID } from "./consts";
import { Repository } from "../../data/transact";
import { Cmd, CmdType, IdOp, OpType } from "../../coop/data/classes";
import { ArrayOpInsert, ArrayOpRemove, TableOpTarget } from "../../coop/data/basictypes";
import { updateShapesFrame } from "./utils";
import { CmdGroup } from "../../coop/data/cmdgroup";

type TextShapeLike = Shape & { text: Text }

function importShape(data: string, document: Document) {
    const source: { [key: string]: any } = JSON.parse(data);
    const ctx: IImportContext = new class implements IImportContext { document: Document = document };
    // if (source.typeId == 'shape') {
    //     return importShape(source as types.Shape, ctx)
    // }
    if (source.typeId == 'flatten-shape') {
        return importFlattenShape(source as types.FlattenShape, ctx)
    }
    if (source.typeId == 'group-shape') {
        return importGroupShape(source as types.GroupShape, ctx)
    }
    if (source.typeId == 'image-shape') {
        return importImageShape(source as types.ImageShape, ctx)
    }
    if (source.typeId == 'path-shape') {
        return importPathShape(source as types.PathShape, ctx)
    }
    if (source.typeId == 'path-shape2') {
        return importPathShape2(source as types.PathShape2, ctx)
    }
    if (source.typeId == 'rect-shape') {
        return importRectShape(source as types.RectShape, ctx)
    }
    if (source.typeId == 'symbol-ref-shape') {
        return importSymbolRefShape(source as types.SymbolRefShape, ctx)
    }
    if (source.typeId == 'text-shape') {
        return importTextShape(source as types.TextShape, ctx)
    }
    if (source.typeId == 'artboard') {
        return importArtboard(source as types.Artboard, ctx)
    }
    if (source.typeId == 'symbol-shape') {
        return importSymbolShape(source as types.SymbolShape, ctx)
    }
    if (source.typeId == 'line-shape') {
        return importLineShape(source as types.LineShape, ctx)
    }
    if (source.typeId == 'oval-shape') {
        return importOvalShape(source as types.OvalShape, ctx)
    }
    if (source.typeId == 'table-shape') {
        return importTableShape(source as types.TableShape, ctx)
    }
    if (source.typeId == 'table-cell') {
        return importTableCell(source as types.TableCell, ctx)
    }
    throw new Error("unknow shape type: " + source.typeId)
}

export class CMDExecuter {
    private __document: Document;
    private __repo: Repository;
    constructor(document: Document, repo: Repository) {
        this.__document = document;
        this.__repo = repo;
    }

    exec(cmd: Cmd): boolean {
        this.__repo.start("", {});
        const save = this.__repo.transactCtx.settrap;
        try {
            this.__repo.transactCtx.settrap = false;
            this._exec(cmd);
            this.__repo.commit();
            return true;
        }
        catch (e) {
            console.error("exec error:", e)
            console.error("error cmd:", cmd)
            this.__repo.rollback();
            return false;
        }
        finally {
            this.__repo.transactCtx.settrap = save;
        }
    }

    private _exec(cmd: Cmd) {
        const needUpdateFrame: { shape: Shape, page: Page }[] = [];
        switch (cmd.type) {
            case CmdType.PageInsert:
                this.pageInsert(cmd as PageCmdInsert);
                break;
            case CmdType.PageDelete:
                this.pageDelete(cmd as PageCmdDelete);
                break;
            case CmdType.PageModify:
                this.pageModify(cmd as PageCmdModify);
                break;
            case CmdType.PageMove:
                this.pageMove(cmd as PageCmdMove);
                break;
            case CmdType.ShapeArrayAttrInsert:
                this.shapeArrAttrInsert(cmd as ShapeArrayAttrInsert);
                break;
            case CmdType.ShapeArrayAttrModify:
                this.shapeArrAttrModify(cmd as ShapeArrayAttrModify);
                break;
            case CmdType.ShapeArrayAttrMove:
                this.shapeArrAttrMove(cmd as ShapeArrayAttrMove);
                break;
            case CmdType.ShapeArrayAttrDelete:
                this.shapeArrAttrDelete(cmd as ShapeArrayAttrRemove);
                break;
            case CmdType.TextDelete:
                this.textDelete(cmd as TextCmdRemove);
                break;
            case CmdType.TextInsert:
                this.textInsert(cmd as TextCmdInsert);
                break;
            case CmdType.TextModify:
                this.textModify(cmd as TextCmdModify);
                break;
            case CmdType.ShapeDelete:
                this.shapeDelete(cmd as ShapeCmdRemove, needUpdateFrame);
                break;
            case CmdType.ShapeInsert:
                this.shapeInsert(cmd as ShapeCmdInsert, needUpdateFrame);
                break;
            case CmdType.ShapeModify:
                this.shapeModify(cmd as ShapeCmdModify, needUpdateFrame);
                break;
            case CmdType.ShapeMove:
                this.shapeMove(cmd as ShapeCmdMove, needUpdateFrame);
                break;
            case CmdType.Group:
                this.cmdGroup(cmd as CmdGroup, needUpdateFrame);
                break;
            case CmdType.TableInsert:
                this.tableInsert(cmd as TableCmdInsert);
                break;
            case CmdType.TableDelete:
                this.tableDelete(cmd as TableCmdRemove);
                break;
            default:
                throw new Error("unknow cmd type:" + cmd.type)
        }

        if (needUpdateFrame.length > 0) {
            const page = needUpdateFrame[0].page;
            const shapes = needUpdateFrame.map((v) => v.shape);
            updateShapesFrame(page, shapes, api)
        }
    }

    cmdGroup(cmdGroup: CmdGroup, needUpdateFrame: { shape: Shape, page: Page }[]) {
        cmdGroup.cmds.forEach((cmd) => {
            switch (cmd.type) {
                case CmdType.ShapeInsert:
                    this.shapeInsert(cmd as ShapeCmdInsert, needUpdateFrame);
                    break;
                case CmdType.ShapeDelete:
                    this.shapeDelete(cmd as ShapeCmdRemove, needUpdateFrame);
                    break;
                case CmdType.ShapeModify:
                    this.shapeModify(cmd as ShapeCmdModify, needUpdateFrame);
                    break;
                case CmdType.ShapeMove:
                    this.shapeMove(cmd as ShapeCmdMove, needUpdateFrame);
                    break;
                case CmdType.ShapeArrayAttrInsert:
                    this.shapeArrAttrInsert(cmd as ShapeArrayAttrInsert);
                    break;
                case CmdType.ShapeArrayAttrDelete:
                    this.shapeArrAttrDelete(cmd as ShapeArrayAttrInsert);
                    break;
                case CmdType.ShapeArrayAttrModify:
                    this.shapeArrAttrModify(cmd as ShapeArrayAttrModify);
                    break;
                case CmdType.ShapeArrayAttrModify2:
                    this.shapeArrAttrModify2(cmd as ShapeArrayAttrModify2);
                    break;
                case CmdType.ShapeArrayAttrMove:
                    this.shapeArrAttrMove(cmd as ShapeArrayAttrMove);
                    break;
                case CmdType.TextInsert:
                    this.textInsert(cmd as TextCmdInsert);
                    break;
                case CmdType.TextDelete:
                    this.textDelete(cmd as TextCmdRemove);
                    break;
                case CmdType.TextModify:
                    this.textModify(cmd as TextCmdModify);
                    break;
                case CmdType.TableInsert:
                    this.tableInsert(cmd as TableCmdInsert);
                    break;
                case CmdType.TableDelete:
                    this.tableDelete(cmd as TableCmdRemove);
                    break;
                default:
                    throw new Error("unknow cmd type:" + cmd.type)
            }
        })
    }

    pageInsert(cmd: PageCmdInsert) {
        const op = cmd.ops[0];
        if (op.type === OpType.ShapeInsert) {
            const page = importPage(JSON.parse(cmd.data));
            api.pageInsert(this.__document, page, op.index)
        }
    }
    pageDelete(cmd: PageCmdDelete) {
        const op = cmd.ops[0];
        if (op.type === OpType.ShapeRemove) { // oss需要保存历史版本以undo
            // check
            const item = this.__document.pagesList[op.index];
            if (item && item.id !== cmd.pageId) throw new Error("page id not equals: " + item.id + " " + cmd.pageId)

            api.pageDelete(this.__document, op.index)
        }
    }
    pageModify(cmd: PageCmdModify) {
        // 参见consts.ts PAGE_ATTR_ID
        const op = cmd.ops[0];
        if (op.type === OpType.IdSet) {// 以pagelist为准
            const pageId = op.targetId[0]
            const opId = (op as IdOpSet).opId;
            if (opId === PAGE_ATTR_ID.name) {
                if (cmd.value) api.pageModifyName(this.__document, pageId, cmd.value)
            }
        }
    }
    pageMove(cmd: PageCmdMove) {
        const op = cmd.ops[0] as ShapeOpMove;
        if (op && op.type === OpType.ShapeMove) {
            api.pageMove(this.__document, op.index, op.index2);
        }
    }

    shapeInsert(cmd: ShapeCmdInsert, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const pageId = cmd.blockId;
        const page = this.__document.pagesMgr.getSync(pageId)
        const op = cmd.ops[0];
        const parentId = op.targetId[0]
        if (page && op.type === OpType.ShapeInsert) { // 后续page加载后需要更新！
            const parent = page.getShape(parentId, true);
            if (!parent || !(parent instanceof GroupShape)) {
                throw new Error("shape insert, parent error")
            }
            const shape = importShape(cmd.data, this.__document)
            api.shapeInsert(page, parent, shape, op.index, needUpdateFrame)
        }
    }
    shapeDelete(cmd: ShapeCmdRemove, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const pageId = cmd.blockId;
        const op = cmd.ops[0];
        const parentId = op.targetId[0]
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page && op.type === OpType.ShapeRemove) {
            const parent = page.getShape(parentId, true);
            if (!parent || !(parent instanceof GroupShape)) {
                throw new Error("shape delete, parent error")
            }
            // check
            const shapeop = op as ShapeOpRemove;
            const shapeid = shapeop.shapeId;
            const shape = parent.childs[op.index];
            if (shape && shape.id !== shapeid) {
                throw new Error("shape id not equals: " + shape.id + " " + shapeid);
            }
            api.shapeDelete(page, parent, op.index, needUpdateFrame)
        }
    }
    private _shapeModify(page: Page, shape: Shape, op: IdOp, value: string | undefined, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const opId = op.opId;
        if (opId === SHAPE_ATTR_ID.x) {
            if (value) {
                const x = JSON.parse(value)
                api.shapeModifyX(page, shape, x, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.y) {
            if (value) {
                const y = JSON.parse(value)
                api.shapeModifyY(page, shape, y, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.size) {
            if (value) {
                const wh = JSON.parse(value)
                api.shapeModifyWH(page, shape, wh.w, wh.h, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.rotate) {
            if (value) {
                const rotate = JSON.parse(value)
                api.shapeModifyRotate(page, shape, rotate, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.name) {
            if (value) {
                const name = value;
                api.shapeModifyName(shape, name)
            }
        }
        else if (opId === SHAPE_ATTR_ID.hflip) {
            const hflip = value && JSON.parse(value)
            api.shapeModifyHFlip(page, shape, hflip, needUpdateFrame)
        }
        else if (opId === SHAPE_ATTR_ID.vflip) {
            const vflip = value && JSON.parse(value)
            api.shapeModifyVFlip(page, shape, vflip, needUpdateFrame)
        }
        else if (opId === SHAPE_ATTR_ID.visible) {
            const isVisible = value && JSON.parse(value)
            api.shapeModifyVisible(shape, isVisible ?? false);
        }
        else if (opId === SHAPE_ATTR_ID.lock) {
            const isLock = value && JSON.parse(value)
            api.shapeModifyLock(shape, isLock ?? false);
        }
        else if (opId === SHAPE_ATTR_ID.resizingConstraint) {
            if (value) {
                const v = JSON.parse(value);
                api.shapeModifyResizingConstraint(shape, v)
            }
        }
        else if (opId === SHAPE_ATTR_ID.radius) {
            if (value) {
                const v = (JSON.parse(value) as { lt: number, rt: number, rb: number, lb: number });
                api.shapeModifyRadius(shape as RectShape, v.lt, v.rt, v.rb, v.lb)
            }
        }
        else if (opId === SHAPE_ATTR_ID.constrainerProportions) {
            const isLock = value && JSON.parse(value)
            api.shapeModifyConstrainerProportions(shape, isLock ?? false);
        }
        else if (opId === SHAPE_ATTR_ID.textBehaviour) {
            const textBehaviour = value as types.TextBehaviour
            api.shapeModifyTextBehaviour(page, shape as TextShapeLike, textBehaviour ?? types.TextBehaviour.Flexible);
        }
        else if (opId === SHAPE_ATTR_ID.textVerAlign) {
            const textVerAlign = value as types.TextVerAlign
            const text = (shape as TextShapeLike).text;
            api.shapeModifyTextVerAlign(text, textVerAlign ?? types.TextVerAlign.Top);
        }
        else if (opId === SHAPE_ATTR_ID.textTransform) {
            const text = (shape as TextShapeLike).text;
            api.shapeModifyTextTransform(text, value as TextTransformType);
        }
        else if (opId === SHAPE_ATTR_ID.boolop) {
            api.shapeModifyBoolOp(shape, value as types.BoolOp);
        }
        else if (opId === SHAPE_ATTR_ID.isboolopshape) {
            const isOpShape = value && JSON.parse(value);
            api.shapeModifyBoolOpShape(shape as GroupShape, isOpShape);
        }
        else if (opId === SHAPE_ATTR_ID.fixedRadius) {
            const fixedRadius = value && JSON.parse(value);
            api.shapeModifyFixedRadius(shape as GroupShape, fixedRadius);
        }
        else if (opId === SHAPE_ATTR_ID.cellContentType) {
            api.tableSetCellContentType(shape as TableCell, value as types.TableCellType);
        }
        else if (opId === SHAPE_ATTR_ID.cellContentText) {
            const text = value ? importText(JSON.parse(value)) : undefined;
            api.tableSetCellContentText(shape as TableCell, text);
        }
        else if (opId === SHAPE_ATTR_ID.cellContentImage) {
            api.tableSetCellContentImage(shape as TableCell, value);
        }
        else if (opId === SHAPE_ATTR_ID.cellSpan) {
            const val = value && JSON.parse(value);
            const rowSpan = val?.rowSpan;
            const colSpan = val?.colSpan;
            api.tableModifyCellSpan(shape as TableCell, rowSpan ?? 1, colSpan ?? 1);
        }
        // todo
        else {
            console.error("not implemented ", op)
        }
    }
    shapeModify(cmd: ShapeCmdModify, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const pageId = cmd.blockId;
        const op = cmd.ops[0];
        const shapeId = op.targetId[0]
        const page = this.__document.pagesMgr.getSync(pageId)
        if (!page) return;
        const shape = page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape modify not find shape")
        }
        if ((op.type === OpType.IdSet)) {
            const value = cmd.value;
            this._shapeModify(page, shape, op, value, needUpdateFrame);
        }
    }
    shapeMove(cmd: ShapeCmdMove, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const pageId = cmd.blockId;
        const page = this.__document.pagesMgr.getSync(pageId)
        if (!page) return;
        const op = cmd.ops[0];
        if (op.type === OpType.ShapeMove) {
            const moveOp = op as ShapeOpMove;
            const parentId = moveOp.targetId[0];
            const parentId2 = moveOp.targetId2[0];
            const parent = page.getShape(parentId, true);
            const parent2 = page.getShape(parentId2, true);
            if (!parent || !parent2) {
                throw new Error("shape move not find parent")
            }
            api.shapeMove(page, parent as GroupShape, moveOp.index, parent2 as GroupShape, moveOp.index2, needUpdateFrame)
        }
    }

    shapeArrAttrInsert(cmd: ShapeArrayAttrInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape not find")
        }
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            if (op.type === OpType.ArrayInsert) {
                const fill = importFill(JSON.parse(cmd.data))
                api.addFillAt(shape.style, fill, (op as ArrayOpInsert).start);
            }
        }
        else if (arrayAttr === BORDER_ID) {
            if (op.type === OpType.ArrayInsert) {
                const border = importBorder(JSON.parse(cmd.data))
                api.addBorderAt(shape.style, border, (op as ArrayOpInsert).start);
            }
        }
        else if (arrayAttr === TABLE_COL_WIDTHS_ID) {

        }
        else if (arrayAttr === TABLE_ROW_HEIGHTS_ID) {

        }
        else {
            console.error("not implemented ", arrayAttr)
        }
    }
    shapeArrAttrDelete(cmd: ShapeArrayAttrRemove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape not find")
        }
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            if (op.type === OpType.ArrayRemove) {
                api.deleteFillAt(shape.style, (op as ArrayOpRemove).start)
            }
        }
        else if (arrayAttr === BORDER_ID) {
            if (op.type === OpType.ArrayRemove) {
                api.deleteBorderAt(shape.style, (op as ArrayOpRemove).start)
            }
        }
        else if (arrayAttr === TABLE_COL_WIDTHS_ID) {

        }
        else if (arrayAttr === TABLE_ROW_HEIGHTS_ID) {

        }
        else {
            console.error("not implemented ", arrayAttr)
        }
    }
    shapeArrAttrModify(cmd: ShapeArrayAttrModify) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape not find")
        }
        if (op.type !== OpType.IdSet) {
            return;
        }
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            const fillId = cmd.arrayAttrId;
            // find fill
            const fillIdx = shape.style.fills.findIndex((fill) => fill.id === fillId);
            if (fillIdx < 0) return;
            const opId = op.opId;
            const value = cmd.value;
            if (opId === FILLS_ATTR_ID.color) {
                if (value) {
                    const color = importColor(JSON.parse(value));
                    api.setFillColor(shape.style, fillIdx, color);
                }
            }
            else if (opId === FILLS_ATTR_ID.enable) {
                const enable = value && JSON.parse(value);
                api.setFillEnable(shape.style, fillIdx, enable ?? false)
            }
            else {
                console.error("not implemented ", op)
            }
        }
        else if (arrayAttr === BORDER_ID) {
            const borderId = cmd.arrayAttrId;
            // find fill
            const borderIdx = shape.style.borders.findIndex((border) => border.id === borderId)
            if (borderIdx < 0) return;

            const opId = op.opId;
            const value = cmd.value;
            if (opId === BORDER_ATTR_ID.color) {
                if (value) {
                    const color = importColor(JSON.parse(value))
                    api.setBorderColor(shape.style, borderIdx, color);
                }
            }
            else if (opId === BORDER_ATTR_ID.enable) {
                const enable = value && JSON.parse(value);
                api.setBorderEnable(shape.style, borderIdx, enable ?? false)
            }
            else if (opId === BORDER_ATTR_ID.thickness) {
                const thickness = value && JSON.parse(value);
                api.setBorderThickness(shape.style, borderIdx, thickness ?? 0)
            }
            else if (opId === BORDER_ATTR_ID.position) {
                if (value) {
                    const position = importBorderPosition(value as any);
                    api.setBorderPosition(shape.style, borderIdx, position)
                }
            }
            else if (opId === BORDER_ATTR_ID.borderStyle) {
                if (value) {
                    const style = importBorderStyle(JSON.parse(value));
                    api.setBorderStyle(shape.style, borderIdx, style)
                }
            }
            else if (opId === BORDER_ATTR_ID.startMarkerType) {
                if (value) {
                    api.setBorderStartMarkerType(shape.style, borderIdx, value as any)
                }
            }
            else if (opId === BORDER_ATTR_ID.endMarkerType) {
                if (value) {
                    api.setBorderEndMarkerType(shape.style, borderIdx, value as any)
                }
            }
            // todo
            else {
                console.error("not implemented ", op)
            }
        }
        else if (arrayAttr === POINTS_ID) {
            if (!(shape instanceof PathShape)) return;
            const pointId = cmd.arrayAttrId;
            // find point
            const pointIdx = shape.points.findIndex((p) => p.id === pointId)
            if (pointIdx < 0) return;

            const opId = op.opId;
            const value = cmd.value;

            if (opId === POINTS_ATTR_ID.point) {
                if (value) {
                    const p = importPoint2D(JSON.parse(value));
                    api.shapeModifyCurvPoint(page, shape, pointIdx, p);
                }
            }
            else if (opId === POINTS_ATTR_ID.from) {
                if (value) {
                    const p = importPoint2D(JSON.parse(value));
                    api.shapeModifyCurvFromPoint(page, shape, pointIdx, p);
                }
            }
            else if (opId === POINTS_ATTR_ID.to) {
                if (value) {
                    const p = importPoint2D(JSON.parse(value));
                    api.shapeModifyCurvToPoint(page, shape, pointIdx, p);
                }
            }
            else {
                console.error("not implemented ", op)
            }
        }
        else {
            console.error("not implemented ", arrayAttr)
        }
    }
    shapeArrAttrModify2(cmd: ShapeArrayAttrModify2) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape not find")
        }
        if (op.type !== OpType.ArrayAttr) {
            return;
        }
        const value = cmd.value;
        const idx = op.start;
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === TABLE_COL_WIDTHS_ID) {
            const width = value && JSON.parse(value);
            if (width) api.tableModifyColWidth(shape as TableShape, idx, width);
        }
        else if (arrayAttr === TABLE_ROW_HEIGHTS_ID) {
            const height = value && JSON.parse(value);
            if (height) api.tableModifyRowHeight(shape as TableShape, idx, height);
        }
    }
    tableInsert(cmd: TableCmdInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0] as TableOpInsert
        const shapeId = op.targetId[0]
        const shape = page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape not find")
        }
        if (op.type !== OpType.TableInsert) {
            return;
        }
        const target = op.target;
        const _this = this;
        const ctx = new class implements IImportContext { document: Document = _this.__document }
        if (target === TableOpTarget.Row) {
            const data = op.data.map((cell) => cell && importTableCell(cell, ctx));
            const height = JSON.parse(cmd.data);
            api.tableInsertRow(shape as TableShape, op.index, height, data);
        }
        else if (target === TableOpTarget.Col) {
            const data = op.data.map((cell) => cell && importTableCell(cell, ctx));
            const width = JSON.parse(cmd.data);
            api.tableInsertCol(shape as TableShape, op.index, width, data);
        }
        else {
            throw new Error("unknow table target " + target)
        }
    }
    tableDelete(cmd: TableCmdRemove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape not find")
        }
        if (op.type !== OpType.TableRemove) {
            return;
        }
        const target = op.target;
        if (target === TableOpTarget.Row) {
            api.tableRemoveRow(shape as TableShape, op.index);
        }
        else if (target === TableOpTarget.Col) {
            api.tableRemoveCol(shape as TableShape, op.index);
        }
        else {
            throw new Error("unknow table target " + target)
        }
    }
    shapeArrAttrMove(cmd: ShapeArrayAttrMove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op0 = cmd.ops[0] as ArrayOpRemove
        const op1 = cmd.ops[1] as ArrayOpInsert
        const shapeId = op0.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape not find")
        }
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            if (op0 && op1 && op0.type === OpType.ArrayRemove && op1.type === OpType.ArrayInsert) {
                api.moveFill(shape.style, op0.start, op1.start)
            }
        }
        else if (arrayAttr === BORDER_ID) {
            if (op0 && op1 && op0.type === OpType.ArrayRemove && op1.type === OpType.ArrayInsert) {
                api.moveBorder(shape.style, op0.start, op1.start)
            }
        }
        else {
            console.error("not implemented ", arrayAttr)
        }
    }

    textInsert(cmd: TextCmdInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape not find")
        }
        if (!(shape instanceof TextShape)) {
            throw new Error("shape type wrong")
        }
        const text = cmd.parseText();
        const shapetext = (shape as TextShapeLike).text;
        if (text.type === "simple") {
            let attr;
            if (text.attr) attr = importSpanAttr(text.attr);
            api.insertSimpleText(shapetext, text.text as string, op.start, { attr })
        }
        else if (text.type === "complex") {
            const _text = importText(text.text as types.Text);
            api.insertComplexText(shapetext, _text, op.start)
        }
        else {
            throw new Error("unknow text insert type: " + cmd.text)
        }
    }
    textDelete(cmd: TextCmdRemove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape not find")
        }
        const shapetext = (shape as TextShapeLike).text;
        if (!(shapetext instanceof Text)) {
            throw new Error("shape type wrong")
        }
        api.deleteText(shapetext, op.start, op.length);
    }
    textModify(cmd: TextCmdModify) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!shape) {
            throw new Error("shape not find")
        }
        if (!(shape instanceof TextShape)) {
            throw new Error("shape type wrong")
        }
        if (op.type !== OpType.ArrayAttr) {
            return;
        }
        const attrId = cmd.attrId
        const value = cmd.value;
        const shapetext = (shape as TextShapeLike).text;
        if (attrId === TEXT_ATTR_ID.color) {
            const color = (value && importColor(JSON.parse(value))) as Color | undefined;
            api.textModifyColor(shapetext, op.start, op.length, color)
        }
        else if (attrId === TEXT_ATTR_ID.fontName) {
            api.textModifyFontName(shapetext, op.start, op.length, value)
        }
        else if (attrId === TEXT_ATTR_ID.fontSize) {
            const fontSize = value && JSON.parse(value);
            api.textModifyFontSize(shapetext, op.start, op.length, fontSize)
        }
        else if (attrId === TEXT_ATTR_ID.spanKerning) {
            const kerning = value && JSON.parse(value);
            api.textModifySpanKerning(shapetext, kerning, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.paraKerning) {
            const kerning = value && JSON.parse(value);
            api.textModifyParaKerning(shapetext, kerning, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.textHorAlign) {
            const textHorAlign = value as TextHorAlign;
            api.textModifyHorAlign(shapetext, textHorAlign, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.textMaxLineheight) {
            const maxLineHeight = value && JSON.parse(value);
            api.textModifyMaxLineHeight(shapetext, maxLineHeight, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.textMinLineheight) {
            const minLineHeight = value && JSON.parse(value);
            api.textModifyMinLineHeight(shapetext, minLineHeight, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.paraSpacing) {
            const paraSpacing = value && JSON.parse(value);
            api.textModifyParaSpacing(shapetext, paraSpacing, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.bold) {
            const bold = value && JSON.parse(value);
            api.textModifyBold(shapetext, bold, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.italic) {
            const italic = value && JSON.parse(value);
            api.textModifyItalic(shapetext, italic, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.underline) {
            api.textModifyUnderline(shapetext, value as UnderlineType, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.strikethrough) {
            api.textModifyStrikethrough(shapetext, value as StrikethroughType, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.bulletNumbersType) {
            api.textModifyBulletNumbersType(shapetext, value as BulletNumbersType, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.bulletNumbersStart) {
            const start = value && JSON.parse(value) || 0;
            api.textModifyBulletNumbersStart(shapetext, start, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.bulletNumbersBehavior) {
            const inherit = value as BulletNumbersBehavior;
            api.textModifyBulletNumbersBehavior(shapetext, inherit, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.highlightColor) {
            const color = (value && importColor(JSON.parse(value))) as Color | undefined;
            api.textModifyHighlightColor(shapetext, op.start, op.length, color)
        }
        else if (attrId === TEXT_ATTR_ID.spanTransform) {
            const transform = value as TextTransformType | undefined;
            api.textModifySpanTransfrom(shapetext, transform, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.paraTransform) {
            const transform = value as TextTransformType | undefined;
            api.textModifyParaTransfrom(shapetext, transform, op.start, op.length)
        }
        else if (attrId === TEXT_ATTR_ID.indent) {
            const indent = value && JSON.parse(value) || undefined;
            api.textModifyParaIndent(shapetext, indent, op.start, op.length)
        }
        else {
            console.error("not implemented ", attrId)
        }
    }
}