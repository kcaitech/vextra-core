import { PathShape2, Shape, ShapeFrame, SymbolRefShape, SymbolShape } from "../data/classes";
import { ShapeView } from "./shape";
import { PathSegment } from "../data/typesdefine";
import { DViewCtx, PropsType } from "./viewctx";
import { EL, elh } from "./el";
import { renderBorders } from "../render";

/**
 * @deprecated 使用PathShapeView
 */
export class PathShapeView2 extends ShapeView {

    constructor(ctx: DViewCtx, props: PropsType) {
        super(ctx, props);
    }

    m_pathsegs?: PathSegment[];

    get segments() {
        return this.m_pathsegs || (this.m_data as PathShape2).pathsegs;
    }

    protected _layout(
        shape: Shape,
        parentFrame: ShapeFrame | undefined,
        varsContainer: (SymbolRefShape | SymbolShape)[] | undefined,
        scale: { x: number, y: number } | undefined
    ): void {
        this.m_pathsegs = undefined;
        super._layout(shape, parentFrame, varsContainer, scale);
    }

    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.m_data, false);
    }
}