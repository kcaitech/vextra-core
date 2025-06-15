/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { Document } from "../data/document";
import { TransactDataGuard } from "../data/transact";
import { Operator } from "../operator/operator";
import { Page } from "../data/page";
import { cloneSelectionState, isDiffSelectionState, isDiffStringArr } from "./utils";
import { CmdMgr } from "./cmdmgr";
import { CmdMergeType, ISave4Restore, LocalCmd, Cmd, IRepository, INet } from "./types";
import { transform } from "./arrayoptransform";
import { ArrayOp, ArrayOpSelection, IdOpRecord, Op, OpType } from "../operator";
import { Text } from "../data/text/text";
import { FMT_VER_latest } from "../data/fmtver";
import { uuid } from "../basic/uuid";
import { Basic } from "../data";


class MockNet implements INet {
    hasConnected(): boolean {
        return false;
    }
    async pullCmds(from: number, to: number): Promise<Cmd[]> {
        return [];
    }
    async postCmds(cmds: Cmd[]): Promise<boolean> {
        return false;
    }

    watchCmds(watcher: (cmds: Cmd[]) => void) {
        return () => { };
    }

    watchError(watcher: (errorInfo: any) => void): void {

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

/**
 * @description 针对同一指令路径， 新增效果的指令后存在删除效果的指令，则将被视为一组无效指令被清除（包括同一路径中间修改指令）
 * 新增效果指令： undefined => Basic
 * 删除效果指令： Basic => undefined
 * 无效指令组： <同一路径： 新增效果指令 修改指令 删除效果指令 >
 */
function pairOpsSimplify(ops: Op[]) {
    // 指令效果为新增
    const isJustBorn = (op: Op & {
        from?: Basic;
        to?: Basic;
    }) => op.type === OpType.CrdtArr && op.from === undefined && op.to !== undefined;

    // 指令效果为删除
    const isAbort = (op: Op & {
        to?: Basic;
    }) => op.type === OpType.CrdtArr && op.to === undefined;

    type WrappedOp = { op: Op, needDelete: boolean };

    const wrappedOps: WrappedOp[] = [];
    for (const op of ops) wrappedOps.push({ op, needDelete: false });
    const deletedMap = new Map<string, boolean>();
    for (let i = wrappedOps.length - 1; i > -1; i--) {
        const wrappedOp = wrappedOps[i];
        if (isAbort(wrappedOp.op)) {
            deletedMap.set(wrappedOp.op.id, false);
        } else if (deletedMap.has(wrappedOp.op.id)) {
            wrappedOp.needDelete = true;
            isJustBorn(wrappedOp.op) && deletedMap.set(wrappedOp.op.id, true);
        }
    }
    for (const wrappedOp of wrappedOps) if (deletedMap.get(wrappedOp.op.id)) wrappedOp.needDelete = true;
    const simplifiedOps: Op[] = [];
    for (const wrappedOp of wrappedOps) if (!wrappedOp.needDelete) simplifiedOps.push(wrappedOp.op);
    return simplifiedOps;
}

export class CoopRepository implements IRepository {
    private __repo: TransactDataGuard;
    private __cmdmgr: CmdMgr;
    private __api: Operator;
    private selection?: ISave4Restore;
    private __onChange: Function | undefined;
    private __curcmd: LocalCmd | undefined;

    constructor(document: Document, repo: TransactDataGuard, /*cmds: Cmd[] = [], localcmds: LocalCmd[] = []*/) {
        this.__repo = repo;
        this.__api = Operator.create(repo);
        this.__cmdmgr = new CmdMgr(document, repo, new MockNet())

        // this.__cmdmgr.restore(cmds, localcmds);
        // if (cmds.length > 0 || localcmds.length > 0) {
        //     this.__cmdmgr.roll2NewVersion([document.id]);
        // }

        document.pagesMgr.setUpdater((data: Page) => {
            this.__cmdmgr.roll2NewVersion([data.id]);
        })
    }

    __initingDoc: boolean = false;
    setInitingDocument(init: boolean) {
        this.__initingDoc = init;
    }

    public setOnChange(onChange: Function) {
        this.__onChange = onChange;
    }

    public lastRemoteCmdVersion(): number | undefined {
        return this.__cmdmgr.lastRemoteCmdVersion();
    }
    public hasPendingSyncCmd(): boolean {
        return this.__cmdmgr.hasPendingSyncCmd();
    }

    public setNet(net: INet) {
        this.__cmdmgr.setNet(net);
    }

    // public setOnLoaded(onLoaded: () => void) {
    //     this.__cmdmgr.setOnLoaded(onLoaded);
    // }

    public setBaseVer(baseVer: number) {
        this.__cmdmgr.setBaseVer(baseVer);
    }

    public setProcessCmdsTrigger(trigger: () => void) {
        this.__cmdmgr.watchProcessCmdsEnd(trigger);
    }

    public receive(cmds: Cmd[]) {
        this.__cmdmgr.receive(cmds);
    }

    setSelection(selection: ISave4Restore) {
        this.selection = selection;
        this.__cmdmgr.setSelection(selection);
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
            const cmd = this.__cmdmgr.undo();
            if (cmd && this.selection) cmd.selectionupdater(this.selection, true, cmd);
            this.__repo.commit();
        } catch (e) {
            this.__repo.rollback();
            throw e;
        } finally {
            this.__repo.transactCtx.settrap = save;
            const localcCmdId = this.__cmdmgr.localcmds[this.__cmdmgr.localindex - 1]?.id || '';
            if (this.__onChange) this.__onChange(localcCmdId);
        }
    }

    redo() {
        this.__repo.start("redo");
        const save = this.__repo.transactCtx.settrap;
        try {
            this.__repo.transactCtx.settrap = false;
            const cmd = this.__cmdmgr.redo();
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
        return this.__cmdmgr.canUndo();
    }
    canRedo() {
        return this.__cmdmgr.canRedo();
    }
    start(description: string, selectionupdater: (selection: ISave4Restore, isUndo: boolean, cmd: LocalCmd) => void = defaultSU): Operator {
        this.__repo.start(description);
        this.__api.reset();
        this.__curcmd = {
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
            saveselection: this.selection?.save(),
            selectionupdater,
            dataFmtVer: FMT_VER_latest,
        };

        return this.__api;
    }
    updateTextSelectionPath(text: Text) {
        const path = text?.getCrdtPath() || [];
        if (this.__curcmd?.saveselection?.text) this.__curcmd.saveselection.text.path = path;
    }
    updateTextSelectionRange(start: number, length: number) {
        if (this.__curcmd?.saveselection?.text) {
            const selection = this.__curcmd.saveselection.text;
            selection.start = start;
            selection.length = length;
        }
    }
    isNeedCommit(): boolean {
        return this.__api.ops.length > 0;
    }

    _commit(mergetype: CmdMergeType = CmdMergeType.None): LocalCmd | undefined {
        const cmd = this.__curcmd;
        if (!cmd) return undefined;
        cmd.ops = this.__api.ops;
        cmd.id = uuid();
        cmd.time = Date.now();
        cmd.mergetype = mergetype;
        // if (this.needUpdateFrame.length > 0) {
        //     // todo 不同page
        //     const update = this.needUpdateFrame.slice(0);
        //     const page = update[0].page;
        //     const shapes = update.map((v) => v.shape);
        //     updateShapesFrame(page, shapes, this);
        // }
        // this.needUpdateFrame.clear();
        this.__curcmd = undefined;
        // merge op
        if (cmd.ops.length > 1) {
            // merge idset
            // shapemove？
            // arraymove？
            // text?
            // todo 这里是否也要保持原来的顺序？
            const ops = [];
            const idsetops = new Map<string, Op>();
            for (let i = 0; i < cmd.ops.length; i++) {
                const op = cmd.ops[i];
                if (op.type === OpType.Idset) {
                    const path = op.path.join(','); // 是否要包含id？path包含id
                    const pre = idsetops.get(path) as IdOpRecord;
                    if (pre) {
                        pre.data = (op as IdOpRecord).data;
                    } else {
                        idsetops.set(path, op);
                    }
                } else {
                    ops.push(op);
                }
            }
            if (idsetops.size > 0) for (let [_, v] of idsetops) {
                const op = v as IdOpRecord;
                if (op.data !== op.origin) ops.push(v);
            }
            if (ops.length < cmd.ops.length) {
                // has merge
                cmd.ops = ops;
            }
            cmd.ops = pairOpsSimplify(cmd.ops);
            if (cmd.ops.length === 0) return undefined;
        }
        if (cmd.saveselection?.text) { // 文本选区需要加入到op参与变换
            cmd.ops.unshift(cmd.saveselection.text);
        }
        return cmd;
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
        let cmd = this._commit(mergetype); // 这里selection是对的
        // if (!cmd) throw new Error("no cmd to commit")
        if (!cmd) {
            this.rollback("commit");
            return;
        }
        this.__repo.commit();
        if (!this.__initingDoc) cmd = this.__cmdmgr.commit(cmd);
        if (this.selection) cmd.selectionupdater(this.selection, false, cmd);
        const localcCmdId = this.__cmdmgr.localcmds[this.__cmdmgr.localindex - 1]?.id || '';
        if (this.__onChange) this.__onChange(localcCmdId);
    }
    rollback(from: string = "") {
        this.__curcmd = undefined;
        this.__repo.rollback(from);
        this.__api.reset();
    }

    onLoaded() {

    }

    quit() {
        this.__cmdmgr.quit();
    }
}