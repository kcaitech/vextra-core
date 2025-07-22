import { TransactDataGuard, Text, Document } from "../data";
import { CmdMergeType, IRepository, ISave4Restore, LocalCmd } from "./types";
import { Operator, OperatorT } from "../operator";
import { defaultSU } from "./utils";
import { uuid } from "../basic/uuid";

export class Repo implements IRepository {
    private __repo: TransactDataGuard;
    private __onChange?: (cmdId: string) => void;
    private __selection?: ISave4Restore;
    private __operator: Operator;
    private __curCmd: LocalCmd | undefined;
    private __initing: boolean = false
    constructor(data: Document, repo: TransactDataGuard) {
        this.__repo = repo;
        this.__operator = OperatorT.create(this.__repo);
    }
    startInitData(): void {
        this.__initing = true
    }
    endInitData(): void {
        this.__initing = false
    }

    onChange(cb: (cmdId: string) => void): void {
        this.__onChange = cb;
    }

    setSelection(selection: ISave4Restore): void {
        this.__selection = selection;
    }

    isInTransact(): boolean {
        return this.__repo.isInTransact();
    }
    undo(): void {
        const saved_data = this.__repo.undo() as LocalCmd;
        if (!saved_data) return;
        const cmd = saved_data;
        if (cmd && this.__selection) {
            // selection
            cmd.selectionupdater(this.__selection, true, cmd);
        }
        if (this.__onChange) this.__onChange(cmd.id)
    }
    redo(): void {
        const saved_data = this.__repo.redo() as LocalCmd;
        if (!saved_data) return;
        const cmd = saved_data;
        if (cmd && this.__selection) {
            // selection
            cmd.selectionupdater(this.__selection, false, cmd);
        }
        if (this.__onChange) this.__onChange(cmd.id)
    }
    canUndo(): boolean {
        return this.__repo.canUndo();
    }
    canRedo(): boolean {
        return this.__repo.canRedo();
    }
    start(description: string, selectionupdater: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void = defaultSU): Operator {
        this.__repo.start(description);

        this.__curCmd = {
            id: uuid(),
            mergetype: CmdMergeType.None,
            saveselection: this.__selection?.save(),
            selectionupdater,
        };

        return this.__operator;
    }
    updateTextSelectionPath(text: Text) {
        const path = text?.getCrdtPath() || [];
        if (this.__curCmd?.saveselection?.text) this.__curCmd.saveselection.text.path = path;
    }
    updateTextSelectionRange(start: number, length: number) {
        if (this.__curCmd?.saveselection?.text) {
            const selection = this.__curCmd.saveselection.text;
            selection.start = start;
            selection.length = length;
        }
    }
    isNeedCommit(): boolean {
        return (this.__repo.transactCtx.transact?.length ?? 0) > 0;
    }
    commit(mergetype: CmdMergeType = CmdMergeType.None) {
        if (!this.__curCmd) throw new Error("commit failed");
        this.__repo.commit(!this.__initing, this.__curCmd);
        if (this.__initing) {
            this.__curCmd = undefined;
            return
        }
        const cmd = this.__curCmd;

        cmd.mergetype = mergetype;
        this.__curCmd = undefined;
        if (this.__onChange) this.__onChange(cmd.id)
    }
    rollback(from?: string): void {
        if (!this.__curCmd) throw new Error("rollback failed");
        this.__repo.rollback(from);
        this.__curCmd = undefined;
    }
    fireNotify(): void {
        this.__repo.transactCtx.fireNotify();
    }
}