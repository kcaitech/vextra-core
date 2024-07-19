import { DViewCtx, PropsType } from "./viewctx";
import { GroupShapeView } from "./groupshape";
import { EL } from "./el";

export class MaskGroup extends GroupShapeView {
    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
    }

    protected onChildChange(...args: any[]) {
    }

    protected renderContents(): EL[] {
        const childs = this.m_children;
        childs.forEach((c) => c.render())
        return childs;
    }

    onDataChange(...args: any[]) {
        super.onDataChange(...args);
    }

    onDestory(): void {
        super.onDestory();
    }
}