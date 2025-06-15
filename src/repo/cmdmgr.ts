/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

import { Op, OpType } from "../operator";
import { CmdMergeType, ISave4Restore, LocalCmd, Cmd, OpItem } from "./types";
import { cloneSelectionState, isDiffStringArr } from "./utils";
import { Document } from "../data/document";
import { ICoopNet } from "./net";
import { uuid } from "../basic/uuid";
import { RepoNode, RepoNodePath } from "./base";
import { nodecreator } from "./creator";
import { ArrayMoveOpRecord, IdOp, IdOpRecord, TreeMoveOpRecord } from "../operator";
import { TransactDataGuard } from "../data/transact";
import { ArrayOp, ArrayOpSelection } from "../operator";
import { TextOpInsertRecord, TextOpRemoveRecord } from "../operator";
import { CmdNetTask } from "./cmdnettask";
import { stringifyShape } from "../operator";
import { Shape } from "../data/shape";
import { FMT_VER_latest } from "../data/fmtver";
import { convertCmds } from "./compatible";
import { parseCmds, serialCmds } from "./serial";

const NET_TIMEOUT = 5000; // 5s

/**
 * 根据path 分类
 * @param cmds
 * @returns 
 */
function classifyOps(cmds: Cmd[]): { k: string, v: OpItem[] }[] {
    const pathArray: string[] = [];
    const subrepos: Map<string, (OpItem)[]> = new Map();
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        for (let j = 0; j < cmd.ops.length; ++j) {
            const op = cmd.ops[j];
            if (op instanceof ArrayOp && op.order !== cmd.version) throw new Error("op.order !== cmd.version");
            const oppath = op.path.join('/');
            let arr = subrepos.get(oppath);
            if (!arr) {
                arr = [];
                subrepos.set(oppath, arr);
                pathArray.push(oppath);
            }
            arr.push({ op, cmd });
        }
    }
    // sort: 按路径长度从短的开始，即从对象树的根往下更新；且原来在前的op也要在前
    // return Array.from(subrepos.entries()).sort((a, b) => a[0].length - b[0].length);
    return pathArray.map((path) => ({ k: path, v: subrepos.get(path)! }));
}

// 不是Recovery
function quickRejectRecovery(cmd: LocalCmd) {
    const ops = cmd.ops;
    for (let i = 0; i < ops.length; ++i) {
        const op = ops[i] as ArrayMoveOpRecord | TreeMoveOpRecord | IdOpRecord;
        switch (op.type) {
            case OpType.None:
            case OpType.Array:
                break;
            case OpType.CrdtArr:
            case OpType.CrdtTree:
                const record = op as ArrayMoveOpRecord | TreeMoveOpRecord;
                if (!record.from && record.to &&
                    (typeof record.data === 'string') &&
                    (record.data[0] === '{' || record.data[0] === '[')) {
                    // 插入object
                    return false;
                }
                break;
            case OpType.Idset:
                if ((typeof op.data === 'string') &&
                    (op.data[0] === '{' || op.data[0] === '[')) {
                    // 插入object
                    return false;
                }
                break;
        }
    }
    return true;
}
// 与远程同步的cmdsync
// 一个page一个curversion，不可见page，cmd仅暂存
// symbols要同步更新
// 一个文档一个总的repo
class CmdSync {
    nettask: CmdNetTask;
    repo: TransactDataGuard;
    // private selection: ISave4Restore | undefined;
    private nodecreator: (parent: RepoNodePath, op: Op) => RepoNode
    private net: ICoopNet;
    constructor(document: Document, repo: TransactDataGuard, net: ICoopNet) {
        this.document = document;
        this.repo = repo;
        // 用于加载本地的cmds
        // this.cmds = cmds;
        // this.nopostcmds = localcmds;
        this.nodecreator = nodecreator(document, undefined);
        this.net = net;
        this.net.watchCmds(this.receive.bind(this));
        this.net.watchError(this.receiveErr.bind(this));
        this.nettask = new CmdNetTask(net, this.baseVer, this.baseVer, this.receive.bind(this));
    }

    setSelection(selection: ISave4Restore) {
        this.nodecreator = nodecreator(this.document, selection);
    }

    public setNet(net: ICoopNet) {
        this.net = net;
        this.nettask.setNet(net);
        this.net.watchCmds(this.receive.bind(this));
        this.net.watchError(this.receiveErr.bind(this));
    }

    // private __loaded: boolean = false; // 是否已经完成首次指令加载
    // // 设置首次指令加载完成时的回调任务
    // public setOnLoaded(onLoaded: () => void) {
    //     if (this.__loaded) return onLoaded(); // 已经错过了第一次的指令加载
    //     const stop = this.net.watchCmds(() => {
    //         onLoaded();
    //         stop();
    //     });
    // }

    document: Document;

    baseVer: number = 0;
    dataVer: number = 0;

    public setBaseVer(baseVer: number) {
        this.baseVer = baseVer;
        this.dataVer = baseVer;
    }

    cmds: Cmd[] = [];
    pendingcmds: Cmd[] = []; // 远程过来还未应用的cmd // 在需要拉取更早的版本时，远程的cmd也需要暂存不应用

    posttime: number = 0; // 提交cmd的时间
    postingcmds: Cmd[] = []; // 已提交未返回cmd
    nopostcmds: LocalCmd[] = []; // 本地未提交cmd
    nopostcmdidx: number = 0; // 本地未提交cmd,可提交的cmd的length. index之后为被undo掉的cmd


