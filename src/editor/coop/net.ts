// coop需要的远程接口

import { Cmd } from "../../coop/common/repo";

export interface ICoopNet {

    /**
     * 
     * @returns 是否已经连接
     */
    hasConnected(): boolean;

    /**
     * 
     * @param from 起始版本号
     * @param to 结束版本号（包含）
     */
    pullCmds(from: number, to: number): void;

    /**
     * 
     * @param cmds 要推送的命令
     */
    postCmds(cmds: Cmd[]): void;

    /**
     * 监听远程cmd
     * @param watcher 
     */
    watchCmds(watcher: (cmds: Cmd[]) => void): void;
}