import { Shape } from "../../data/shape";
import { Op, OpType } from "../../coop/common/op";
import { Cmd, OpItem } from "../../coop/common/repo";
import { ISave4Restore, LocalCmd, cloneSelectionState } from "./localcmd";
import { Document } from "../../data/document";
import { updateShapesFrame } from "./utils";
import * as basicapi from "../basicapi"
import { ICoopNet } from "./net";
import { uuid } from "../../basic/uuid";
import { RepoNode, RepoNodePath } from "./base";
import { nodecreator } from "./creator";
import { ArrayMoveOpRecord, IdOpRecord, TreeMoveOpRecord } from "coop/client/crdt";
import { SNumber } from "../../coop/client/snumber";
import { Repository } from "../../data/transact";

const POST_TIMEOUT = 5000; // 5s

/**
 * 根据path 分类
 * @param cmds
 * @returns 
 */
function classifyOps(cmds: Cmd[]) {
    // todo 需要按顺序执行??
    const subrepos: Map<string, OpItem[]> = new Map();
    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];
        for (let j = 0; j < cmd.ops.length; ++j) {
            const op = cmd.ops[j];
            // op.order = cmd.version; // set order // 应该是设置过的
            if (op.order !== cmd.version) throw new Error("op.order !== cmd.version");
            // client端，非array op也要处理
            // if (op.type !== OpType.Array) continue; // 仅array op需要变换
            const oppath = op.path.join('/');
            let arr = subrepos.get(oppath);
            if (!arr) {
                arr = [];
                subrepos.set(oppath, arr);
            }
            arr.push({ op, cmd });
        }
    }
    // sort: 按路径长度从短的开始，即从对象树的根往下更新
    return Array.from(subrepos.entries()).sort((a, b) => a[0].length - b[0].length);
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

// 一个page一个curversion，不可见page，cmd仅暂存
// symbols要同步更新
// 一个文档一个总的repo
export class CmdRepo {
    private repo: Repository;
    // private selection: ISave4Restore | undefined;
    private nodecreator: (op: Op) => RepoNode
    private net: ICoopNet;
    constructor(document: Document, repo: Repository, net: ICoopNet) {
        this.document = document;
        this.repo = repo;
        // 用于加载本地的cmds
        // this.cmds = cmds;
        // this.nopostcmds = localcmds;
        this.nodecreator = nodecreator(document, undefined);
        this.net = net;
        this.net.watchCmds(this.receive.bind(this));
    }

    restore(cmds: Cmd[], localcmds: LocalCmd[]) {
        // todo 只有本地编辑undo时，需要往回回退版本。初始化时的cmd是不能回退回去的。可以考虑不以undo-do-redo的方式来restore!
        // 比如离线编辑，有比较多的本地cmd需要同步时，太多的undo比较费时。
        // restore

        if (cmds.length === 0 && this.localcmds.length === 0) return;

        const repo = this.repo;
        const document = this.document;
        repo.start("init");
        try {
            const needUpdateFrame: Map<string, Shape[]> = new Map();
            if (cmds.length > 0) {
                this._receive(cmds, needUpdateFrame);
            }
            if (this.localcmds.length > 0) {
                localcmds.forEach(item => this._commit(item));
            }
            // update frame
            // todo
            // for (let [k, v] of needUpdateFrame) {
            //     const page = document.pagesMgr.getSync(k);
            //     if (!page) continue;
            //     updateShapesFrame(page, v, basicapi);
            // }
            repo.commit();
        } catch (e) {
            repo.rollback();
        }
    }

    setSelection(selection: ISave4Restore) {
        this.nodecreator = nodecreator(this.document, selection);
    }

    public setNet(net: ICoopNet) {
        this.net = net;
        this.net.watchCmds(this.receive.bind(this));
    }

    document: Document;

    baseVer: string = "";
    cmds: Cmd[] = [];
    pendingcmds: Cmd[] = []; // 远程过来还未应用的cmd // 在需要拉取更早的版本时，远程的cmd也需要暂存不应用

    posttime: number = 0; // 提交cmd的时间
    postingcmds: Cmd[] = []; // 已提交未返回cmd
    nopostcmds: LocalCmd[] = []; // 本地未提交cmd

    localcmds: LocalCmd[] = []; // 本地用户的所有cmd
    localindex: number = 0;

