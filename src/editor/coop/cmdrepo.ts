import { Shape } from "../../data/shape";
import { Op } from "../../coop/common/op";
import { Cmd } from "../../coop/common/repo";
import { LocalCmd } from "./localcmd";
import { RepoNode, RepoNodePath, nodecreator } from "./reponode";
import { Document } from "../../data/document";
import { updateShapesFrame } from "./utils";
import * as basicapi from "../basicapi"
import { ICoopNet } from "./net";
import { LocalOpItem as OpItem } from "./localcmd";
import { uuid } from "../../basic/uuid";

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
    private net: ICoopNet;
    constructor(document: Document, cmds: Cmd[], localcmds: LocalCmd[], net: ICoopNet) {
        this.document = document;
        // 用于加载本地的cmds
        this.cmds = cmds;
        this.nopostcmds = localcmds;
        this.nodecreator = nodecreator(document);
        this.net = net;

        // todo 只有本地编辑undo时，需要往回回退版本。初始化时的cmd是不能回退回去的。可以考虑不以undo-do-redo的方式来restore!
        // 比如离线编辑，有比较多的本地cmd需要同步时，太多的undo比较费时。
        // restore
        if (cmds.length > 0 || this.localcmds.length > 0) {
            const needUpdateFrame: Map<string, Shape[]> = new Map();
            if (cmds.length > 0) {
                this._receive(cmds, needUpdateFrame);
            }
            if (this.localcmds.length > 0) {
                localcmds.forEach(item => this._commit(item));
            }
            // update frame
            for (let [k, v] of needUpdateFrame) {
                const page = document.pagesMgr.getSync(k);
                if (!page) continue;
                updateShapesFrame(page, v, basicapi);
            }
        }
    }

    document: Document;

    baseVer: number = 0;
    cmds: Cmd[];
    pendingcmds: Cmd[] = []; // 远程过来还未应用的cmd // 在需要拉取更早的版本时，远程的cmd也需要暂存不应用

    posttime: number = 0; // 提交cmd的时间
    postingcmds: Cmd[] = []; // 已提交未返回cmd
    nopostcmds: LocalCmd[]; // 本地未提交cmd

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

    private _receive(cmds: Cmd[], needUpdateFrame: Map<string, Shape[]>) {
        // 处理远程过来的cmds
        // 可能的情况是，本地有cmd, 需要做变换
        // 1. 分类op
        const subrepos = classifyOps(cmds);
        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            let repotree = this.getRepoTree(blockId);
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            let nuf = needUpdateFrame.get(k);
            if (!nuf) {
                nuf = [];
                needUpdateFrame.set(k, nuf);
            }
            node.receive(v, nuf);
        }
    }

    private _receiveLocal(cmds: Cmd[]) {
        // 处理本地提交后返回的cmds
        // 1. 分类op
        const subrepos = classifyOps(cmds);
        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.getRepoTree(blockId);
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            node.receiveLocal(v);
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
                this._receive(pcmds, needUpdateFrame);
            }
            // 2. 再处理postingcmds, 与服务端对齐
            this._receiveLocal(this.pendingcmds.slice(index, index + this.postingcmds.length));
            // 3. 再处理index之后的cmds
            if (this.pendingcmds.length > index + this.postingcmds.length) {
                const pcmds = this.pendingcmds.slice(index + this.postingcmds.length);
                this._receive(pcmds, needUpdateFrame);
            }

            this.postingcmds.length = 0;
            this.pendingcmds.length = 0;
        }

        // 未返回也可以应用连续的cmds
        // apply pending and transform local // 仅remote
        if (this.pendingcmds.length > 0) {
            // 先处理pending
            this._receive(this.pendingcmds, needUpdateFrame);
            this.pendingcmds.length = 0;
        }

        // update frame
        for (let [k, v] of needUpdateFrame) {
            const page = this.document.pagesMgr.getSync(k);
            if (!page) continue;
            updateShapesFrame(page, v, basicapi);
        }

        this._postcmds();
    }

    private _commit(cmd: LocalCmd) { // 不需要应用的
        // todo check merge?
        this.nopostcmds.push(cmd); // 本地cmd也要应用到nodetree
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
            const repotree = this.getRepoTree(blockId);
            const node = repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            node.commit(v);
        }

        // need process
        this.processCmds();
    }

    private _commit2(cmd: LocalCmd) { // 不需要应用的
        // todo check merge?
        this.nopostcmds.push(cmd); // 本地cmd也要应用到nodetree
        // 处理本地提交后返回的cmds

        // need process
        this.processCmds();
    }

    // 本地cmd
    // 区分需要应用的与不需要应用的
    commit(cmd: LocalCmd) {
        // 有丢弃掉的cmd，要通知到textnode
        if (this.localcmds.length > this.localindex) {
            const droped = this.localcmds.splice(this.localindex);
            const subrepos = classifyOps(droped);
            for (let [k, v] of subrepos.entries()) {
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

        this.localcmds.push(cmd);
        ++this.localindex;

        this._commit(cmd);
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
        // todo 检查cmd baseVer是否本地有,否则需要拉取远程cmds

        // this.freshlocalcmdcount = 0;
        this.pendingcmds.push(...cmds);
        // need process
        this.processCmds();
    }

    // ================ cmd 上传、下拉 ==========================
    // todo
    // todo 数据序列化
    private _postcmds() {
        if (this.postingcmds.length > 0) {
            const now = Date.now();
            if (now - this.posttime > POST_TIMEOUT) {
                // 超时了
                // todo post
            }
            // todo check超时
            return; // 等返回
        }

        const baseVer = this.cmds.length > 0 ? this.cmds[this.cmds.length - 1].version : this.baseVer;

        if (this.nopostcmds.length > 0) {
            // check
            // post local (根据cmd提交时间是否保留最后个cmd用于合并)
            // 所有cmd延迟1s提交？cmd应该能设置delay & mergeable
            const now = Date.now();
            const len = this.nopostcmds.length;
            for (let i = 0; i < len; i++) {
                const cmd = this.nopostcmds[i];
                cmd.baseVer = baseVer;
                if ((i < len - 1) || (now - cmd.time > cmd.delay)) {
                    this.postingcmds.push(cmd);
                    cmd.posttime = now;
                } else {
                    break;
                }
            }

            if (this.postingcmds.length > 0) {
                this.posttime = now;
                if (this.nopostcmds.length === this.postingcmds.length) this.nopostcmds.length = 0;
                else this.nopostcmds.splice(0, this.postingcmds.length);
                // todo post
            }
        }
    }

    // ================ 打开文档恢复、延迟加载数据更新 =========================

    roll2NewVersion(_blockIds: string[]) {
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

            repotree.roll2Version([_blockId], this.baseVer, Number.MAX_SAFE_INTEGER, nuf)
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
    canUndo() { // todo 这个判断不对。没提交的是可以直接undo掉。但这个undo要判断是不是可以走transact，
        return this.localindex > 0;
    }
    canRedo() {
        return this.localindex < this.localcmds.length;
    }
    undo() {
        if (!this.canUndo()) return;
        const cmd = this.localcmds[this.localindex - 1];
        const posted = cmd.posttime > 0;

        const newCmd = posted ? {
            id: uuid(),
            // mergeable: true,
            mergetype: cmd.mergetype,
            delay: 500,
            version: Number.MAX_SAFE_INTEGER,
            baseVer: 0,
            ops: [],
            isUndo: true,
            blockId: cmd.blockId,
            description: cmd.description,
            time: Date.now(),
            posttime: 0
        } : undefined;

        const needUpdateFrame: Map<string, Shape[]> = new Map();
        const subrepos = classifyOps([cmd]);
        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.repotrees.get(blockId);
            const node = repotree && repotree.get(op0.path);
            if (!node) throw new Error("cmd"); // 本地cmd 不应该没有
            // apply op
            let nuf = needUpdateFrame.get(k);
            if (!nuf) {
                nuf = [];
                needUpdateFrame.set(k, nuf);
            }

            if (posted) node.undoPosted(v, nuf, newCmd!);
            else node.undoLocal(v, nuf);
        }
        // update frame
        for (let [k, v] of needUpdateFrame) {
            const page = this.document.pagesMgr.getSync(k);
            if (!page) continue;
            updateShapesFrame(page, v, basicapi);
        }

        if (posted) {
            // posted
            // need commit new command
            this._commit2(newCmd!)
        }

        --this.localindex;
    }
    redo() {
        if (!this.canRedo()) return;
        const cmd = this.localcmds[this.localindex];
        const posted = cmd.posttime > 0;

        const newCmd = posted ? {
            id: uuid(),
            // mergeable: true,
            mergetype: cmd.mergetype,
            delay: 500,
            version: Number.MAX_SAFE_INTEGER,
            baseVer: 0,
            ops: [],
            isUndo: true,
            blockId: cmd.blockId,
            description: cmd.description,
            time: Date.now(),
            posttime: 0
        } : undefined;

        const needUpdateFrame: Map<string, Shape[]> = new Map();
        const subrepos = classifyOps([cmd]);
        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const blockId = op0.path[0];
            const repotree = this.repotrees.get(blockId);
            const node = repotree && repotree.get(op0.path);
            if (!node) throw new Error("cmd"); // 本地cmd 不应该没有
            // apply op
            let nuf = needUpdateFrame.get(k);
            if (!nuf) {
                nuf = [];
                needUpdateFrame.set(k, nuf);
            }

            if (posted) node.redoPosted(v, nuf, newCmd!);
            else node.redoLocal(v, nuf);
        }
        // update frame
        for (let [k, v] of needUpdateFrame) {
            const page = this.document.pagesMgr.getSync(k);
            if (!page) continue;
            updateShapesFrame(page, v, basicapi);
        }

        if (posted) {
            // posted
            // need commit new command
            this._commit2(newCmd!)
        }

        ++this.localindex;

        // todo 选区
        // todo restore selection
        // shape 记录id即可
        // table 选中单元格时记录行列的crdtidx（还原时取最大框选），选中表格或者文本，记录shapeid
        // 文本记录选区，需要变换。selection op记录到cmd.ops（第一个？），上传时过滤掉
    }
}