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
     * @param from 起始id
     * @param to 结束id（包含）
     */
    pullCmds(from: string, to: string): Promise<Cmd[]>;

    /**
     * 
     * @param cmds 要推送的命令
     */
    postCmds(cmds: Cmd[]): Promise<boolean>;

    /**
     * 监听远程cmd
     * @param watcher 
     */
    watchCmds(watcher: (cmds: Cmd[]) => void): void;

    getWatcherList(): ((cmds: Cmd[]) => void)[];
}