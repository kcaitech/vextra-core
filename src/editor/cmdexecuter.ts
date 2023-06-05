// command 对应的要执行的api

import {
    PageCmdDelete,
    PageCmdInsert,
    PageCmdModify,
    // ShapeBatchModify,
    ShapeCmdGroup,
    ShapeCmdRemove,
    ShapeCmdInsert,
    ShapeCmdModify,
    ShapeCmdMove,
    TextCmdModify,
    TextCmdRemove,
    TextCmdInsert,
    TextCmdBatchModify,
    ShapeArrayAttrInsert,
    ShapeArrayAttrRemove,
    ShapeArrayAttrModify,
    ShapeArrayAttrMove,
    PageCmdMove,
    TextCmdMove,
    ArrayOpMove,
    ShapeOpMove
} from "../coop/data/classes";
import { Document } from "../data/document";
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
    importTextShape
} from "../io/baseimport";
import * as types from "../data/typesdefine"
import { ImageShape, SymbolRefShape, ArtboardRef, GroupShape, Page, Shape } from "../data/classes";

import * as api from "./api"
import { BORDER_ID, FILLS_ID, SHAPE_ATTR_ID } from "./consts";
import { Repository } from "../data/transact";
import { Cmd, CmdType, IdOp, OpType } from "../coop/data/classes";

