// command 对应的要执行的api
// todo 需要schema定义

import {
    PageDelete,
    PageInsert,
    PageModify,
    ShapeBatchModify,
    ShapeCMDGroup,
    ShapeDelete,
    ShapeInsert,
    ShapeModify,
    ShapeMove,
    TextModify,
    TextDelete,
    TextInsert,
    TextInsert2,
    ShapeArrayAttrInsert,
    ShapeArrayAttrDelete,
    ShapeArrayAttrModify,
    ShapeArrayAttrMove,
    ICMD,
    PageMove,
    TextMove,
    BasicCMD
} from "../coop/cmds";
import { Document } from "../data/document";
import { IImportContext, importFlattenShape, importArtboard, importGroupShape, importImageShape, importLineShape, importOvalShape, importPage, importPathShape, importRectShape, importSymbolRefShape, importSymbolShape, importTextShape } from "../io/baseimport";
import * as types from "../data/typesdefine"
import { ImageShape, SymbolRefShape, ArtboardRef, GroupShape, Page, Shape } from "../data/classes";

import * as api from "./api"
import { SHAPE_ATTR_ID } from "./consts";
import { ArrayOp, IdOp, OpType, ShapeOp } from "../coop/ot/op";
import { CMDTypes } from "../coop/cmds/typesdef";
import { Repository } from "../data/transact";

import { castObjectToClass } from "../basic/utils"
import {OpArrayNone} from "../coop/ot/arrayot";
import {OpShapeNone} from "../coop/ot/shapeot";
import {OpIdNone} from "../coop/ot/idot";
// 每个command 对应的api

// page
//  insert
//  delete
//  modify
//  move

// shape
//  insert
//  delete
//  modify
//  batchmodify
//  move
//  cmdgroup

// text
//  insert
//  delete
//  delete & insert
//  modify

