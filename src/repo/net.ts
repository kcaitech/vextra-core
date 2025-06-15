/*
 * Copyright (c) 2023-2025 KCai Technology (https://kcaitech.com). All rights reserved.
 *
 * This file is part of the Vextra project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

// coop需要的远程接口

import { Cmd } from "./types";

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
    pullCmds(from: number, to?: number): Promise<Cmd[]>;

    /**
     * 
     * @param cmds 要推送的命令
     */
    postCmds(cmds: Cmd[], serial:(cmds: Cmd[])=> string): Promise<boolean>;

    /**
     * 监听远程cmd
     * @param watcher 
     */
    watchCmds(watcher: (cmds: Cmd[]) => void): () => void;

    /**
     * 监听错误信息
     * errorInfo的几种类型：
     * {
     *   type: "duplicate",
     *   duplicateCmd: Cmd,
     * }
     */
    watchError(watcher: (errorInfo: {
        type: "duplicate",
        duplicateCmd: Cmd,
    }) => void): void;


}