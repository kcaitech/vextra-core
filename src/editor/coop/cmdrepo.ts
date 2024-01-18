import { Shape } from "../../data/shape";
import { Op, OpType } from "../../coop/common/op";
import { OpItem } from "../../coop/common/repo";
import { LocalCmd as Cmd } from "./localcmd";
import { RepoNode } from "./reponode";


const POST_TIMEOUT = 5000; // 5s

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

    private nodecreator: (op: Op, path: string[]) => RepoNode
    constructor(creator: (op: Op, path: string[]) => RepoNode) {
        this.nodecreator = creator;
    }

    baseVer: number = 0;
    cmds: Cmd[] = [];
    pendingcmds: Cmd[] = []; // 远程过来还未应用的cmd

    posttime: number = 0; // 提交cmd的时间
    postingcmds: Cmd[] = []; // 已提交未返回cmd
    localcmds: Cmd[] = []; // 本地未提交cmd
    freshlocalcmdcount: number = 0;

    // todo 怎么隔离不同page的repo
    repotree: RepoNode = new RepoNode(OpType.None);


    private processRemoteCmds(cmds: Cmd[], needUpdateFrame: Shape[]) {
        // 处理远程过来的cmds
        // 可能的情况是，本地有cmd, 需要做变换

        // 1. 分类op
        const subrepos = classifyOps(cmds);

        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const node = this.repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            node.processRemote(v, needUpdateFrame);
        }
    }

    private processPostedCmds(cmds: Cmd[]) {
        // 处理本地提交后返回的cmds

        // 1. 分类op
        const subrepos = classifyOps(cmds);

        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const node = this.repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            node.processPosted(v);
        }
    }

    private processLocalCmds(cmds: Cmd[]) {
        // 处理本地提交后返回的cmds

        // 1. 分类op
        const subrepos = classifyOps(cmds);

        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const node = this.repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            node.processLocal(v);
        }
    }

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

    // 可由transact 直接undo的cmd数量
    // 一旦有远程命令过来，只能走undo op
    canTransactUndoCount() {
        return this.freshlocalcmdcount;
    }

    canUndoLocal() { // todo 这个判断不对。没提交的是可以直接undo掉。但这个undo要判断是不是可以走transact，
        return this.localcmds.length > 0;
    }

    undoLocal(needUnApply: boolean) {
        const cmd = this.localcmds.pop();
        if (!cmd) throw new Error("no local cmd to undo");
        const needUpdateFrame: Shape[] = [];
        this.processUndoLocal([cmd], needUnApply, needUpdateFrame);
        // todo update frame
    }

    // undo 一个本地cmd
    private processUndoLocal(cmds: Cmd[], needUnApply: boolean, needUpdateFrame: Shape[]) {
        // 1. 分类op
        const subrepos = classifyOps(cmds);

        for (let [k, v] of subrepos.entries()) {
            // 建立repotree
            const op0 = v[0].op;
            const node = this.repotree.buildAndGet(op0, op0.path, this.nodecreator);
            // apply op
            node.processUndoLocal(v, needUnApply, needUpdateFrame);
        }
    }
    // todo redo, text的op需要变换
    redo(cmd: Cmd) {
        // 
        // cmd.version
    }

    // debounce or add to render loop
    processCmds() {
        const needUpdateFrame: Shape[] = [];
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

            // todo
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

        // todo update frame

        
        this._postCmds();
    }

    // 本地cmd
    post(cmd: Cmd) {
        ++this.freshlocalcmdcount;
        // todo check merge?
        this.localcmds.push(cmd); // 本地cmd也要应用到nodetree
        this.processLocalCmds([cmd]);
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
        this.freshlocalcmdcount = 0;
        this.pendingcmds.push(...cmds);
        // need process
        this.processCmds();
    }
}