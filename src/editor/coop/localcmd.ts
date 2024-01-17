import { Cmd } from "../../coop/common/repo";

export interface LocalCmd extends Cmd {
    mergeable: boolean; // 是否可合并
    delay: number; // 是否延迟同步
}