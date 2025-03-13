/*
 * Copyright (c) 2023-2024 KCai Technology(kcaitech.com). All rights reserved.
 *
 * This file is part of the vextra.io/vextra.cn project, which is licensed under the AGPL-3.0 license.
 * The full license text can be found in the LICENSE file in the root directory of this source tree.
 *
 * For more information about the AGPL-3.0 license, please visit:
 * https://www.gnu.org/licenses/agpl-3.0.html
 */

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
        parentFrame: ShapeFrame | undefined,
        scale: { x: number, y: number } | undefined,
    ): void {
        this.m_pathsegs = undefined;
        super._layout(parentFrame, scale);
    }

    protected renderBorders(): EL[] {
        return renderBorders(elh, this.getBorders(), this.frame, this.getPathStr(), this.m_data, this.radius,false);
    }
}