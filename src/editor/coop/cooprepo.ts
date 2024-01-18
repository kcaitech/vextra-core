
import { Document } from "../../data/document";
import { Repository } from "../../data/transact";
import { Api } from "./recordapi";
import { Page } from "../../data/page";
import { uuid } from "../../basic/uuid";
import { LocalCmd as Cmd } from "./localcmd";
import { ClientRepo } from "./cmdrepo";

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
    private __cmdrepo: ClientRepo;
    private __localcmds: Cmd[] = [];
    private __index: number = 0;
    private __api: Api;

    constructor(uid: string, document: Document, repo: Repository) {
        this.__repo = repo;
        repo.transactCtx.settrap = true; // todo
        this.__api = new Proxy<Api>(new Api(uid), new TrapHdl(repo));
        this.__cmdrepo = new ClientRepo((op, path) => {
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
        this.__allcmds.forEach((cmd) => {
            if (cmd.blockId === blockId) this.__cmdexec.exec(cmd)
        })
    }

    private _exec(cmd: Cmd, isRemote: boolean) {
        if (this.__cmdexec.exec(cmd)) {
            this.__allcmds.push(cmd);
            this.__commitListener.forEach((l) => {
                l(cmd, isRemote);
            })
            return true;
        }
        else {
            this.__rollbackListener.forEach((l) => {
                l(isRemote);
            })
            return false;
        }
    }

    execRemote(cmd: Cmd) {
        this._exec(cmd, true);
    }

    undo() {
        if (!this.canUndo()) {
            return;
        }
        const sourceCmd = this.__localcmds[this.__index - 1];
        const sourceCmdId = sourceCmd.unitId;
        let undoCmd = this.__cmdrevert.revert(sourceCmd);
        if (undoCmd) {
            const unitId = uuid();
            if (undoCmd instanceof CmdGroup) {
                undoCmd.setUnitId(unitId);
            }
            else {
                undoCmd.unitId = unitId;
            }
            console.log("undo cmd", cmdClone(undoCmd))
            for (const h of this.__undoRedoListener) {
                const newCmd = h(UndoRedoType.Undo, undoCmd, sourceCmdId)
                if (newCmd === undefined) {
                    console.log("undo变换失败")
                    return
                }
                undoCmd = newCmd as any
            }
            console.log("undo cmd (after transform)", undoCmd)
            if (this._exec(undoCmd, false)) {
                this.__index--;
            }
        }
    }

    redo() {
        if (!this.canRedo()) {
            return;
        }
        let redoCmd = cmdClone(this.__localcmds[this.__index]);
        setOpsOrderForCmd(redoCmd, Number.MAX_VALUE)
        const oldCmdId = redoCmd.unitId;
        if (redoCmd) {
            const unitId = uuid();
            if (redoCmd instanceof CmdGroup) {
                redoCmd.setUnitId(unitId);
            }
            else {
                redoCmd.unitId = unitId;
            }
            console.log("redo cmd", cmdClone(redoCmd))
            for (const h of this.__undoRedoListener) {
                const newCmd = h(UndoRedoType.Redo, redoCmd, oldCmdId)
                if (newCmd === undefined) {
                    console.log("redo变换失败")
                    return
                }
                redoCmd = newCmd as any
            }
            console.log("redo cmd (after transform)", redoCmd)
            if (this._exec(redoCmd, false)) {
                this.__index++;
            }
        }
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
            this.rollback("commit", false);
            return;
        }
        // 
        const transact = this.__repo.transactCtx.transact;
        if (transact === undefined) {
            throw new Error("not inside transact!");
        }
        const cmd = this.__api.commit();
        if (!cmd) throw new Error("no cmd to commit")
        this.__repo.commit()

        this.__localcmds.length = this.__index;
        const l = cmd as (Cmd & { index: number })
        l.index = this.__allcmds.length;
        this.__localcmds.push(l);
        this.__index++;

        this.__allcmds.push(cmd);
        this.__commitListener.forEach((l) => {
            l(cmd, false);
        })
    }
    rollback(from: string = "", isRemote: boolean = false) {
        this.__repo.rollback(from);
    }
}