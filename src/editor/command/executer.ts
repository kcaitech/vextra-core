import {
    PageCmdDelete,
    PageCmdInsert,
    PageCmdModify,
    ShapeCmdRemove,
    ShapeCmdInsert,
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
    TableCmdInsert,
    TableCmdRemove,
    TableOpInsert,
    TableCmdModify,
    TableOpRemove,
    TableOpModify
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
    importTableCell,
    importContactShape,
    importContactRole,
    importCurvePoint,
    importOverride,
    importVariable,
} from "../../data/baseimport";
import * as types from "../../data/typesdefine"
import {
    GroupShape,
    Page,
    Shape,
    Color,
    PathShape,
    TextHorAlign,
    UnderlineType,
    StrikethroughType,
    BulletNumbersType,
    TextTransformType,
    BulletNumbersBehavior,
    Text,
    TableShape,
    SymbolShape,
    SymbolRefShape,
    Variable
} from "../../data/classes";

import * as api from "../basicapi"
import { BORDER_ATTR_ID, BORDER_ID, CONTACTS_ID, FILLS_ATTR_ID, FILLS_ID, OVERRIDE_ID, PAGE_ATTR_ID, POINTS_ATTR_ID, POINTS_ID, TABLE_ATTR_ID, TEXT_ATTR_ID, VARIABLE_ATTR_ID, VARIABLE_ID } from "./consts";
import { Repository } from "../../data/transact";
import { Cmd, CmdType, OpType } from "../../coop/data/classes";
import { ArrayOpRemove, TableOpTarget, ArrayOpAttr, ArrayOpInsert, ShapeOpInsert } from "../../coop/data/classes";
import { updateShapesFrame } from "./utils";
import { CmdGroup } from "../../coop/data/cmdgroup";
import { CMDHandler } from "./handler";

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
    if (source.typeId == 'contact-shape') {
        return importContactShape(source as types.ContactShape, ctx)
    }
    throw new Error("unknow shape type: " + source.typeId)
}

export class CMDExecuter {
    private __document: Document;
    private __repo: Repository;
    private __handler: CMDHandler;
    constructor(document: Document, repo: Repository) {
        this.__document = document;
        this.__repo = repo;
        this.__handler = new CMDHandler();
    }

