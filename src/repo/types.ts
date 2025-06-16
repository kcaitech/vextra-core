/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { TransactDataGuard, Text } from "../data";
import { ArrayOpSelection, Op, Operator } from "../operator";

export interface Cmd { // 用户的一次操作
    id: string; // cmd id
    version: number;
    // preVersion: string; // 服务端对cmd进行排序后，当前cmd的前一个cmd的version
    baseVer: number;
    batchId: string; // 服务端收到的cmd的批次序号 // 此批次的第一个cmd的id
    // userId: string;
    ops: Op[];
    // isUndo: boolean; // Undo cmd，需要对delete shape特别处理
    isRecovery: boolean; // undo、redo。当恢复已同步的数据时，需要在post时对齐版本并在应用后更新到最新版本。
    // 其它cmd信息
    description: string; // 此cmd是干嘛的
    time: number; // 时间戳 // 编辑时间
    posttime: number; // 上传时间
    dataFmtVer: string; // 数据格式版本
}

export interface OpItem {
    op: Op;
    cmd: Cmd;
}


export interface SelectionState {
    shapes: string[],
    table?: {
        isRowOrCol: boolean, // 是否选中整行整列
        rows: string[],
        cols: string[],
    },
    text?: ArrayOpSelection // 在组件变量override时，可能存在由一个var切换到另外一个var的情况，这时就存在2个selectionOp
}
export interface ISave4Restore {
    save(): SelectionState;
    restore(saved: SelectionState): void;
    saveText(path: string[]): ArrayOpSelection | undefined;
    restoreText(op: ArrayOpSelection): void;
}
export enum CmdMergeType {
    None,
    TextInsert,
    TextDelete,
}
export interface LocalCmd extends Cmd {
    ops: Op[];
    delay: number; // 是否延迟同步
    mergetype: CmdMergeType; // 用于cmd合并
    saveselection: SelectionState | undefined; // undo时还原到旧选区。 redo及正常操作时，selectionupdater更新选区
    // cmd执行完后如何更新选区。大部分操作应该是选区不变，即应用saveselection（不是不操作）
    // 需要特别处理的：对象操作（编组、组件、）、表格行列操作、文本
    selectionupdater: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void;
}


export interface INet {

    /**
     * 
     * @returns 是否已经连接
     */
    hasConnected(): boolean;

    /**
     * 
     * @param from 起始id
     * @param to 结束id（包含）
     */
    pullCmds(from: number, to?: number): Promise<Cmd[]>;

    /**
     * 
     * @param cmds 要推送的命令
     */
    postCmds(cmds: Cmd[], serial:(cmds: Cmd[])=> string): Promise<boolean>;

    /**
     * 监听远程cmd
     * @param watcher 
     */
    watchCmds(watcher: (cmds: Cmd[]) => void): () => void;

    /**
     * 监听错误信息
     * errorInfo的几种类型：
     * {
     *   type: "duplicate",
     *   duplicateCmd: Cmd,
     * }
     */
    watchError(watcher: (errorInfo: {
        type: "duplicate",
        duplicateCmd: Cmd,
    }) => void): void;


}

export interface IRepository {
    setInitingDocument(init: boolean): void;
    onLoaded(): void;

    setOnChange(onChange: Function): void;
    lastRemoteCmdVersion(): number | undefined;
    hasPendingSyncCmd(): boolean;
    setNet(net: INet): void;
    setBaseVer(baseVer: number): void;
    setProcessCmdsTrigger(trigger: () => void): void;
    receive(cmds: Cmd[]): void;
    setSelection(selection: ISave4Restore): void;
    
    /**
     * @deprecated
     */
    get repo(): TransactDataGuard;
    
    /**
     * @deprecated
     */
    get transactCtx(): any;
    
    isInTransact(): boolean;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    start(description: string, selectionupdater?: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void): Operator;
    updateTextSelectionPath(text: Text): void;
    updateTextSelectionRange(start: number, length: number): void;
    isNeedCommit(): boolean;
    commit(mergetype?: CmdMergeType): void;
    rollback(from?: string): void;

    quit(): void;
}