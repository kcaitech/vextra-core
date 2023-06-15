import { Cmd } from "../../coop/data/classes";
import { Document } from "../../data/document";
import { Repository } from "../../data/transact";
import { CMDExecuter } from "./executer";
import { CMDReverter } from "./reverter";
import { Api } from "./recordapi";

export class CoopRepository {
    private __repo: Repository;
    private __cmdrevert: CMDReverter;
    private __cmdexec: CMDExecuter;
    private __commitListener: ((cmd: Cmd, isRemote: boolean) => void)[] = [];
    private __rollbackListener: ((isRemote: boolean) => void)[] = [];
    private __allcmds: Cmd[] = [];
    private __localcmds: (Cmd & { index: number })[] = [];
    private __index: number = 0;
    private __api: Api;

    constructor(document: Document, repo: Repository) {
        this.__repo = repo;
        repo.transactCtx.settrap = true; // todo
        this.__cmdrevert = new CMDReverter(document);
        this.__cmdexec = new CMDExecuter(document, repo);
        this.__api = new Api(repo);
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
        const undoCmd = this.__localcmds[this.__index - 1];
        // 这里需要变换
        const revertCmd = this.__cmdrevert.revert(undoCmd)
        if (revertCmd) {
            if (this._exec(revertCmd, false)) {
                this.__index--;
            }
        }
    }

    redo() {
        if (!this.canRedo()) {
            return;
        }
        const redoCmd = this.__localcmds[this.__index];
        if (redoCmd) {
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
    commit() {
        // 
        const transact = this.__repo.transactCtx.transact;
        if (transact === undefined) {
            throw new Error();
        }
        const cmd = this.__api.commit();
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
    rollback(isRemote: boolean = false) {
        this.__repo.rollback();
        this.__rollbackListener.forEach((l) => {
            l(isRemote);
        })
    }

    onCommit(listener: (cmd: Cmd, isRemote: boolean) => void) {
        const _listeners = this.__commitListener;
        _listeners.push(listener);
        return {
            stop() {
                const idx = _listeners.indexOf(listener);
                if (idx >= 0) _listeners.splice(idx, 1);
            }
        }
    }
    onRollback(listener: (isRemote: boolean) => void) {
        const _listeners = this.__rollbackListener;
        _listeners.push(listener);
        return {
            stop() {
                const idx = _listeners.indexOf(listener);
                if (idx >= 0) _listeners.splice(idx, 1);
            }
        }
    }
}