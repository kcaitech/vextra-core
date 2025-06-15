/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Op, OpType } from "../operator";
import { Cmd } from "./types";
import { ArrayMoveOp, IdOp, TreeMoveOp } from "../operator";
import { TextInsertProps, TextOpAttr, TextOpInsert, TextOpRemove } from "../operator";
import { ArrayOp, ArrayOpNone, ArrayOpType } from "../operator";
import { importText } from "../data/baseimport";

// ArrayMoveOp
function exportArrayMoveOp(op: ArrayMoveOp): ArrayMoveOp {
    // copy
    return {
        type: op.type,
        path: op.path,
        data: op.data,
        to: op.to,
        id: op.id
    }
}

// TreeMoveOp
function exportTreeMoveOp(op: TreeMoveOp): TreeMoveOp {
    // copy
    return {
        type: op.type,
        path: op.path,
        data: op.data,
        to: op.to,
        id: op.id
    }
}

// IdOp
function exportIdOp(op: IdOp): IdOp {
    // copy
    return {
        type: op.type,
        path: op.path,
        data: op.data,
        id: op.id
    }
}

function exportTextOpNone(op: ArrayOp): ArrayOp { // 不需要同步order
    return new ArrayOp(op.id, op.path, 0, op.start, op.length, op.type1);
}

function exportTextInsertProps(text: TextInsertProps): TextInsertProps {
    if (text.type === 'complex') {
        return {
            type: 'complex',
            text: importText(text.text) // 需要导出一遍，否则override的text使用json导出不对
        }
    }
    return text
}

// TextOpInsert
function exportTextOpInsert(op: TextOpInsert): TextOpInsert {
    return new TextOpInsert(op.id, op.path, 0, op.start, op.length, exportTextInsertProps(op.text));
}

// TextOpRemove
function exportTextOpRemove(op: TextOpRemove): TextOpRemove {
    return new TextOpRemove(op.id, op.path, 0, op.start, op.length);
}

// TextOpAttr
function exportTextOpAttr(op: TextOpAttr): TextOpAttr {
    return new TextOpAttr(op.id, op.path, 0, op.start, op.length, op.props);
}

// Cmd
function exportCmd(cmd: Cmd): Cmd {
    const copy: Cmd = {
        id: cmd.id,
        ops: [],
        version: cmd.version,
        // preVersion: cmd.preVersion,
        baseVer: cmd.baseVer,
        batchId: cmd.batchId,
        isRecovery: cmd.isRecovery,
        description: cmd.description,
        time: cmd.time,
        posttime: cmd.posttime,
        dataFmtVer: cmd.dataFmtVer,
    }
    copy.ops = cmd.ops.reduce((result, op) => {
        switch (op.type) {
            case OpType.Array:
                const arrOp = op as ArrayOp;
                switch (arrOp.type1) {
                    case ArrayOpType.Attr:
                        result.push(exportTextOpAttr(op as TextOpAttr));
                        break;
                    case ArrayOpType.Insert:
                        result.push(exportTextOpInsert(op as TextOpInsert));
                        break;
                    case ArrayOpType.Remove:
                        result.push(exportTextOpRemove(op as TextOpRemove));
                        break;
                    case ArrayOpType.None:
                        // throw new Error(JSON.stringify(op, (k, v) => k.startsWith('__') ? undefined : v));
                        result.push(exportTextOpNone(op as ArrayOp)); // 需要同步，回来后前端需要对齐
                        break;
                    case ArrayOpType.Selection:
                        break; // 选区op不同步
                }
                break;
            case OpType.CrdtArr:
                result.push(exportArrayMoveOp(op as ArrayMoveOp));
                break;
            case OpType.CrdtTree:
                result.push(exportTreeMoveOp(op as TreeMoveOp));
                break;
            case OpType.Idset:
                result.push(exportIdOp(op as IdOp));
                break;
            case OpType.None:
                throw new Error(JSON.stringify(op, (k, v) => k.startsWith('__') ? undefined : v));
        }
        return result;
    }, [] as Op[]);
    return copy;
}

export function serialCmds(cmds: Cmd[]): string {
    return JSON.stringify(cmds.map(cmd => exportCmd(cmd)), (k, v) => k.startsWith('__') ? undefined : v)
}

export function parseCmds(cmds: string | object): Cmd[] {
    const _cmds = typeof cmds === 'string' ? JSON.parse(cmds) : cmds;
    if (!Array.isArray(_cmds)) throw new Error();
    const ret: Cmd[] = [];

    _cmds.forEach(cmd => {

        if (!Array.isArray(cmd.ops)) throw new Error();

        const c = {
            id: cmd.id,
            ops: [],
            version: cmd.version,
            // preVersion: cmd.preVersion,
            baseVer: cmd.baseVer,
            batchId: cmd.batchId,
            isRecovery: cmd.isRecovery,
            description: cmd.description,
            time: cmd.time,
            posttime: cmd.posttime,
            dataFmtVer: cmd.dataFmtVer?.toString() ?? '0',
        };
        ret.push(c);

        c.ops = cmd.ops.map((op: any) => {
            switch (op.type) {
                case OpType.Array:
                    const arrOp = op as ArrayOp;
                    switch (arrOp.type1) {
                        case ArrayOpType.Attr:
                            return TextOpAttr.parse(op);
                        case ArrayOpType.Insert:
                            return TextOpInsert.parse(op);
                        case ArrayOpType.Remove:
                            return TextOpRemove.parse(op);
                        case ArrayOpType.None:
                            // export时导出了，会存在None
                            return new ArrayOpNone(op.id, op.path, op.order);
                        case ArrayOpType.Selection:
                            throw new Error(op);
                    }
                    break;
                case OpType.CrdtArr:
                    return op as ArrayMoveOp;
                case OpType.CrdtTree:
                    return op as TreeMoveOp;
                case OpType.Idset:
                    return op as IdOp;
                case OpType.None:
                    throw new Error(op);
            }
        })
    })

    return ret;
}

export function cloneCmds(cmds: Cmd[]): Cmd[] {
    return parseCmds(serialCmds(cmds));
}
