import { Shape } from "../../data/shape";
import { Op, OpType } from "../../coop/common/op";
import { Cmd, OpItem } from "../../coop/common/repo";
import { LocalCmd } from "./localcmd";
import { RepoNode, RepoNodePath } from "./reponode";
import { Document } from "../../data/document";
import { updateShapesFrame } from "./utils";
import * as basicapi from "../basicapi"

const POST_TIMEOUT = 5000; // 5s

/**
 * 根据path 分类
 * @param cmds
 * @returns 
 */
function classifyOps(cmds: Cmd[]) {
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
    return subrepos;
}

// 一个page一个curversion，不可见page，cmd仅暂存
// symbols要同步更新
// 一个文档一个总的repo
export class CmdRepo {

    private nodecreator: (op: Op) => RepoNode
    constructor(document: Document, cmds: Cmd[], localcmds: LocalCmd[], creator: (op: Op) => RepoNode) {
        this.document = document;
        // 用于加载本地的cmds
        this.cmds = cmds;
        this.localcmds = localcmds;
        this.nodecreator = creator;
    }

    document: Document;

    baseVer: number = 0;
    cmds: Cmd[];
    pendingcmds: Cmd[] = []; // 远程过来还未应用的cmd

    posttime: number = 0; // 提交cmd的时间
    postingcmds: Cmd[] = []; // 已提交未返回cmd
    localcmds: LocalCmd[]; // 本地未提交cmd

    undocmds: LocalCmd[] = [];
    freshlocalcmdcount: number = 0;

    // 不同bolck（page、document，不同repotree）
    // todo 怎么隔离不同page的repo
    repotrees: Map<string, RepoNodePath> = new Map();
    // repotree: RepoNode = new RepoNode(OpType.None);

