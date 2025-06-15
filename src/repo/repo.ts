import { TransactDataGuard, Text } from "src/data";
import { Operator as Api } from "../operator";
import { Cmd, CmdMergeType, INet, IRepository, ISave4Restore, LocalCmd } from "./types";
import { Operator } from "../operator";
import { FMT_VER_latest } from "src/data/fmtver";
import { defaultSU } from "./utils";
import { uuid } from "src/basic/uuid";

export class Repo implements IRepository {
    private __repo: TransactDataGuard;
    private __onChange?: Function;
    private __selection?: ISave4Restore;
    private __operator: Operator;
    private __cmds: LocalCmd[] = [];
    private __curCmd: LocalCmd | undefined;
    private __cmdIdx: number = 0;
    constructor() {
        this.__repo = new TransactDataGuard();
        this.__operator = Operator.create(this.__repo);
    }
    setInitingDocument(init: boolean): void {
        // throw new Error("Method not implemented.");
    }
    onLoaded(): void {
        // throw new Error("Method not implemented.");
    }
    setOnChange(onChange: Function): void {
        this.__onChange = onChange;
    }
    lastRemoteCmdVersion(): number | undefined {
        // throw new Error("Method not implemented.");
        return undefined;
    }
    hasPendingSyncCmd(): boolean {
        // throw new Error("Method not implemented.");
        return false;
    }
    setNet(net: INet): void {
        // throw new Error("Method not implemented.");
    }
    setBaseVer(baseVer: number): void {
        // throw new Error("Method not implemented.");
    }
    setProcessCmdsTrigger(trigger: () => void): void {
        // throw new Error("Method not implemented.");
    }
    receive(cmds: Cmd[]): void {
        // throw new Error("Method not implemented.");
    }
    setSelection(selection: ISave4Restore): void {
        this.__selection = selection;
    }
    get repo(): TransactDataGuard {
        return this.__repo;
    }
    get transactCtx(): any {
        return this.__repo.transactCtx;
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
    }
    redo(): void {
        if (!this.__repo.redo()) return;
        this.__cmdIdx++;
        const cmd = this.__cmds[this.__cmdIdx];
        if (cmd && this.__selection) {
            // selection
            cmd.selectionupdater(this.__selection, false, cmd);
        }
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
        this.__repo.commit();
        const cmd = this.__curCmd;
        cmd.ops = this.__operator.ops;
        cmd.id = uuid();
        cmd.time = Date.now();
        cmd.mergetype = mergetype;
        this.__cmds.push(cmd);
        this.__operator.reset();
        this.__curCmd = undefined;
    }
    rollback(from?: string): void {
        if (!this.__curCmd) throw new Error("rollback failed");
        this.__repo.rollback(from);
        this.__operator.reset();
        this.__curCmd = undefined;
    }
    quit(): void {
        throw new Error("Method not implemented.");
    }
}