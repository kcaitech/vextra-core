
import { Document } from "../../data/document";
import { Repository } from "../../data/transact";
import { Api } from "./recordapi";
import { Page } from "../../data/page";
import { LocalCmd } from "./localcmd";
import { CmdRepo } from "./cmdrepo";
import { Cmd } from "../../coop/common/repo";
import { ICoopNet } from "./net";

export class CoopRepository {
    private __repo: Repository;
    private __cmdrepo: CmdRepo;
    private __api: Api;

    constructor(document: Document, repo: Repository, net: ICoopNet, cmds: Cmd[] = [], localcmds: LocalCmd[] = []) {
        this.__repo = repo;
        repo.transactCtx.settrap = true; // todo
        this.__api = Api.create(repo);
        this.__cmdrepo = new CmdRepo(document, cmds, localcmds, net)

        if (cmds.length > 0 || localcmds.length > 0) {
            this.__cmdrepo.roll2NewVersion([document.id]);
        }

        document.pagesMgr.setUpdater((data: Page) => {
            this.__cmdrepo.roll2NewVersion([data.id]);
        })
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
        this.__cmdrepo.redo();
    }

    redo() {
        this.__cmdrepo.redo();
    }
    canUndo() {
        return this.__cmdrepo.canUndo();
    }
    canRedo() {
        return this.__cmdrepo.canRedo();
    }
    start(name: string, saved: {}): Api {
        this.__repo.start(name, saved);
        this.__api.start();
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
    }
    rollback(from: string = "") {
        this.__api.rollback();
        this.__repo.rollback(from);
    }
}