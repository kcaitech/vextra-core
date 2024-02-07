import { Cmd } from "../../coop/common/repo";
import { ArrayOpSelection } from "../../coop/client/arrayop";

export enum CmdMergeType {
    None,
    TextInsert,
    TextDelete,
}

export interface SelectionState {
    shapes: string[],
    table?: {
        isRowOrCol: boolean, // 是否选中整行整列
        rows: string[],
        cols: string[],
    },
    text?: ArrayOpSelection
}

export function isDiffStringArr(lhs: string[], rhs: string[]): boolean {
    if (lhs.length !== rhs.length) return true;
    for (let i = 0; i < lhs.length; ++i) {
        if (lhs[i] !== rhs[i]) return true;
    }
    return false;
}

export function isDiffSelectionState(lhs: SelectionState, rhs: SelectionState): boolean {
    if (lhs.shapes.length !== rhs.shapes.length) return true;
    if (isDiffStringArr(lhs.shapes, rhs.shapes)) return true;

    if (lhs.table === rhs.table && lhs.text === rhs.text) return false; // undefined
    if (lhs.table && rhs.table) {
        const lt = lhs.table;
        const rt = rhs.table;
        if (lt.isRowOrCol !== rt.isRowOrCol || lt.rows.length !== rt.rows.length || lt.cols.length !== rt.cols.length) return true;
        if (isDiffStringArr(lt.rows, rt.rows)) return true;
        if (isDiffStringArr(lt.cols, rt.cols)) return true;
    } else if (lhs.table !== rhs.table) {
        return true;
    }
    if (lhs.text && rhs.text) {
        // id: string, // 可不要
        // path: string[], // 要有
        // order: number, // MAX
        // start: number, // 
        // length: number,
        if (lhs.text.start !== rhs.text.start || lhs.text.length !== rhs.text.length) return true;
    }
    else if (lhs.text !== rhs.text) {
        return true;
    }
    return false;
}

export function cloneSelectionState(selection: SelectionState): SelectionState {
    return {
        shapes: selection.shapes,
        table: selection.table,
        text: selection.text ? selection.text.clone() : undefined
    }
}

export interface ISave4Restore {
    save(): SelectionState;
    restore(saved: SelectionState): void;
    saveText(path: string[]): ArrayOpSelection | undefined;
    restoreText(op: ArrayOpSelection): void;
}

export interface LocalCmd extends Cmd {
    delay: number; // 是否延迟同步
    mergetype: CmdMergeType; // 用于cmd合并
    saveselection: SelectionState | undefined; // undo时还原到旧选区。 redo及正常操作时，selectionupdater更新选区
    // cmd执行完后如何更新选区。大部分操作应该是选区不变，即应用saveselection（不是不操作）
    // 需要特别处理的：对象操作（编组、组件、）、表格行列操作、文本
    selectionupdater: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void;
}


