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

import { fromObject } from "../basic/utils"
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

    exec(cmd: ICMD) {
        this.__repo.start("", {});
        try {
            this._exec(cmd);
            this.__repo.commitRemote();
        }
        catch (e) {
            console.log("exec error:", e)
            this.__repo.rollbackRemote();
        }
    }

    private _exec(cmd: ICMD) {
        switch ((cmd as any)._type) {
            case CMDTypes.page_insert:
                this.pageInsert(fromObject(PageInsert.prototype, cmd));
                break;
            case CMDTypes.page_delete:
                this.pageDelete(fromObject(PageDelete.prototype, cmd));
                break;
            case CMDTypes.page_modify:
                this.pageModify(fromObject(PageModify.prototype, cmd));
                break;
            case CMDTypes.page_move:
                this.pageMove(fromObject(PageMove.prototype, cmd));
                break;
            case CMDTypes.shape_array_attr_insert:
                this.shapeArrAttrInsert(fromObject(ShapeArrayAttrInsert.prototype, cmd));
                break;
            case CMDTypes.shape_array_attr_modify:
                this.shapeArrAttrModify(fromObject(ShapeArrayAttrModify.prototype, cmd));
                break;
            case CMDTypes.shape_array_attr_move:
                this.shapeArrAttrMove(fromObject(ShapeArrayAttrMove.prototype, cmd));
                break;
            case CMDTypes.shape_array_attr_delete:
                this.shapeArrAttrDelete(fromObject(ShapeArrayAttrDelete.prototype, cmd));
                break;
            case CMDTypes.shape_batch_modify:
                this.shapeBatchModify(fromObject(ShapeBatchModify.prototype, cmd));
                break;
            case CMDTypes.shape_cmd_group:
                this.shapeCMDGroup(fromObject(ShapeCMDGroup.prototype, cmd));
                break;
            case CMDTypes.text_delete:
                this.textDelete(fromObject(TextDelete.prototype, cmd));
                break;
            case CMDTypes.text_insert:
                this.textInsert(fromObject(TextInsert.prototype, cmd));
                break;
            case CMDTypes.text_insert2:
                this.textInsert2(fromObject(TextInsert2.prototype, cmd));
                break;
            case CMDTypes.text_modify:
                this.textModify(fromObject(TextModify.prototype, cmd));
                break;
            case CMDTypes.text_move:
                this.textMove(fromObject(TextMove.prototype, cmd));
                break;
            case CMDTypes.shape_delete:
                this.textDelete(fromObject(TextDelete.prototype, cmd));
                break;
            case CMDTypes.shape_insert:
                this.shapeInsert(fromObject(ShapeInsert.prototype, cmd));
                break;
            case CMDTypes.shape_modify:
                this.shapeModify(fromObject(ShapeModify.prototype, cmd));
                break;
            case CMDTypes.shape_move:
                this.shapeMove(fromObject(ShapeMove.prototype, cmd));
                break;
            default:
                throw new Error("unknow cmd type:" + cmd.type)
        }
    }

    pageInsert(cmd: PageInsert) {
        let op: any = cmd.ops[0];
        if (op._type === OpType.array_insert) {
            op = fromObject(OpArrayNone.prototype, op)
            const page = importPage(JSON.parse(cmd.data));
            api.pageInsert(this.__document, page, (op as ArrayOp).range.start)
        }
    }
    pageDelete(cmd: PageDelete) {
        let op: any = cmd.ops[0];
        if (op._type === OpType.array_remove) { // oss需要保存历史版本以undo
            op = fromObject(OpArrayNone.prototype, op)
            api.pageDelete(this.__document, (op as ArrayOp).range.start)
        }
    }
    pageModify(cmd: PageModify) {
        // 参见consts.ts PAGE_ATTR_ID
        const ops: any[] = cmd.ops;
        if (ops.length === 1 && ops[0]._type === OpType.id_set && cmd.value) {// 以pagelist为准
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
        let op: any = cmd.ops[0]
        if (page && op._type === OpType.shape_insert) { // 后续page加载后需要更新！
            op = fromObject(OpShapeNone.prototype, op)
            const parent = page.getShape(parentId, true);
            if (parent && parent instanceof GroupShape) {
                api.shapeInsert(page, parent, shape, (op as ShapeOp).index)
            }
        }
    }
    shapeDelete(cmd: ShapeDelete) {
        const pageId = cmd.blockId;
        const parentId = cmd.targets[0][0];
        let op: any = cmd.ops[0]
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page && op._type === OpType.shape_remove) {
            op = fromObject(OpShapeNone.prototype, op)
            const parent = page.getShape(parentId, true);
            if (parent && parent instanceof GroupShape) {
                api.shapeDelete(page, parent, (op as ShapeOp).index)
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
        let op: any = cmd.ops[0]
        const page = this.__document.pagesMgr.getSync(pageId)
        const shape = page && page.getShape(shapeId, true);
        if (page && shape && (op._type === OpType.id_set || op._type === OpType.id_remove)) {
            op = fromObject(OpIdNone.prototype, op)
            const value = cmd.value;
            this._shapeModify(page, shape, op as IdOp, value);
        }
    }
    shapeBatchModify(cmd: ShapeBatchModify) {
        const pageId = cmd.blockId;
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page) {
            const ops: any[] = cmd.ops;
            const values = cmd.values;
            ops.forEach((op, index) => {
                const shapeId = op._targetId[0];
                const shape = page.getShape(shapeId, true);
                const value = values[index];
                if (shape && (op._type === OpType.id_set || op._type === OpType.id_remove)) {
                    op = fromObject(OpIdNone.prototype, op)
                    this._shapeModify(page, shape, op as IdOp, value);
                }
            })
        }
    }
    shapeMove(cmd: ShapeMove) { // TODO
        const pageId = cmd.blockId;
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page) {
            let op: any = cmd.ops[0]; // 正常是一个删除，一个插入
            // 如果有用户同时move一个对象，现在是错的！
            // ops.forEach((op, index) => {
            //     if (op._type === OpType.array_remove) {
            //     }
            //     else if (op._type === OpType.array_insert) {
            //     }
            // })
        }
    }
    shapeCMDGroup(cmdGroup: ShapeCMDGroup) {
        cmdGroup.cmds.forEach((cmd) => {
            switch ((cmd as any)._type) {
                case CMDTypes.shape_insert:
                    this.shapeInsert(fromObject(ShapeInsert.prototype, cmd));
                    break;
                case CMDTypes.shape_delete:
                    this.shapeDelete(fromObject(ShapeDelete.prototype, cmd));
                    break;
                case CMDTypes.shape_modify:
                    this.shapeModify(fromObject(ShapeModify.prototype, cmd));
                    break;
                case CMDTypes.shape_batch_modify:
                    this.shapeBatchModify(fromObject(ShapeBatchModify.prototype, cmd));
                    break;
                case CMDTypes.shape_move:
                    this.shapeMove(fromObject(ShapeMove.prototype, cmd));
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