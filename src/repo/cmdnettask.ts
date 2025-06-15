/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */


import { INet } from "./types";
import { Cmd } from "./types";

export class CmdNetTask {

    private pullTasks: { from: number, to?: number }[] = [];
    private net: INet;
    private baseVer: number;
    private lastVer: number;
    private receive: (cmds: Cmd[]) => void;
    constructor(net: INet, baseVer: number,
        lastVer: number, receive: (cmds: Cmd[]) => void
    ) {
        this.net = net;
        this.baseVer = baseVer;
        this.lastVer = lastVer;
        this.receive = receive;
    }

    public setNet(net: INet) {
        this.net = net;
    }

    pull(from: number, to?: number) {
        console.log("pull cmds, from: " + from + " to: " + to);
        this.pullTasks.push({ from, to });
        for (let i = 1; i < this.pullTasks.length; ++i) {
            this._merge(i);
        }
        this._pull();
    }

    updateVer(baseVer: number, lastVer: number) {
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
            if ((item.to === undefined || (item.to - from) >= 0) &&
                (to === undefined || (item.from - to) <= 0)) {
                if ((from - item.from) > 0) from = item.from;
                if (item.to === undefined) to = undefined;
                else if (to !== undefined && (to - item.to) < 0) to = item.to;
                this.pullTasks.splice(i, 1);
            } else {
                ++i;
            }
        }
        // 判断下当前已有的
        if ((from - this.baseVer) >= 0 && (from - this.lastVer) <= 0) from = this.lastVer; // 这个版本已经存在的了。
        if (to !== undefined && (to - this.baseVer) >= 0 && (to - this.lastVer) <= 0) to = this.baseVer; // 这个不一定存在
        if (to !== undefined && (from - to) > 0) {
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
        if (from === undefined) from = 0;
        this.__pulling = true;
        this.net.pullCmds(from, to).then((cmds) => {
            console.log("pull back");
            this.__pulling = false;
            this.pullTasks.shift();
            this.receive(cmds);
            this._pull();
        }).catch(e => {
            console.log("pull error");
            this.__pulling = false;
            this._pull();
        })
    }
}