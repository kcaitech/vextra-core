import { TransactDataGuard, Text, Document } from "../data";
import { Operator as Api } from "../operator";
import { CmdMergeType, IRepository, ISave4Restore, LocalCmd } from "./types";
import { Operator } from "../operator";
import { FMT_VER_latest } from "../data/fmtver";
import { defaultSU } from "./utils";
import { uuid } from "../basic/uuid";

export class Repo implements IRepository {
    private __repo: TransactDataGuard;
    private __onChange?: (cmdId: string) => void;
    private __selection?: ISave4Restore;
    private __operator: Operator;
    private __cmds: LocalCmd[] = [];
    private __curCmd: LocalCmd | undefined;
    private __cmdIdx: number = 0;
    private __initing: boolean = false
    constructor(data: Document, repo: TransactDataGuard) {
        this.__repo = repo;
        this.__operator = Operator.create(this.__repo);
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
        if (!this.__repo.undo()) return;
        this.__cmdIdx--;
        const cmd = this.__cmds[this.__cmdIdx];
        if (cmd && this.__selection) {
            // selection
            cmd.selectionupdater(this.__selection, true, cmd);
        }
        if (this.__onChange) this.__onChange(cmd.id)
    }
    redo(): void {
        if (!this.__repo.redo()) return;
        this.__cmdIdx++;
        const cmd = this.__cmds[this.__cmdIdx];
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
    start(description: string, selectionupdater: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void = defaultSU): Api {
        this.__repo.start(description);
        this.__operator.reset();
        this.__curCmd = {
            id: "",
            // mergeable: true,
            mergetype: CmdMergeType.None,
            delay: 500,
            version: Number.MAX_SAFE_INTEGER,
            // preVersion: "",
            baseVer: 0,
            batchId: "",
            ops: [],
            isRecovery: false,
            description,
            time: 0,
            posttime: 0,
            saveselection: this.__selection?.save(),
            selectionupdater,
            dataFmtVer: FMT_VER_latest,
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
        return this.__operator.ops.length > 0;
    }
    commit(mergetype: CmdMergeType = CmdMergeType.None) {
        if (!this.__curCmd) throw new Error("commit failed");
        this.__repo.commit(!this.__initing);
        if (this.__initing) {
            this.__operator.reset();
            this.__curCmd = undefined;
            return
        }
        const cmd = this.__curCmd;
        cmd.ops = this.__operator.ops;
        cmd.id = uuid();
        cmd.time = Date.now();
        cmd.mergetype = mergetype;
        this.__cmds.push(cmd);
        this.__operator.reset();
        this.__curCmd = undefined;
        if (this.__onChange) this.__onChange(cmd.id)
    }
    rollback(from?: string): void {
        if (!this.__curCmd) throw new Error("rollback failed");
        this.__repo.rollback(from);
        this.__operator.reset();
        this.__curCmd = undefined;
    }
    fireNotify(): void {
        this.__repo.transactCtx.fireNotify();
    }
}