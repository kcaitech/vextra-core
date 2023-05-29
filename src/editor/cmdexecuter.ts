// command 对应的要执行的api
// todo 需要schema定义

import { PageDelete, PageInsert, PageModify, ShapeBatchModify, ShapeCMDGroup, ShapeDelete, ShapeInsert, ShapeModify, ShapeMove, TextModify, TextDelete, TextInsert, TextInsert2, ShapeArrayAttrInsert, ShapeArrayAttrDelete, ShapeArrayAttrModify, ShapeArrayAttrMove } from "coop/cmds";
import { OpArrayInsert, OpArrayRemove } from "coop/ot/arrayot";
import { Document } from "data/document";
import { IImportContext, importFlattenShape, importArtboard, importGroupShape, importImageShape, importLineShape, importOvalShape, importPage, importPathShape, importRectShape, importSymbolRefShape, importSymbolShape, importTextShape } from "io/baseimport";
import { OpIdSet } from "coop/ot/idot";
import * as types from "../data/typesdefine"
import { ImageShape, SymbolRefShape, ArtboardRef, GroupShape } from "data/classes";

import * as api from "./api"
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
    constructor(document: Document) {
        this.__document = document;
    }
    pageInsert(cmd: PageInsert) {
        const op = cmd.ops[0];
        if (op instanceof OpArrayInsert) {
            const page = importPage(JSON.parse(cmd.data));
            api.pageInsert(this.__document, page, op.range.start)
        }
    }
    pageDelete(cmd: PageDelete) {
        const op = cmd.ops[0];
        if (op instanceof OpArrayRemove) { // oss需要保存历史版本以undo
            api.pageDelete(this.__document, op.range.start)
        }
    }
    pageModify(cmd: PageModify) {
        // 参见consts.ts PAGE_ATTR_ID
        const ops = cmd.ops;
        if (ops.length === 1 && ops[0] instanceof OpIdSet && cmd.value) {// 以pagelist为准
            const pageId = cmd.targets[0][0]
            api.pageModifyName(this.__document, pageId, cmd.value)
        }
    }

    shapeInsert(cmd: ShapeInsert) {
        const pageId = cmd.blockId;
        const shape = importShape(cmd.data, this.__document)
        const parentId = cmd.targets[0][0];
        const page = this.__document.pagesMgr.getSync(pageId)
        const op = cmd.ops[0]
        if (page && op instanceof OpArrayInsert) { // 后续page加载后需要更新！
            const parent = page.getShape(parentId);
            if (parent && parent instanceof GroupShape) {
                api.shapeInsert(page, parent, shape, op.range.start)
            }
        }
    }
    shapeDelete(cmd: ShapeDelete) {

    }
    shapeModify(cmd: ShapeModify) {

    }
    shapeBatchModify(cmd: ShapeBatchModify) {

    }
    shapeMove(cmd: ShapeMove) {

    }
    shapeCMDGroup(cmdGroup: ShapeCMDGroup) {

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
}