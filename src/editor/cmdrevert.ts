import { uuid } from "../basic/uuid";
import {
    Cmd,
    CmdType,
    PageCmdInsert,
    PageCmdDelete,
    PageCmdModify,
    PageCmdMove,
    ShapeArrayAttrInsert,
    ShapeArrayAttrModify,
    ShapeArrayAttrMove,
    ShapeArrayAttrRemove,
    ShapeCmdGroup,
    TextCmdRemove,
    TextCmdInsert,
    TextCmdModify,
    TextCmdBatchModify,
    TextCmdMove,
    ShapeCmdRemove,
    ShapeCmdInsert,
    ShapeCmdModify,
    ShapeCmdMove,
    OpType,
    ArrayOpRemove,
    ArrayOpNone,
    ArrayOpInsert,
    ArrayOpMove
} from "coop/data/classes";
import { Document } from "../data/document"
import { exportPage } from "io/baseexport";

export class CMDReverter {
    private __document: Document;
    constructor(document: Document) {
        this.__document = document;
    }

    revert(cmd: Cmd) {
        switch (cmd.type) {
            case CmdType.PageInsert:
                return this.pageInsert(cmd as PageCmdInsert);
            case CmdType.PageDelete:
                return this.pageDelete(cmd as PageCmdDelete);
            case CmdType.PageModify:
                return this.pageModify(cmd as PageCmdModify);
            case CmdType.PageMove:
                return this.pageMove(cmd as PageCmdMove);
            case CmdType.ShapeArrayAttrInsert:
                return this.shapeArrAttrInsert(cmd as ShapeArrayAttrInsert);
            case CmdType.ShapeArrayAttrModify:
                return this.shapeArrAttrModify(cmd as ShapeArrayAttrModify);
            case CmdType.ShapeArrayAttrMove:
                return this.shapeArrAttrMove(cmd as ShapeArrayAttrMove);
            case CmdType.ShapeArrayAttrDelete:
                return this.shapeArrAttrDelete(cmd as ShapeArrayAttrRemove);
            case CmdType.ShapeCmdGroup:
                return this.shapeCMDGroup(cmd as ShapeCmdGroup);
            case CmdType.TextDelete:
                return this.textDelete(cmd as TextCmdRemove);
            case CmdType.TextInsert:
                return this.textInsert(cmd as TextCmdInsert);
            case CmdType.TextModify:
                return this.textModify(cmd as TextCmdModify);
            case CmdType.TextBatchModify:
                return this.textBatchModify(cmd as TextCmdBatchModify);
            case CmdType.TextMove:
                return this.textMove(cmd as TextCmdMove);
            case CmdType.ShapeDelete:
                return this.shapeDelete(cmd as ShapeCmdRemove);
            case CmdType.ShapeInsert:
                return this.shapeInsert(cmd as ShapeCmdInsert);
            case CmdType.ShapeModify:
                return this.shapeModify(cmd as ShapeCmdModify);
            case CmdType.ShapeMove:
                return this.shapeMove(cmd as ShapeCmdMove);
            default:
                throw new Error("unknow cmd type:" + cmd.type)
        }
    }

    pageInsert(cmd: PageCmdInsert) {
        const cmdop = cmd.ops[0];
        const index = this.__document.pagesList.findIndex((item) => item.id === cmd.pageId)
        let op;
        if (cmdop.type === OpType.ArrayInsert && index >= 0) {
            op = ArrayOpRemove.Make(cmdop.targetId, index, 1)
        } else {
            op = ArrayOpNone.Make(cmdop.targetId, index, 1)
        }
        return new PageCmdDelete(CmdType.PageDelete, uuid(), cmd.blockId, [op], cmd.pageId);
    }
    pageDelete(cmd: PageCmdDelete) {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ArrayRemove) {
            op = ArrayOpInsert.Make(cmdop.targetId, cmdop.start, 1)
        } else {
            op = ArrayOpNone.Make(cmdop.targetId, cmdop.start, 1)
        }
        const page = this.__document.pagesMgr.getSync(cmd.pageId);
        if (!page) return;

        const data = JSON.stringify(exportPage(page))
        return new PageCmdInsert(CmdType.PageInsert, uuid(), cmd.blockId, [op], page.id, data);
    }
    pageModify(cmd: PageCmdModify) {

    }
    pageMove(cmd: PageCmdMove) {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ArrayMove) {
            op = ArrayOpMove.Make(cmdop.targetId, cmdop.start, cmdop.length, (cmdop as ArrayOpMove).start2)
        }
        else {
            op = ArrayOpNone.Make(cmdop.targetId, cmdop.start, cmdop.length)
        }
        return new PageCmdMove(CmdType.PageMove, uuid(), cmd.blockId, [op]);
    }

    shapeArrAttrInsert(cmd: ShapeArrayAttrInsert) {
    }
    shapeArrAttrModify(cmd: ShapeArrayAttrModify) {
    }
    shapeArrAttrMove(cmd: ShapeArrayAttrMove) {
    }
    shapeArrAttrDelete(cmd: ShapeArrayAttrRemove) {
    }

    shapeCMDGroup(cmd: ShapeCmdGroup) {
    }
    shapeDelete(cmd: ShapeCmdRemove) {
    }
    shapeInsert(cmd: ShapeCmdInsert) {
    }
    shapeModify(cmd: ShapeCmdModify) {
    }
    shapeMove(cmd: ShapeCmdMove) {
    }

    textDelete(cmd: TextCmdRemove) {
    }
    textInsert(cmd: TextCmdInsert) {
    }
    textModify(cmd: TextCmdModify) {
    }
    textBatchModify(cmd: TextCmdBatchModify) {
    }
    textMove(cmd: TextCmdMove) {

    }
}