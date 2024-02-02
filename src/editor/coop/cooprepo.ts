
import { Document } from "../../data/document";
import { Repository } from "../../data/transact";
import { Api } from "./recordapi";
import { Page } from "../../data/page";
import { ISave4Restore, LocalCmd, cloneSelectionState, isDiffSelectionState, isDiffStringArr } from "./localcmd";
import { CmdRepo } from "./cmdrepo";
import { Cmd } from "../../coop/common/repo";
import { ICoopNet } from "./net";
import { Op } from "../../coop/common/op";
import { transform } from "../../coop/client/arrayoptransform";
import { ArrayOp, ArrayOpSelection } from "coop/client/arrayop";


class MockNet implements ICoopNet {
    private watcherList: ((cmds: Cmd[]) => void)[] = [];

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
        this.watcherList.push(watcher);
    }

    getWatcherList(): ((cmds: Cmd[]) => void)[] {
        return this.watcherList;
    }
}

function defaultSU(selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd): void {
    if (!cmd.saveselection) return;
    let saveselection = cmd.saveselection;
    if (!isUndo && saveselection.text) {
        // 需要变换
        const selectTextOp = saveselection.text;
        const idx = cmd.ops.indexOf(selectTextOp);
        if (idx < 0) throw new Error();
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

    constructor(document: Document, repo: Repository, cmds: Cmd[] = [], localcmds: LocalCmd[] = []) {
        this.__repo = repo;
        this.__api = Api.create(repo);
        this.__cmdrepo = new CmdRepo(document, cmds, localcmds, new MockNet())

        if (cmds.length > 0 || localcmds.length > 0) {
            this.__cmdrepo.roll2NewVersion([document.id]);
        }

        document.pagesMgr.setUpdater((data: Page) => {
            this.__cmdrepo.roll2NewVersion([data.id]);
        })
    }

    public setNet(net: ICoopNet) {
        this.__cmdrepo.setNet(net);
    }
    setSelection(selection: ISave4Restore) {
        this.selection = selection;
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
            this.__repo.commit();
            if (cmd && this.selection) cmd.selectionupdater(this.selection, true, cmd);
        } catch(e) {
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
            this.__repo.commit();
            if (cmd && this.selection) cmd.selectionupdater(this.selection, false, cmd);
        } catch(e) {
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
    start(name: string, selectionupdater: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void = defaultSU): Api {
        this.__repo.start(name);
        this.__api.start(this.selection?.save(), selectionupdater);
        return this.__api;
    }
    isNeedCommit(): boolean {
        return this.__api.isNeedCommit();
    }
    commit() {
        if (!this.isNeedCommit()) {
            this.rollback("commit");
            return;
        }
        const transact = this.__repo.transactCtx.transact;
        if (transact === undefined) {
            throw new Error("not inside transact!");
        }
        const cmd = this.__api.commit();
        if (!cmd) throw new Error("no cmd to commit")
        this.__repo.commit();
        this.__cmdrepo.commit(cmd);
        if (this.selection) cmd.selectionupdater(this.selection, false, cmd);
    }
    rollback(from: string = "") {
        this.__api.rollback();
        this.__repo.rollback(from);
    }
}