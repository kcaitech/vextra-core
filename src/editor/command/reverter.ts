import { uuid } from "../../basic/uuid";
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
    TextCmdRemove,
    TextCmdInsert,
    TextCmdModify,
    ShapeCmdRemove,
    ShapeCmdInsert,
    ShapeCmdModify,
    ShapeCmdMove,
    OpType,
    ArrayOpRemove,
    ArrayOpInsert,
    IdOpSet,
    ShapeOpInsert,
    ShapeOpRemove,
    ShapeOpMove,
    CmdGroup,
    TableCmdInsert,
    TableCmdRemove,
    TableOpRemove,
    TableOpInsert,
    TableCmdModify,
    TableOpModify,
    NoneOp
} from "../../coop/data/classes";
import { Document } from "../../data/document";



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
            case CmdType.TextDelete:
                return this.textDelete(cmd as TextCmdRemove);
            case CmdType.TextInsert:
                return this.textInsert(cmd as TextCmdInsert);
            case CmdType.TextModify:
                return this.textModify(cmd as TextCmdModify);
            case CmdType.ShapeDelete:
                return this.shapeDelete(cmd as ShapeCmdRemove);
            case CmdType.ShapeInsert:
                return this.shapeInsert(cmd as ShapeCmdInsert);
            case CmdType.ShapeModify:
                return this.shapeModify(cmd as ShapeCmdModify);
            case CmdType.ShapeMove:
                return this.shapeMove(cmd as ShapeCmdMove);
            case CmdType.Group:
                return this.cmdGroup(cmd as CmdGroup);
            case CmdType.TableDelete:
                return this.tableRemove(cmd as TableCmdRemove);
            case CmdType.TableInsert:
                return this.tableInsert(cmd as TableCmdInsert);
            case CmdType.TableModify:
                return this.tableModify(cmd as TableCmdModify);
            default:
                throw new Error("unknow cmd type:" + cmd.type)
        }
    }

    pageInsert(cmd: PageCmdInsert): PageCmdDelete {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeInsert) {
            const _op = cmdop as ShapeOpInsert;
            op = ShapeOpRemove.Make(cmdop.targetId[0] as string, _op.shapeId, _op.index)
        } else {
            op = NoneOp.Make(cmdop.targetId)
        }
        // todo data要重新获取
        return new PageCmdDelete(CmdType.PageDelete, uuid(), cmd.blockId, [op], cmd.pageId, cmd.data);
    }
    pageDelete(cmd: PageCmdDelete): PageCmdInsert {
        const cmdop = cmd.ops[0];
        let pageId = cmd.pageId;
        let op;
        if (cmdop.type === OpType.ShapeRemove) {
            const _op = cmdop as ShapeOpRemove;
            op = ShapeOpInsert.Make(cmdop.targetId[0] as string, _op.shapeId, _op.index);
            pageId = _op.shapeId;
        } else {
            op = NoneOp.Make(cmdop.targetId);
        }
        return new PageCmdInsert(CmdType.PageInsert, uuid(), cmd.blockId, [op], pageId, cmd.data);
    }
    pageModify(cmd: PageCmdModify): PageCmdModify {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.IdSet) {
            const _op = cmdop as IdOpSet;
            op = IdOpSet.Make(cmdop.targetId, _op.opId)
        }
        else {
            op = NoneOp.Make(cmdop.targetId)
        }
        const ret = new PageCmdModify(CmdType.PageModify, uuid(), cmd.blockId, [op], cmd.attrId)
        ret.value = cmd.origin;
        ret.origin = cmd.value;
        return ret;
    }
    pageMove(cmd: PageCmdMove): PageCmdMove {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeMove) {
            const _op = cmdop as ShapeOpMove;
            op = ShapeOpMove.Make(_op.targetId2[0] as string, _op.shapeId, _op.index2, cmdop.targetId[0] as string, _op.index)
        }
        else {
            op = NoneOp.Make(cmdop.targetId)
        }
        return new PageCmdMove(CmdType.PageMove, uuid(), cmd.blockId, [op]);
    }

    shapeArrAttrInsert(cmd: ShapeArrayAttrInsert): ShapeArrayAttrRemove {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ArrayInsert) {
            const _op = cmdop as ArrayOpInsert;
            op = ArrayOpRemove.Make(cmdop.targetId, _op.start, _op.length)
        } else {
            op = NoneOp.Make(cmdop.targetId)
        }
        // todo data要重新获取
        const revert = new ShapeArrayAttrRemove(CmdType.ShapeArrayAttrDelete, uuid(), cmd.blockId, [op], cmd.arrayAttrId);
        revert.origin = cmd.data;
        return revert;
    }

    shapeArrAttrModify(cmd: ShapeArrayAttrModify): ShapeArrayAttrModify {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.IdSet) {
            const _op = cmdop as IdOpSet;
            op = IdOpSet.Make(cmdop.targetId, _op.opId);
        }
        else {
            op = NoneOp.Make(cmdop.targetId)
        }
        const ret = new ShapeArrayAttrModify(CmdType.ShapeArrayAttrModify, uuid(), cmd.blockId, [op], cmd.attrId)
        ret.value = cmd.origin;
        ret.origin = cmd.value;
        return ret;
    }
    shapeArrAttrMove(cmd: ShapeArrayAttrMove): ShapeArrayAttrMove {
        const cmdop0 = cmd.ops[0];
        const cmdop1 = cmd.ops[1];
        let op0, op1;
        if (cmdop0.type === OpType.ArrayRemove && cmdop1.type === OpType.ArrayInsert) {
            const cmdop0 = cmd.ops[0] as ArrayOpRemove;
            const cmdop1 = cmd.ops[1] as ArrayOpInsert;
            op0 = ArrayOpRemove.Make(cmdop1.targetId, cmdop1.start, cmdop1.length)
            op1 = ArrayOpInsert.Make(cmdop0.targetId, cmdop0.start, cmdop0.length)
        }
        else {
            op0 = NoneOp.Make(cmdop1.targetId)
            op1 = NoneOp.Make(cmdop0.targetId)
        }
        return new ShapeArrayAttrMove(CmdType.ShapeArrayAttrMove, uuid(), cmd.blockId, [op0, op1]);
    }
    shapeArrAttrDelete(cmd: ShapeArrayAttrRemove): ShapeArrayAttrInsert {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ArrayRemove) {
            const _op = cmdop as ArrayOpRemove;
            op = ArrayOpInsert.Make(cmdop.targetId, _op.start, _op.length)
        } else {
            op = NoneOp.Make(cmdop.targetId);
        }

        if (!cmd.origin) throw new Error("cmd origin not exist")

        const arrayAttrId = cmd.arrayAttrId;

        return new ShapeArrayAttrInsert(CmdType.ShapeArrayAttrInsert, uuid(), cmd.blockId, [op], arrayAttrId, cmd.origin);
    }

    shapeDelete(cmd: ShapeCmdRemove): ShapeCmdInsert {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeRemove) {
            const _op = cmdop as ShapeOpRemove;
            op = ShapeOpInsert.Make(cmdop.targetId[0] as string, _op.shapeId, _op.index);
        } else {
            op = NoneOp.Make(cmdop.targetId);
        }
        return new ShapeCmdInsert(CmdType.ShapeInsert, uuid(), cmd.blockId, [op], cmd.data);
    }
    shapeInsert(cmd: ShapeCmdInsert): ShapeCmdRemove {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeInsert) {
            const _op = cmdop as ShapeOpInsert;
            op = ShapeOpRemove.Make(cmdop.targetId[0] as string, _op.shapeId, _op.index)
        } else {
            op = NoneOp.Make(cmdop.targetId)
        }
        // todo data要重新获取
        return new ShapeCmdRemove(CmdType.ShapeDelete, uuid(), cmd.blockId, [op], cmd.data);
    }
    shapeModify(cmd: ShapeCmdModify): ShapeCmdModify {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.IdSet) {
            const _op = cmdop as IdOpSet;
            op = IdOpSet.Make(cmdop.targetId, _op.opId);
        }
        else {
            op = NoneOp.Make(cmdop.targetId)
        }
        const ret = new ShapeCmdModify(CmdType.ShapeModify, uuid(), cmd.blockId, [op], cmd.attrId)
        ret.value = cmd.origin;
        ret.origin = cmd.value;
        return ret;
    }
    shapeMove(cmd: ShapeCmdMove): ShapeCmdMove {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeMove) {
            const _op = cmdop as ShapeOpMove;
            op = ShapeOpMove.Make(_op.targetId2[0] as string, _op.shapeId, _op.index2, _op.targetId[0] as string, _op.index)
        }
        else {
            op = NoneOp.Make(cmdop.targetId)
        }
        return new ShapeCmdMove(CmdType.ShapeMove, uuid(), cmd.blockId, [op]);
    }

    textDelete(cmd: TextCmdRemove): TextCmdInsert {
        const op = cmd.ops[0];
        if (op.type !== OpType.ArrayRemove) {
            return new TextCmdInsert(CmdType.TextInsert, uuid(), cmd.blockId, [op], cmd.origin!);
        }
        else {
            const origin = cmd.parseOrigin();
            if (!origin) {
                throw new Error("text remove cmd has not origin")
            }
            const _op = op as ArrayOpRemove;
            const opinsert = ArrayOpInsert.Make(_op.targetId, _op.start, origin.length)
            return new TextCmdInsert(CmdType.TextInsert, uuid(), cmd.blockId, [opinsert], JSON.stringify(origin))
        }
    }
    textInsert(cmd: TextCmdInsert): TextCmdRemove {
        const op = cmd.ops[0];
        if (op.type === OpType.ArrayInsert) {
            const _op = op as ArrayOpInsert;
            const removeOp = ArrayOpRemove.Make(op.targetId, _op.start, _op.length);
            const ret = new TextCmdRemove(CmdType.TextDelete, uuid(), cmd.blockId, [removeOp]);
            ret.origin = cmd.text;
            return ret;
        }
        else {
            const ret = new TextCmdRemove(CmdType.TextDelete, uuid(), cmd.blockId, [op]);
            ret.origin = cmd.text;
            return ret;
        }
    }
    textModify(cmd: TextCmdModify): TextCmdModify {
        const ret = new TextCmdModify(CmdType.TextModify, uuid(), cmd.blockId, cmd.ops, cmd.attrId)
        ret.value = cmd.origin;
        ret.origin = cmd.value;
        return ret;
    }
    tableInsert(cmd: TableCmdInsert): TableCmdRemove {
        const op = cmd.ops[0];
        if (op.type === OpType.TableInsert) {
            // todo data要重新获取
            const _op = op as TableOpInsert;
            const removeOp = TableOpRemove.Make(op.targetId[0] as string, _op.index, _op.opTarget, _op.data);
            const ret = new TableCmdRemove(CmdType.TableDelete, uuid(), cmd.blockId, [removeOp], cmd.data);
            return ret;
        }
        else {
            const ret = new TableCmdRemove(CmdType.TableDelete, uuid(), cmd.blockId, [op], cmd.data);
            return ret;
        }
    }
    tableModify(cmd: TableCmdModify): TableCmdModify {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.TableModify) {
            const _op = cmdop as TableOpModify;
            op = TableOpModify.Make(cmdop.targetId[0] as string, _op.index, _op.opTarget, _op.opId);
        }
        else {
            op = NoneOp.Make(cmdop.targetId);
        }
        const ret = new TableCmdModify(CmdType.TableModify, uuid(), cmd.blockId, [op], cmd.attrId)
        ret.value = cmd.origin;
        ret.origin = cmd.value;
        return ret;
    }
    tableRemove(cmd: TableCmdRemove): TableCmdInsert {
        const op = cmd.ops[0];
        if (op.type === OpType.TableRemove) {
            const _op = op as TableOpRemove;
            const removeOp = TableOpInsert.Make(op.targetId[0] as string, _op.index, _op.opTarget, _op.data);
            const ret = new TableCmdInsert(CmdType.TableInsert, uuid(), cmd.blockId, [removeOp], cmd.data);
            return ret;
        }
        else {
            const ret = new TableCmdInsert(CmdType.TableInsert, uuid(), cmd.blockId, [op], cmd.data);
            return ret;
        }
    }

    cmdGroup(cmd: CmdGroup): CmdGroup {
        const ret = CmdGroup.Make(cmd.blockId);
        const revert = ret.cmds;
        cmd.cmds.slice(0).reverse().forEach((cmd) => {
            const r = this.revert(cmd);
            if (r) revert.push(r as any)
        });
        return ret;
    }
}