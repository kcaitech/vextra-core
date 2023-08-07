import { arrayEquals } from "../../coop/data/basic";
import { Cmd, CmdType, IdOpNone, IdOpSet, OpType, PageCmdModify, ShapeArrayAttrModify, ShapeCmdModify } from "../../coop/data/classes";

enum MERGE_STATE {
    CONTINUE = 0,
    BREAK = 1,
    MERGED = 2,
}

function _merge(l: Cmd, r: Cmd): MERGE_STATE {
    if (l.type !== r.type) return MERGE_STATE.CONTINUE;
    switch (l.type) {
        case CmdType.PageInsert:
            return MERGE_STATE.BREAK;
        case CmdType.PageDelete:
            return MERGE_STATE.BREAK;
        case CmdType.PageModify:
            {
                const lcmd = l as PageCmdModify;
                const rcmd = r as PageCmdModify;
                const lop = lcmd.ops[0] as (IdOpSet | IdOpNone);
                const rop = rcmd.ops[0] as (IdOpSet | IdOpNone);
                if (!arrayEquals(lop.targetId, rop.targetId) || lop.opId !== rop.opId) {
                    return MERGE_STATE.CONTINUE;
                }
                if (lop.type === OpType.None || rop.type === OpType.None) throw new Error("") // merge用在用户执行操作时，这时不应该有None
                // 用后一个op覆盖前一个op
                if (lop.type !== rop.type) {
                    lcmd.ops[0] = rop;
                }
                lcmd.value = rcmd.value;
                return MERGE_STATE.MERGED;
            }
        case CmdType.PageMove:
            return MERGE_STATE.BREAK;;
        case CmdType.ShapeArrayAttrInsert:
            return MERGE_STATE.BREAK;;
        case CmdType.ShapeArrayAttrModify:
            {
                const lcmd = l as ShapeArrayAttrModify;
                const rcmd = r as ShapeArrayAttrModify;
                const lop = lcmd.ops[0] as (IdOpSet | IdOpNone);
                const rop = rcmd.ops[0] as (IdOpSet | IdOpNone);
                if (!arrayEquals(lop.targetId, rop.targetId) || lop.opId !== rop.opId) {
                    return MERGE_STATE.CONTINUE;
                }
                if (lop.type === OpType.None || rop.type === OpType.None) throw new Error("") // merge用在用户执行操作时，这时不应该有None
                // 用后一个op覆盖前一个op
                if (lop.type !== rop.type) {
                    lcmd.ops[0] = rop;
                }
                lcmd.value = rcmd.value;
                return MERGE_STATE.MERGED;
            }
        case CmdType.ShapeArrayAttrModify2:
            return MERGE_STATE.BREAK;
        case CmdType.ShapeArrayAttrMove:
            return MERGE_STATE.BREAK;;
        case CmdType.ShapeArrayAttrDelete:
            return MERGE_STATE.BREAK;;

        case CmdType.TextDelete:
            return MERGE_STATE.BREAK; // todo
        case CmdType.TextInsert:
            return MERGE_STATE.BREAK; // todo
        case CmdType.TextModify:
            return MERGE_STATE.BREAK; // todo
        case CmdType.TextMove:
            return MERGE_STATE.BREAK;
        case CmdType.ShapeDelete:
            return MERGE_STATE.BREAK;
        case CmdType.ShapeInsert:
            return MERGE_STATE.BREAK;
        case CmdType.ShapeModify:
            {
                const lcmd = l as ShapeCmdModify;
                const rcmd = r as ShapeCmdModify;
                const lop = lcmd.ops[0] as (IdOpSet | IdOpNone);
                const rop = rcmd.ops[0] as (IdOpSet | IdOpNone);
                if (!arrayEquals(lop.targetId, rop.targetId) || lop.opId !== rop.opId) {
                    return MERGE_STATE.CONTINUE;
                }
                if (lop.type === OpType.None || rop.type === OpType.None) throw new Error("") // merge用在用户执行操作时，这时不应该有None
                // 用后一个op覆盖前一个op
                if (lop.type !== rop.type) {
                    lcmd.ops[0] = rop;
                }
                lcmd.value = rcmd.value;
                return MERGE_STATE.MERGED;
            }
        case CmdType.ShapeMove:
            return MERGE_STATE.BREAK;
        default:
            throw new Error("unknow cmd type:" + l.type)
    }
}

// 合并两个cmd
export function cmdmerge(cmds: Cmd[], cmd: Cmd): boolean {
    for (let i = 0, len = cmds.length; i < len; i++) {
        const state = _merge(cmds[i], cmd);
        if (state === MERGE_STATE.MERGED) return true;
        if (state === MERGE_STATE.BREAK) return false;
    }
    return false;
}