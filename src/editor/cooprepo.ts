import { Cmd } from "../coop/data/classes";
import { Document } from "../data/document";
import { Repository } from "../data/transact";
import { CMDExecuter } from "./cmdexecuter";
import { CMDReverter } from "./cmdrevert";

export class CoopRepository {
    private __repo: Repository;
    private __cmdrevert: CMDReverter;
    private __cmdexec: CMDExecuter;
    private __commitListener: ((cmd: Cmd, isRemote: boolean) => void)[] = [];
    private __rollbackListener: ((isRemote: boolean) => void)[] = [];
    private __allcmds: Cmd[] = [];
    private __localcmds: (Cmd & { index: number })[] = [];
    private __index: number = 0;

    constructor(document: Document, repo: Repository) {
        this.__repo = repo;
        this.__cmdrevert = new CMDReverter(document);
        this.__cmdexec = new CMDExecuter(document, repo);
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
        if (this.__cmdexec.exec(cmd, isRemote)) {
            this.__allcmds.push(cmd);
            this.__commitListener.forEach((l) => {
                l(cmd, isRemote);
            })
        }
        else {
            this.__rollbackListener.forEach((l) => {
                l(isRemote);
            })
        }
    }

    execRemote(cmd: Cmd) {
        console.log("exec remote:", cmd)
        this._exec(cmd, true);
    }

    undo() {
        if (!this.canUndo()) {
            return;
        }
        this.__index--;
        const undoCmd = this.__localcmds[this.__index];
        // 这里需要变换

        const revertCmd = this.__cmdrevert.revert(undoCmd)
        if (revertCmd) {
            this._exec(revertCmd, false);
        }
    }

    redo() {
        if (!this.canRedo()) {
            return;
        }
        const redoCmd = this.__localcmds[this.__index];
        this.__index++;
        if (redoCmd) {
            this._exec(redoCmd, false);
        }
    }
    canUndo() {
        return this.__index > 0;
    }
    canRedo() {
        return this.__index < this.__localcmds.length;
    }
    start(name: string, saved: {}) {
        this.__repo.start(name, saved);
    }
    commit(cmd: Cmd, isRemote: boolean = false) {
        // 
        const transact = this.__repo.transactCtx.transact;
        // collect position cmd
        // todo
        this.__repo.commit()
        if (!isRemote) {
            this.__localcmds.length = this.__index;
            const l = cmd as (Cmd & { index: number })
            l.index = this.__allcmds.length;
            this.__localcmds.push(l);
            this.__index++;
        }
        this.__allcmds.push(cmd);

        this.__commitListener.forEach((l) => {
            l(cmd, isRemote);
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