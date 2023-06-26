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
    ShapeArrayAttrGroup,
    PageCmdMove,
    TextCmdMove,
    ShapeOpMove,
    IdOpSet,
    ShapeOpRemove
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
    importRectRadius,
    importText,
    importSpanAttr
} from "../../io/baseimport";
import * as types from "../../data/typesdefine"
import { ImageShape, SymbolRefShape, GroupShape, Page, Shape, TextShape, RectShape, Artboard, SymbolShape, Text, SpanAttr, Color } from "../../data/classes";

import * as api from "../basicapi"
import { BORDER_ATTR_ID, BORDER_ID, FILLS_ATTR_ID, FILLS_ID, PAGE_ATTR_ID, SHAPE_ATTR_ID, TEXT_ATTR_ID } from "./consts";
import { Repository } from "../../data/transact";
import { Cmd, CmdType, IdOp, OpType } from "../../coop/data/classes";
import { ArrayOpInsert, ArrayOpRemove } from "../../coop/data/basictypes";
import { updateShapesFrame } from "./utils";
import { CmdGroup } from "../../coop/data/cmdgroup";

function importShape(data: string, document: Document) {
    const source: { [key: string]: any } = JSON.parse(data);
    const ctx = new class implements IImportContext {
        afterImport(obj: any): void {
            if (obj instanceof ImageShape) {
                obj.setImageMgr(document.mediasMgr)
            } else if (obj instanceof SymbolRefShape) {
                obj.setSymbolMgr(document.symbolsMgr)
                // } else if (obj instanceof ArtboardRef) {
                //     obj.setArtboardMgr(document.artboardMgr)
            } else if (obj instanceof Artboard) {
                document.artboardMgr.add(obj.id, obj);
            } else if (obj instanceof SymbolShape) {
                document.symbolsMgr.add(obj.id, obj);
            } else if (obj instanceof TextShape) {
                obj.setMeasureFun(document.measureFun);
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
        const save = this.__repo.transactCtx.settrap;
        try {
            this.__repo.transactCtx.settrap = false;
            this._exec(cmd);
            this.__repo.commit();
            return true;
        }
        catch (e) {
            console.log("exec error:", e)
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
            case CmdType.ShapeArrayAttrGroup:
                this.shapeArrayAttrCMDGroup(cmd as ShapeArrayAttrGroup);
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
            case CmdType.Group:
                this.cmdGroup(cmd as CmdGroup, needUpdateFrame);
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
                case CmdType.TextMove:
                    this.textMove(cmd as TextCmdMove);
                    break;
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
        const op = cmd.ops[0] as ShapeOpMove;
        if (op && op.type === OpType.ShapeMove) {
            api.pageMove(this.__document, op.index, op.index2);
        }
    }

    shapeInsert(cmd: ShapeCmdInsert, needUpdateFrame: { shape: Shape, page: Page }[]) {
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
    shapeDelete(cmd: ShapeCmdRemove, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const pageId = cmd.blockId;
        const op = cmd.ops[0];
        const parentId = op.targetId[0]
        const page = this.__document.pagesMgr.getSync(pageId)
        if (page && op.type === OpType.ShapeRemove) {
            const parent = page.getShape(parentId, true);
            if (parent && parent instanceof GroupShape) {
                // check
                const shapeop = op as ShapeOpRemove;
                const shapeid = shapeop.shapeId;
                const shape = parent.childs[op.index];
                if (shape && shape.id !== shapeid) throw new Error("shape id not equals: " + shape.id + " " + shapeid);

                api.shapeDelete(page, parent, op.index, needUpdateFrame)
            }
        }
    }
    private _shapeModify(page: Page, shape: Shape, op: IdOp, value: string | undefined, needUpdateFrame: { shape: Shape, page: Page }[]) {
        const opId = op.opId;
        if (opId === SHAPE_ATTR_ID.x) {
            if (op.type === OpType.IdSet && value) {
                const x = JSON.parse(value)
                api.shapeModifyX(page, shape, x, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.y) {
            if (op.type === OpType.IdSet && value) {
                const y = JSON.parse(value)
                api.shapeModifyY(page, shape, y, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.size) {
            if (op.type === OpType.IdSet && value) {
                const wh = JSON.parse(value)
                api.shapeModifyWH(page, shape, wh.w, wh.h, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.rotate) {
            if (op.type === OpType.IdSet && value) {
                const rotate = JSON.parse(value)
                api.shapeModifyRotate(page, shape, rotate, needUpdateFrame)
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
                api.shapeModifyHFlip(page, shape, hflip, needUpdateFrame)
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyHFlip(page, shape, undefined, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.vflip) {
            if (op.type === OpType.IdSet && value) {
                const vflip = JSON.parse(value)
                api.shapeModifyVFlip(page, shape, vflip, needUpdateFrame)
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyVFlip(page, shape, undefined, needUpdateFrame)
            }
        }
        else if (opId === SHAPE_ATTR_ID.visible) {
            if (op.type === OpType.IdSet && value) {
                const isVisible = JSON.parse(value)
                api.shapeModifyVisible(shape, isVisible);
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyVisible(shape, false)
            }
        }
        else if (opId === SHAPE_ATTR_ID.lock) {
            if (op.type === OpType.IdSet && value) {
                const isLock = JSON.parse(value)
                api.shapeModifyLock(shape, isLock);
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyLock(shape, false)
            }
        }
        else if (opId === SHAPE_ATTR_ID.backgroundColor) {
            if (op.type === OpType.IdSet && value) {
                const color = importColor(JSON.parse(value))
                api.shapeModifyBackgroundColor(shape, color)
            }
        }
        else if (opId === SHAPE_ATTR_ID.resizingConstraint) {
            if (op.type === OpType.IdSet && value) {
                const v = JSON.parse(value);
                api.shapeModifyResizingConstraint(shape, v)
            }
        }
        else if (opId === SHAPE_ATTR_ID.radius) {
            if (op.type === OpType.IdSet && value) {
                const v = importRectRadius(JSON.parse(value));
                api.shapeModifyRadius(shape as RectShape, v)
            }
        }
        else if (opId === SHAPE_ATTR_ID.constrainerProportions) {
            if (op.type === OpType.IdSet && value) {
                const isLock = JSON.parse(value)
                api.shapeModifyConstrainerProportions(shape, isLock);
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyConstrainerProportions(shape, false)
            }
        }
        else if (opId === SHAPE_ATTR_ID.textBehaviour) {
            if (op.type === OpType.IdSet && value) {
                const textBehaviour = value as types.TextBehaviour
                api.shapeModifyTextBehaviour(page, shape as TextShape, textBehaviour);
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyTextBehaviour(page, shape as TextShape, types.TextBehaviour.Flexible)
            }
        }
        else if (opId === SHAPE_ATTR_ID.textVerAlign) {
            if (op.type === OpType.IdSet && value) {
                const textVerAlign = value as types.TextVerAlign
                api.shapeModifyTextVerAlign(shape as TextShape, textVerAlign);
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyTextVerAlign(shape as TextShape, types.TextVerAlign.Top)
            }
        }
        else if (opId === SHAPE_ATTR_ID.textHorAlign) {
            if (op.type === OpType.IdSet && value) {
                const textHorAlign = value as types.TextHorAlign
                api.shapeModifyTextHorAlign(shape as TextShape, textHorAlign);
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyTextHorAlign(shape as TextShape, types.TextHorAlign.Left)
            }
        }
        else if (opId === SHAPE_ATTR_ID.textMaxLineheight) {
            if (op.type === OpType.IdSet && value) {
                const textMaxLineheight = JSON.parse(value) as number;
                api.shapeModifyTextMaxLineHeight(shape as TextShape, textMaxLineheight);
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyTextMaxLineHeight(shape as TextShape, 0)
            }
        }
        else if (opId === SHAPE_ATTR_ID.textMinLineheight) {
            if (op.type === OpType.IdSet && value) {
                const textMinLineheight = JSON.parse(value) as number
                api.shapeModifyTextMinLineHeight(shape as TextShape, textMinLineheight);
            }
            else if (op.type === OpType.IdRemove) {
                api.shapeModifyTextMinLineHeight(shape as TextShape, 0)
            }
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
        const shape = page && page.getShape(shapeId, true);
        if (page && shape && (op.type === OpType.IdSet || op.type === OpType.IdRemove)) {
            const value = cmd.value;
            this._shapeModify(page, shape, op, value, needUpdateFrame);
        }
    }
    shapeMove(cmd: ShapeCmdMove, needUpdateFrame: { shape: Shape, page: Page }[]) {
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
                    api.shapeMove(page, parent as GroupShape, moveOp.index, parent2 as GroupShape, moveOp.index2, needUpdateFrame)
                }
            }
        }
    }
    shapeCMDGroup(cmdGroup: ShapeCmdGroup, needUpdateFrame: { shape: Shape, page: Page }[]) {
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

    shapeArrayAttrCMDGroup(cmdGroup: ShapeArrayAttrGroup) {
        cmdGroup.cmds.forEach((cmd) => {
            switch (cmd.type) {
                case CmdType.ShapeArrayAttrInsert:
                    this.shapeArrAttrInsert(cmd as ShapeArrayAttrInsert);
                    break;
                case CmdType.ShapeArrayAttrDelete:
                    this.shapeArrAttrDelete(cmd as ShapeArrayAttrInsert);
                    break;
                case CmdType.ShapeArrayAttrModify:
                    this.shapeArrAttrModify(cmd as ShapeArrayAttrModify);
                    break;
                case CmdType.ShapeArrayAttrMove:
                    this.shapeArrAttrMove(cmd as ShapeArrayAttrMove);
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
            const fillIdx = shape.style.fills.findIndex((fill) => fill.id === fillId);
            if (fillIdx < 0) return;
            const opId = op.opId;
            const value = cmd.value;
            if (opId === FILLS_ATTR_ID.color) {
                if (op.type === OpType.IdSet && value) {
                    const color = importColor(JSON.parse(value));
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
            else if (opId === BORDER_ATTR_ID.enable) {
                if (op.type === OpType.IdSet && value) {
                    const enable = JSON.parse(value);
                    api.setBorderEnable(shape.style, borderIdx, enable)
                }
                else if (op.type === OpType.IdRemove) {
                    api.setBorderEnable(shape.style, borderIdx, false)
                }
            }
            else if (opId === BORDER_ATTR_ID.thickness) {
                if (op.type === OpType.IdSet && value) {
                    const thickness = JSON.parse(value);
                    api.setBorderThickness(shape.style, borderIdx, thickness)
                }
                else if (op.type === OpType.IdRemove) {
                    api.setBorderThickness(shape.style, borderIdx, 0)
                }
            }
            else if (opId === BORDER_ATTR_ID.position) {
                if (op.type === OpType.IdSet && value) {
                    const position = importBorderPosition(JSON.parse(value));
                    api.setBorderPosition(shape.style, borderIdx, position)
                }
            }
            else if (opId === BORDER_ATTR_ID.borderStyle) {
                if (op.type === OpType.IdSet && value) {
                    const style = importBorderStyle(JSON.parse(value));
                    api.setBorderStyle(shape.style, borderIdx, style)
                }
            }
            else if (opId === BORDER_ATTR_ID.startMarkerType) {
                if (op.type === OpType.IdSet && value) {
                    api.setBorderStartMarkerType(shape.style, borderIdx, value as any)
                }
            }
            else if (opId === BORDER_ATTR_ID.endMarkerType) {
                if (op.type === OpType.IdSet && value) {
                    api.setBorderEndMarkerType(shape.style, borderIdx, value as any)
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
        const op0 = cmd.ops[0] as ArrayOpRemove
        const op1 = cmd.ops[1] as ArrayOpInsert
        const shapeId = op0.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!page || !shape) return;
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
    }

    textInsert(cmd: TextCmdInsert) {
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const op = cmd.ops[0]
        const shapeId = op.targetId[0]
        const shape = page && page.getShape(shapeId, true);
        if (!page || !shape || !(shape instanceof TextShape)) return;
        const text = cmd.parseText();
        if (text.type === "simple") {
            let attr;
            if (text.attr) attr = importSpanAttr(text.attr);
            api.insertSimpleText(shape, text.text as string, op.start, { attr })
        }
        else if (text.type === "complex") {
            const _text = importText(text.text as types.Text);
            api.insertComplexText(shape, _text, op.start)
        }
        else {
            throw new Error("unknow text insert type: " + cmd.text)
        }
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
        const attrId = cmd.attrId
        const value = cmd.value;
        if (attrId === TEXT_ATTR_ID.color) {
            if (op.type === OpType.ArrayAttr) {
                const color = (value && importColor(JSON.parse(value))) as Color | undefined;
                api.textModifyColor(shape, op.start, op.length, color)
            }
        }
        else if (attrId === TEXT_ATTR_ID.fontName) {
            if (op.type === OpType.ArrayAttr) {
                api.textModifyFontName(shape, op.start, op.length, value)
            }
        }
        else if (attrId === TEXT_ATTR_ID.fontSize) {
            if (op.type === OpType.ArrayAttr) {
                const fontSize = value && JSON.parse(value);
                api.textModifyFontSize(shape, op.start, op.length, fontSize)
            }
        }
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
        throw new Error("not implemented")
        // const page = this.__document.pagesMgr.getSync(cmd.blockId);
        // const op = cmd.ops[0]
        // const shapeId = op.targetId[0]
        // const shape = page && page.getShape(shapeId, true);
        // if (!page || !shape || !(shape instanceof TextShape)) return;
        // todo
    }
}