    private processRemoteCmds(cmds: Cmd[], needUpdateFrame: Map<string, Shape[]>) {
        // 处理远程过来的cmds
        // 可能的情况是，本地有cmd, 需要做变换

        // 1. 分类op
        const subrepos = classifyOps(cmds);

        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            let repotree = this.repotrees.get(blockId);
            if (!repotree) continue;
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            let nuf = needUpdateFrame.get(k);
            if (!nuf) {
                nuf = [];
                needUpdateFrame.set(k, nuf);
            }
            node.processRemote(v, nuf);
        }
    }

    private processPostedCmds(cmds: Cmd[]) {
        // 处理本地提交后返回的cmds

        // 1. 分类op
        const subrepos = classifyOps(cmds);

        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.repotrees.get(blockId);
            if (!repotree) continue;
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            node.processPosted(v);
        }
    }

    // debounce or add to render loop
    processCmds() {
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
                cmd.version = receive.version;
                cmd.ops.forEach((op) => op.order = receive.version);
            }
            // 分3步
            // 1. 先处理index之前的cmds
            if (index > 0) {
                const pcmds = this.pendingcmds.slice(0, index);
                this.processRemoteCmds(pcmds, needUpdateFrame);
            }
            // 2. 再处理postingcmds, 与服务端对齐
            this.processPostedCmds(this.pendingcmds.slice(index, index + this.postingcmds.length));
            // 3. 再处理index之后的cmds
            if (this.pendingcmds.length > index + this.postingcmds.length) {
                const pcmds = this.pendingcmds.slice(index + this.postingcmds.length);
                this.processRemoteCmds(pcmds, needUpdateFrame);
            }

            this.postingcmds.length = 0;
            this.pendingcmds.length = 0;
        }

        // 未返回也可以应用连续的cmds
        // apply pending and transform local // 仅remote
        if (this.pendingcmds.length > 0) {
            // 先处理pending
            this.processRemoteCmds(this.pendingcmds, needUpdateFrame);
            this.pendingcmds.length = 0;
        }

        // update frame
        for (let [k, v] of needUpdateFrame) {
            const page = this.document.pagesMgr.getSync(k);
            if (!page) continue;
            updateShapesFrame(page, v, basicapi);
        }

        this._postCmds();
    }

    private pushLocalCmd(cmd: LocalCmd) { // 不需要应用的
        ++this.freshlocalcmdcount;
        // todo check merge?
        this.localcmds.push(cmd); // 本地cmd也要应用到nodetree

        // 处理本地提交后返回的cmds

        // 1. 分类op
        const subrepos = classifyOps([cmd]);

        for (let [k, v] of subrepos.entries()) {
            // check
            if (v.length > 1) {
                console.warn("op can merge?? ", v)
            }
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.repotrees.get(blockId);
            if (!repotree) continue;
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            node.processLocal(v, false, []);
        }
    }

    // 本地cmd
    // 区分需要应用的与不需要应用的
    post(cmd: LocalCmd) {
        this.undocmds.length = 0; // 有新编辑,undo cmd 丢弃
        this.pushLocalCmd(cmd);
        // need process
        this.processCmds();
    }

    // 收到远程cmd
    receive(cmds: Cmd[]) {
        if (cmds.length === 0) return;
        // 检查版本号是否连续
        let lastVer = this.baseVer;
        if (this.pendingcmds.length > 0) {
            lastVer = this.pendingcmds[this.pendingcmds.length - 1].version;
        } else if (this.cmds.length > 0) {
            lastVer = this.cmds[this.cmds.length - 1].version;
        }
        if (cmds[0].version !== lastVer + 1) {
            // abort
            console.log("abort received cmds: ", cmds);
            return;
        }
        this.freshlocalcmdcount = 0; // todo
        this.pendingcmds.push(...cmds);
        // need process
        this.processCmds();
    }

    // ================ cmd 上传、下拉 ==========================
    // todo
    // todo 数据序列化
    private _postCmds() {
        if (this.postingcmds.length > 0) {
            const now = Date.now();
            if (now - this.posttime > POST_TIMEOUT) {
                // 超时了
                // todo post
            }
            // todo check超时
            return; // 等返回
        }

        if (this.localcmds.length > 0) {
            // check
            // post local (根据cmd提交时间是否保留最后个cmd用于合并)
            // 所有cmd延迟1s提交？cmd应该能设置delay & mergeable
            const now = Date.now();
            const len = this.localcmds.length;
            for (let i = 0; i < len; i++) {
                const cmd = this.localcmds[i];
                if ((i < len - 1) || (now - cmd.time > cmd.delay)) {
                    this.postingcmds.push(cmd);
                    cmd.posttime = now;
                } else {
                    break;
                }
            }

            if (this.postingcmds.length > 0) {
                this.posttime = now;
                if (this.localcmds.length === this.postingcmds.length) this.localcmds.length = 0;
                else this.localcmds.splice(0, this.postingcmds.length);
                // todo post
            }
        }
    }

    // ================ 打开文档恢复、延迟加载数据更新 =========================

    updateBlockData(_blockIds: string[]) {

        const needUpdateFrame: Map<string, Shape[]> = new Map();

        // create repotree
        // check
        for (let i = 0; i < _blockIds.length; i++) {
            const _blockId = _blockIds[i];
            if (this.repotrees.has(_blockId)) throw new Error("blockId already exists");
            const repotree = new RepoNodePath();
            this.repotrees.set(_blockId, repotree);
        }

        // 1 remote
        // cmds: Cmd[] = [];
        {
            const subrepos = classifyOps(this.cmds.filter(cmd => {
                for (let i = 0; i < cmd.blockId.length; ++i) {
                    if (_blockIds.includes(cmd.blockId[i])) return true;
                }
                return false;
            }));
            for (let [k, v] of subrepos.entries()) {
                // 建立repotree
                const op0 = v[0].op;
                const blockId = op0.path[0];
                if (!_blockIds.includes(blockId)) continue;
                const repotree = this.repotrees.get(blockId);
                if (!repotree) throw new Error();
                const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
                // apply op
                let nuf = needUpdateFrame.get(k);
                if (!nuf) {
                    nuf = [];
                    needUpdateFrame.set(k, nuf);
                }
                node.processRemote(v, nuf);
            }
        }

        // 2 local
        // postingcmds: Cmd[] = []; // 已提交未返回cmd
        // localcmds: Cmd[] = []; // 本地未提交cmd
        {
            const subrepos = classifyOps(this.postingcmds.concat(...this.localcmds).filter(cmd => {
                for (let i = 0; i < cmd.blockId.length; ++i) {
                    if (_blockIds.includes(cmd.blockId[i])) return true;
                }
                return false;
            }));
            for (let [k, v] of subrepos.entries()) {
                // 建立repotree
                const op0 = v[0].op;
                const blockId = op0.path[0];
                if (!_blockIds.includes(blockId)) continue;
                const repotree = this.repotrees.get(blockId);
                if (!repotree) throw new Error();
                const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
                // apply op
                let nuf = needUpdateFrame.get(k);
                if (!nuf) {
                    nuf = [];
                    needUpdateFrame.set(k, nuf);
                }
                node.processLocal(v, true, nuf);
            }
        }

        for (let [k, v] of needUpdateFrame) {
            const page = this.document.pagesMgr.getSync(k);
            if (!page) continue;
            updateShapesFrame(page, v, basicapi);
        }
    }

    // ================ undo redo ==================================

    // 可由transact 直接undo的cmd数量
    // 一旦有远程命令过来，只能走undo op
    canTransactUndo() {
        const count = this.freshlocalcmdcount - this.undocmds.length;
        return count > 0;
    }
    canTransactRedo() {
        return this.undocmds.length > 0 && this.freshlocalcmdcount > 0;
    }

    canUndoLocal() { // todo 这个判断不对。没提交的是可以直接undo掉。但这个undo要判断是不是可以走transact，
        return this.localcmds.length > 0;
    }

    canRedoLocal() {
        return this.undocmds.length > 0;
    }

    /**
     * 
     * @param needApply 如果是在transact中已经还原数据了，就不需要apply
     */
    undoLocal(needApply: boolean) {
        if (this.localcmds.length === 0) return;
        const cmd = this.localcmds.pop();
        if (!cmd) throw new Error("no local cmd to undo");
        this.undocmds.push(cmd);
        const needUpdateFrame: Map<string, Shape[]> = new Map();
        this.processUndoLocal([cmd], needApply, needUpdateFrame);
        // update frame
        for (let [k, v] of needUpdateFrame) {
            const page = this.document.pagesMgr.getSync(k);
            if (!page) continue;
            updateShapesFrame(page, v, basicapi);
        }
    }

    // undo 一个本地cmd
    private processUndoLocal(cmds: Cmd[], needApply: boolean, needUpdateFrame: Map<string, Shape[]>) {
        // 1. 分类op
        const subrepos = classifyOps(cmds);

        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.repotrees.get(blockId);
            if (!repotree) continue;
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            let nuf = needUpdateFrame.get(k);
            if (!nuf) {
                nuf = [];
                needUpdateFrame.set(k, nuf);
            }
            node.processUndoLocal(v, needApply, nuf);
        }
    }

    // todo redo, text的op需要变换
    redoLocal(needApply: boolean) {
        // 
        // cmd.version
        if (this.undocmds.length === 0) return;
        const cmd = this.undocmds.shift();
        if (!cmd) throw new Error("no local cmd to redo");
        this.localcmds.push(cmd);
        const needUpdateFrame: Map<string, Shape[]> = new Map();
        this.processRedoLocal([cmd], needApply, needUpdateFrame);
        // update frame
        for (let [k, v] of needUpdateFrame) {
            const page = this.document.pagesMgr.getSync(k);
            if (!page) continue;
            updateShapesFrame(page, v, basicapi);
        }
    }

    private processRedoLocal(cmds: Cmd[], needApply: boolean, needUpdateFrame: Map<string, Shape[]>) {
        // 1. 分类op
        const subrepos = classifyOps(cmds);

        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.repotrees.get(blockId);
            if (!repotree) continue;
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            let nuf = needUpdateFrame.get(k);
            if (!nuf) {
                nuf = [];
                needUpdateFrame.set(k, nuf);
            }
            node.processRedoLocal(v, needApply, nuf);
        }
    }

    // todo
    // undo redo
    undo(cmd: LocalCmd) {
        // 已经提交的cmd需要undo
        // 还是交由各节点处理
    }
    redo(cmd: LocalCmd) {

    }
}