    public lastRemoteCmdVersion(): number | undefined {
        const last = this.pendingcmds.length > 0 ? this.pendingcmds[this.pendingcmds.length - 1] : this.cmds[this.cmds.length - 1];
        return last?.version;
    }

    // 是否存在未同步的cmd
    public hasPendingSyncCmd(): boolean {
        return this.postingcmds.length > 0 || this.nopostcmdidx > 0;
    }

    // 不同bolck（page、document，不同repotree）
    repotrees: Map<string, RepoNodePath> = new Map();

    private getRepoTree(blockId: string) { // 开始就创建，要跟踪变换op
        let repotree = this.repotrees.get(blockId);
        if (!repotree) {
            repotree = new RepoNodePath(undefined, blockId);
            this.repotrees.set(blockId, repotree);
        }
        return repotree;
    }

    private __receive(cmds: Cmd[]) {
        // 一个batch一个batch的执行。否则iset的对象需要做版本对齐
        while (cmds.length > 0) {
            const batchid = cmds[0].batchId;
            let i = 1;
            while (i < cmds.length && cmds[i].batchId === batchid) ++i;

            const subrepos = classifyOps(cmds.splice(0, i));
            for (let { k, v } of subrepos) {
                // 建立repotree
                const op0 = v[0].op;
                const blockId = op0.path[0];
                let repotree = this.getRepoTree(blockId);
                const node = repotree.buildAndGet(op0, op0.path.slice(1), this.nodecreator);
                // apply op
                try {
                    node.receive(v);
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }

    __receiveRecovery(cmd: Cmd) {
        const subrepos = classifyOps([cmd]);
        for (let { k, v } of subrepos) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            let repotree = this.getRepoTree(blockId);
            const node = repotree.buildAndGet(op0, op0.path.slice(1), this.nodecreator);
            // apply op
            try {
                node.receive(v);
            } catch (e) {
                console.error(e);
            }
            const op = v[0].op; // 需要重新获取
            switch (op.type) {
                case OpType.None:
                case OpType.Array:
                    break;
                case OpType.CrdtArr:
                case OpType.CrdtTree:
                    {
                        const record = op as ArrayMoveOpRecord | TreeMoveOpRecord;
                        const node = repotree.get3(record.path.slice(1).concat(record.id));
                        // node.baseVer = cmd.baseVer;
                        // 深入设置baseVer
                        node.setTreeBaseVer(cmd.baseVer);
                        try {
                            node.roll2Version(cmd.baseVer, Number.MAX_SAFE_INTEGER)
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    break;
                case OpType.Idset:
                    {
                        const record = op as IdOpRecord;
                        const node = repotree.get3(record.path.slice(1));
                        // node.baseVer = cmd.baseVer;
                        // 深入设置baseVer
                        node.setTreeBaseVer(cmd.baseVer);
                        try {
                            node.roll2Version(cmd.baseVer, Number.MAX_SAFE_INTEGER)
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    break;
            }
        }
    }

    _receive(cmds: Cmd[]) {
        // 处理远程过来的cmds
        for (; cmds.length > 0;) {
            const idx = cmds.findIndex((cmd) => cmd.isRecovery);
            if (idx < 0) {
                this.__receive(cmds);
                break;
            }

            if (idx > 0) {
                this.__receive(cmds.slice(0, idx));
            }
            const recoveryCmd = cmds[idx];
            cmds.splice(0, idx + 1);

            this.__receiveRecovery(recoveryCmd);
        }
    }

    private _receiveLocal(cmds: Cmd[]) {
        // 处理本地提交后返回的cmds
        // 1. 分类op
        const subrepos = classifyOps(cmds);
        for (let { k, v } of subrepos) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.getRepoTree(blockId);
            const node = repotree.buildAndGet(op0, op0.path.slice(1), this.nodecreator);
            // apply op
            try {
                node.receiveLocal(v);
            } catch (e) {
                console.error(e);
            }
        }
    }

    private onProcessCmdsEnd: () => void = () => { };
    public watchProcessCmdsEnd(onEnd: () => void) {
        this.onProcessCmdsEnd = onEnd;
    }

    _quited: boolean = false
    quit() {
        if (this.__processTimeToken) {
            clearTimeout(this.__processTimeToken)
            this.__processTimeToken = undefined
        }
        this._quited = true
    }

    __processTimeToken: any;
    processCmds(delay: boolean = true) {
        const delayProcess = (timeout: number) => {
            if (!this.__processTimeToken) this.__processTimeToken = setTimeout(() => {
                this.__processTimeToken = undefined;
                this.processCmds(false);
            }, timeout);
        }

        // todo 长时间pulling与长时间postcmds时，提示用户出错
        if (this.nettask.pulling) {
            delayProcess(NET_TIMEOUT);
            return;
        }

        if (this.repo.isInTransact()) {
            delayProcess(1000); // 1s
            return;
        }

        if (delay) {
            delayProcess(1);
            return;
        }

        // 检查cmd baseVer是否本地有,否则需要拉取远程cmds
        if (this.pendingcmds.length > 0) {
            const cmds = this.pendingcmds;
            const minBaseVer = cmds.reduce((m, c) => ((m - c.baseVer) > 0 ? c.baseVer : m), cmds[0].baseVer);
            if ((this.baseVer - minBaseVer) > 0) {
                this.nettask.pull(minBaseVer, this.baseVer);
                delayProcess(NET_TIMEOUT);
                return;
            }
        }
        if (this.__processTimeToken) {
            clearTimeout(this.__processTimeToken);
            this.__processTimeToken = undefined;
        }
        if (this.pendingcmds.length > 0) {
            this.repo.start("processCmds"); // todo 需要更细粒度的事务？
            const savetrap = this.repo.transactCtx.settrap;
            try {
                this.repo.transactCtx.settrap = false;
                this._processCmds();
                this.repo.commit();
            } catch (e) {
                console.error(e);
                this.repo.rollback();
            } finally {
                this.repo.transactCtx.settrap = savetrap;
            }
        }
        this.onProcessCmdsEnd();
        this._postcmds(delayProcess);
    }

    // debounce or add to render loop
    _processCmds() {
        const p0id: string | undefined = this.postingcmds[0]?.id;
        const index = p0id ? this.pendingcmds.findIndex(p => p.id === p0id) : -1;
        // check是否已返回
        if (index >= 0) {
            // 已返回
            // check: 应该是一起返回的
            // 容错，在网络错误等导致重复提交时，有可能重复提交。在重复提交时仅返回第一个id重复的cmd
            // if (this.pendingcmds.length < index + this.postingcmds.length) throw new Error("something wrong 0");
            // for (let i = 0; i < this.postingcmds.length; i++) {
            //     const cmd = this.postingcmds[i];
            //     const receive = this.pendingcmds[index + i];
            //     if (cmd.id !== receive.id) throw new Error("something wrong 1");
            //     // 给pendingcmds更新order,
            //     // cmd.version = receive.version;
            //     // cmd.ops.forEach((op) => op.order = receive.version);
            // }
            // 分3步
            // 1. 先处理index之前的cmds
            if (index > 0) {
                const pcmds = this.pendingcmds.slice(0, index);
                this._receive(pcmds);
            }
            // 2. 再处理postingcmds, 与服务端对齐
            const receiveLocals = this.pendingcmds.slice(index, index + this.postingcmds.length);
            // 更新postingcmds version
            for (let i = 0; i < receiveLocals.length; ++i) {
                this.postingcmds[i].batchId = receiveLocals[i].batchId;
                this.postingcmds[i].version = receiveLocals[i].version;
                this.postingcmds[i].ops.forEach((op) => { if (op instanceof ArrayOp) op.order = receiveLocals[i].version });
            }
            this._receiveLocal(this.postingcmds.splice(0, receiveLocals.length));
            // 3. 再处理index之后的cmds
            if (this.pendingcmds.length > index + receiveLocals.length) {
                const pcmds = this.pendingcmds.slice(index + receiveLocals.length);
                this._receive(pcmds);
            }
            this.cmds.push(...this.pendingcmds);
            // this.postingcmds.length = 0;
            this.pendingcmds.length = 0;

            if (this.postingcmds.length > 0) {
                // reset batchId & basever
                const baseVer = this.cmds.length > 0 ? this.cmds[this.cmds.length - 1].version : this.baseVer;
                const batchId = this.postingcmds[0].id;
                this.postingcmds.forEach(c => {
                    c.baseVer = baseVer;
                    c.batchId = batchId;
                })
            }
        }

        // 未返回也可以应用连续的cmds
        // apply pending and transform local // 仅remote
        if (this.pendingcmds.length > 0) {
            // 先处理pending
            this._receive(this.pendingcmds.slice(0));
            this.cmds.push(...this.pendingcmds);
            this.pendingcmds.length = 0;
        }
    }

    private _commit(cmd: LocalCmd) { // 不需要应用的
        this.nopostcmds.length = this.nopostcmdidx;
        // check
        for (let i = 0; i < this.nopostcmds.length; ++i) {
            if (this.nopostcmds[i].id === cmd.id) throw new Error("duplicate cmd id");
        }
        this.nopostcmds.push(cmd); // 本地cmd也要应用到nodetree
        ++this.nopostcmdidx;
        // 处理本地提交后返回的cmds
        // 1. 分类op
        const subrepos = classifyOps([cmd]);
        for (let { k, v } of subrepos) {
            // 过滤掉仅一个selection的op
            if (v.length === 1 && v[0].op === cmd.saveselection?.text) {
                const idx = cmd.ops.indexOf(v[0].op);
                if (idx >= 0) cmd.ops.splice(idx, 1);
                cmd.saveselection.text = undefined;
                continue;
            }
            // check
            // if (v.length > 1) {
            //     console.warn("op can merge?? ", v)
            // }
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.getRepoTree(blockId);
            const node = repotree.buildAndGet(op0, op0.path.slice(1), this.nodecreator);
            // apply op
            node.commit(v);
        }

        // need process
        this.processCmds();
    }

    private _commit2(cmd: LocalCmd) { // 不需要应用的
        this.nopostcmds.length = this.nopostcmdidx;
        // check
        for (let i = 0; i < this.nopostcmds.length; ++i) {
            if (this.nopostcmds[i].id === cmd.id) throw new Error("duplicate cmd id");
        }
        this.nopostcmds.push(cmd);
        ++this.nopostcmdidx;
        this.processCmds();
    }

    // 本地cmd
    // 区分需要应用的与不需要应用的
    commit(cmd: LocalCmd) {
        this._commit(cmd);
    }

    undo(cmd: LocalCmd) {
        const posted = cmd.posttime > 0;

        const newCmd: LocalCmd | undefined = posted ? {
            id: uuid(),
            mergetype: cmd.mergetype,
            delay: 500,
            version: Number.MAX_SAFE_INTEGER,
            // preVersion: "",
            baseVer: 0,
            batchId: "",
            ops: [],
            isRecovery: true,
            description: cmd.description,
            time: Date.now(),
            posttime: 0,
            saveselection: cmd.saveselection && cloneSelectionState(cmd.saveselection),
            selectionupdater: cmd.selectionupdater,
            dataFmtVer: FMT_VER_latest,
        } : undefined;
        if (newCmd?.saveselection?.text) newCmd.saveselection.text.order = Number.MAX_SAFE_INTEGER;

        const subrepos = classifyOps([cmd]);
        for (let { k, v } of subrepos) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.repotrees.get(blockId);
            const node = repotree && repotree.get(op0.path.slice(1));
            if (!node) throw new Error("cmd"); // 本地cmd 不应该没有
            // apply op
            if (newCmd) {
                node.undo(v, newCmd); // 已posted
            } else if (cmd === this.nopostcmds[this.nopostcmdidx]) {
                node.redo(v, undefined); // 刚undo时生成新cmd，再redo（此时走的是undo），再undo
            } else if (cmd === this.nopostcmds[this.nopostcmdidx - 1]) {
                node.undo(v, undefined); // 正常
            } else {
                // throw new Error();
                node.redo(v, undefined);
            }
        }

        if (newCmd) {
            if (newCmd.saveselection?.text) {
                // 替换掉selection op
                const sop = newCmd.saveselection.text;
                const idx = newCmd.ops.findIndex(op => op.id === sop.id);
                if (idx < 0) throw new Error();
                newCmd.ops.splice(idx, 1, sop); // 不需要变换的可以直接替换
            }
            this._commit2(newCmd);
        } else {
            if (cmd.saveselection?.text) {
                // 替换掉selection op
                const sop = cmd.saveselection.text;
                const idx = cmd.ops.findIndex(op => op.id === sop.id);
                if (idx < 0) throw new Error();
                // newCmd.ops.splice(idx, 1, sop); // 不需要变换的可以直接替换
                cmd.saveselection.text = cmd.ops[idx] as ArrayOpSelection;
            }
            if (cmd === this.nopostcmds[this.nopostcmdidx]) {
                ++this.nopostcmdidx;
            } else if (cmd === this.nopostcmds[this.nopostcmdidx - 1]) {
                --this.nopostcmdidx;
            } else {
                // throw new Error();
                this._commit2(cmd)
            }
            this.processCmds();
        }

        return newCmd ?? cmd;
    }
    redo(cmd: LocalCmd) {
        const posted = cmd.posttime > 0;

        const newCmd: LocalCmd | undefined = posted ? {
            id: uuid(),
            mergetype: cmd.mergetype,
            delay: 500,
            version: Number.MAX_SAFE_INTEGER,
            // preVersion: "",
            batchId: "",
            baseVer: 0,
            ops: [],
            isRecovery: true,
            description: cmd.description,
            time: Date.now(),
            posttime: 0,
            saveselection: cmd.saveselection && cloneSelectionState(cmd.saveselection),
            selectionupdater: cmd.selectionupdater,
            dataFmtVer: FMT_VER_latest,
        } : undefined;
        if (newCmd?.saveselection?.text) newCmd.saveselection.text.order = Number.MAX_SAFE_INTEGER;

        const subrepos = classifyOps([cmd]); // 这个得有顺序
        for (let { k, v } of subrepos) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.repotrees.get(blockId);
            const node = repotree && repotree.get(op0.path.slice(1));
            if (!node) throw new Error("cmd"); // 本地cmd 不应该没有
            // apply op
            if (newCmd) {
                node.redo(v, newCmd); // posted
            } else if (cmd === this.nopostcmds[this.nopostcmdidx]) {
                node.redo(v, undefined); // 正常
            } else if (cmd === this.nopostcmds[this.nopostcmdidx - 1]) {
                node.undo(v, undefined); // undo时刚commit的cmd
            } else {
                // throw new Error();
                node.redo(v, undefined); // 如在undo时commit新cmd后被清理的cmds，这时重新提交过来
            }
        }

        if (newCmd) {
            if (newCmd.saveselection?.text) {
                // 替换掉selection op
                const sop = newCmd.saveselection.text;
                const idx = newCmd.ops.findIndex(op => op.id === sop.id);
                if (idx < 0) throw new Error();
                newCmd.ops.splice(idx, 1, sop); // 不需要变换的可以直接替换
            }
            // posted
            // need commit new command
            this._commit2(newCmd)
        } else {
            if (cmd.saveselection?.text) {
                // 替换掉selection op
                const sop = cmd.saveselection.text;
                const idx = cmd.ops.findIndex(op => op.id === sop.id);
                if (idx < 0) throw new Error();
                // newCmd.ops.splice(idx, 1, sop); // 不需要变换的可以直接替换
                cmd.saveselection.text = cmd.ops[idx] as ArrayOpSelection;
            }
            if (cmd === this.nopostcmds[this.nopostcmdidx]) {
                ++this.nopostcmdidx;
            } else if (cmd === this.nopostcmds[this.nopostcmdidx - 1]) {
                --this.nopostcmdidx;
            } else {
                // throw new Error();
                this._commit2(cmd)
            }
            this.processCmds();
        }

        return newCmd ?? cmd;
    }

    private receiveErr(errorInfo: {
        type: "duplicate",
        duplicateCmd: Cmd,
    }) {

        if (this._quited) return;

        if (this.postingcmds.length > 1) {
            // 如果是batch提交的cmd，需要进行拉取
            // 不然应该也不会出错，但会多次重复提交，一个一个的返回duplicateCmd
            this.nettask.pull(errorInfo.duplicateCmd.version); // 理论上说这就是第一个batch的cmd
        } else {
            this.receive([errorInfo.duplicateCmd])
        }
    }

    // 收到远程cmd
    public receive(cmds: Cmd[]) {
        if (this._quited) return;
        // 先parse，这样类型才对
        cmds = parseCmds(cmds);

        console.log("receive", cmds, this.baseVer);
        // this.__loaded = true;
        // 检查版本号是否连续
        let lastVer = this.baseVer;
        if (this.pendingcmds.length > 0) {
            lastVer = this.pendingcmds[this.pendingcmds.length - 1].version;
        } else if (this.cmds.length > 0) {
            lastVer = this.cmds[this.cmds.length - 1].version;
        }
        // fix preversion
        // if (cmds.length > 0) {
        //     const cmd = cmds[0];
        //     if (SNumber.comp(cmd.preVersion, cmd.baseVer) < 0) cmd.preVersion = cmd.baseVer;
        // }
        // check
        const abortshead: Cmd[] = [];
        const aborts: Cmd[] = [];
        for (let i = 0; i < cmds.length;) {
            const cmd = cmds[i];
            const diff = (cmd.version - lastVer - 1);
            if (diff < 0 && i === 0) { // 可能批量重传过来的，去掉头部重复的
                abortshead.push(cmd);
                cmds.shift();
                continue;
            }
            if (diff !== 0) {
                aborts.push(...cmds.splice(i, cmds.length - i));
                break;
            }
            lastVer = cmd.version;
            ++i;
        }
        let hasheadcmds = false;
        if (abortshead.length > 0) {
            // 收到头部cmd
            const basIdx = abortshead.findIndex((cmd) => cmd.version === this.baseVer);
            if (basIdx >= 0) {
                hasheadcmds = true;
                const headcmds: Cmd[] = [];
                let ver = this.baseVer;
                for (let i = basIdx; i >= 0; --i) {
                    const cmd = abortshead[i];
                    if (cmd.version === ver) {
                        headcmds.push(cmd);
                        ver = cmd.version - 1;
                    } else {
                        break;
                    }
                }
                abortshead.splice(basIdx - headcmds.length + 1, headcmds.length);
                headcmds.reverse();
                headcmds.forEach(cmd => {
                    cmd.ops.forEach((op) => { if (op instanceof ArrayOp) op.order = cmd.version });
                })
                this.baseVer = headcmds[0].version - 1;
                this.cmds.unshift(...headcmds);
                const subrepos = classifyOps(headcmds);
                for (let { k, v } of subrepos) {
                    // 建立repotree
                    const op0 = v[0].op;
                    const blockId = op0.path[0];
                    let repotree = this.getRepoTree(blockId);
                    const node = repotree.buildAndGet(op0, op0.path.slice(1), this.nodecreator);
                    // apply op
                    node.unshift(v);
                }
            }
            // if (abortshead.length > 0) console.log("abort head cmds: ", abortshead);
        }
        if (aborts.length > 0) {
            console.log("abort received cmds: ", aborts,
                "lastVer: " + lastVer,
                "cmds: ", this.cmds,
                "pendingcmds: ", this.pendingcmds);
            if (cmds.length === 0) {
                const abortVer = aborts[aborts.length - 1].version;
                if ((lastVer - abortVer) < 0) {
                    // 有新版本需要拉取
                    this.nettask.pull(lastVer);
                }
            }
        }

        if (cmds.length === 0 && !hasheadcmds) return;
        // 更新op.order
        cmds.forEach(cmd => {
            cmd.ops.forEach((op) => { if (op instanceof ArrayOp) op.order = cmd.version });
        })
        convertCmds(cmds);
        this.pendingcmds.push(...cmds);
        this.nettask.updateVer(this.baseVer, (cmds[cmds.length - 1]?.version) ?? lastVer);
        // need process
        this.processCmds(false);
    }

    // ================ cmd 上传、下拉 ==========================
    // private __postTimeToken: any; // 这个要与process一起处理
    private _postcmds(delayPost: (delay: number) => void) {

        // const delayPost = (delay: number) => {
        //     if (!this.__postTimeToken) this.__postTimeToken = setTimeout(() => {
        //         this.__postTimeToken = undefined;
        //         this._postcmds();
        //     }, delay);
        // }

        if (this.postingcmds.length > 0) {
            const now = Date.now();
            if (now - this.posttime > NET_TIMEOUT) {
                // 超时了
                // repost
                // check
                // todo 一起重传不成功要处理
                const cmdids = new Set<string>();
                for (let i = 0; i < this.postingcmds.length; ++i) {
                    const id = this.postingcmds[i].id;
                    if (cmdids.has(id)) throw new Error("duplicate cmd id");
                    cmdids.add(id);
                }

                this.net.postCmds(this.postingcmds, serialCmds);
                this.posttime = now;
            }
            // set timeout
            delayPost(NET_TIMEOUT);
            return; // 等返回
        }

        if (!this.net.hasConnected()) {
            delayPost(NET_TIMEOUT);
            return;
        }

        // if (this.__postTimeToken) {
        //     clearTimeout(this.__postTimeToken);
        //     this.__postTimeToken = undefined;
        // }

        if (this.nopostcmdidx === 0) return;
        const baseVer = this.cmds.length > 0 ? this.cmds[this.cmds.length - 1].version : this.baseVer;
        let delay = NET_TIMEOUT;

        // check
        // post local (根据cmd提交时间是否保留最后个cmd用于合并)
        // 所有cmd延迟1s提交？cmd应该能设置delay & mergeable
        const now = Date.now();
        const len = this.nopostcmdidx;
        for (let i = 0; i < len; i++) {
            const cmd = this.nopostcmds[i];
            if (!((i < len - 1) || (now - cmd.time > cmd.delay))) {
                delay = cmd.delay;
                break;
            }
            if (cmd.isRecovery) {
                if (quickRejectRecovery(cmd)) {
                    cmd.isRecovery = false; // 可以不用recovery
                } else if (this.postingcmds.length > 0) {
                    break; // 因为要设置准确的baseVer，它的前面不能有要提交的cmd。也可以保证之前的删除cmd已经提交回来了
                } else {
                    this.repo.start("_alignDataVersion");
                    const savetrap = this.repo.transactCtx.settrap;
                    try {
                        this.repo.transactCtx.settrap = false;
                        this._alignDataVersion(cmd);
                        this.repo.commit();
                    } catch (e) {
                        console.error(e);
                        this.repo.rollback();
                    } finally {
                        this.repo.transactCtx.settrap = savetrap;
                    }
                }
            }
            this.postingcmds.push(cmd);
            cmd.baseVer = baseVer;
            cmd.posttime = now;
            cmd.batchId = this.postingcmds[0].id;
            if (cmd.isRecovery) {
                break; // receive时一次只处理一个recovery的cmd。为减少可能的bug，recovery的cmd一个一个的同步。
            }
        }

        if (this.postingcmds.length > 0) {
            this.posttime = now;
            this.nopostcmds.splice(0, this.postingcmds.length);
            this.nopostcmdidx -= this.postingcmds.length;

            // check
            const cmdids = new Set<string>();
            for (let i = 0; i < this.postingcmds.length; ++i) {
                const id = this.postingcmds[i].id;
                if (cmdids.has(id)) throw new Error("duplicate cmd id");
                cmdids.add(id);
            }

            // post
            this.net.postCmds((this.postingcmds), serialCmds);
        }
        // set timeout
        delayPost(delay);
    }

    _alignDataVersion(cmd: LocalCmd) {
        // 需要判断op 类型
        if (cmd !== this.nopostcmds[0]) throw new Error();
        const ops = cmd.ops;
        for (let i = 0; i < ops.length; ++i) {
            const op = ops[i];
            switch (op.type) {
                case OpType.None:
                case OpType.Array:
                    break;
                case OpType.CrdtArr:
                    {
                        const record = op as ArrayMoveOpRecord | TreeMoveOpRecord;
                        if (!record.from && record.to && (typeof record.data === 'string') && (record.data[0] === '{' || record.data[0] === '[')) {
                            if (!record.data2) throw new Error();
                            const blockId = record.path[0];
                            const repotree = this.repotrees.get(blockId);
                            const node = repotree && repotree.get2(record.path.slice(1).concat(record.id));
                            if (node) {
                                node.undoLocals();
                                record.data = JSON.stringify(record.data2, (k, v) => k.startsWith('__') ? undefined : v)
                                node.redoLocals();
                            }
                        }
                    }
                    break;
                case OpType.CrdtTree:
                    {
                        const record = op as ArrayMoveOpRecord | TreeMoveOpRecord;
                        if (!record.from && record.to && (typeof record.data === 'string') && (record.data[0] === '{' || record.data[0] === '[')) {
                            if (!record.data2) throw new Error();
                            const blockId = record.path[0];
                            const repotree = this.repotrees.get(blockId);
                            const node = repotree && repotree.get2(record.path.slice(1).concat(record.id));
                            if (node) { // group对象的子对象并不能undo掉
                                node.undoLocals();
                                // 对象数据不可以序列化childs。
                                record.data = stringifyShape(record.data2 as Shape);
                                node.redoLocals();
                            }
                        }
                    }
                    break;
                case OpType.Idset:
                    {
                        const record = op as IdOpRecord;
                        if ((typeof record.data === 'string') && (record.data[0] === '{' || record.data[0] === '[')) {
                            // 插入object
                            if (!record.data2) throw new Error();
                            const blockId = record.path[0];
                            const repotree = this.repotrees.get(blockId);
                            const node = repotree && repotree.get2(record.path.slice(1));
                            if (node) {
                                node.undoLocals();
                                record.data = JSON.stringify(record.data2, (k, v) => k.startsWith('__') ? undefined : v)
                                node.redoLocals();
                            }
                        }
                    }
                    break;
            }
        }
    }

    // ================ 打开文档恢复、延迟加载数据更新 =========================
    _roll2NewVersion(_blockIds: string[]) {
        // create repotree
        // check
        const set = new Set<string>();
        // update
        for (let i = 0; i < _blockIds.length; i++) {
            const _blockId = _blockIds[i];
            // check
            if (set.has(_blockId)) throw new Error("duplicate blockId");
            set.add(_blockId);

            const repotree = this.repotrees.get(_blockId);
            if (!repotree) return; // 无需更新

            try {
                repotree.roll2Version(this.dataVer, Number.MAX_SAFE_INTEGER)
            } catch (e) {
                console.error(e)
            }
        }
    }

    roll2NewVersion(_blockIds: string[]) {
        // todo 
        if (this.repo.isInTransact()) {
            this._roll2NewVersion(_blockIds);
            return;
        }
        this.repo.start("roll2NewVersion"); // todo 需要更细粒度的事务？
        const savetrap = this.repo.transactCtx.settrap;
        try {
            this.repo.transactCtx.settrap = false;
            this._roll2NewVersion(_blockIds);
            this.repo.commit();
        } catch (e) {
            console.error(e);
            this.repo.rollback();
        } finally {
            this.repo.transactCtx.settrap = savetrap;
        }
    }
}

function __mergeIdset(last: LocalCmd, cmd: LocalCmd) {
    const idsetops = new Map<string, Op>();
    for (let i = 0; i < last.ops.length; i++) {
        const op = last.ops[i];
        if (op.type === OpType.Idset) {
            const path = op.path.join(','); // 是否要包含id？path包含id
            idsetops.set(path, op);
        }
    }
    // check first
    for (let i = 0; i < cmd.ops.length; i++) {
        const op = cmd.ops[i];
        if (op.type === OpType.Idset) {
            const path = op.path.join(',');
            const pre = idsetops.get(path) as IdOpRecord;
            if (!pre) return false;
        }
    }

    for (let i = 0; i < cmd.ops.length; i++) {
        const op = cmd.ops[i];
        if (op.type === OpType.Idset) {
            const path = op.path.join(',');
            const pre = idsetops.get(path) as IdOpRecord;
            if (pre) {
                pre.data = (op as IdOpRecord).data;
            } else {
                throw new Error();
            }
        }
    }
    return true;
}

function _mergeTextDelete(last: LocalCmd, cmd: LocalCmd) {
    // 处理只有deleteop跟selectionop的情况
    const canMerge1 = (ops: Op[]) => {
        let canMerge = true;
        for (let i = 0; i < ops.length; ++i) {
            const op = ops[i] as ArrayOp;
            if (op.type !== OpType.Array && op.type !== OpType.Idset) {
                canMerge = false;
                break;
            }
        }
        return canMerge;
    }
    if (!(canMerge1(last.ops) && canMerge1(cmd.ops))) return false;
    const delOp = last.ops.find((op) => op instanceof TextOpRemoveRecord) as TextOpRemoveRecord;
    const delOp2 = cmd.ops.find((op) => op instanceof TextOpRemoveRecord) as TextOpRemoveRecord;

    // 连续的
    if (!(delOp && delOp2 && (delOp.start === (delOp2.start + delOp2.length) || (delOp.start + delOp.length) === delOp2.start))) return false;
    if (isDiffStringArr(delOp.path, delOp2.path)) return false;

    // mrege idset ops
    if (!__mergeIdset(last, cmd)) return false;

    // merge text delete
    if (delOp.start === (delOp2.start + delOp2.length)) {
        delOp.text.insertFormatText(delOp2.text, 0);
    } else {
        delOp2.text.insertFormatText(delOp.text, 0);
        delOp.text = delOp2.text;
    }
    delOp.start = Math.min(delOp.start, delOp2.start);
    delOp.length = delOp.length + delOp2.length;

    last.time = cmd.time;
    console.log("merge localcmd: ", last);
    return true;

}
function _mergeTextInsert(last: LocalCmd, cmd: LocalCmd) {
    // 处理只有insertop跟selectionop的情况
    const canMerge2 = (ops: Op[]) => {
        let canMerge = true;
        for (let i = 0; i < ops.length; ++i) {
            const op = ops[i] as ArrayOp | IdOp;
            if (op.type !== OpType.Array && op.type !== OpType.Idset) {
                canMerge = false;
                break;
            }
        }
        return canMerge;
    }

    if (!(canMerge2(last.ops) && canMerge2(cmd.ops))) return false;

    // 找到insertop

    const insertOp = last.ops.find((op) => op instanceof TextOpInsertRecord) as TextOpInsertRecord;
    const insertOp2 = cmd.ops.find((op) => op instanceof TextOpInsertRecord) as TextOpInsertRecord;
    // 连续的
    if (!(insertOp && insertOp2 && ((insertOp.start + insertOp.length) === insertOp2.start))) return false;
    if (isDiffStringArr(insertOp.path, insertOp2.path)) return false;


    // mrege idset ops
    if (!__mergeIdset(last, cmd)) return false;

    // simple 跟 simple合并，complex跟complex合并
    if (insertOp.text.type === 'simple' && insertOp2.text.type === 'simple' &&
        (!insertOp.text.props || !insertOp.text.props.attr && !insertOp.text.props.paraAttr) &&
        (!insertOp2.text.props || !insertOp2.text.props.attr && !insertOp2.text.props.paraAttr)) {
        insertOp.text.text += insertOp2.text.text;
    } else if (insertOp.text.type === 'complex' && insertOp2.text.type === 'complex') {
        const _text = insertOp2.text.text;
        _text.insertFormatText(insertOp.text.text, 0);
        insertOp.text.text = _text;
    } else {
        return false;
    }
    insertOp.start = Math.min(insertOp.start, insertOp2.start);
    insertOp.length = insertOp.length + insertOp2.length;


    last.time = cmd.time;
    console.log("merge localcmd: ", last);
    return true;
}

export class CmdMgr {

    cmdsync: CmdSync;
    localcmds: LocalCmd[] = []; // 本地用户的所有cmd
    localindex: number = 0;

    constructor(document: Document, repo: TransactDataGuard, net: ICoopNet) {
        this.cmdsync = new CmdSync(document, repo, net);
    }
    // restore(cmds: Cmd[], localcmds: LocalCmd[]) {
    //     // todo 只有本地编辑undo时，需要往回回退版本。初始化时的cmd是不能回退回去的。可以考虑不以undo-do-redo的方式来restore!
    //     // 比如离线编辑，有比较多的本地cmd需要同步时，太多的undo比较费时。
    //     // restore

    //     if (this.localcmds.length > 0 || this.cmdsync.cmds.length > 0) throw new Error();
    //     if (cmds.length === 0 && localcmds.length === 0) return;

    //     // 拷贝一下, _receive会修改原数组
    //     cmds = cmds.slice(0);
    //     localcmds = localcmds.slice(0);

    //     const repo = this.cmdsync.repo;
    //     repo.start("init");
    //     try {
    //         if (cmds.length > 0) {
    //             if (cmds[0].preVersion !== this.cmdsync.baseVer) throw new Error();
    //             this.cmdsync._receive(cmds);
    //             this.cmdsync.cmds.push(...cmds);
    //             this.cmdsync.nettask.updateVer(this.cmdsync.baseVer, cmds[cmds.length - 1].version);
    //         }
    //         if (localcmds.length > 0) {
    //             localcmds.forEach(item => this.cmdsync.commit(item));
    //             this.localcmds.push(...localcmds);
    //         }
    //         repo.commit();
    //     } catch (e) {
    //         repo.rollback();
    //     }
    // }

    // 本地cmd
    // 区分需要应用的与不需要应用的
    commit(cmd: LocalCmd) {
        // 有丢弃掉的cmd，要通知到textnode
        if (this.localcmds.length > this.localindex) {
            const droped = this.localcmds.splice(this.localindex); // 这里的有些cmd也是要提交的
            const subrepos = classifyOps(droped);
            for (let { k, v } of subrepos) {
                // 建立repotree
                const op0 = v[0].op;
                const blockId = op0.path[0];
                const repotree = this.cmdsync.repotrees.get(blockId);
                const node = repotree && repotree.get(op0.path.slice(1));
                if (!node) throw new Error("op not found");
                node.dropOps(v);
            }
        }

        // check merge
        const last = this.localcmds[this.localcmds.length - 1];
        if (last && last.posttime === 0 &&
            last.mergetype !== CmdMergeType.None &&
            last.mergetype === cmd.mergetype &&
            last.time + last.delay > Date.now()) {
            // 考虑合并
            // 需要个cmdtype
            if (last.mergetype === CmdMergeType.TextDelete && _mergeTextDelete(last, cmd)) return last;
            if (last.mergetype === CmdMergeType.TextInsert && _mergeTextInsert(last, cmd)) return last;
        }

        console.log("commit localcmd: ", cmd);
        this.localcmds.push(cmd);
        ++this.localindex;

        this.cmdsync.commit(cmd);
        return cmd;
    }

    canUndo() {
        return this.localindex > 0;
    }
    canRedo() {
        return this.localindex < this.localcmds.length;
    }
    undo() {
        if (!this.canUndo()) return;
        const cmd = this.localcmds[this.localindex - 1];
        const newCmd = this.cmdsync.undo(cmd);
        if (newCmd !== cmd) {
            this.localcmds.splice(this.localindex - 1, 1, newCmd);
        }

        --this.localindex;
        console.log("undo", newCmd ?? cmd);
        return newCmd ?? cmd;
    }
    redo() {
        if (!this.canRedo()) return;
        const cmd = this.localcmds[this.localindex];
        const newCmd = this.cmdsync.redo(cmd);
        if (newCmd !== cmd) {
            this.localcmds.splice(this.localindex, 1, newCmd);
        }

        ++this.localindex;
        console.log("redo", newCmd ?? cmd);
        return newCmd ?? cmd;
    }

    // adapt
    roll2NewVersion(_blockIds: string[]) {
        return this.cmdsync.roll2NewVersion(_blockIds);
    }
    lastRemoteCmdVersion() {
        return this.cmdsync.lastRemoteCmdVersion();
    }
    hasPendingSyncCmd(): boolean {
        return this.cmdsync.hasPendingSyncCmd()
    }
    setNet(net: ICoopNet) {
        return this.cmdsync.setNet(net);
    }

    // setOnLoaded(onLoaded: () => void) {
    //     this.cmdsync.setOnLoaded(onLoaded);
    // }
    setBaseVer(baseVer: number) {
        return this.cmdsync.setBaseVer(baseVer);
    }
    watchProcessCmdsEnd(onEnd: () => void) {
        return this.cmdsync.watchProcessCmdsEnd(onEnd);
    }
    receive(cmds: Cmd[]) {
        return this.cmdsync.receive(cmds);
    }
    setSelection(selection: ISave4Restore) {
        return this.cmdsync.setSelection(selection);
    }
    quit() {
        this.cmdsync.quit()
    }
}