// shapearrayattr
//  insert
//  remove
//  modify
//  move

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

    exec(cmd: ICMD): boolean {
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

    private _exec(cmd: ICMD) {
        cmd = castObjectToClass(cmd, BasicCMD.prototype)
        switch (cmd.type) {
            case CMDTypes.page_insert:
                this.pageInsert(castObjectToClass(cmd, PageInsert.prototype));
                break;
            case CMDTypes.page_delete:
                this.pageDelete(castObjectToClass(cmd, PageDelete.prototype));
                break;
            case CMDTypes.page_modify:
                this.pageModify(castObjectToClass(cmd, PageModify.prototype));
                break;
            case CMDTypes.page_move:
                this.pageMove(castObjectToClass(cmd, PageMove.prototype));
                break;
            case CMDTypes.shape_array_attr_insert:
                this.shapeArrAttrInsert(castObjectToClass(cmd, ShapeArrayAttrInsert.prototype));
                break;
            case CMDTypes.shape_array_attr_modify:
                this.shapeArrAttrModify(castObjectToClass(cmd, ShapeArrayAttrModify.prototype));
                break;
            case CMDTypes.shape_array_attr_move:
                this.shapeArrAttrMove(castObjectToClass(cmd, ShapeArrayAttrMove.prototype));
                break;
            case CMDTypes.shape_array_attr_delete:
                this.shapeArrAttrDelete(castObjectToClass(cmd, ShapeArrayAttrDelete.prototype));
                break;
            case CMDTypes.shape_batch_modify:
                this.shapeBatchModify(castObjectToClass(cmd, ShapeBatchModify.prototype));
                break;
            case CMDTypes.shape_cmd_group:
                this.shapeCMDGroup(castObjectToClass(cmd, ShapeCMDGroup.prototype));
                break;
            case CMDTypes.text_delete:
                this.textDelete(castObjectToClass(cmd, TextDelete.prototype));
                break;
            case CMDTypes.text_insert:
                this.textInsert(castObjectToClass(cmd, TextInsert.prototype));
                break;
            case CMDTypes.text_insert2:
                this.textInsert2(castObjectToClass(cmd, TextInsert2.prototype));
                break;
            case CMDTypes.text_modify:
                this.textModify(castObjectToClass(cmd, TextModify.prototype));
                break;
            case CMDTypes.text_move:
                this.textMove(castObjectToClass(cmd, TextMove.prototype));
                break;
            case CMDTypes.shape_delete:
                this.textDelete(castObjectToClass(cmd, TextDelete.prototype));
                break;
            case CMDTypes.shape_insert:
                this.shapeInsert(castObjectToClass(cmd, ShapeInsert.prototype));
                break;
            case CMDTypes.shape_modify:
                this.shapeModify(castObjectToClass(cmd, ShapeModify.prototype));
                break;
            case CMDTypes.shape_move:
                this.shapeMove(castObjectToClass(cmd, ShapeMove.prototype));
                break;
            default:
                throw new Error("unknow cmd type:" + cmd.type)
        }
    }

    pageInsert(cmd: PageInsert) {
        const op = castObjectToClass(cmd.ops[0], OpArrayNone.prototype);
        if (op.type === OpType.array_insert) {
            const page = importPage(JSON.parse(cmd.data));
            api.pageInsert(this.__document, page, op.range.start)
        }
    }
    pageDelete(cmd: PageDelete) {
        const op = castObjectToClass(cmd.ops[0], OpArrayNone.prototype);
        if (op.type === OpType.array_remove) { // oss需要保存历史版本以undo
            api.pageDelete(this.__document, op.range.start)
        }
    }
    pageModify(cmd: PageModify) {
        // 参见consts.ts PAGE_ATTR_ID
        const ops = cmd.ops;
        if (ops.length === 1 && castObjectToClass(ops[0], OpIdNone.prototype).type === OpType.id_set && cmd.value) {// 以pagelist为准
            const pageId = cmd.targets[0][0]
            api.pageModifyName(this.__document, pageId, cmd.value)
        }
    }
    pageMove(cmd: PageMove) {

    }

    shapeInsert(cmd: ShapeInsert) {
        const pageId = cmd.blockId;
        const shape = importShape(cmd.data, this.__document)
        const parentId = cmd.targets[0][0];
        const page = this.__document.pagesMgr.getSync(pageId)
        const op = castObjectToClass(cmd.ops[0], OpShapeNone.prototype);
        if (page && op.type === OpType.shape_insert) { // 后续page加载后需要更新！
            const parent = page.getShape(parentId, true);
            if (parent && parent instanceof GroupShape) {
                api.shapeInsert(page, parent, shape, op.index)
            }
        }
    }
    shapeDelete(cmd: ShapeDelete) {
        const pageId = cmd.blockId;
        const parentId = cmd.targets[0][0];
        const op = castObjectToClass(cmd.ops[0], OpShapeNone.prototype);
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page && op.type === OpType.shape_remove) {
            const parent = page.getShape(parentId, true);
            if (parent && parent instanceof GroupShape) {
                api.shapeDelete(page, parent, op.index)
            }
        }
    }
    private _shapeModify(page: Page, shape: Shape, op: IdOp, value: string | undefined) {
        const opId = op.opId;
        if (opId === SHAPE_ATTR_ID.xy) {
            if (op.type === OpType.id_set && value) {
                const xy = JSON.parse(value)
                api.shapeModifyXY(shape, xy.x, xy.y)
            }
        }
        else if (opId === SHAPE_ATTR_ID.wh) {
            if (op.type === OpType.id_set && value) {
                const wh = JSON.parse(value)
                api.shapeModifyWH(shape, wh.w, wh.h)
            }
        }
        // todo
    }
    shapeModify(cmd: ShapeModify) {
        const pageId = cmd.blockId;
        const shapeId = cmd.targets[0][0];
        const op = castObjectToClass(cmd.ops[0], OpIdNone.prototype);
        const page = this.__document.pagesMgr.getSync(pageId)
        const shape = page && page.getShape(shapeId, true);
        if (page && shape && (op.type === OpType.id_set || op.type === OpType.id_remove)) {
            const value = cmd.value;
            this._shapeModify(page, shape, op, value);
        }
    }
    shapeBatchModify(cmd: ShapeBatchModify) {
        const pageId = cmd.blockId;
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page) {
            const ops= cmd.ops;
            const values = cmd.values;
            ops.forEach((op, index) => {
                op = castObjectToClass(cmd.ops[0], OpIdNone.prototype);
                const shapeId = op.targetId[0];
                const shape = page.getShape(shapeId, true);
                const value = values[index];
                if (shape && (op.type === OpType.id_set || op.type === OpType.id_remove)) {
                    this._shapeModify(page, shape, op as IdOp, value);
                }
            })
        }
    }
    shapeMove(cmd: ShapeMove) { // TODO
        const pageId = cmd.blockId;
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page) {
            const op = castObjectToClass(cmd.ops[0], OpArrayNone.prototype); // 正常是一个删除，一个插入
            // 如果有用户同时move一个对象，现在是错的！
            // ops.forEach((op, index) => {
            //     if (op.type === OpType.array_remove) {
            //     }
            //     else if (op.type === OpType.array_insert) {
            //     }
            // })
        }
    }
    shapeCMDGroup(cmdGroup: ShapeCMDGroup) {
        cmdGroup.cmds.forEach((cmd) => {
            switch (castObjectToClass(cmd, BasicCMD.prototype).type) {
                case CMDTypes.shape_insert:
                    this.shapeInsert(castObjectToClass(cmd, ShapeInsert.prototype));
                    break;
                case CMDTypes.shape_delete:
                    this.shapeDelete(castObjectToClass(cmd, ShapeDelete.prototype));
                    break;
                case CMDTypes.shape_modify:
                    this.shapeModify(castObjectToClass(cmd, ShapeModify.prototype));
                    break;
                case CMDTypes.shape_batch_modify:
                    this.shapeBatchModify(castObjectToClass(cmd, ShapeBatchModify.prototype));
                    break;
                case CMDTypes.shape_move:
                    this.shapeMove(castObjectToClass(cmd, ShapeMove.prototype));
                    break;
            }
        })
    }
    shapeArrAttrInsert(cmd: ShapeArrayAttrInsert) {

    }
    shapeArrAttrDelete(cmd: ShapeArrayAttrDelete) {

    }
    shapeArrAttrModify(cmd: ShapeArrayAttrModify) {

    }
    shapeArrAttrMove(cmd: ShapeArrayAttrMove) {

    }

    textInsert(cmd: TextInsert) {

    }
    textDelete(cmd: TextDelete) {

    }
    textInsert2(cmd: TextInsert2) {

    }
    textModify(cmd: TextModify) {

    }
    textMove(cmd: TextMove) {

    }
}