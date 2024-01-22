import { Cmd } from "../../coop/common/repo";

export enum CmdMergeType {
    TextInsert,
    TextDelete,
    ShapeMove,
    Others,
}

export interface LocalCmd extends Cmd {
    // mergeable: boolean; // 是否可合并
    delay: number; // 是否延迟同步
    mergetype: CmdMergeType; // 用于cmd合并
}