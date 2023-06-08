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
    ArrayOpMove,
    IdOpNone,
    IdOpSet,
    IdOpRemove,
    ShapeOpInsert,
    ShapeOpNone,
    ShapeOpRemove,
    ShapeOpMove
} from "../coop/data/classes";
import { Document } from "../data/document"
import { exportPage } from "../io/baseexport";
import { exportShape } from "./utils";

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
        // const index = this.__document.pagesList.findIndex((item) => item.id === cmd.pageId) // 不可以，cmd是需要变换的
        let op;
        if (cmdop.type === OpType.ArrayInsert) {
            op = ArrayOpRemove.Make(cmdop.targetId, cmdop.start, cmdop.length)
        } else {
            op = ArrayOpNone.Make(cmdop.targetId, cmdop.start, cmdop.length)
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
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.IdSet) {
            op = IdOpRemove.Make(cmdop.targetId, cmdop.opId)
        }
        else if (cmdop.type === OpType.IdRemove) {
            op = IdOpSet.Make(cmdop.targetId, cmdop.opId)
        }
        else {
            op = IdOpNone.Make(cmdop.targetId, cmdop.opId)
        }
        const ret = new PageCmdModify(CmdType.PageModify, uuid(), cmd.blockId, [op], cmd.attrId)
        ret.value = cmd.origin;
        ret.origin = cmd.value;
        return ret;
    }
    pageMove(cmd: PageCmdMove) {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ArrayMove) {
            op = ArrayOpMove.Make(cmdop.targetId, (cmdop as ArrayOpMove).start2, cmdop.length, cmdop.start)
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
        const ret = ShapeCmdGroup.Make(cmd.blockId);
        cmd.cmds.reverse().forEach((cmd) => {
            const r = this.revert(cmd);
            if (r) ret.cmds.push(r as any)
        })
        return ret;
    }
    shapeDelete(cmd: ShapeCmdRemove) {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeRemove) {
            op = ShapeOpInsert.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        } else {
            op = ShapeOpNone.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        }
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const shape = page && page.getShape(cmdop.shapeId, true);
        if (!shape) return;

        const data = JSON.stringify(exportShape(shape))
        return new ShapeCmdInsert(CmdType.ShapeInsert, uuid(), cmd.blockId, [op], data);
    }
    shapeInsert(cmd: ShapeCmdInsert) {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeInsert) {
            op = ShapeOpRemove.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        } else {
            op = ShapeOpNone.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        }
        return new ShapeCmdRemove(CmdType.ShapeDelete, uuid(), cmd.blockId, [op]);
    }
    shapeModify(cmd: ShapeCmdModify) {
        //
    }
    shapeMove(cmd: ShapeCmdMove) {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeMove) {
            const _op = cmdop as ShapeOpMove;
            op = ShapeOpMove.Make(_op.targetId2[0], _op.shapeId, _op.index2, _op.targetId[0], _op.index)
        }
        else {
            const _op = cmdop as ShapeOpNone;
            op = ShapeOpNone.Make(_op.targetId[0], _op.shapeId, _op.index)
        }
        return new ShapeCmdMove(CmdType.ShapeMove, uuid(), cmd.blockId, [op]);
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