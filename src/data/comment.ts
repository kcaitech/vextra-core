import { Watchable } from "./basic";
import * as classes from "./baseclasses";
export { UserInfo } from "./baseclasses"
export class Comment extends Watchable(classes.Comment) {
    constructor(
        pageId: string,
        id: string,
        frame: classes.ShapeFrame,
        user: classes.UserInfo,
        createAt: string,
        content: string,
        parasiticBody: classes.Shape,
        parentId?: string,
        rootId?: string,
    ) {
        super(pageId, id, frame, user, createAt, content, parasiticBody);
        this.status = 0;
        this.parentId = parentId;
        this.rootId = rootId;
    }
    setStatus(status: number) {
        this.status = status
    }
}