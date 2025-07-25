/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { BasicOpImpl } from "../operator/basicop";
import { Text } from "../data";
import { BasicOp, OperatorT } from "../operator";


export interface ITextSelection {
    id: string,
    path: string[],
    order: number,
    start: number,
    length: number,
    clone(): ITextSelection
}

export class TextSelection {
    constructor(
        public id: string,
        public path: string[],
        public order: number,
        public start: number,
        public length: number,
    ) { }
    clone(): TextSelection {
        return new TextSelection(this.id, this.path, this.order, this.start, this.length);
    }
}

export interface SelectionState {
    shapes: string[],
    table?: {
        isRowOrCol: boolean, // 是否选中整行整列
        rows: string[],
        cols: string[],
    },
    text?: ITextSelection // 在组件变量override时，可能存在由一个var切换到另外一个var的情况，这时就存在2个selectionOp
}

export interface ISave4Restore {
    save(): SelectionState;
    restore(saved: SelectionState): void;
    saveText(path: string[]): ITextSelection | undefined;
    restoreText(op: ITextSelection): void;
}

export enum CmdMergeType {
    None,
    TextInsert,
    TextDelete,
}

export interface LocalCmd {
    id: string;
    mergetype: CmdMergeType; // 用于cmd合并
    time: number; // 时间戳 // 编辑时间
    saveselection: SelectionState | undefined; // undo时还原到旧选区。 redo及正常操作时，selectionupdater更新选区
    selectionupdater: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void;
}

export interface IRepositoryT<T extends BasicOp> {
    startInitData(): void;
    endInitData(): void;

    // 用户编辑时，通知外部更新
    onChange(cb: (cmdId: string) => void): void;

    setSelection(selection: ISave4Restore): void;
    updateTextSelectionPath(text: Text): void;
    updateTextSelectionRange(start: number, length: number): void;

    isInTransact(): boolean;
    undo(): void;
    redo(): void;
    canUndo(): boolean;
    canRedo(): boolean;
    start(description: string, selectionupdater?: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void): OperatorT<T>;
    isNeedCommit(): boolean;
    commit(mergetype?: CmdMergeType): void;
    rollback(from?: string): void;
    fireNotify(): void;
}

export type IRepository = IRepositoryT<BasicOpImpl>;