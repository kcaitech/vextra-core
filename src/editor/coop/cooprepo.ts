
import { Document } from "../../data/document";
import { Repository } from "../../data/transact";
import { Api } from "./recordapi";
import { Page } from "../../data/page";
import { LocalCmd as Cmd } from "./localcmd";
import { CmdRepo } from "./cmdrepo";

class TrapHdl {
    private repo: Repository;
    constructor(repo: Repository) {
        this.repo = repo;
    }
    get(target: object, propertyKey: PropertyKey, receiver?: any) {
        const ret = Reflect.get(target, propertyKey, receiver);
        if (typeof ret !== "function") return ret;
        return (...args: any[]) => {
            const save = this.repo.transactCtx.settrap;
            this.repo.transactCtx.settrap = false;
            try {
                return ret.apply(this, args);
            }
            finally {
                this.repo.transactCtx.settrap = save;
            }
        }
    }
}

export class CoopRepository {
    private __repo: Repository;
    private __cmdrepo: CmdRepo;
    private __localcmds: Cmd[] = [];
    private __index: number = 0;
    private __api: Api;

    constructor(uid: string, document: Document, repo: Repository) {
        this.__repo = repo;
        repo.transactCtx.settrap = true; // todo
        this.__api = new Proxy<Api>(new Api(uid), new TrapHdl(repo));
        this.__cmdrepo = new CmdRepo((op, path) => {
            // todo
            throw new Error("not implemented");
        })
        document.pagesMgr.setUpdater((data: Page) => {
            this.updateLazyData(data.id);
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

    private updateLazyData(blockId: string) {
        // todo 
        // this.__allcmds.forEach((cmd) => {
        //     if (cmd.blockId === blockId) this.__cmdexec.exec(cmd)
        // })
    }

    undo() {
        if (!this.canUndo()) {
            return;
        }
        const undocmd = this.__localcmds[this.__index - 1];
        // todo
    }

    redo() {
        if (!this.canRedo()) {
            return;
        }
        let redocmd = this.__localcmds[this.__index];
        // todo
    }
    canUndo() {
        return this.__index > 0;
    }
    canRedo() {
        return this.__index < this.__localcmds.length;
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
        this.__repo.commit()


        // todo check merge

        this.__localcmds.length = this.__index;
        this.__localcmds.push(cmd);
        this.__index++;

        this.__cmdrepo.post(cmd);
    }
    rollback(from: string = "") {
        this.__repo.rollback(from);
    }
}