import { SNumber } from "../../coop/client/snumber";
import { ICoopNet } from "./net";
import { Cmd } from "../../coop/common/repo";

export class CmdNetTask {

    private pullTasks: { from: string, to?: string }[] = [];
    private net: ICoopNet;
    private baseVer: string;
    private lastVer: string;
    private receive: (cmds: Cmd[]) => void;
    constructor(net: ICoopNet, baseVer: string,
        lastVer: string, receive: (cmds: Cmd[]) => void
    ) {
        this.net = net;
        this.baseVer = baseVer;
        this.lastVer = lastVer;
        this.receive = receive;
    }

    public setNet(net: ICoopNet) {
        this.net = net;
    }

    pull(from: string, to?: string) {
        console.log("pull cmds, from: " + from + " to: " + to);
        this.pullTasks.push({ from, to });
        for (let i = 1; i < this.pullTasks.length; ++i) {
            this._merge(i);
        }
        this._pull();
    }

    updateVer(baseVer: string, lastVer: string) {
        this.baseVer = baseVer;
        this.lastVer = lastVer;
    }

    get pulling() {
        return this.__pulling;
    }

    _merge(start: number): boolean {
        let { from, to } = this.pullTasks[start];
        for (let i = start + 1; i < this.pullTasks.length;) {
            const item = this.pullTasks[i];
            // 相交 item.to >= from && item.from <= to
            if ((item.to === undefined || SNumber.comp(item.to, from) >= 0) &&
                (to === undefined || SNumber.comp(item.from, to) <= 0)) {
                if (SNumber.comp(from, item.from) > 0) from = item.from;
                if (item.to === undefined) to = undefined;
                else if (to !== undefined && SNumber.comp(to, item.to) < 0) to = item.to;
                this.pullTasks.splice(i, 1);
            } else {
                ++i;
            }
        }
        // 判断下当前已有的
        if (SNumber.comp(from, this.baseVer) >= 0 && SNumber.comp(from, this.lastVer) <= 0) from = this.lastVer; // 这个版本已经存在的了。
        if (to !== undefined && SNumber.comp(to, this.baseVer) >= 0 && SNumber.comp(to, this.lastVer) <= 0) to = this.baseVer; // 这个不一定存在
        if (to !== undefined && SNumber.comp(from, to) > 0) {
            this.pullTasks.splice(start, 1);
            return false;
        } else {
            this.pullTasks[start].from = from;
            this.pullTasks[start].to = to;
            return true;
        }
    }

    __pulling: boolean = false;
    _pull() {
        if (this.__pulling) return;
        // merge
        // 所有与第一个相交的
        if (this.pullTasks.length === 0) return;
        if (!this._merge(0)) {
            this._pull();
            return;
        }
        let { from, to } = this.pullTasks[0];
        if (from === "") from = "0";
        this.__pulling = true;
        this.net.pullCmds(from, to).then((cmds) => {
            console.log("pull back");
            this.receive(cmds);
            this.pullTasks.shift();
            this.__pulling = false;
            this._pull();
        }).catch(e => {
            this.__pulling = false;
            this._pull();
        })
    }
}