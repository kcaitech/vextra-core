import { ShapeView } from "./shape";
import { DViewCtx, PropsType } from "./viewctx";

/**
 * @deprecated 使用 PathShapeView，PathShapeView2不会渲染
 */
export class PathShapeView2 extends ShapeView {
    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
        throw new Error('PathShapeView2 has been deprecated.');
    }
}