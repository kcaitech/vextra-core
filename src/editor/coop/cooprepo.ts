
import { Document } from "../../data/document";
import { Repository } from "../../data/transact";
import { Api } from "./recordapi";
import { Page } from "../../data/page";
import { LocalCmd } from "./localcmd";
import { CmdRepo } from "./cmdrepo";
import { Cmd } from "../../coop/common/repo";

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
    private __localcmds: LocalCmd[] = [];
    private __index: number = 0;
    private __api: Api;

    constructor(uid: string, document: Document, repo: Repository, cmds: Cmd[], localcmds: LocalCmd[]) {
        this.__repo = repo;
        repo.transactCtx.settrap = true; // todo
        this.__api = new Proxy<Api>(new Api(uid), new TrapHdl(repo));
        this.__cmdrepo = new CmdRepo(document, cmds, localcmds, (op, path) => {
            // todo
            throw new Error("not implemented");
        })

        if (cmds.length > 0 || localcmds.length > 0) {
            this.__cmdrepo.updateBlockData([document.id]);
        }

        document.pagesMgr.setUpdater((data: Page) => {
            this.__cmdrepo.updateBlockData([data.id]);
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
        if (!this.canUndo()) {
            return;
        }
        const undocmd = this.__localcmds[this.__index - 1];
        if (this.__cmdrepo.canTransactUndo()) {
            this.__repo.undo();
            this.__cmdrepo.undoLocal(false);
        } else if (this.__cmdrepo.canUndoLocal()) {
            this.__cmdrepo.undoLocal(true);
        } else {
            this.__cmdrepo.undo(undocmd);
        }
        --this.__index;
        // todo restore selection
        // shape 记录id即可
        // table 选中单元格时记录行列的crdtidx（还原时取最大框选），选中表格或者文本，记录shapeid
        // 文本记录选区，需要变换。selection op记录到cmd.ops（第一个？），上传时过滤掉
    }

    redo() {
        if (!this.canRedo()) {
            return;
        }
        let redocmd = this.__localcmds[this.__index];
        if (this.__cmdrepo.canTransactRedo()) {
            this.__repo.redo();
            this.__cmdrepo.redoLocal(false);
        } else if (this.__cmdrepo.canRedoLocal()) {
            this.__cmdrepo.redoLocal(true);
        } else {
            this.__cmdrepo.redo(redocmd);
        }
        ++this.__index;
        // todo restore selection
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
        this.__api.rollback();
        this.__repo.rollback(from);
    }
}