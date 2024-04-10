
import { Document } from "../../data/document";
import { Repository } from "../../data/transact";
import { Api } from "./recordapi";
import { Page } from "../../data/page";
import { CmdMergeType, ISave4Restore, LocalCmd, cloneSelectionState, isDiffSelectionState, isDiffStringArr } from "./localcmd";
import { CmdRepo } from "./cmdrepo";
import { Cmd } from "../../coop/common/repo";
import { ICoopNet } from "./net";
import { transform } from "../../coop/client/arrayoptransform";
import { ArrayOp, ArrayOpSelection, ArrayOpType } from "../../coop/client/arrayop";
import { Text } from "../../data/text";


class MockNet implements ICoopNet {
    hasConnected(): boolean {
        return false;
    }
    async pullCmds(from: string, to: string): Promise<Cmd[]> {
        return [];
    }
    async postCmds(cmds: Cmd[]): Promise<boolean> {
        return false;
    }
    watchCmds(watcher: (cmds: Cmd[]) => void): void {

    }
}

function defaultSU(selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd): void {
    if (!cmd.saveselection) return;
    let saveselection = cmd.saveselection;
    if (!isUndo && saveselection.text) {
        // 需要变换
        const selectTextOp = saveselection.text;
        const idx = cmd.ops.indexOf(selectTextOp);
        if (idx < 0) {
            throw new Error(); // 出现了
        }
        const rhs = cmd.ops.slice(idx + 1).reduce((rhs, op) => {
            if (!isDiffStringArr(op.path, selectTextOp.path)) rhs.push(op as ArrayOp);
            return rhs;
        }, [] as ArrayOp[])
        const trans = transform([selectTextOp], rhs);
        saveselection = cloneSelectionState(saveselection);
        saveselection.text = trans.lhs[0] as ArrayOpSelection;
    }
    const cur = selection.save();
    if (isDiffSelectionState(cur, saveselection)) {
        selection.restore(saveselection);
    }
}

export class CoopRepository {
    private __repo: Repository;
    private __cmdrepo: CmdRepo;
    private __api: Api;
    private selection?: ISave4Restore;

    constructor(document: Document, repo: Repository, /*cmds: Cmd[] = [], localcmds: LocalCmd[] = []*/) {
        this.__repo = repo;
        this.__api = Api.create(repo);
        this.__cmdrepo = new CmdRepo(document, repo, new MockNet())

        // this.__cmdrepo.restore(cmds, localcmds);
        // if (cmds.length > 0 || localcmds.length > 0) {
        //     this.__cmdrepo.roll2NewVersion([document.id]);
        // }

        document.pagesMgr.setUpdater((data: Page) => {
            this.__cmdrepo.roll2NewVersion([data.id]);
        })
    }

    __initingDoc: boolean = false;
    setInitingDocument(init: boolean) {
        this.__initingDoc = init;
    }

    public hasPendingSyncCmd(): boolean {
        return this.__cmdrepo.hasPendingSyncCmd();
    }

    public setNet(net: ICoopNet) {
        this.__cmdrepo.setNet(net);
    }

    public setBaseVer(baseVer: string) {
        this.__cmdrepo.setBaseVer(baseVer);
    }

    public setProcessCmdsTrigger(trigger: () => void) {
        this.__cmdrepo.watchProcessCmdsEnd(trigger);
    }

    public receive(cmds: Cmd[]) {
        this.__cmdrepo.receive(cmds);
    }

    setSelection(selection: ISave4Restore) {
        this.selection = selection;
        this.__cmdrepo.setSelection(selection);
    }

    /**
     * @deprecated
     */
    get repo() {
        return this.__repo;
    }

    /**
     * @deprecated
     */
    get transactCtx(): any {
        return this.__repo.transactCtx;
    }

    isInTransact(): boolean {
        return this.__repo.isInTransact();
    }

    undo() {
        this.__repo.start("undo");
        const save = this.__repo.transactCtx.settrap;
        try {
            this.__repo.transactCtx.settrap = false;
            const cmd = this.__cmdrepo.undo();
            if (cmd && this.selection) cmd.selectionupdater(this.selection, true, cmd);
            this.__repo.commit();
        } catch (e) {
            this.__repo.rollback();
            throw e;
        } finally {
            this.__repo.transactCtx.settrap = save;
        }
    }

    redo() {
        this.__repo.start("redo");
        const save = this.__repo.transactCtx.settrap;
        try {
            this.__repo.transactCtx.settrap = false;
            const cmd = this.__cmdrepo.redo();
            if (cmd && this.selection) cmd.selectionupdater(this.selection, false, cmd);
            this.__repo.commit();
        } catch (e) {
            this.__repo.rollback();
            throw e;
        } finally {
            this.__repo.transactCtx.settrap = save;
        }
    }
    canUndo() {
        return this.__cmdrepo.canUndo();
    }
    canRedo() {
        return this.__cmdrepo.canRedo();
    }
    start(description: string, selectionupdater: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void = defaultSU): Api {
        this.__repo.start(description);
        this.__api.start(this.selection?.save(), selectionupdater, description);
        return this.__api;
    }
    updateTextSelectionPath(text: Text) {
        const path = text?.getCrdtPath() || [];
        this.__api.updateTextSelectionPath(path);
    }
    updateTextSelectionRange(start: number, length: number) {
        this.__api.updateTextSelectionRange(start, length);
    }
    isNeedCommit(): boolean {
        return this.__api.isNeedCommit();
    }
    commit(mergetype: CmdMergeType = CmdMergeType.None) {
        if (!this.isNeedCommit()) {
            this.rollback("commit");
            return;
        }
        const transact = this.__repo.transactCtx.transact;
        if (transact === undefined) {
            throw new Error("not inside transact!");
        }
        let cmd = this.__api.commit(mergetype); // 这里selection是对的
        // if (!cmd) throw new Error("no cmd to commit")
        if (!cmd) {
            this.rollback("commit");
            return;
        }
        this.__repo.commit();
        if (!this.__initingDoc) cmd = this.__cmdrepo.commit(cmd);
        if (this.selection) cmd.selectionupdater(this.selection, false, cmd);
    }
    rollback(from: string = "") {
        this.__api.rollback();
        this.__repo.rollback(from);
    }
}