    exec(cmd: Cmd): boolean {
        this.__repo.start("", {});
        const save = this.__repo.transactCtx.settrap;
        try {
            this.__repo.transactCtx.settrap = false;
            const needUpdateFrame: { shape: Shape, page: Page }[] = [];
            this._exec(cmd, needUpdateFrame);
            if (needUpdateFrame.length > 0) {
                const page = needUpdateFrame[0].page;
                const shapes = needUpdateFrame.map((v) => v.shape);
                updateShapesFrame(page, shapes, api)
            }
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

    private _exec(cmd: Cmd, needUpdateFrame: { shape: Shape, page: Page }[]) {
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
                // this.shapeModify(cmd as ShapeCmdModify, needUpdateFrame);
                this.__handler.handle(this.__document, cmd, needUpdateFrame);
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
            case CmdType.TableModify:
                this.tableModify(cmd as TableCmdModify);
                break;
            default:
                throw new Error("unknow cmd type:" + cmd.type)
        }
    }

    cmdGroup(cmdGroup: CmdGroup, needUpdateFrame: { shape: Shape, page: Page }[]) {
        cmdGroup.cmds.forEach((cmd) => {
            this._exec(cmd, needUpdateFrame);
        })
    }

    pageInsert(cmd: PageCmdInsert) {
        const op = cmd.ops[0];
        if (op.type === OpType.ShapeInsert) {
            const _op = op as ShapeOpInsert;
            const page = importPage(JSON.parse(cmd.data));
            api.pageInsert(this.__document, page, _op.index)
        }
    }
    pageDelete(cmd: PageCmdDelete) {
        const op = cmd.ops[0];
        if (op.type === OpType.ShapeRemove) { // oss需要保存历史版本以undo
            const _op = op as ShapeOpRemove;
            // check
            const item = this.__document.pagesList[_op.index];
            if (item && item.id !== cmd.pageId) throw new Error("page id not equals: " + item.id + " " + cmd.pageId)

            api.pageDelete(this.__document, _op.index)
        }
    }
    pageModify(cmd: PageCmdModify) {
        // 参见consts.ts PAGE_ATTR_ID
        const op = cmd.ops[0];
        if (op.type === OpType.IdSet) {// 以pagelist为准
            const pageId = op.targetId[0] as string;
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
        if (page && op.type === OpType.ShapeInsert) { // 后续page加载后需要更新！
            const parent = page.getTarget(op.targetId);
            if (!parent || !(parent instanceof GroupShape)) {
                throw new Error("shape insert, parent error")
            }
            const _op = op as ShapeOpInsert;
            const shape = importShape(cmd.data, this.__document)
            api.shapeInsert(page, parent, shape, _op.index, needUpdateFrame)
        }
    }
    shapeDelete(cmd: ShapeCmdRemove, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const pageId = cmd.blockId;
        const op = cmd.ops[0];
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page && op.type === OpType.ShapeRemove) {
            const parent = page.getTarget(op.targetId);
            if (!parent || !(parent instanceof GroupShape)) {
                throw new Error("shape delete, parent error")
            }
            // check
            const shapeop = op as ShapeOpRemove;
            const shapeid = shapeop.shapeId;
            const _op = op as ShapeOpRemove;
            const shape = parent.childs[_op.index];
            if (shape && shape.id !== shapeid) {
                throw new Error("shape id not equals: " + shape.id + " " + shapeid);
            }
            api.shapeDelete(page, parent, _op.index, needUpdateFrame)
        }
    }

    shapeMove(cmd: ShapeCmdMove, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const pageId = cmd.blockId;
        const page = this.__document.pagesMgr.getSync(pageId)
        if (!page) return;
        const op = cmd.ops[0];
        if (op.type === OpType.ShapeMove) {
            const moveOp = op as ShapeOpMove;
            const parent = page.getTarget(moveOp.targetId);
            const parent2 = page.getTarget(moveOp.targetId2);
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
        if (op.type !== OpType.ArrayInsert) return;
        const shape = page.getTarget(op.targetId);

        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            const fill = importFill(JSON.parse(cmd.data))
            api.addFillAt(shape.style.fills, fill, (op as ArrayOpInsert).start);
        }
        else if (arrayAttr === BORDER_ID) {
            const border = importBorder(JSON.parse(cmd.data))
            api.addBorderAt(shape.style.borders, border, (op as ArrayOpInsert).start);
        }
        else if (arrayAttr === CONTACTS_ID) {
            const contact_role = importContactRole(JSON.parse(cmd.data));
            api.addContactShape(shape.style, contact_role);
        }
        else if (arrayAttr === POINTS_ID) {
            const point = importCurvePoint(JSON.parse(cmd.data));
            api.addPointAt(shape as PathShape, point, (op as ArrayOpInsert).start);
        }
        else if (arrayAttr === OVERRIDE_ID) {
            const over = importOverride(JSON.parse(cmd.data));
            api.addOverrideAt((shape as SymbolRefShape), over, (op as ArrayOpInsert).start);
        }
        else if (arrayAttr === VARIABLE_ID) {
            const _var = importVariable(JSON.parse(cmd.data));
            api.addVariableAt((shape as SymbolRefShape | SymbolShape), _var, (op as ArrayOpInsert).start);
        }
        else {
            console.error("not implemented ", arrayAttr)
        }
    }
    shapeArrAttrDelete(cmd: ShapeArrayAttrRemove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0]
        if (op.type !== OpType.ArrayRemove) return;
        const shape = page.getTarget(op.targetId);

        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            api.deleteFillAt(shape.style.fills, (op as ArrayOpRemove).start)
        }
        else if (arrayAttr === BORDER_ID) {
            api.deleteBorderAt(shape.style.borders, (op as ArrayOpRemove).start)
        }
        else if (arrayAttr === CONTACTS_ID) {
            api.removeContactRoleAt(shape.style, (op as ArrayOpRemove).start)
        }
        else if (arrayAttr === POINTS_ID) {
            api.deletePointAt(shape as PathShape, (op as ArrayOpRemove).start)
        }
        else if (arrayAttr === OVERRIDE_ID) {
            api.deleteOverrideAt((shape as SymbolRefShape), (op as ArrayOpRemove).start);
        }
        else if (arrayAttr === VARIABLE_ID) {
            api.deleteVariableAt((shape as SymbolShape | SymbolRefShape), (op as ArrayOpRemove).start);
        }
        else {
            console.error("not implemented ", arrayAttr)
        }
    }
    shapeArrAttrModify(cmd: ShapeArrayAttrModify) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const _op = cmd.ops[0]
        if (_op.type !== OpType.IdSet) {
            return;
        }
        const shape = page.getTarget(_op.targetId);

        const op = _op as IdOpSet;
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            const fillId = cmd.arrayAttrId;
            // find fill
            const fills = shape.style.fills;
            const fillIdx = fills.findIndex((fill) => fill.id === fillId);
            if (fillIdx < 0) return;
            const fill = fills[fillIdx];
            const opId = op.opId;
            const value = cmd.value;
            if (opId === FILLS_ATTR_ID.color) {
                if (value) {
                    const color = importColor(JSON.parse(value));
                    api.setFillColor(fill, color);
                }
            }
            else if (opId === FILLS_ATTR_ID.enable) {
                const enable = value && JSON.parse(value);
                api.setFillEnable(fill, enable ?? false)
            }
            else {
                console.error("not implemented ", op)
            }
        }
        else if (arrayAttr === BORDER_ID) {
            const borderId = cmd.arrayAttrId;
            // find fill
            const borders = shape.style.borders;
            const borderIdx = borders.findIndex((border) => border.id === borderId)
            if (borderIdx < 0) return;
            const border = borders[borderIdx];
            const opId = op.opId;
            const value = cmd.value;
            if (opId === BORDER_ATTR_ID.color) {
                if (value) {
                    const color = importColor(JSON.parse(value))
                    api.setBorderColor(border, color);
                }
            }
            else if (opId === BORDER_ATTR_ID.enable) {
                const enable = value && JSON.parse(value);
                api.setBorderEnable(border, enable ?? false)
            }
            else if (opId === BORDER_ATTR_ID.thickness) {
                const thickness = value && JSON.parse(value);
                api.setBorderThickness(border, thickness ?? 0)
            }
            else if (opId === BORDER_ATTR_ID.position) {
                if (value) {
                    const position = importBorderPosition(value as any);
                    api.setBorderPosition(border, position)
                }
            }
            else if (opId === BORDER_ATTR_ID.borderStyle) {
                if (value) {
                    const style = importBorderStyle(JSON.parse(value));
                    api.setBorderStyle(border, style)
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
        else if (arrayAttr === OVERRIDE_ID) {
            // todo
        }
        else if (arrayAttr === VARIABLE_ID) {
            if (!(shape instanceof SymbolRefShape || shape instanceof SymbolShape)) return;
            const valId = cmd.arrayAttrId;
            // find variable
            const valIdx = shape.variables.findIndex((p) => p.id === valId)
            if (valIdx < 0) return;

            const opId = op.opId;
            const value = cmd.value;

            if (opId === VARIABLE_ATTR_ID.value) {
                if (value) {
                    const _val = new Variable("", types.VariableType.Text, ""); // 用于导入
                    _val.value = JSON.parse(value);
                    const _val1 = importVariable(_val);
                    api.modifyVariableAt(shape, valIdx, _val1.value);
                }
            }
        }
        else {
            console.error("not implemented ", arrayAttr)
        }
    }
    tableInsert(cmd: TableCmdInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0] as TableOpInsert
        const shape = page.getTarget(op.targetId);

        if (op.type !== OpType.TableInsert) {
            return;
        }
        const _this = this;
        const ctx = new class implements IImportContext { document: Document = _this.__document }
        if (op.opTarget === TableOpTarget.Row) {
            const data = op.data.map((cell) => cell ? importTableCell(cell, ctx) : undefined);
            const height = JSON.parse(cmd.data);
            api.tableInsertRow(page, shape as TableShape, op.index, height, data);
        }
        else if (op.opTarget === TableOpTarget.Col) {
            const data = op.data.map((cell) => cell ? importTableCell(cell, ctx) : undefined);
            const width = JSON.parse(cmd.data);
            api.tableInsertCol(page, shape as TableShape, op.index, width, data);
        }
        else {
            throw new Error("unknow table target " + op.opTarget)
        }
    }
    tableDelete(cmd: TableCmdRemove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0] as TableOpRemove
        const shape = page.getTarget(op.targetId);

        if (op.type !== OpType.TableRemove) {
            return;
        }
        if (op.opTarget === TableOpTarget.Row) {
            api.tableRemoveRow(page, shape as TableShape, op.index);
        }
        else if (op.opTarget === TableOpTarget.Col) {
            api.tableRemoveCol(page, shape as TableShape, op.index);
        }
        else {
            throw new Error("unknow table target " + op.opTarget)
        }
    }
    tableModify(cmd: TableCmdModify) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op = cmd.ops[0] as TableOpModify;
        const shape = page.getTarget(op.targetId);

        if (op.type !== OpType.TableModify) {
            return;
        }
        const value = cmd.value;
        const opId = op.opId;
        if (op.opTarget === TableOpTarget.Row) {
            if (opId === TABLE_ATTR_ID.rowHeight) {
                if (value) api.tableModifyRowHeight(page, shape as TableShape, op.index, JSON.parse(value));
            }
        }
        else if (op.opTarget === TableOpTarget.Col) {
            if (opId === TABLE_ATTR_ID.colWidth) {
                if (value) api.tableModifyColWidth(page, shape as TableShape, op.index, JSON.parse(value));
            }
        }
        else {
            throw new Error("unknow table target " + op.opTarget)
        }
    }
    shapeArrAttrMove(cmd: ShapeArrayAttrMove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const op0 = cmd.ops[0]
        const op1 = cmd.ops[1]
        const shape = page.getTarget(op0.targetId);

        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            if (op0 && op1 && op0.type === OpType.ArrayRemove && op1.type === OpType.ArrayInsert) {
                const op0 = cmd.ops[0] as ArrayOpRemove
                const op1 = cmd.ops[1] as ArrayOpInsert
                api.moveFill(shape.style.fills, op0.start, op1.start)
            }
        }
        else if (arrayAttr === BORDER_ID) {
            if (op0 && op1 && op0.type === OpType.ArrayRemove && op1.type === OpType.ArrayInsert) {
                const op0 = cmd.ops[0] as ArrayOpRemove
                const op1 = cmd.ops[1] as ArrayOpInsert
                api.moveBorder(shape.style.borders, op0.start, op1.start)
            }
        }
        else {
            console.error("not implemented ", arrayAttr)
        }
    }

    textInsert(cmd: TextCmdInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const _op = cmd.ops[0]
        if (_op.type !== OpType.ArrayInsert) return;
        const shape = page.getTarget(_op.targetId);

        const op = _op as ArrayOpInsert;
        const text = cmd.parseText();
        const shapetext = (shape as TextShapeLike).text;
        if (!(shapetext instanceof Text)) {
            throw new Error("shape type wrong, has no text: " + shapetext)
        }
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
        const _op = cmd.ops[0]
        if (_op.type !== OpType.ArrayRemove) return;
        const shape = page.getTarget(_op.targetId);

        const op = _op as ArrayOpRemove;
        const shapetext = (shape as TextShapeLike).text;
        if (!(shapetext instanceof Text)) {
            throw new Error("shape type wrong")
        }
        api.deleteText(shapetext, op.start, op.length);
    }
    textModify(cmd: TextCmdModify) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        if (!page) return;
        const _op = cmd.ops[0]
        if (_op.type !== OpType.ArrayAttr) {
            return;
        }
        const shape = page.getTarget(_op.targetId);

        const op = _op as ArrayOpAttr;
        const attrId = cmd.attrId
        const value = cmd.value;
        const shapetext = (shape as TextShapeLike).text;
        if (!(shapetext instanceof Text)) {
            throw new Error("shape type wrong")
        }
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