function importShape(data: string, document: Document) {
    const source: { [key: string]: any } = JSON.parse(data);
    const ctx = new class implements IImportContext {
        afterImport(obj: any): void {
            if (obj instanceof ImageShape) {
                obj.setImageMgr(document.mediasMgr)
            } else if (obj instanceof SymbolRefShape) {
                obj.setSymbolMgr(document.symbolsMgr)
            } else if (obj instanceof ArtboardRef) {
                obj.setArtboardMgr(document.artboardMgr)
            }
        }
    }
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
        try {
            this._exec(cmd);
            this.__repo.commitRemote();
            return true;
        }
        catch (e) {
            console.log("exec error:", e)
            this.__repo.rollbackRemote();
            return false;
        }
    }

    private _exec(cmd: Cmd) {
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
            case CmdType.ShapeCmdGroup:
                this.shapeCMDGroup(cmd as ShapeCmdGroup);
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
            case CmdType.TextBatchModify:
                this.textBatchModify(cmd as TextCmdBatchModify);
                break;
            case CmdType.TextMove:
                this.textMove(cmd as TextCmdMove);
                break;
            case CmdType.ShapeDelete:
                this.shapeDelete(cmd as ShapeCmdRemove);
                break;
            case CmdType.ShapeInsert:
                this.shapeInsert(cmd as ShapeCmdInsert);
                break;
            case CmdType.ShapeModify:
                this.shapeModify(cmd as ShapeCmdModify);
                break;
            case CmdType.ShapeMove:
                this.shapeMove(cmd as ShapeCmdMove);
                break;
            default:
                throw new Error("unknow cmd type:" + cmd.type)
        }
    }

    pageInsert(cmd: PageCmdInsert) {
        const op = cmd.ops[0];
        if (op.type === OpType.ArrayInsert) {
            const page = importPage(JSON.parse(cmd.data));
            api.pageInsert(this.__document, page, op.start)
        }
    }
    pageDelete(cmd: PageCmdDelete) {
        const op = cmd.ops[0];
        if (op.type === OpType.ArrayRemove) { // oss需要保存历史版本以undo
            api.pageDelete(this.__document, op.start)
        }
    }
    pageModify(cmd: PageCmdModify) {
        // 参见consts.ts PAGE_ATTR_ID
        const ops = cmd.ops;
        if (ops.length === 1 && ops[0].type === OpType.IdSet && cmd.value) {// 以pagelist为准
            const pageId = ops[0].targetId[0]
            api.pageModifyName(this.__document, pageId, cmd.value)
        }
    }
    pageMove(cmd: PageCmdMove) {
        const op = cmd.ops[0];
        if (op && op.type === OpType.ArrayMove) {
            const moveOp = op as ArrayOpMove;
            api.pageMove(this.__document, moveOp.start, moveOp.start2);
        }
    }

    shapeInsert(cmd: ShapeCmdInsert) {
        const pageId = cmd.blockId;
        const shape = importShape(cmd.data, this.__document)
        const page = this.__document.pagesMgr.getSync(pageId)
        const op = cmd.ops[0];
        const parentId = op.targetId[0]
        if (page && op.type === OpType.ShapeInsert) { // 后续page加载后需要更新！
            const parent = page.getShape(parentId, true);
            if (parent && parent instanceof GroupShape) {
                api.shapeInsert(page, parent, shape, op.index)
            }
        }
    }
    shapeDelete(cmd: ShapeCmdRemove) {
        const pageId = cmd.blockId;
        const op = cmd.ops[0];
        const parentId = op.targetId[0]
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page && op.type === OpType.ShapeRemove) {
            const parent = page.getShape(parentId, true);
            if (parent && parent instanceof GroupShape) {
                api.shapeDelete(page, parent, op.index)
            }
        }
    }
    private _shapeModify(page: Page, shape: Shape, op: IdOp, value: string | undefined) {
        const opId = op.opId;
        if (opId === SHAPE_ATTR_ID.xy) {
            if (op.type === OpType.IdSet && value) {
                const xy = JSON.parse(value)
                api.shapeModifyXY(shape, xy.x, xy.y)
            }
        }
        else if (opId === SHAPE_ATTR_ID.wh) {
            if (op.type === OpType.IdSet && value) {
                const wh = JSON.parse(value)
                api.shapeModifyWH(shape, wh.w, wh.h)
            }
        }
        // todo
    }
    shapeModify(cmd: ShapeCmdModify) {
        const pageId = cmd.blockId;
        const op = cmd.ops[0];
        const shapeId = op.targetId[0]
        const page = this.__document.pagesMgr.getSync(pageId)
        const shape = page && page.getShape(shapeId, true);
        if (page && shape && (op.type === OpType.IdSet || op.type === OpType.IdRemove)) {
            const value = cmd.value;
            this._shapeModify(page, shape, op, value);
        }
    }
    shapeMove(cmd: ShapeCmdMove) { // TODO
        const pageId = cmd.blockId;
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page) {
            const op = cmd.ops[0];
            if (op && op.type === OpType.ShapeMove) {
                const moveOp = op as ShapeOpMove;
                const parentId = moveOp.targetId[0];
                const parentId2 = moveOp.targetId2[0];
                const parent = page.getShape(parentId, true);
                const parent2 = page.getShape(parentId2, true);
                if (parent && parent2) {
                    api.shapeMove(parent as GroupShape, moveOp.index, parent2 as GroupShape, moveOp.index2)
                }
            }
        }
    }
    shapeCMDGroup(cmdGroup: ShapeCmdGroup) {
        cmdGroup.cmds.forEach((cmd) => {
            switch (cmd.type) {
                case CmdType.ShapeInsert:
                    this.shapeInsert(cmd as ShapeCmdInsert);
                    break;
                case CmdType.ShapeDelete:
                    this.shapeDelete(cmd as ShapeCmdRemove);
                    break;
                case CmdType.ShapeModify:
                    this.shapeModify(cmd as ShapeCmdModify);
                    break;
                case CmdType.ShapeMove:
                    this.shapeMove(cmd as ShapeCmdMove);
                    break;
            }
        })
    }

    shapeArrAttrInsert(cmd: ShapeArrayAttrInsert) {
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {

        }
        else if (arrayAttr === BORDER_ID) {

        }
    }
    shapeArrAttrDelete(cmd: ShapeArrayAttrRemove) {
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {

        }
        else if (arrayAttr === BORDER_ID) {

        }
    }
    shapeArrAttrModify(cmd: ShapeArrayAttrModify) {
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {

        }
        else if (arrayAttr === BORDER_ID) {

        }
    }
    shapeArrAttrMove(cmd: ShapeArrayAttrMove) {
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {

        }
        else if (arrayAttr === BORDER_ID) {

        }
    }

    textInsert(cmd: TextCmdInsert) {

    }
    textDelete(cmd: TextCmdRemove) {

    }
    textModify(cmd: TextCmdModify) {

    }
    textBatchModify(cmd: TextCmdBatchModify) {

    }
    textMove(cmd: TextCmdMove) {

    }
}