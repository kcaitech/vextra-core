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
    ArrayOpNone,
    ArrayOpInsert,
    IdOpNone,
    IdOpSet,
    ShapeOpInsert,
    ShapeOpNone,
    ShapeOpRemove,
    ShapeOpMove,
    CmdGroup,
    TableCmdInsert,
    TableCmdRemove,
    TableOpRemove,
    TableOpInsert
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
            default:
                throw new Error("unknow cmd type:" + cmd.type)
        }
    }

    pageInsert(cmd: PageCmdInsert): PageCmdDelete {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeInsert) {
            op = ShapeOpRemove.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        } else {
            op = ShapeOpNone.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        }
        return new PageCmdDelete(CmdType.PageDelete, uuid(), cmd.blockId, [op], cmd.pageId, cmd.data);
    }
    pageDelete(cmd: PageCmdDelete): PageCmdInsert {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeRemove) {
            op = ShapeOpInsert.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index);
        } else {
            op = ShapeOpNone.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index);
        }
        return new PageCmdInsert(CmdType.PageInsert, uuid(), cmd.blockId, [op], cmdop.shapeId, cmd.data);
    }
    pageModify(cmd: PageCmdModify): PageCmdModify {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.IdSet) {
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
    pageMove(cmd: PageCmdMove): PageCmdMove {
        const cmdop = cmd.ops[0] as ShapeOpMove;
        let op;
        if (cmdop.type === OpType.ShapeMove) {
            op = ShapeOpRemove.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        }
        else {
            op = ShapeOpNone.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        }
        return new PageCmdMove(CmdType.PageMove, uuid(), cmd.blockId, [op]);
    }

    shapeArrAttrInsert(cmd: ShapeArrayAttrInsert): ShapeArrayAttrRemove {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ArrayInsert) {
            op = ArrayOpRemove.Make(cmdop.targetId, cmdop.start, cmdop.length)
        } else {
            op = ArrayOpNone.Make(cmdop.targetId, cmdop.start, cmdop.length)
        }
        return new ShapeArrayAttrRemove(CmdType.ShapeArrayAttrDelete, uuid(), cmd.blockId, [op], cmd.arrayAttrId);
    }
    shapeArrAttrModify(cmd: ShapeArrayAttrModify): ShapeArrayAttrModify {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.IdSet) {
            op = IdOpSet.Make(cmdop.targetId, cmdop.opId);
        }
        else {
            op = IdOpNone.Make(cmdop.targetId, cmdop.opId)
        }
        const ret = new ShapeArrayAttrModify(CmdType.ShapeArrayAttrModify, uuid(), cmd.blockId, [op], cmd.attrId)
        ret.value = cmd.origin;
        ret.origin = cmd.value;
        return ret;
    }
    shapeArrAttrMove(cmd: ShapeArrayAttrMove): ShapeArrayAttrMove {
        const cmdop0 = cmd.ops[0] as ArrayOpRemove;
        const cmdop1 = cmd.ops[1] as ArrayOpInsert;
        let op0, op1;
        if (cmdop0.type === OpType.ArrayRemove && cmdop1.type === OpType.ArrayInsert) {
            op0 = ArrayOpRemove.Make(cmdop1.targetId, cmdop1.start, cmdop1.length)
            op1 = ArrayOpInsert.Make(cmdop0.targetId, cmdop0.start, cmdop0.length)
        }
        else {
            op0 = ArrayOpNone.Make(cmdop1.targetId, cmdop1.start, cmdop1.length)
            op1 = ArrayOpNone.Make(cmdop0.targetId, cmdop0.start, cmdop0.length)
        }
        return new ShapeArrayAttrMove(CmdType.ShapeArrayAttrMove, uuid(), cmd.blockId, [op0, op1]);
    }
    shapeArrAttrDelete(cmd: ShapeArrayAttrRemove): ShapeArrayAttrInsert {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ArrayRemove) {
            op = ArrayOpInsert.Make(cmdop.targetId, cmdop.start, 1)
        } else {
            op = ArrayOpNone.Make(cmdop.targetId, cmdop.start, 1)
        }

        if (!cmd.origin) throw new Error("cmd origin not exist")

        const arrayAttrId = cmd.arrayAttrId;

        return new ShapeArrayAttrInsert(CmdType.ShapeArrayAttrInsert, uuid(), cmd.blockId, [op], arrayAttrId, cmd.origin);
    }

    shapeDelete(cmd: ShapeCmdRemove): ShapeCmdInsert {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeRemove) {
            op = ShapeOpInsert.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index);
        } else {
            op = ShapeOpNone.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index);
        }
        return new ShapeCmdInsert(CmdType.ShapeInsert, uuid(), cmd.blockId, [op], cmd.data);
    }
    shapeInsert(cmd: ShapeCmdInsert): ShapeCmdRemove {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeInsert) {
            op = ShapeOpRemove.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        } else {
            op = ShapeOpNone.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        }
        return new ShapeCmdRemove(CmdType.ShapeDelete, uuid(), cmd.blockId, [op], cmd.data);
    }
    shapeModify(cmd: ShapeCmdModify): ShapeCmdModify {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.IdSet) {
            op = IdOpSet.Make(cmdop.targetId, cmdop.opId);
        }
        else {
            op = IdOpNone.Make(cmdop.targetId, cmdop.opId)
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
            op = ShapeOpMove.Make(_op.targetId2[0], _op.shapeId, _op.index2, _op.targetId[0], _op.index)
        }
        else {
            const _op = cmdop as ShapeOpNone;
            op = ShapeOpNone.Make(_op.targetId[0], _op.shapeId, _op.index)
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
            const shapeId = op.targetId[0];
            return TextCmdInsert.Make(cmd.blockId, shapeId, op.start, origin.length, origin);
        }
    }
    textInsert(cmd: TextCmdInsert): TextCmdRemove {
        const op = cmd.ops[0];
        if (op.type === OpType.ArrayInsert) {
            const removeOp = ArrayOpRemove.Make(op.targetId, op.start, op.length);
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
            const removeOp = TableOpRemove.Make(op.targetId[0], op.index, op.data, op.target);
            const ret = new TableCmdRemove(CmdType.TableDelete, uuid(), cmd.blockId, [removeOp], cmd.data);
            return ret;
        }
        else {
            const ret = new TableCmdRemove(CmdType.TableDelete, uuid(), cmd.blockId, [op], cmd.data);
            return ret;
        }
    }
    tableRemove(cmd: TableCmdRemove): TableCmdInsert {
        const op = cmd.ops[0];
        if (op.type === OpType.TableRemove) {
            const removeOp = TableOpInsert.Make(op.targetId[0], op.index, op.data, op.target);
            const ret = new TableCmdInsert(CmdType.TableDelete, uuid(), cmd.blockId, [removeOp], cmd.data);
            return ret;
        }
        else {
            const ret = new TableCmdInsert(CmdType.TableDelete, uuid(), cmd.blockId, [op], cmd.data);
            return ret;
        }
    }

    cmdGroup(cmd: CmdGroup): CmdGroup {
        const ret = CmdGroup.Make(cmd.blockId);
        const revert = ret.cmds;
        cmd.cmds.slice(0).reverse().forEach((cmd) => {
            switch (cmd.type) {
                case CmdType.TextInsert:
                    revert.push(this.textInsert(cmd as TextCmdInsert));
                    break;
                case CmdType.TextDelete:
                    revert.push(this.textDelete(cmd as TextCmdRemove));
                    break;
                case CmdType.TextModify:
                    revert.push(this.textModify(cmd as TextCmdModify));
                    break;

                case CmdType.ShapeDelete:
                case CmdType.ShapeInsert:
                case CmdType.ShapeModify:
                case CmdType.ShapeMove:
                case CmdType.ShapeArrayAttrDelete:
                case CmdType.ShapeArrayAttrInsert:
                case CmdType.ShapeArrayAttrModify:
                case CmdType.ShapeArrayAttrMove:
                    {
                        const r = this.revert(cmd);
                        if (r) revert.push(r as any)
                        break;
                    }
                default:
                    throw new Error("unknow cmd type: " + cmd.type)
            }
        });
        return ret;
    }
}