    // 不同bolck（page、document，不同repotree）
    repotrees: Map<string, RepoNodePath> = new Map();

    private getRepoTree(blockId: string) { // 开始就创建，要跟踪变换op
        let repotree = this.repotrees.get(blockId);
        if (!repotree) {
            repotree = new RepoNodePath();
            this.repotrees.set(blockId, repotree);
        }
        return repotree;
    }

    private __receive(cmds: Cmd[], needUpdateFrame: Map<string, Shape[]>) {
        const subrepos = classifyOps(cmds);
        for (let [k, v] of subrepos) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            let repotree = this.getRepoTree(blockId);
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            let nuf = needUpdateFrame.get(blockId);
            if (!nuf) {
                nuf = [];
                needUpdateFrame.set(blockId, nuf);
            }
            node.receive(v, nuf);
        }
    }

    private _receive(cmds: Cmd[], needUpdateFrame: Map<string, Shape[]>) {
        // 处理远程过来的cmds
        // 可能的情况是，本地有cmd, 需要做变换
        // 1. 分类op

        // todo isRecovery的cmd需要处理

        for (; cmds.length > 0;) {
            const idx = cmds.findIndex((cmd) => cmd.isRecovery);
            if (idx < 0) {
                this.__receive(cmds, needUpdateFrame);
                break;
            }

            if (idx > 0) {
                this.__receive(cmds.slice(0, idx), needUpdateFrame);
            }
            const recoveryCmd = cmds[idx];
            cmds.splice(0, idx + 1);

            const subrepos = classifyOps([recoveryCmd]);
            for (let [k, v] of subrepos) {
                // 建立repotree
                const op0 = v[0].op;
                const blockId = op0.path[0];
                let repotree = this.getRepoTree(blockId);
                const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
                // apply op
                let nuf = needUpdateFrame.get(blockId);
                if (!nuf) {
                    nuf = [];
                    needUpdateFrame.set(blockId, nuf);
                }
                node.receive(v, nuf);

                const op = v[0].op; // 需要重新获取
                switch (op.type) {
                    case OpType.None:
                    case OpType.Array:
                        break;
                    case OpType.CrdtArr:
                    case OpType.CrdtTree:
                        {
                            const record = op as ArrayMoveOpRecord | TreeMoveOpRecord;
                            const node = repotree.get2(record.path.concat(record.id));
                            if (node) {
                                node.roll2Version(recoveryCmd.baseVer, SNumber.MAX_SAFE_INTEGER, nuf)
                            }
                        }
                        break;
                    case OpType.Idset:
                        {
                            const record = op as IdOpRecord;
                            const node = repotree.get2(record.path);
                            if (node) {
                                node.roll2Version(recoveryCmd.baseVer, SNumber.MAX_SAFE_INTEGER, nuf)
                            }
                        }
                        break;
                }
            }
        }
    }

    private _receiveLocal(cmds: Cmd[]) {
        // 处理本地提交后返回的cmds
        // 1. 分类op
        const subrepos = classifyOps(cmds);
        for (let [k, v] of subrepos) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.getRepoTree(blockId);
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            node.receiveLocal(v);
        }
    }

    __processTimeToken: any;
    __pullingCmdsTime: number = 0;
    processCmds() {
        if (this.repo.isInTransact()) {
            if (this.__processTimeToken) return;
            this.__processTimeToken = setTimeout(() => {
                this.__processTimeToken = undefined;
                this.processCmds();
            }, 1000); // 1s
            return;
        }

        // todo 检查cmd baseVer是否本地有,否则需要拉取远程cmds
        if (this.pendingcmds.length > 0) {
            const cmds = this.pendingcmds;
            const minBaseVer = cmds.reduce((m, c) => (SNumber.comp(m, c.baseVer) > 0 ? c.baseVer : m), cmds[0].baseVer);
            if (SNumber.comp(this.baseVer, minBaseVer) > 0) {
                const time = Date.now();
                if (this.__pullingCmdsTime > 0) {

                }
                // todo
                throw new Error("not implemented");
                // this.net.pullCmds(minBaseVer, this.baseVer).then((cmds) => {
                // })
                // if (this.__processTimeToken) return;
                // this.__processTimeToken = setTimeout(() => {
                //     this.__processTimeToken = undefined;
                //     this.processCmds();
                // }, 1000); // 1s
                // return;
            }
        }
        if (this.__processTimeToken) {
            clearTimeout(this.__processTimeToken);
            this.__processTimeToken = undefined;
        }

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

        this._postcmds();
    }

    // debounce or add to render loop
    _processCmds() {
        const needUpdateFrame: Map<string, Shape[]> = new Map();
        const p0id: string | undefined = this.postingcmds[0]?.id;
        const index = p0id ? this.pendingcmds.findIndex(p => p.id === p0id) : -1;
        // check是否已返回
        if (index >= 0) {
            // 已返回
            // check: 应该是一起返回的
            if (this.pendingcmds.length < index + this.postingcmds.length) throw new Error("something wrong 0");
            for (let i = 0; i < this.postingcmds.length; i++) {
                const cmd = this.postingcmds[i];
                const receive = this.pendingcmds[index + i];
                if (cmd.id !== receive.id) throw new Error("something wrong 1");
                // 给pendingcmds更新order,
                // cmd.version = receive.version;
                // cmd.ops.forEach((op) => op.order = receive.version);
            }
            // 分3步
            // 1. 先处理index之前的cmds
            if (index > 0) {
                const pcmds = this.pendingcmds.slice(0, index);
                this._receive(pcmds, needUpdateFrame);
            }
            // 2. 再处理postingcmds, 与服务端对齐
            this._receiveLocal(this.pendingcmds.slice(index, index + this.postingcmds.length));
            // 3. 再处理index之后的cmds
            if (this.pendingcmds.length > index + this.postingcmds.length) {
                const pcmds = this.pendingcmds.slice(index + this.postingcmds.length);
                this._receive(pcmds, needUpdateFrame);
            }
            this.cmds.push(...this.pendingcmds);
            this.postingcmds.length = 0;
            this.pendingcmds.length = 0;
        }

        // 未返回也可以应用连续的cmds
        // apply pending and transform local // 仅remote
        if (this.pendingcmds.length > 0) {
            // 先处理pending
            this._receive(this.pendingcmds, needUpdateFrame);
            this.cmds.push(...this.pendingcmds);
            this.pendingcmds.length = 0;
        }

        // update frame
        // todo
        // for (let [k, v] of needUpdateFrame) {
        //     const page = this.document.pagesMgr.getSync(k);
        //     if (!page) continue;
        //     updateShapesFrame(page, v, basicapi);
        // }
    }

    private _commit(cmd: LocalCmd) { // 不需要应用的
        this.nopostcmds.push(cmd); // 本地cmd也要应用到nodetree
        // 处理本地提交后返回的cmds
        // 1. 分类op
        const subrepos = classifyOps([cmd]);
        for (let [k, v] of subrepos) {
            // check
            if (v.length > 1) {
                console.warn("op can merge?? ", v)
            }
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.getRepoTree(blockId);
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            node.commit(v);
        }

        // need process
        this.processCmds();
    }

    private _commit2(cmd: LocalCmd) { // 不需要应用的
        this.nopostcmds.push(cmd);
        this.processCmds();
    }

    // 本地cmd
    // 区分需要应用的与不需要应用的
    commit(cmd: LocalCmd) {
        // 有丢弃掉的cmd，要通知到textnode
        if (this.localcmds.length > this.localindex) {
            const droped = this.localcmds.splice(this.localindex);
            const subrepos = classifyOps(droped);
            for (let [k, v] of subrepos) {
                // 建立repotree
                const op0 = v[0].op;
                const blockId = op0.path[0];
                const repotree = this.repotrees.get(blockId);
                const node = repotree && repotree.get(op0.path);
                if (!node) throw new Error("op not found");
                node.dropOps(v);
            }
        } else {
            // todo check merge
            // 要此cmd前没有插入其他用户的cmd
            // 文本输入
            // 键盘移动
            // 
            // if (this.__localcmds.length > 0 && this.__cmdrepo.nopostcmds.length > 0) {
            //     const now = Date.now();
            //     const last = this.__localcmds[this.__localcmds.length - 1];
            //     if (now - last.time < 1000) {
            //         // 考虑合并
            //         // 需要个cmdtype
            //     }
            // }
        }
        console.log("commit localcmd: ", cmd);
        this.localcmds.push(cmd);
        ++this.localindex;

        this._commit(cmd);
    }

    // 收到远程cmd
    receive(cmds: Cmd[]) {
        console.log("receive", cmds);
        // 检查版本号是否连续
        let lastVer = this.baseVer;
        if (this.pendingcmds.length > 0) {
            lastVer = this.pendingcmds[this.pendingcmds.length - 1].version;
        } else if (this.cmds.length > 0) {
            lastVer = this.cmds[this.cmds.length - 1].version;
        }
        // check
        for (let i = 0; i < cmds.length; ++i) {
            const cmd = cmds[i];
            if (SNumber.comp(cmd.previousVersion, lastVer) !== 0) {
                const aborts = cmds.splice(i, cmds.length - i);
                console.log("abort received cmds: ", aborts);
                break;
            }
            lastVer = cmd.version;
        }
        if (cmds.length === 0) return;
        // 更新op.order
        cmds.forEach(cmd => {
            cmd.ops.forEach((op) => op.order = cmd.version);
        })
        this.pendingcmds.push(...cmds);
        // need process
        this.processCmds();
    }

    // ================ cmd 上传、下拉 ==========================
    // todo
    // todo 数据序列化
    private __timeOutToken: any;
    private _postcmds() {
        if (this.postingcmds.length > 0) {
            const now = Date.now();
            if (now - this.posttime > POST_TIMEOUT) {
                // 超时了
                // repost
                this.net.postCmds(this.postingcmds);
                this.posttime = now;
            }
            // set timeout
            const delay = POST_TIMEOUT;
            if (this.__timeOutToken) clearTimeout(this.__timeOutToken);
            this.__timeOutToken = setTimeout(() => {
                this.__timeOutToken = undefined;
                this._postcmds();
            }, delay);
            return; // 等返回
        }

        // if (!this.net.hasConnected()) {
        //     const delay = POST_TIMEOUT;
        //     if (!this.__timeOutToken) this.__timeOutToken = setTimeout(() => {
        //         this.__timeOutToken = undefined;
        //         this._postcmds();
        //     }, delay);
        //     return;
        // }

        const baseVer = this.cmds.length > 0 ? this.cmds[this.cmds.length - 1].version : this.baseVer;
        let delay = POST_TIMEOUT;
        if (this.nopostcmds.length > 0) {
            // check
            // post local (根据cmd提交时间是否保留最后个cmd用于合并)
            // 所有cmd延迟1s提交？cmd应该能设置delay & mergeable
            const now = Date.now();
            const len = this.nopostcmds.length;
            for (let i = 0; i < len; i++) {
                const cmd = this.nopostcmds[i];
                if ((i < len - 1) || (now - cmd.time > cmd.delay)) {
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
                } else {
                    delay = cmd.delay;
                    break;
                }
            }

            if (this.postingcmds.length > 0) {
                this.posttime = now;
                if (this.nopostcmds.length === this.postingcmds.length) this.nopostcmds.length = 0;
                else this.nopostcmds.splice(0, this.postingcmds.length);
                // post
                this.net.postCmds(this.postingcmds);
            }
            // set timeout
            if (this.__timeOutToken) clearTimeout(this.__timeOutToken);
            this.__timeOutToken = setTimeout(() => {
                this.__timeOutToken = undefined;
                this._postcmds();
            }, delay);
            return;
        }

        // no cmd need post, remove timeout
        if (this.__timeOutToken) {
            clearTimeout(this.__timeOutToken);
            this.__timeOutToken = undefined;
        }
    }

    _alignDataVersion(cmd: LocalCmd) { // recovery的cmd需要单独post？
        // todo 对齐数据版本
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
                case OpType.CrdtTree:
                    {
                        const record = op as ArrayMoveOpRecord | TreeMoveOpRecord;
                        if (!record.from && record.to && (typeof record.data === 'string') && (record.data[0] === '{' || record.data[0] === '[')) {
                            if (!record.data2) throw new Error();
                            const blockId = record.path[0];
                            const repotree = this.repotrees.get(blockId);
                            const node = repotree && repotree.get2(record.path.concat(record.id));
                            if (node) {
                                node.undoLocals();
                                record.data = JSON.stringify(record.data2, (k, v) => k.startsWith('__') ? undefined : v)
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
                            const node = repotree && repotree.get2(record.path);
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
        const needUpdateFrame: Map<string, Shape[]> = new Map();
        // update
        for (let i = 0; i < _blockIds.length; i++) {
            const _blockId = _blockIds[i];
            // check
            if (set.has(_blockId)) throw new Error("duplicate blockId");
            set.add(_blockId);

            const repotree = this.repotrees.get(_blockId);
            if (!repotree) return; // 无需更新

            const nuf: Shape[] = [];
            needUpdateFrame.set(_blockId, nuf);

            repotree.roll2Version(this.baseVer, SNumber.MAX_SAFE_INTEGER, nuf)
        }

        // todo
        // for (let [k, v] of needUpdateFrame) {
        //     const page = this.document.pagesMgr.getSync(k);
        //     if (!page) continue;
        //     updateShapesFrame(page, v, basicapi);
        // }
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

    canUndo() {
        return this.localindex > 0;
    }
    canRedo() {
        return this.localindex < this.localcmds.length;
    }
    undo() {
        if (!this.canUndo()) return;
        const cmd = this.localcmds[this.localindex - 1];
        const posted = cmd.posttime > 0;

        const newCmd: LocalCmd | undefined = posted ? {
            id: uuid(),
            mergetype: cmd.mergetype,
            delay: 500,
            version: SNumber.MAX_SAFE_INTEGER,
            previousVersion: "",
            baseVer: "",
            batchId: "",
            ops: [],
            isRecovery: true,
            description: cmd.description,
            time: Date.now(),
            posttime: 0,
            saveselection: cmd.saveselection && cloneSelectionState(cmd.saveselection),
            selectionupdater: cmd.selectionupdater
        } : undefined;

        const needUpdateFrame: Map<string, Shape[]> = new Map();
        const subrepos = classifyOps([cmd]);
        for (let [k, v] of subrepos) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.repotrees.get(blockId);
            const node = repotree && repotree.get(op0.path);
            if (!node) throw new Error("cmd"); // 本地cmd 不应该没有
            // apply op
            let nuf = needUpdateFrame.get(blockId);
            if (!nuf) {
                nuf = [];
                needUpdateFrame.set(blockId, nuf);
            }
            node.undo(v, nuf, newCmd);
        }
        // update frame
        // todo
        // for (let [k, v] of needUpdateFrame) {
        //     const page = this.document.pagesMgr.getSync(k);
        //     if (!page) continue;
        //     updateShapesFrame(page, v, basicapi);
        // }

        if (posted && newCmd) {

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
            this.localcmds.splice(this.localindex - 1, 1, newCmd);


        }

        --this.localindex;
        console.log("undo", newCmd ?? cmd);
        return newCmd ?? cmd;
    }
    redo() {
        if (!this.canRedo()) return;
        const cmd = this.localcmds[this.localindex];
        const posted = cmd.posttime > 0;

        const newCmd: LocalCmd | undefined = posted ? {
            id: uuid(),
            mergetype: cmd.mergetype,
            delay: 500,
            version: SNumber.MAX_SAFE_INTEGER,
            previousVersion: "",
            batchId: "",
            baseVer: "",
            ops: [],
            isRecovery: true,
            description: cmd.description,
            time: Date.now(),
            posttime: 0,
            saveselection: cmd.saveselection && cloneSelectionState(cmd.saveselection),
            selectionupdater: cmd.selectionupdater
        } : undefined;

        const needUpdateFrame: Map<string, Shape[]> = new Map();
        const subrepos = classifyOps([cmd]); // 这个得有顺序
        for (let [k, v] of subrepos) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.repotrees.get(blockId);
            const node = repotree && repotree.get(op0.path);
            if (!node) throw new Error("cmd"); // 本地cmd 不应该没有
            // apply op
            let nuf = needUpdateFrame.get(blockId);
            if (!nuf) {
                nuf = [];
                needUpdateFrame.set(blockId, nuf);
            }
            node.redo(v, nuf, newCmd);
        }
        // update frame
        // todo
        // for (let [k, v] of needUpdateFrame) {
        //     const page = this.document.pagesMgr.getSync(k);
        //     if (!page) continue;
        //     updateShapesFrame(page, v, basicapi);
        // }

        if (posted && newCmd) {
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
            this.localcmds.splice(this.localindex, 1, newCmd);
        } else {
            this._commit2(cmd);
        }

        ++this.localindex;
        console.log("redo", newCmd ?? cmd);
        return newCmd ?? cmd;
    }
}