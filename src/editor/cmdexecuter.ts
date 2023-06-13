import {
    PageCmdDelete,
    PageCmdInsert,
    PageCmdModify,
    ShapeCmdGroup,
    ShapeCmdRemove,
    ShapeCmdInsert,
    ShapeCmdModify,
    ShapeCmdMove,
    TextCmdModify,
    TextCmdRemove,
    TextCmdInsert,
    TextCmdGroup,
    ShapeArrayAttrInsert,
    ShapeArrayAttrRemove,
    ShapeArrayAttrModify,
    ShapeArrayAttrMove,
    PageCmdMove,
    TextCmdMove,
    ArrayOpMove,
    ShapeOpMove,
    IdOpSet
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
    importTextShape,
    importFill,
    importBorder,
    importColor
} from "../io/baseimport";
import * as types from "../data/typesdefine"
import { ImageShape, SymbolRefShape, ArtboardRef, GroupShape, Page, Shape, TextShape } from "../data/classes";

import * as api from "./cmdapi"
import { BORDER_ATTR_ID, BORDER_ID, FILLS_ATTR_ID, FILLS_ID, PAGE_ATTR_ID, SHAPE_ATTR_ID } from "./consts";
import { Repository } from "../data/transact";
import { Cmd, CmdType, IdOp, OpType } from "../coop/data/classes";
import { ArrayOpInsert, ArrayOpRemove } from "../coop/data/basictypes";

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

    exec(cmd: Cmd, isRemote: boolean = true): boolean {
        this.__repo.start("", {});
        try {
            this._exec(cmd);
            this.__repo.commit();
            return true;
        }
        catch (e) {
            console.log("exec error:", e)
            this.__repo.rollback();
            return false;
        }
    }

    private _exec(cmd: Cmd) {
        const needUpdateFrame: Shape[] = [];

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
                this.shapeCMDGroup(cmd as ShapeCmdGroup, needUpdateFrame);
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
            case CmdType.TextCmdGroup:
                this.textCmdGroup(cmd as TextCmdGroup);
                break;
            case CmdType.TextMove:
                this.textMove(cmd as TextCmdMove);
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
            default:
                throw new Error("unknow cmd type:" + cmd.type)
        }

        const updated = new Set<string>();
        needUpdateFrame.forEach((shape) => {
            if (updated.has(shape.id)) return;
            api.updateFrame(shape);
            updated.add(shape.id);
        })
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
        const op = cmd.ops[0];
        if (op.type === OpType.IdSet && cmd.value) {// 以pagelist为准
            const pageId = op.targetId[0]
            const opId = (op as IdOpSet).opId;
            if (opId === PAGE_ATTR_ID.name) {
                api.pageModifyName(this.__document, pageId, cmd.value)
            }
        }
        else if (op.type === OpType.IdRemove) {
            // 
        }
    }
    pageMove(cmd: PageCmdMove) {
        const op = cmd.ops[0];
        if (op && op.type === OpType.ArrayMove) {
            const moveOp = op as ArrayOpMove;
            api.pageMove(this.__document, moveOp.start, moveOp.start2);
        }
    }

    shapeInsert(cmd: ShapeCmdInsert, needUpdateFrame: Shape[]) {
        const pageId = cmd.blockId;
        const shape = importShape(cmd.data, this.__document)
        const page = this.__document.pagesMgr.getSync(pageId)
        const op = cmd.ops[0];
        const parentId = op.targetId[0]
        if (page && op.type === OpType.ShapeInsert) { // 后续page加载后需要更新！
            const parent = page.getShape(parentId, true);
            if (parent && parent instanceof GroupShape) {
                api.shapeInsert(page, parent, shape, op.index, needUpdateFrame)
            }
        }
    }
    shapeDelete(cmd: ShapeCmdRemove, needUpdateFrame: Shape[]) {
        const pageId = cmd.blockId;
        const op = cmd.ops[0];
        const parentId = op.targetId[0]
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page && op.type === OpType.ShapeRemove) {
            const parent = page.getShape(parentId, true);
            if (parent && parent instanceof GroupShape) {
                api.shapeDelete(page, parent, op.index, needUpdateFrame)
            }
        }
    }
    private _shapeModify(page: Page, shape: Shape, op: IdOp, value: string | undefined, needUpdateFrame: Shape[]) {
        const opId = op.opId;
        if (opId === SHAPE_ATTR_ID.x) {
            if (op.type === OpType.IdSet && value) {
                const x = JSON.parse(value)
                api.shapeModifyX(shape, x, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.y) {
            if (op.type === OpType.IdSet && value) {
                const y = JSON.parse(value)
                api.shapeModifyY(shape, y, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.size) {
            if (op.type === OpType.IdSet && value) {
                const wh = JSON.parse(value)
                api.shapeModifyWH(shape, wh.w, wh.h, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.rotate) {
            if (op.type === OpType.IdSet && value) {
                const rotate = JSON.parse(value)
                api.shapeModifyRotate(shape, rotate, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.name) {
            if (op.type === OpType.IdSet && value) {
                const name = value;
                api.shapeModifyName(shape, name)
            }
        }
        else if (opId === SHAPE_ATTR_ID.hflip) {
            if (op.type === OpType.IdSet && value) {
                const hflip = JSON.parse(value)
                api.shapeModifyHFlip(shape, hflip, needUpdateFrame)
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyHFlip(shape, undefined, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.vflip) {
            if (op.type === OpType.IdSet && value) {
                const vflip = JSON.parse(value)
                api.shapeModifyVFlip(shape, vflip, needUpdateFrame)
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyVFlip(shape, undefined, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.backgroundColor) {
            if (op.type === OpType.IdSet && value) {
                const color = importColor(JSON.parse(value))
                api.shapeModifyBackgroundColor(shape, color)
            }
        }
        // todo
        else {
            console.error("not implemented ", op)
        }
    }
    shapeModify(cmd: ShapeCmdModify, needUpdateFrame: Shape[]) {
        const pageId = cmd.blockId;
        const op = cmd.ops[0];
        const shapeId = op.targetId[0]
        const page = this.__document.pagesMgr.getSync(pageId)
        const shape = page && page.getShape(shapeId, true);
        if (page && shape && (op.type === OpType.IdSet || op.type === OpType.IdRemove)) {
            const value = cmd.value;
            this._shapeModify(page, shape, op, value, needUpdateFrame);
        }
    }
    shapeMove(cmd: ShapeCmdMove, needUpdateFrame: Shape[]) {
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
                    api.shapeMove(parent as GroupShape, moveOp.index, parent2 as GroupShape, moveOp.index2, needUpdateFrame)
                }
            }
        }
    }
    shapeCMDGroup(cmdGroup: ShapeCmdGroup, needUpdateFrame: Shape[]) {
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
            }
        })
    }

    shapeArrAttrInsert(cmd: ShapeArrayAttrInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!page || !shape) return;
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
    }
    shapeArrAttrDelete(cmd: ShapeArrayAttrRemove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!page || !shape) return;
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
    }
    shapeArrAttrModify(cmd: ShapeArrayAttrModify) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!page || !shape) return;
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            const fillId = cmd.arrayAttrId;
            // find fill
            const fillIdx = shape.style.fills.findIndex((fill) => fill.id === fillId)
            if (fillIdx < 0) return;
            const opId = op.opId;
            const value = cmd.value;
            if (opId === FILLS_ATTR_ID.color) {
                if (op.type === OpType.IdSet && value) {
                    const color = importColor(JSON.parse(value))
                    api.setFillColor(shape.style, fillIdx, color);
                }
            }
            else if (opId === FILLS_ATTR_ID.enable) {
                if (op.type === OpType.IdSet && value) {
                    const enable = JSON.parse(value);
                    api.setFillEnable(shape.style, fillIdx, enable)
                }
                else if (op.type === OpType.IdRemove) {
                    api.setFillEnable(shape.style, fillIdx, false)
                }
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
                if (op.type === OpType.IdSet && value) {
                    const color = importColor(JSON.parse(value))
                    api.setBorderColor(shape.style, borderIdx, color);
                }
            }
            // todo
            else {
                console.error("not implemented ", op)
            }
        }
    }
    shapeArrAttrMove(cmd: ShapeArrayAttrMove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!page || !shape) return;
        const arrayAttr = cmd.arrayAttr;
        if (arrayAttr === FILLS_ID) {
            if (op.type === OpType.ArrayMove) {
                const moveOp = op as ArrayOpMove;
                api.moveFill(shape.style, moveOp.start, moveOp.start2)
            }
        }
        else if (arrayAttr === BORDER_ID) {
            if (op.type === OpType.ArrayMove) {
                const moveOp = op as ArrayOpMove;
                api.moveBorder(shape.style, moveOp.start, moveOp.start2)
            }
        }
    }

    textInsert(cmd: TextCmdInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!page || !shape || !(shape instanceof TextShape)) return;
        api.insertText(shape, cmd.text, op.start)
    }
    textDelete(cmd: TextCmdRemove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!page || !shape || !(shape instanceof TextShape)) return;
        api.deleteText(shape, op.start, op.length);
    }
    textModify(cmd: TextCmdModify) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!page || !shape || !(shape instanceof TextShape)) return;
        // todo
    }
    textCmdGroup(cmd: TextCmdGroup) {
        cmd.cmds.forEach((cmd) => {
            switch (cmd.type) {
                case CmdType.TextInsert:
                    this.textInsert(cmd as TextCmdInsert);
                    break;
                case CmdType.TextDelete:
                    this.textDelete(cmd as TextCmdRemove);
                    break;
                case CmdType.TextModify:
                    this.textModify(cmd as TextCmdModify);
                    break;
                case CmdType.TextMove:
                    this.textMove(cmd as TextCmdMove);
                    break;
            }
        })
    }
    textMove(cmd: TextCmdMove) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!page || !shape || !(shape instanceof TextShape)) return;
        // todo
    }
}