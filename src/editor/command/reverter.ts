import { uuid } from "../../basic/uuid";
import {
    Cmd,
    CmdType,
    PageCmdInsert,
    PageCmdDelete,
    PageCmdModify,
    PageCmdMove,
    ShapeArrayAttrGroup,
    ShapeArrayAttrInsert,
    ShapeArrayAttrModify,
    ShapeArrayAttrMove,
    ShapeArrayAttrRemove,
    ShapeCmdGroup,
    TextCmdRemove,
    TextCmdInsert,
    TextCmdModify,
    TextCmdMove,
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
    IdOpRemove,
    ShapeOpInsert,
    ShapeOpNone,
    ShapeOpRemove,
    ShapeOpMove,
    TextCmdGroup
} from "../../coop/data/classes";
import { Document } from "../../data/document"
import { exportPage } from "../../io/baseexport";
import { exportShape } from "./utils";
import { Span } from "../../data/text";
import { importSpan } from "../../io/baseimport";

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
            case CmdType.ShapeArrayAttrGroup:
                return this.shapeArrAttrCMDGroup(cmd as ShapeArrayAttrGroup);
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
            case CmdType.TextMove:
                return this.textMove(cmd as TextCmdMove);
            case CmdType.TextCmdGroup:
                return this.textCmdGroup(cmd as TextCmdGroup);
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

    pageInsert(cmd: PageCmdInsert): PageCmdDelete {
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
    pageDelete(cmd: PageCmdDelete): PageCmdInsert {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ArrayRemove) {
            op = ArrayOpInsert.Make(cmdop.targetId, cmdop.start, 1)
        } else {
            op = ArrayOpNone.Make(cmdop.targetId, cmdop.start, 1)
        }
        const page = this.__document.pagesMgr.getSync(cmd.pageId);
        if (!page) throw new Error("page not found: " + cmd.pageId);

        const data = JSON.stringify(exportPage(page))
        return new PageCmdInsert(CmdType.PageInsert, uuid(), cmd.blockId, [op], page.id, data);
    }
    pageModify(cmd: PageCmdModify): PageCmdModify {
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
    pageMove(cmd: PageCmdMove): PageCmdMove {
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
        return new PageCmdMove(CmdType.PageMove, uuid(), cmd.blockId, [op0, op1]);
    }

    shapeArrAttrCMDGroup(cmd: ShapeArrayAttrGroup): ShapeArrayAttrGroup {
        const ret = ShapeArrayAttrGroup.Make(cmd.blockId);
        cmd.cmds.reverse().forEach((cmd) => {
            const r = this.revert(cmd);
            if (r) ret.cmds.push(r as any)
        })
        return ret;
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
        if (cmdop.type === OpType.IdSet || cmdop.type === OpType.IdRemove) {
            op = cmd.origin ? IdOpSet.Make(cmdop.targetId, cmdop.opId) : IdOpRemove.Make(cmdop.targetId, cmdop.opId);
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
    shapeCMDGroup(cmd: ShapeCmdGroup): ShapeCmdGroup {
        const ret = ShapeCmdGroup.Make(cmd.blockId);
        cmd.cmds.reverse().forEach((cmd) => {
            const r = this.revert(cmd);
            if (r) ret.cmds.push(r as any)
        })
        return ret;
    }
    shapeDelete(cmd: ShapeCmdRemove): ShapeCmdInsert {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeRemove) {
            op = ShapeOpInsert.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        } else {
            op = ShapeOpNone.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        }
        const page = this.__document.pagesMgr.getSync(cmd.blockId);
        const shape = page && page.getShape(cmdop.shapeId, true);
        if (!shape) throw new Error("page not found: " + cmd.blockId);

        const data = JSON.stringify(exportShape(shape))
        return new ShapeCmdInsert(CmdType.ShapeInsert, uuid(), cmd.blockId, [op], data);
    }
    shapeInsert(cmd: ShapeCmdInsert): ShapeCmdRemove {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.ShapeInsert) {
            op = ShapeOpRemove.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        } else {
            op = ShapeOpNone.Make(cmdop.targetId[0], cmdop.shapeId, cmdop.index)
        }
        return new ShapeCmdRemove(CmdType.ShapeDelete, uuid(), cmd.blockId, [op]);
    }
    shapeModify(cmd: ShapeCmdModify): ShapeCmdModify {
        const cmdop = cmd.ops[0];
        let op;
        if (cmdop.type === OpType.IdSet || cmdop.type === OpType.IdRemove) {
            op = cmd.origin ? IdOpSet.Make(cmdop.targetId, cmdop.opId) : IdOpRemove.Make(cmdop.targetId, cmdop.opId)
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

    textDelete(cmd: TextCmdRemove): TextCmdInsert | TextCmdGroup {
        const op = cmd.ops[0];
        const origin = JSON.parse(cmd.origin!) as { text: string, spans: Span[] };
        origin.spans = origin.spans.map((span) => importSpan(span))
        if (op.type !== OpType.ArrayRemove) {
            return new TextCmdInsert(CmdType.TextInsert, uuid(), cmd.blockId, [op], origin.text);
        }

        const shapeId = op.targetId[0];
        if (origin.spans.length <= 1) {
            return TextCmdInsert.Make(cmd.blockId, shapeId, op.start, origin.text); // todo attr
        }

        const cmdgroup = TextCmdGroup.Make(cmd.blockId);
        for (let i = 0, j = 0; i < origin.text.length;) {
            if (j >= origin.spans.length) {
                const text = origin.text.slice(i);
                const span = origin.spans.at(-1); // todo attr
                cmdgroup.addInsert(shapeId, op.start + i, text)
                break;
            }
            else {
                const span = origin.spans[j]; // todo attr
                const text = origin.text.slice(i, i + span.length);
                cmdgroup.addInsert(shapeId, op.start + i, text)
                i += span.length;
                j++;
            }
        }
        return cmdgroup;
    }
    textInsert(cmd: TextCmdInsert): TextCmdRemove {
        const op = cmd.ops[0];
        if (op.type === OpType.ArrayInsert) {
            const removeOp = ArrayOpRemove.Make(op.targetId, op.start, cmd.text.length);
            const ret = new TextCmdRemove(CmdType.TextDelete, uuid(), cmd.blockId, [removeOp]);
            ret.origin = JSON.stringify({ text: cmd.text, spans: [] });
            return ret;
        }
        else {
            const ret = new TextCmdRemove(CmdType.TextDelete, uuid(), cmd.blockId, [op]);
            ret.origin = JSON.stringify({ text: cmd.text, spans: [] });
            return ret;
        }
    }
    textModify(cmd: TextCmdModify): TextCmdModify {
        const ret = new TextCmdModify(CmdType.TextModify, uuid(), cmd.blockId, cmd.ops, cmd.attrId)
        ret.value = cmd.origin;
        ret.origin = cmd.value;
        return ret;
    }
    textMove(cmd: TextCmdMove): TextCmdMove {
        const op0 = cmd.ops[0] as ArrayOpRemove;
        const op1 = cmd.ops[1] as ArrayOpInsert;
        if (op0.type === OpType.ArrayRemove && op1.type === OpType.ArrayInsert) {
            return TextCmdMove.Make(cmd.blockId, op0.targetId[0], op1.start, op0.length, op0.start);
        }
        else {
            return new TextCmdMove(CmdType.TextMove, uuid(), cmd.blockId, [op0, op1]);
        }
    }
    textCmdGroup(cmd: TextCmdGroup): TextCmdGroup {
        const ret = TextCmdGroup.Make(cmd.blockId);
        const revert = ret.cmds;
        cmd.cmds.forEach((cmd) => {
            switch (cmd.type) {
                case CmdType.TextInsert:
                    revert.push(this.textInsert(cmd as TextCmdInsert));
                    break;
                case CmdType.TextDelete: {
                    const ret = this.textDelete(cmd as TextCmdRemove);
                    if (ret instanceof TextCmdGroup) {
                        revert.push(...ret.cmds);
                    }
                    else {
                        revert.push(ret);
                    }
                }
                case CmdType.TextModify:
                    revert.push(this.textModify(cmd as TextCmdModify));
                case CmdType.TextMove:
                    revert.push(this.textMove(cmd as TextCmdMove));
                default:
                    throw new Error("unknow cmd type: " + cmd.type)
            }
        });
        return ret;
    }
}