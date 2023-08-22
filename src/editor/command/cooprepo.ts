import { Cmd, CmdGroup } from "../../coop/data/classes";
import { Document } from "../../data/document";
import { Repository } from "../../data/transact";
import { CMDExecuter } from "./executer";
import { CMDReverter } from "./reverter";
import { Api } from "./recordapi";
import { Page } from "../../data/page";
import { uuid } from "../../basic/uuid";
import { setOpsOrderForCmd, cmdClone } from "../../coop/common";

export enum UndoRedoType {
    Undo,
    Redo,
}

export class CoopRepository {
    private __repo: Repository;
    private __cmdrevert: CMDReverter;
    private __cmdexec: CMDExecuter;
    private __commitListener: ((cmd: Cmd, isRemote: boolean) => void)[] = [];
    private __rollbackListener: ((isRemote: boolean) => void)[] = [];
    private __undoRedoListener: ((type: UndoRedoType, newCmd: Cmd, oldCmdId: string) => Cmd | undefined)[] = [];
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
        const undoCmd = this.__localcmds[this.__index - 1];
        const oldCmdId = undoCmd.unitId;
        let revertCmd = this.__cmdrevert.revert(undoCmd);
        if (revertCmd) {
            const unitId = uuid();
            if (revertCmd instanceof CmdGroup) {
                revertCmd.setUnitId(unitId);
            }
            else {
                revertCmd.unitId = unitId;
            }
            for (const h of this.__undoRedoListener) {
                const newCmd = h(UndoRedoType.Undo, revertCmd, oldCmdId)
                if (newCmd === undefined) {
                    console.log("undo变换失败")
                    return
                }
                revertCmd = newCmd as any
            }
            if (this._exec(revertCmd, false)) {
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
            for (const h of this.__undoRedoListener) {
                const newCmd = h(UndoRedoType.Redo, redoCmd, oldCmdId)
                if (newCmd === undefined) {
                    console.log("redo变换失败")
                    return
                }
                redoCmd = newCmd as any
            }
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
            console.log("no cmd to commit")
            this.rollback(false);
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
    rollback(isRemote: boolean = false) {
        this.__repo.rollback();
        this.__rollbackListener.forEach((l) => {
            l(isRemote);
        })
    }
    normalRollback(isRemote: boolean = false) {
        this.__repo.normalRollback();
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
    onUndoRedo(listener: (type: UndoRedoType, newCmd: Cmd, oldCmdId: string) => Cmd | undefined) {
        const _listeners = this.__undoRedoListener;
        _listeners.push(listener);
        return {
            stop() {
                const idx = _listeners.indexOf(listener);
                if (idx >= 0) _listeners.splice(idx, 1);
            }
        }
    }
}